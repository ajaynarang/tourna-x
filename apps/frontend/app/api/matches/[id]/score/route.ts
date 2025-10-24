import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { COLLECTIONS } from '@repo/schemas';
import { ObjectId } from 'mongodb';

// Helper function to get authenticated user
async function getAuthenticatedUser(request: NextRequest) {
  const db = await connectToDatabase();
  const sessionToken = request.cookies.get('session')?.value;

  if (!sessionToken) {
    return null;
  }

  const session = await db.collection(COLLECTIONS.SESSIONS).findOne({
    sessionToken,
    expiresAt: { $gt: new Date() }
  });

  if (!session) {
    return null;
  }

  const user = await db.collection(COLLECTIONS.USERS).findOne({
    _id: new ObjectId(session.userId)
  });

  return user;
}

// Badminton scoring validation
function validateBadmintonScore(player1Score: number, player2Score: number): boolean {
  // Normal win: 21 points with 2-point margin
  if (player1Score === 21 && player2Score <= 19) return true;
  if (player2Score === 21 && player1Score <= 19) return true;
  
  // Deuce win: Must win by 2, max 30
  if (player1Score >= 20 && player2Score >= 20) {
    if (Math.abs(player1Score - player2Score) === 2) return true;
    if (player1Score === 30 || player2Score === 30) return true;
  }
  
  return false;
}

function determineMatchWinner(sets: { player1Score: number[], player2Score: number[] }): 'player1' | 'player2' | null {
  const wins = { player1: 0, player2: 0 };
  
  sets.player1Score.forEach((score1, index) => {
    const score2 = sets.player2Score[index];
    if (score2 !== undefined && score1 > score2) wins.player1++;
    else wins.player2++;
  });
  
  if (wins.player1 > wins.player2) return 'player1';
  if (wins.player2 > wins.player1) return 'player2';
  return null;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const db = await connectToDatabase();
    const user = await getAuthenticatedUser(request);
    const { id } = await params;

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Check if user is admin or referee for this match
    const match = await db.collection(COLLECTIONS.MATCHES).findOne({
      _id: new ObjectId(id)
    });

    if (!match) {
      return NextResponse.json(
        { success: false, error: 'Match not found' },
        { status: 404 }
      );
    }

    const isAdmin = user.roles?.includes('admin');
    const isReferee = await db.collection(COLLECTIONS.REFEREES).findOne({
      tournamentId: match.tournamentId,
      userId: user._id,
      isActive: true
    });

    if (!isAdmin && !isReferee) {
      return NextResponse.json(
        { success: false, error: 'Admin or referee access required' },
        { status: 403 }
      );
    }

    const { player1Score, player2Score, currentSet, isComplete } = await request.json();

    // Validate scores
    if (currentSet && player1Score[currentSet - 1] !== undefined && player2Score[currentSet - 1] !== undefined) {
      const score1 = player1Score[currentSet - 1];
      const score2 = player2Score[currentSet - 1];
      
      if (!validateBadmintonScore(score1, score2)) {
        return NextResponse.json(
          { success: false, error: 'Invalid badminton score' },
          { status: 400 }
        );
      }
    }

    // Update match
    const updateData: any = {
      player1Score,
      player2Score,
      updatedAt: new Date(),
    };

    if (isComplete) {
      const winner = determineMatchWinner({ player1Score, player2Score });
      if (winner) {
        updateData.winnerId = winner === 'player1' ? match.player1Id : match.player2Id;
        updateData.winnerName = winner === 'player1' ? match.player1Name : match.player2Name;
        updateData.status = 'completed';
        updateData.endTime = new Date();
      }
    } else {
      updateData.status = 'in_progress';
      if (!match.startTime) {
        updateData.startTime = new Date();
      }
    }

    const result = await db.collection(COLLECTIONS.MATCHES).updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { success: false, error: 'Match not found' },
        { status: 404 }
      );
    }

    // If match is completed, handle bracket progression for knockout tournaments
    if (isComplete && updateData.status === 'completed') {
      await handleBracketProgression(db, match, updateData.winnerId);
    }

    return NextResponse.json({
      success: true,
      message: 'Score updated successfully',
      data: updateData
    });

  } catch (error) {
    console.error('Error updating match score:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update score' },
      { status: 500 }
    );
  }
}

async function handleBracketProgression(db: any, match: any, winnerId: string) {
  try {
    // Get tournament format
    const tournament = await db.collection(COLLECTIONS.TOURNAMENTS).findOne({
      _id: match.tournamentId
    });

    if (tournament?.format !== 'knockout') return;

    // Find next match in bracket
    const nextRound = match.roundNumber + 1;
    const nextMatchNumber = Math.ceil(match.matchNumber / 2);
    
    const nextMatch = await db.collection(COLLECTIONS.MATCHES).findOne({
      tournamentId: match.tournamentId,
      category: match.category,
      ageGroup: match.ageGroup,
      roundNumber: nextRound,
      matchNumber: nextMatchNumber
    });

    if (nextMatch) {
      // Determine which player slot to fill
      const isPlayer1Slot = match.matchNumber % 2 === 1;
      
      const updateField = isPlayer1Slot ? 'player1Id' : 'player2Id';
      const updateNameField = isPlayer1Slot ? 'player1Name' : 'player2Name';
      
      // Get winner details
      const winner = await db.collection(COLLECTIONS.PARTICIPANTS).findOne({
        tournamentId: match.tournamentId,
        userId: winnerId
      });

      if (winner) {
        await db.collection(COLLECTIONS.MATCHES).updateOne(
          { _id: nextMatch._id },
          {
            $set: {
              [updateField]: winnerId,
              [updateNameField]: winner.name,
              updatedAt: new Date()
            }
          }
        );
      }
    }
  } catch (error) {
    console.error('Error handling bracket progression:', error);
  }
}
