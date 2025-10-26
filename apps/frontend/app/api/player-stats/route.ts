import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { COLLECTIONS } from '@repo/schemas';
import { ObjectId } from 'mongodb';

// Helper function to check if player won a match
function isPlayerWinner(match: any, playerId: string): boolean {
  // Check if player is in winnerIds array (new structure)
  if (match.winnerIds && Array.isArray(match.winnerIds)) {
    return match.winnerIds.some((id: any) => id.toString() === playerId);
  }
  // Fallback: check winnerTeam
  if (match.winnerTeam) {
    const isTeam1 = match.player1Id?.toString() === playerId || match.player3Id?.toString() === playerId;
    const isTeam2 = match.player2Id?.toString() === playerId || match.player4Id?.toString() === playerId;
    return (isTeam1 && match.winnerTeam === 'team1') || (isTeam2 && match.winnerTeam === 'team2');
  }
  return false;
}

export async function GET(request: NextRequest) {
  try {
    const db = await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const tournamentId = searchParams.get('tournamentId');

    if (!tournamentId) {
      return NextResponse.json(
        { success: false, error: 'Tournament ID is required' },
        { status: 400 }
      );
    }

    if (!ObjectId.isValid(tournamentId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid tournament ID' },
        { status: 400 }
      );
    }

    // Get all matches for this tournament
    const matches = await db
      .collection(COLLECTIONS.MATCHES)
      .find({ tournamentId: new ObjectId(tournamentId) })
      .toArray();

    // Get all participants for this tournament with user details
    const participants = await db
      .collection(COLLECTIONS.PARTICIPANTS)
      .aggregate([
        {
          $match: {
            tournamentId: new ObjectId(tournamentId),
          },
        },
        {
          $lookup: {
            from: COLLECTIONS.USERS,
            localField: 'userId',
            foreignField: '_id',
            as: 'userDetails',
          },
        },
        {
          $unwind: {
            path: '$userDetails',
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $project: {
            _id: 1,
            userId: '$userDetails._id',
            userName: '$userDetails.name',
            category: 1,
          },
        },
      ])
      .toArray();

    // Calculate stats for each player
    const playerStatsMap = new Map();

    for (const participant of participants) {
      const playerId = participant.userId?.toString();

      if (!playerId) continue;
      
      if (!playerStatsMap.has(playerId)) {
        playerStatsMap.set(playerId, {
          _id: playerId,
          playerId: playerId,
          playerName: participant.userName || 'Unknown Player',
          totalTournaments: 1,
          totalMatches: 0,
          wins: 0,
          losses: 0,
          winRate: 0,
          titles: 0,
          runnerUps: 0,
          currentStreak: 0,
          longestStreak: 0,
          favoriteCategory: participant.category || 'singles',
          totalPoints: 0,
          averageMatchDuration: 0,
          recentForm: [],
        });
      }
    }

    // Calculate match statistics - process ALL 4 players
    for (const match of matches) {
      try {
        if (match.status !== 'completed') continue;

        const player1Id = match.player1Id?.toString();
        const player2Id = match.player2Id?.toString();
        const player3Id = match.player3Id?.toString();
        const player4Id = match.player4Id?.toString();

        // Build list of all players in this match
        const allPlayers = [player1Id, player2Id];
        if (match.category === 'doubles' || match.category === 'mixed') {
          if (player3Id) allPlayers.push(player3Id);
          if (player4Id) allPlayers.push(player4Id);
        }

        // Update stats for each player
        for (const playerId of allPlayers) {
          if (!playerId || !playerStatsMap.has(playerId)) continue;

          const stats = playerStatsMap.get(playerId);
          stats.totalMatches++;
          
          const isWinner = isPlayerWinner(match, playerId);
          if (isWinner) {
            stats.wins++;
            stats.recentForm.unshift('W');
          } else {
            stats.losses++;
            stats.recentForm.unshift('L');
          }
          
          if (match.duration) {
            stats.totalPoints += match.duration;
          }
        }
      } catch (matchError) {
        console.error('Error processing match:', match._id, matchError);
        // Continue processing other matches
      }
    }

    // Calculate derived stats and format data
    const playerStats = Array.from(playerStatsMap.values()).map((stats) => {
      const winRate = stats.totalMatches > 0 
        ? Math.round((stats.wins / stats.totalMatches) * 100)
        : 0;
      
      const averageMatchDuration = stats.totalMatches > 0
        ? Math.round(stats.totalPoints / stats.totalMatches)
        : 0;

      // Calculate current streak
      let currentStreak = 0;
      for (const result of stats.recentForm) {
        if (result === 'W') {
          currentStreak++;
        } else {
          break;
        }
      }

      // Limit recent form to last 5 matches
      stats.recentForm = stats.recentForm.slice(0, 5);

      return {
        ...stats,
        winRate,
        averageMatchDuration,
        currentStreak,
        longestStreak: Math.max(currentStreak, stats.longestStreak),
      };
    });

    // Sort by win rate and then by total wins
    playerStats.sort((a, b) => {
      if (b.winRate !== a.winRate) {
        return b.winRate - a.winRate;
      }
      return b.wins - a.wins;
    });

    return NextResponse.json({
      success: true,
      data: playerStats,
    });

  } catch (error) {
    console.error('Error fetching player stats:', error);
    console.error('Error details:', error instanceof Error ? error.message : String(error));
    console.error('Stack trace:', error instanceof Error ? error.stack : '');
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch player stats',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

