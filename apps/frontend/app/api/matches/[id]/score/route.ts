import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { COLLECTIONS } from '@repo/schemas';
import { getAuthUser } from '@/lib/auth-utils';
import { ObjectId } from 'mongodb';

// Helper function to get authenticated user

// Helper function to determine game winner
function determineGameWinner(player1Score: number, player2Score: number, scoringFormat: any): 'player1' | 'player2' | null {
  const { pointsPerGame, winBy, maxPoints } = scoringFormat;
  
  // Check if either player has reached the winning score
  if (player1Score >= pointsPerGame || player2Score >= pointsPerGame) {
    // Check win by margin
    if (Math.abs(player1Score - player2Score) >= winBy) {
      return player1Score > player2Score ? 'player1' : 'player2';
    }
    
    // Check if we've hit max points (sudden death)
    if (maxPoints && (player1Score >= maxPoints || player2Score >= maxPoints)) {
      return player1Score > player2Score ? 'player1' : 'player2';
    }
  }
  
  return null;
}

// Helper function to determine match winner
function determineMatchWinner(games: any[], scoringFormat: any): 'player1' | 'player2' | null {
  const { gamesPerMatch } = scoringFormat;
  const gamesToWin = Math.ceil(gamesPerMatch / 2);
  
  let player1GamesWon = 0;
  let player2GamesWon = 0;
  
  games.forEach(game => {
    if (game.winner === 'player1') player1GamesWon++;
    if (game.winner === 'player2') player2GamesWon++;
  });
  
  if (player1GamesWon >= gamesToWin) return 'player1';
  if (player2GamesWon >= gamesToWin) return 'player2';
  
  return null;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getAuthUser(request);
    
    const body = await request.json();
    const { action, gameNumber, player1Score, player2Score, scoringFormat } = body;

    const db = await getDatabase();
    const match = await db.collection(COLLECTIONS.MATCHES).findOne({
      _id: new ObjectId(id)
    });

    if (!match) {
      return NextResponse.json(
        { success: false, error: 'Match not found' },
        { status: 404 }
      );
    }

    // Check if user has permission to score this match
    // Admin can score any match, players can only score their own matches
    const isAdmin = user?.roles?.includes('admin');
    const isPlayerInMatch = match.player1Id?.toString() === user?.userId?.toString() ||
                           match.player2Id?.toString() === user?.userId?.toString();
    
    if (!isAdmin && !isPlayerInMatch) {
      return NextResponse.json(
        { success: false, error: 'Not authorized to score this match' },
        { status: 403 }
      );
    }

    let updatedMatch = { ...match };

    switch (action) {
      case 'start_match':
        updatedMatch.status = 'in_progress';
        updatedMatch.startTime = new Date();
        break;

      case 'update_score':
        if (!gameNumber || player1Score === undefined || player2Score === undefined) {
          return NextResponse.json(
            { success: false, error: 'Missing required fields: gameNumber, player1Score, player2Score' },
            { status: 400 }
          );
        }

        // Initialize games array if empty
        if (!updatedMatch.games) {
          updatedMatch.games = [];
        }

        // Find or create the game
        let game = updatedMatch.games.find((g: any) => g.gameNumber === gameNumber);
        if (!game) {
          game = {
            gameNumber,
            player1Score: 0,
            player2Score: 0,
          };
          updatedMatch.games.push(game);
        }

        // Update scores
        game.player1Score = player1Score;
        game.player2Score = player2Score;

        // Check if game is won
        const gameWinner = determineGameWinner(player1Score, player2Score, scoringFormat || updatedMatch.scoringFormat);
        if (gameWinner) {
          game.winner = gameWinner;
          game.completedAt = new Date();
        }

        // Check if match is won
        const matchWinner = determineMatchWinner(updatedMatch.games, scoringFormat || updatedMatch.scoringFormat);
        if (matchWinner) {
          updatedMatch.status = 'completed';
          updatedMatch.endTime = new Date();
          updatedMatch.winnerId = matchWinner === 'player1' ? updatedMatch.player1Id : updatedMatch.player2Id;
          updatedMatch.winnerName = matchWinner === 'player1' ? updatedMatch.player1Name : updatedMatch.player2Name;
          
          // Calculate match result
          const player1GamesWon = updatedMatch.games.filter((g: any) => g.winner === 'player1').length;
          const player2GamesWon = updatedMatch.games.filter((g: any) => g.winner === 'player2').length;
          
          updatedMatch.matchResult = {
            player1GamesWon,
            player2GamesWon,
            totalDuration: updatedMatch.startTime ? 
              Math.round((updatedMatch.endTime.getTime() - updatedMatch.startTime.getTime()) / 60000) : undefined,
            completedAt: updatedMatch.endTime,
          };

          // Update legacy score arrays for backward compatibility
          updatedMatch.player1Score = updatedMatch.games.map((g: any) => g.player1Score);
          updatedMatch.player2Score = updatedMatch.games.map((g: any) => g.player2Score);
        }
        break;

      case 'complete_game':
        if (!gameNumber) {
          return NextResponse.json(
            { success: false, error: 'Missing gameNumber' },
            { status: 400 }
          );
        }

        const gameToComplete = updatedMatch.games.find((g: any) => g.gameNumber === gameNumber);
        if (gameToComplete && !gameToComplete.winner) {
          const winner = determineGameWinner(
            gameToComplete.player1Score, 
            gameToComplete.player2Score, 
            scoringFormat || updatedMatch.scoringFormat
          );
          
          if (winner) {
            gameToComplete.winner = winner;
            gameToComplete.completedAt = new Date();
          }
        }
        break;

      case 'end_match':
        updatedMatch.status = 'completed';
        updatedMatch.endTime = new Date();
        
        // Calculate final result
        const finalWinner = determineMatchWinner(updatedMatch.games, scoringFormat || updatedMatch.scoringFormat);
        if (finalWinner) {
          updatedMatch.winnerId = finalWinner === 'player1' ? updatedMatch.player1Id : updatedMatch.player2Id;
          updatedMatch.winnerName = finalWinner === 'player1' ? updatedMatch.player1Name : updatedMatch.player2Name;
        }
        break;

      case 'walkover':
        const { walkoverReason, winner } = body;
        updatedMatch.status = 'walkover';
        updatedMatch.endTime = new Date();
        updatedMatch.walkoverReason = walkoverReason;
        
        if (winner === 'player1') {
          updatedMatch.winnerId = updatedMatch.player1Id;
          updatedMatch.winnerName = updatedMatch.player1Name;
        } else if (winner === 'player2') {
          updatedMatch.winnerId = updatedMatch.player2Id;
          updatedMatch.winnerName = updatedMatch.player2Name;
        }
        break;

      case 'cancel_match':
        updatedMatch.status = 'cancelled';
        updatedMatch.endTime = new Date();
        break;

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }

    // Update the match in database
    updatedMatch.updatedAt = new Date();
    
    await db.collection(COLLECTIONS.MATCHES).updateOne(
      { _id: new ObjectId(id) },
      { $set: updatedMatch }
    );

    return NextResponse.json({
      success: true,
      match: updatedMatch,
      message: `Match ${action} successful`
    });

  } catch (error) {
    console.error('Error updating match score:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update match score' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = await getDatabase();
    
    const match = await db.collection(COLLECTIONS.MATCHES).findOne({
      _id: new ObjectId(id)
    });

    if (!match) {
      return NextResponse.json(
        { success: false, error: 'Match not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      match
    });

  } catch (error) {
    console.error('Error fetching match:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch match' },
      { status: 500 }
    );
  }
}