import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { COLLECTIONS } from '@repo/schemas';
import { getAuthUser } from '@/lib/auth-utils';
import { ObjectId } from 'mongodb';

// API to complete a match after scoring and auto-progress winner
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
        { success: false, error: 'Invalid match ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { winnerTeam, player1Score, player2Score, games, player1GamesWon, player2GamesWon } = body;

    if (!winnerTeam) {
      return NextResponse.json(
        { success: false, error: 'Winner team is required' },
        { status: 400 }
      );
    }

    // Get the match
    const match = await db.collection(COLLECTIONS.MATCHES).findOne({
      _id: new ObjectId(id)
    });

    if (!match) {
      return NextResponse.json(
        { success: false, error: 'Match not found' },
        { status: 404 }
      );
    }

    // Determine winner IDs and name based on team
    let winnerIds: ObjectId[];
    let winnerName: string;
    
    if (winnerTeam === 'team1') {
      winnerIds = match.category === 'singles'
        ? [match.player1Id]
        : [match.player1Id, match.player3Id].filter(Boolean);
      winnerName = match.category === 'singles'
        ? match.player1Name
        : `${match.player1Name} / ${match.player3Name}`;
    } else {
      winnerIds = match.category === 'singles'
        ? [match.player2Id]
        : [match.player2Id, match.player4Id].filter(Boolean);
      winnerName = match.category === 'singles'
        ? match.player2Name
        : `${match.player2Name} / ${match.player4Name}`;
    }

    // Update match as completed via live scoring
    const updateData: any = {
      status: 'completed',
      winnerTeam,
      winnerIds,
      winnerName,
      player1Score: player1Score || [],
      player2Score: player2Score || [],
      games: games || [],
      matchResult: {
        player1GamesWon: player1GamesWon || 0,
        player2GamesWon: player2GamesWon || 0,
        completedAt: new Date(),
      },
      completionType: 'normal', // Completed via live scoring
      completedAt: new Date(),
      updatedAt: new Date(),
    };

    await db.collection(COLLECTIONS.MATCHES).updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );

    // AUTO-PROGRESS TO NEXT ROUND (only if this is a new completion and tournament match)
    const wasAlreadyCompleted = match.status === 'completed';
    if (!wasAlreadyCompleted && match.matchType === 'tournament') {
      console.log(`[AUTO-PROGRESS] Starting progression for match ${id}, winner: ${winnerName}`);
      await progressWinnerToNextRound(db, match, winnerTeam, winnerName, winnerIds);
      console.log(`[AUTO-PROGRESS] Completed progression for winner: ${winnerName}`);
    } else if (wasAlreadyCompleted) {
      console.log(`[AUTO-PROGRESS] Skipping progression - match was already completed`);
    }

    return NextResponse.json({
      success: true,
      message: `Match completed. Winner: ${winnerName}`,
      data: { winnerTeam, winnerIds, winnerName }
    });

  } catch (error) {
    console.error('Error completing match:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to complete match' },
      { status: 500 }
    );
  }
}

