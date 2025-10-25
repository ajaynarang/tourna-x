import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { COLLECTIONS } from '@repo/schemas';
import { getAuthUser } from '@/lib/auth-utils';
import { ObjectId } from 'mongodb';

// API to manually re-sync fixtures - progress all completed matches to next rounds
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const db = await connectToDatabase();
    const user = await getAuthUser(request);
    const { id } = await params;

    if (!user || !user.roles?.includes('admin')) {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      );
    }

    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid tournament ID' },
        { status: 400 }
      );
    }

    console.log(`[FIXTURE-SYNC] Starting fixture sync for tournament ${id}`);

    // Get all completed matches in this tournament, sorted by round
    const completedMatches = await db.collection(COLLECTIONS.MATCHES)
      .find({
        tournamentId: new ObjectId(id),
        status: 'completed',
        winnerId: { $exists: true }
      })
      .sort({ roundNumber: 1, matchNumber: 1 })
      .toArray();

    console.log(`[FIXTURE-SYNC] Found ${completedMatches.length} completed matches`);

    let updatedCount = 0;
    const errors: string[] = [];

    // Process each completed match
    for (const match of completedMatches) {
      try {
        // Skip finals and group stage
        if (match.round === 'Final' || match.round === 'Group Stage') {
          continue;
        }

        const winnerId = match.winnerId.toString();
        const winnerName = match.winnerName;

        // Find the next round
        const nextRoundNumber = match.roundNumber + 1;

        // Build query for finding current round matches
        const matchQuery: any = {
          tournamentId: match.tournamentId,
          category: match.category,
          roundNumber: match.roundNumber
        };

        if (match.ageGroup) {
          matchQuery.ageGroup = match.ageGroup;
        }

        const currentRoundMatches = await db.collection(COLLECTIONS.MATCHES)
          .find(matchQuery)
          .sort({ matchNumber: 1 })
          .toArray();

        const matchPositionInRound = currentRoundMatches.findIndex(
          (m: any) => m._id.toString() === match._id.toString()
        );

        if (matchPositionInRound === -1) continue;

        // Build query for next round
        const nextRoundQuery: any = {
          tournamentId: match.tournamentId,
          category: match.category,
          roundNumber: nextRoundNumber
        };

        if (match.ageGroup) {
          nextRoundQuery.ageGroup = match.ageGroup;
        }

        const nextRoundMatches = await db.collection(COLLECTIONS.MATCHES)
          .find(nextRoundQuery)
          .sort({ matchNumber: 1 })
          .toArray();

        if (nextRoundMatches.length === 0) continue;

        const nextMatchIndex = Math.floor(matchPositionInRound / 2);
        const nextMatch = nextRoundMatches[nextMatchIndex];

        if (!nextMatch) continue;

        // Determine position
        const isPlayer1Position = matchPositionInRound % 2 === 0;

        const updateFields: any = {};

        if (isPlayer1Position) {
          // Check if already set correctly
          if (nextMatch.player1Id?.toString() === winnerId) {
            continue; // Already correct
          }

          updateFields.player1Id = new ObjectId(winnerId);
          updateFields.player1Name = winnerName;

          if (match.category === 'doubles' || match.category === 'mixed') {
            const isWinnerPlayer1 = winnerId === match.player1Id?.toString();
            updateFields.player3Id = isWinnerPlayer1 ? match.player3Id : match.player4Id;
            updateFields.player3Name = isWinnerPlayer1 ? match.player3Name : match.player4Name;
          }
        } else {
          // Check if already set correctly
          if (nextMatch.player2Id?.toString() === winnerId) {
            continue; // Already correct
          }

          updateFields.player2Id = new ObjectId(winnerId);
          updateFields.player2Name = winnerName;

          if (match.category === 'doubles' || match.category === 'mixed') {
            const isWinnerPlayer1 = winnerId === match.player1Id?.toString();
            updateFields.player4Id = isWinnerPlayer1 ? match.player3Id : match.player4Id;
            updateFields.player4Name = isWinnerPlayer1 ? match.player3Name : match.player4Name;
          }
        }

        updateFields.updatedAt = new Date();

        await db.collection(COLLECTIONS.MATCHES).updateOne(
          { _id: nextMatch._id },
          { $set: updateFields }
        );

        console.log(`[FIXTURE-SYNC] Updated Match #${nextMatch.matchNumber} with winner from Match #${match.matchNumber}`);
        updatedCount++;

      } catch (error) {
        console.error(`[FIXTURE-SYNC] Error processing match ${match.matchNumber}:`, error);
        errors.push(`Match ${match.matchNumber}: ${error}`);
      }
    }

    console.log(`[FIXTURE-SYNC] Completed. Updated ${updatedCount} matches`);

    return NextResponse.json({
      success: true,
      message: `Fixtures synced successfully. Updated ${updatedCount} matches.`,
      data: {
        totalCompleted: completedMatches.length,
        updated: updatedCount,
        errors: errors.length > 0 ? errors : undefined
      }
    });

  } catch (error) {
    console.error('[FIXTURE-SYNC] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to sync fixtures' },
      { status: 500 }
    );
  }
}

