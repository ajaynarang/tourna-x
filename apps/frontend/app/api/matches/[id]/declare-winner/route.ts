import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { COLLECTIONS } from '@repo/schemas';
import { getAuthUser } from '@/lib/auth-utils';
import { ObjectId } from 'mongodb';

// API to manually declare a winner (walkover/forfeit/disqualification)
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
    const { 
      winnerId, 
      reason, // reason: 'walkover', 'forfeit', 'disqualification', 'manual'
      player1Score, // Optional: actual scores if available
      player2Score, // Optional: actual scores if available
      games // Optional: detailed game data
    } = body;

    if (!winnerId || !reason) {
      return NextResponse.json(
        { success: false, error: 'Winner ID and reason are required' },
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

    // Allow editing completed matches (no longer block updates)

    // Determine winner and loser
    const isPlayer1Winner = winnerId === match.player1Id?.toString();
    const winnerName = isPlayer1Winner ? match.player1Name : match.player2Name;

    // Determine if scores were provided
    const hasScores = player1Score && player2Score && player1Score.length > 0;

    // Update match with winner declaration
    const updateData: any = {
      status: 'completed',
      winnerId: new ObjectId(winnerId),
      winnerName,
      completedAt: new Date(),
      updatedAt: new Date(),
    };

    // Handle scores based on reason and whether scores were provided
    if (hasScores) {
      // User provided scores - use them
      updateData.player1Score = player1Score;
      updateData.player2Score = player2Score;
      if (games && games.length > 0) {
        updateData.games = games;
      }
      // Mark as manual entry if reason is 'manual'
      if (reason === 'manual') {
        updateData.isManualEntry = true;
      } else {
        updateData.isWalkover = true;
        updateData.walkoverReason = reason;
      }
    } else if (reason === 'manual') {
      // Manual reason but no scores - don't add any scores
      updateData.isManualEntry = true;
    } else {
      // Walkover/forfeit/disqualification without scores - use default walkover scores
      updateData.player1Score = isPlayer1Winner ? [21, 0, 0] : [0, 0, 0];
      updateData.player2Score = isPlayer1Winner ? [0, 0, 0] : [21, 0, 0];
      updateData.isWalkover = true;
      updateData.walkoverReason = reason;
    }

    await db.collection(COLLECTIONS.MATCHES).updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );

    // AUTO-PROGRESS TO NEXT ROUND (only if this is a new completion, not an edit)
    const wasAlreadyCompleted = match.status === 'completed';
    if (!wasAlreadyCompleted) {
      await progressWinnerToNextRound(db, match, winnerId, winnerName);
    }

    return NextResponse.json({
      success: true,
      message: wasAlreadyCompleted
        ? `Match result updated: ${winnerName} wins`
        : hasScores 
          ? `Match completed: ${winnerName} wins with scores recorded`
          : `Winner declared: ${winnerName} (${reason})`,
      data: { 
        winnerId, 
        winnerName, 
        reason,
        hasScores,
        player1Score: updateData.player1Score,
        player2Score: updateData.player2Score,
        wasEdit: wasAlreadyCompleted
      }
    });

  } catch (error) {
    console.error('Error declaring winner:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to declare winner' },
      { status: 500 }
    );
  }
}

// Helper function to progress winner to next round
async function progressWinnerToNextRound(
  db: any,
  currentMatch: any,
  winnerId: string,
  winnerName: string
) {
  // Only progress in knockout tournaments
  if (currentMatch.round === 'Final' || currentMatch.round === 'Group Stage') {
    return; // No next round for finals or round robin
  }

  // Find the next round match
  const nextRoundNumber = currentMatch.roundNumber + 1;
  
  // Calculate which match in the next round
  // In knockout: match 1 & 2 feed into next match 1, match 3 & 4 feed into next match 2, etc.
  const currentMatchNumber = currentMatch.matchNumber;
  
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

  // Find position of current match in its round
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

  // Determine which next match and which position
  const nextMatchIndex = Math.floor(matchPositionInRound / 2);
  const nextMatch = nextRoundMatches[nextMatchIndex];

  if (!nextMatch) return;

  // Determine if winner goes to player1 or player2 position
  const isPlayer1Position = matchPositionInRound % 2 === 0;

  const updateFields: any = {};
  
  if (isPlayer1Position) {
    updateFields.player1Id = new ObjectId(winnerId);
    updateFields.player1Name = winnerName;
    
    // For doubles, also update partner
    if (currentMatch.category === 'doubles' || currentMatch.category === 'mixed') {
      const isWinnerPlayer1 = winnerId === currentMatch.player1Id?.toString();
      updateFields.player3Id = isWinnerPlayer1 ? currentMatch.player3Id : currentMatch.player4Id;
      updateFields.player3Name = isWinnerPlayer1 ? currentMatch.player3Name : currentMatch.player4Name;
    }
  } else {
    updateFields.player2Id = new ObjectId(winnerId);
    updateFields.player2Name = winnerName;
    
    // For doubles, also update partner
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
      // Player 1 gets automatic walkover
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
      
      // Recursively progress this winner too
      await progressWinnerToNextRound(
        db,
        updatedNextMatch,
        updatedNextMatch.player1Id.toString(),
        updatedNextMatch.player1Name
      );
    } else if (updatedNextMatch.player2Name !== 'TBD' && updatedNextMatch.player1Name === 'TBD') {
      // Player 2 gets automatic walkover
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
      
      // Recursively progress this winner too
      await progressWinnerToNextRound(
        db,
        updatedNextMatch,
        updatedNextMatch.player2Id.toString(),
        updatedNextMatch.player2Name
      );
    }
  }
}