// Helper function to progress winner to next round (same logic as declare-winner)
async function progressWinnerToNextRound(
  db: any,
  currentMatch: any,
  winnerTeam: string,
  winnerName: string,
  winnerIds: ObjectId[]
) {
  // Only progress in knockout tournaments
  if (currentMatch.round === 'Final' || currentMatch.round === 'Group Stage') {
    return;
  }

  const nextRoundNumber = currentMatch.roundNumber + 1;
  
  // Find all matches in current round with same category/ageGroup
  const currentRoundMatches = await db.collection(COLLECTIONS.MATCHES)
    .find({
      tournamentId: currentMatch.tournamentId,
      category: currentMatch.category,
      ageGroup: currentMatch.ageGroup || null,
      roundNumber: currentMatch.roundNumber
    })
    .sort({ matchNumber: 1 })
    .toArray();

  const matchPositionInRound = currentRoundMatches.findIndex(
    (m: any) => m._id.toString() === currentMatch._id.toString()
  );

  if (matchPositionInRound === -1) return;

  // Find next round matches
  const nextRoundMatches = await db.collection(COLLECTIONS.MATCHES)
    .find({
      tournamentId: currentMatch.tournamentId,
      category: currentMatch.category,
      ageGroup: currentMatch.ageGroup || null,
      roundNumber: nextRoundNumber
    })
    .sort({ matchNumber: 1 })
    .toArray();

  if (nextRoundMatches.length === 0) return;

  const nextMatchIndex = Math.floor(matchPositionInRound / 2);
  const nextMatch = nextRoundMatches[nextMatchIndex];

  if (!nextMatch) return;

  const isPlayer1Position = matchPositionInRound % 2 === 0;

  const updateFields: any = {};
  
  if (isPlayer1Position) {
    updateFields.player1Id = winnerIds[0];
    updateFields.player1Name = winnerName;
    
    if (currentMatch.category === 'doubles' || currentMatch.category === 'mixed') {
      updateFields.player3Id = winnerIds[1] || null;
      updateFields.player3Name = winnerTeam === 'team1' ? currentMatch.player3Name : currentMatch.player4Name;
    }
  } else {
    updateFields.player2Id = winnerIds[0];
    updateFields.player2Name = winnerName;
    
    if (currentMatch.category === 'doubles' || currentMatch.category === 'mixed') {
      updateFields.player4Id = winnerIds[1] || null;
      updateFields.player4Name = winnerTeam === 'team1' ? currentMatch.player3Name : currentMatch.player4Name;
    }
  }

  updateFields.updatedAt = new Date();

  await db.collection(COLLECTIONS.MATCHES).updateOne(
    { _id: nextMatch._id },
    { $set: updateFields }
  );

  // Check if next match now has both players and one is TBD -> auto-walkover
  const updatedNextMatch = await db.collection(COLLECTIONS.MATCHES).findOne({
    _id: nextMatch._id
  });

  if (updatedNextMatch) {
    if (updatedNextMatch.player1Name !== 'TBD' && updatedNextMatch.player2Name === 'TBD') {
      const team1WinnerIds = updatedNextMatch.category === 'singles'
        ? [updatedNextMatch.player1Id]
        : [updatedNextMatch.player1Id, updatedNextMatch.player3Id].filter(Boolean);
      
      await db.collection(COLLECTIONS.MATCHES).updateOne(
        { _id: updatedNextMatch._id },
        {
          $set: {
            status: 'completed',
            winnerTeam: 'team1',
            winnerIds: team1WinnerIds,
            winnerName: updatedNextMatch.player1Name,
            player1Score: [21, 0, 0],
            player2Score: [0, 0, 0],
            completionType: 'walkover',
            completionReason: 'bye',
            completedAt: new Date(),
            updatedAt: new Date(),
          }
        }
      );
      
      await progressWinnerToNextRound(
        db,
        updatedNextMatch,
        'team1',
        updatedNextMatch.player1Name,
        team1WinnerIds
      );
    } else if (updatedNextMatch.player2Name !== 'TBD' && updatedNextMatch.player1Name === 'TBD') {
      const team2WinnerIds = updatedNextMatch.category === 'singles'
        ? [updatedNextMatch.player2Id]
        : [updatedNextMatch.player2Id, updatedNextMatch.player4Id].filter(Boolean);
      
      await db.collection(COLLECTIONS.MATCHES).updateOne(
        { _id: updatedNextMatch._id },
        {
          $set: {
            status: 'completed',
            winnerTeam: 'team2',
            winnerIds: team2WinnerIds,
            winnerName: updatedNextMatch.player2Name,
            player1Score: [0, 0, 0],
            player2Score: [21, 0, 0],
            completionType: 'walkover',
            completionReason: 'bye',
            completedAt: new Date(),
            updatedAt: new Date(),
          }
        }
      );
      
      await progressWinnerToNextRound(
        db,
        updatedNextMatch,
        'team2',
        updatedNextMatch.player2Name,
        team2WinnerIds
      );
    }
  }
}

