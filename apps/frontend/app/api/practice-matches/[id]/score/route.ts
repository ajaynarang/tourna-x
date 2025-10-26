import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { COLLECTIONS } from '@repo/schemas';
import { getAuthUser } from '@/lib/auth-utils';
import { ObjectId } from 'mongodb';

// Helper functions for scoring logic
function determineGameWinner(
  player1Score: number,
  player2Score: number,
  scoringFormat: any
): 'player1' | 'player2' | null {
  const { pointsPerGame, winBy, maxPoints } = scoringFormat;
  
  // Check if either player reached the target points
  if (player1Score >= pointsPerGame || player2Score >= pointsPerGame) {
    // Check win by margin
    if (Math.abs(player1Score - player2Score) >= winBy) {
      return player1Score > player2Score ? 'player1' : 'player2';
    }
    
    // Check max points cap (if set)
    if (maxPoints) {
      if (player1Score >= maxPoints) return 'player1';
      if (player2Score >= maxPoints) return 'player2';
    }
  }
  
  return null;
}

function determineMatchWinner(games: any[], scoringFormat: any): 'player1' | 'player2' | null {
  const { gamesPerMatch } = scoringFormat;
  const gamesToWin = Math.ceil(gamesPerMatch / 2);
  
  let player1GamesWon = 0;
  let player2GamesWon = 0;
  
  for (const game of games) {
    if (game.winner === 'player1') player1GamesWon++;
    if (game.winner === 'player2') player2GamesWon++;
  }
  
  if (player1GamesWon >= gamesToWin) return 'player1';
  if (player2GamesWon >= gamesToWin) return 'player2';
  
  return null;
}

