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
    const { winnerId, winnerName, player1Score, player2Score, games } = body;

    if (!winnerId || !winnerName) {
      return NextResponse.json(
        { success: false, error: 'Winner information is required' },
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

    // Update match as completed
    const updateData: any = {
      status: 'completed',
      winnerId: new ObjectId(winnerId),
      winnerName,
      player1Score: player1Score || [],
      player2Score: player2Score || [],
      games: games || [],
      completedAt: new Date(),
      updatedAt: new Date(),
    };

    await db.collection(COLLECTIONS.MATCHES).updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );

    // AUTO-PROGRESS TO NEXT ROUND (only if this is a new completion)
    const wasAlreadyCompleted = match.status === 'completed';
    if (!wasAlreadyCompleted) {
      await progressWinnerToNextRound(db, match, winnerId, winnerName);
    }

    return NextResponse.json({
      success: true,
      message: `Match completed. Winner: ${winnerName}`,
      data: { winnerId, winnerName }
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
  winnerId: string,
  winnerName: string
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
    updateFields.player1Id = new ObjectId(winnerId);
    updateFields.player1Name = winnerName;
    
    if (currentMatch.category === 'doubles' || currentMatch.category === 'mixed') {
      const isWinnerPlayer1 = winnerId === currentMatch.player1Id?.toString();
      updateFields.player3Id = isWinnerPlayer1 ? currentMatch.player3Id : currentMatch.player4Id;
      updateFields.player3Name = isWinnerPlayer1 ? currentMatch.player3Name : currentMatch.player4Name;
    }
  } else {
    updateFields.player2Id = new ObjectId(winnerId);
    updateFields.player2Name = winnerName;
    
    if (currentMatch.category === 'doubles' || currentMatch.category === 'mixed') {
      const isWinnerPlayer1 = winnerId === currentMatch.player1Id?.toString();
      updateFields.player4Id = isWinnerPlayer1 ? currentMatch.player3Id : currentMatch.player4Id;
      updateFields.player4Name = isWinnerPlayer1 ? currentMatch.player3Name : currentMatch.player4Name;
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
      await db.collection(COLLECTIONS.MATCHES).updateOne(
        { _id: updatedNextMatch._id },
        {
          $set: {
            status: 'completed',
            winnerId: updatedNextMatch.player1Id,
            winnerName: updatedNextMatch.player1Name,
            player1Score: [21, 0, 0],
            player2Score: [0, 0, 0],
            isWalkover: true,
            walkoverReason: 'bye',
            completedAt: new Date(),
            updatedAt: new Date(),
          }
        }
      );
      
      await progressWinnerToNextRound(
        db,
        updatedNextMatch,
        updatedNextMatch.player1Id.toString(),
        updatedNextMatch.player1Name
      );
    } else if (updatedNextMatch.player2Name !== 'TBD' && updatedNextMatch.player1Name === 'TBD') {
      await db.collection(COLLECTIONS.MATCHES).updateOne(
        { _id: updatedNextMatch._id },
        {
          $set: {
            status: 'completed',
            winnerId: updatedNextMatch.player2Id,
            winnerName: updatedNextMatch.player2Name,
            player1Score: [0, 0, 0],
            player2Score: [21, 0, 0],
            isWalkover: true,
            walkoverReason: 'bye',
            completedAt: new Date(),
            updatedAt: new Date(),
          }
        }
      );
      
      await progressWinnerToNextRound(
        db,
        updatedNextMatch,
        updatedNextMatch.player2Id.toString(),
        updatedNextMatch.player2Name
      );
    }
  }
}