// Update practice stats helper
async function updatePracticeStats(db: any, match: any) {
  if (!match.winnerTeam) return;

  const player1Id = match.player1Id;
  const player2Id = match.player2Id;
  const player3Id = match.player3Id;
  const player4Id = match.player4Id;
  const winnerTeam = match.winnerTeam; // 'team1' or 'team2'
  const category = match.category;

  // Build list of all players (including doubles partners)
  const allPlayers = [player1Id, player2Id];
  if (category === 'doubles' || category === 'mixed') {
    if (player3Id) allPlayers.push(player3Id);
    if (player4Id) allPlayers.push(player4Id);
  }

  // Only update stats for registered players (not guests)
  for (const playerId of allPlayers) {
    if (!playerId) continue;

    // Determine if this player won
    // Team 1: player1 + player3, Team 2: player2 + player4
    const isTeam1Player = playerId.toString() === player1Id?.toString() || playerId.toString() === player3Id?.toString();
    const isWinner = (isTeam1Player && winnerTeam === 'team1') || (!isTeam1Player && winnerTeam === 'team2');
    
    const stats = await db.collection(COLLECTIONS.PRACTICE_STATS).findOne({ playerId });

    const player1GamesWon = match.matchResult?.player1GamesWon || 0;
    const player2GamesWon = match.matchResult?.player2GamesWon || 0;
    const gamesWon = isTeam1Player ? player1GamesWon : player2GamesWon;
    const gamesLost = isTeam1Player ? player2GamesWon : player1GamesWon;

    if (!stats) {
      // Create new stats
      const newStats = {
        playerId,
        totalMatches: 1,
        wins: isWinner ? 1 : 0,
        losses: isWinner ? 0 : 1,
        winRate: isWinner ? 100 : 0,
        totalGamesWon: gamesWon,
        totalGamesLost: gamesLost,
        currentStreak: isWinner ? 1 : -1,
        longestStreak: isWinner ? 1 : 0,
        favoriteCategory: category,
        totalPoints: 0,
        averageMatchDuration: match.matchResult?.totalDuration || 0,
        recentForm: [isWinner ? 'W' : 'L'],
        singlesRecord: category === 'singles' ? { played: 1, won: isWinner ? 1 : 0, lost: isWinner ? 0 : 1 } : { played: 0, won: 0, lost: 0 },
        doublesRecord: category === 'doubles' ? { played: 1, won: isWinner ? 1 : 0, lost: isWinner ? 0 : 1 } : { played: 0, won: 0, lost: 0 },
        mixedRecord: category === 'mixed' ? { played: 1, won: isWinner ? 1 : 0, lost: isWinner ? 0 : 1 } : { played: 0, won: 0, lost: 0 },
        updatedAt: new Date(),
      };

      await db.collection(COLLECTIONS.PRACTICE_STATS).insertOne(newStats);
    } else {
      // Update existing stats
      const totalMatches = stats.totalMatches + 1;
      const wins = stats.wins + (isWinner ? 1 : 0);
      const losses = stats.losses + (isWinner ? 0 : 1);
      const winRate = (wins / totalMatches) * 100;

      let currentStreak = stats.currentStreak;
      if (isWinner) {
        currentStreak = currentStreak > 0 ? currentStreak + 1 : 1;
      } else {
        currentStreak = currentStreak < 0 ? currentStreak - 1 : -1;
      }

      const longestStreak = Math.max(stats.longestStreak, currentStreak > 0 ? currentStreak : 0);

      const recentForm = [...stats.recentForm, isWinner ? 'W' : 'L'].slice(-10);

      const categoryRecord = `${category}Record`;
      const updatedCategoryRecord = {
        ...stats[categoryRecord],
        played: stats[categoryRecord].played + 1,
        won: stats[categoryRecord].won + (isWinner ? 1 : 0),
        lost: stats[categoryRecord].lost + (isWinner ? 0 : 1),
      };

      await db.collection(COLLECTIONS.PRACTICE_STATS).updateOne(
        { playerId },
        {
          $set: {
            totalMatches,
            wins,
            losses,
            winRate,
            totalGamesWon: stats.totalGamesWon + gamesWon,
            totalGamesLost: stats.totalGamesLost + gamesLost,
            currentStreak,
            longestStreak,
            recentForm,
            [categoryRecord]: updatedCategoryRecord,
            updatedAt: new Date(),
          }
        }
      );
    }
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = await connectToDatabase();
    const authUser = await getAuthUser(request);

    if (!authUser || (!authUser.roles.includes('admin') && !authUser.roles.includes('player'))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid match ID' }, { status: 400 });
    }

    const match = await db.collection(COLLECTIONS.MATCHES).findOne({
      _id: new ObjectId(id),
      matchType: 'practice'
    });

    if (!match) {
      return NextResponse.json({ error: 'Practice match not found' }, { status: 404 });
    }

    const body = await request.json();
    const { action, gameNumber, player1Score, player2Score, scoringFormat, walkoverReason, winner, pointHistory, matchScore } = body;

    if (!action) {
      return NextResponse.json(
        { success: false, error: 'Missing required field: action' },
        { status: 400 }
      );
    }

    let updatedMatch = { ...match };

    switch (action) {
      case 'start_match':
        updatedMatch.status = 'in_progress';
        updatedMatch.startTime = new Date();
        break;

      case 'update_score':
        // Handle new matchScore format
        if (matchScore) {
          // Add gameNumber to each game if not present
          const gamesWithNumbers = matchScore.games.map((game: any, index: number) => ({
            ...game,
            gameNumber: game.gameNumber || index + 1
          }));
          
          updatedMatch.games = gamesWithNumbers;
          updatedMatch.player1GamesWon = matchScore.player1GamesWon || 0;
          updatedMatch.player2GamesWon = matchScore.player2GamesWon || 0;
          
          // Check if match is complete
          if (matchScore.isMatchComplete && matchScore.winner) {
            updatedMatch.status = 'completed';
            updatedMatch.winnerId = matchScore.winner === 'player1' ? updatedMatch.player1Id : updatedMatch.player2Id;
            
            // Set winner name based on category (team names for doubles/mixed)
            if (updatedMatch.category === 'singles') {
              updatedMatch.winnerName = matchScore.winner === 'player1' ? updatedMatch.player1Name : updatedMatch.player2Name;
            } else {
              // For doubles/mixed, show team name
              updatedMatch.winnerName = matchScore.winner === 'player1' 
                ? `${updatedMatch.player1Name} / ${updatedMatch.player3Name}`
                : `${updatedMatch.player2Name} / ${updatedMatch.player4Name}`;
            }
            
            updatedMatch.endTime = new Date();
            
            // Update match result
            updatedMatch.matchResult = {
              player1GamesWon: matchScore.player1GamesWon,
              player2GamesWon: matchScore.player2GamesWon,
              totalDuration: updatedMatch.startTime ? Math.round((new Date().getTime() - new Date(updatedMatch.startTime).getTime()) / 60000) : 0,
              completedAt: new Date(),
            };
            
            // Update practice stats
            await updatePracticeStats(db, updatedMatch);
          }
        } else if (player1Score === undefined || player2Score === undefined) {
          return NextResponse.json(
            { success: false, error: 'Missing required fields: player1Score, player2Score' },
            { status: 400 }
          );
        } else {
          // Fallback to old format for backward compatibility
          // Initialize games array if empty
          if (!updatedMatch.games) {
            updatedMatch.games = [];
          }

        // Find or create the current game (default to game 1 if no gameNumber specified)
        const currentGameNumber = gameNumber || 1;
        let game = updatedMatch.games.find((g: any) => g.gameNumber === currentGameNumber);
        if (!game) {
          game = {
            gameNumber: currentGameNumber,
            player1Score: 0,
            player2Score: 0,
            pointHistory: [],
          };
          updatedMatch.games.push(game);
        }

        // Update scores
        game.player1Score = player1Score;
        game.player2Score = player2Score;

        // Add point history if provided
        if (pointHistory && Array.isArray(pointHistory)) {
          game.pointHistory = pointHistory;
        }

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
          
          // NEW: Set winnerTeam and winnerIds
          updatedMatch.winnerTeam = matchWinner === 'player1' ? 'team1' : 'team2';
          
          if (updatedMatch.category === 'singles') {
            updatedMatch.winnerIds = [matchWinner === 'player1' ? updatedMatch.player1Id : updatedMatch.player2Id];
            updatedMatch.winnerName = matchWinner === 'player1' ? updatedMatch.player1Name : updatedMatch.player2Name;
          } else {
            // For doubles/mixed, include both team members
            updatedMatch.winnerIds = matchWinner === 'player1' 
              ? [updatedMatch.player1Id, updatedMatch.player3Id].filter(Boolean)
              : [updatedMatch.player2Id, updatedMatch.player4Id].filter(Boolean);
            updatedMatch.winnerName = matchWinner === 'player1' 
              ? `${updatedMatch.player1Name} / ${updatedMatch.player3Name}`
              : `${updatedMatch.player2Name} / ${updatedMatch.player4Name}`;
          }

          // Calculate match result
          const player1GamesWon = updatedMatch.games.filter((g: any) => g.winner === 'player1').length;
          const player2GamesWon = updatedMatch.games.filter((g: any) => g.winner === 'player2').length;
          const totalDuration = updatedMatch.startTime 
            ? Math.round((new Date().getTime() - new Date(updatedMatch.startTime).getTime()) / 60000)
            : 0;

          updatedMatch.matchResult = {
            player1GamesWon,
            player2GamesWon,
            totalDuration,
            completedAt: new Date(),
          };

          // Update practice stats
          await updatePracticeStats(db, updatedMatch);
        }
        }

        break;

      case 'end_match':
        updatedMatch.status = 'completed';
        updatedMatch.endTime = new Date();
        
        // Calculate final result
        const finalWinner = determineMatchWinner(updatedMatch.games, scoringFormat || updatedMatch.scoringFormat);
        if (finalWinner) {
          // NEW: Set winnerTeam and winnerIds
          updatedMatch.winnerTeam = finalWinner === 'player1' ? 'team1' : 'team2';
          
          if (updatedMatch.category === 'singles') {
            updatedMatch.winnerIds = [finalWinner === 'player1' ? updatedMatch.player1Id : updatedMatch.player2Id];
            updatedMatch.winnerName = finalWinner === 'player1' ? updatedMatch.player1Name : updatedMatch.player2Name;
          } else {
            // For doubles/mixed, include both team members
            updatedMatch.winnerIds = finalWinner === 'player1' 
              ? [updatedMatch.player1Id, updatedMatch.player3Id].filter(Boolean)
              : [updatedMatch.player2Id, updatedMatch.player4Id].filter(Boolean);
            updatedMatch.winnerName = finalWinner === 'player1' 
              ? `${updatedMatch.player1Name} / ${updatedMatch.player3Name}`
              : `${updatedMatch.player2Name} / ${updatedMatch.player4Name}`;
          }

          const player1GamesWon = updatedMatch.games.filter((g: any) => g.winner === 'player1').length;
          const player2GamesWon = updatedMatch.games.filter((g: any) => g.winner === 'player2').length;
          const totalDuration = updatedMatch.startTime 
            ? Math.round((new Date().getTime() - new Date(updatedMatch.startTime).getTime()) / 60000)
            : 0;

          updatedMatch.matchResult = {
            player1GamesWon,
            player2GamesWon,
            totalDuration,
            completedAt: new Date(),
          };

          // Update practice stats
          await updatePracticeStats(db, updatedMatch);
        }
        break;

      case 'walkover':
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

        updatedMatch.matchResult = {
          player1GamesWon: winner === 'player1' ? 1 : 0,
          player2GamesWon: winner === 'player2' ? 1 : 0,
          totalDuration: 0,
          completedAt: new Date(),
        };

        // Update practice stats for walkover
        await updatePracticeStats(db, updatedMatch);
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

    console.log(`Practice match ${action} completed:`, {
      matchId: id,
      status: updatedMatch.status,
      winnerName: updatedMatch.winnerName,
      matchResult: updatedMatch.matchResult,
      gamesCount: updatedMatch.games?.length || 0
    });

    return NextResponse.json({
      success: true,
      match: updatedMatch,
      message: `Practice match ${action} successful`
    });

  } catch (error) {
    console.error('Error updating practice match score:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update practice match score' },
      { status: 500 }
    );
  }
}

