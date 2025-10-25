import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { COLLECTIONS } from '@repo/schemas';
import { ObjectId } from 'mongodb';

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

    // Calculate match statistics
    for (const match of matches) {
      if (match.status !== 'completed') continue;

      const player1Id = match.player1Id?.toString();
      const player2Id = match.player2Id?.toString();
      const winnerId = match.winnerId?.toString();

      // Update player 1 stats
      if (player1Id && playerStatsMap.has(player1Id)) {
        const stats = playerStatsMap.get(player1Id);
        stats.totalMatches++;
        
        if (winnerId === player1Id) {
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

      // Update player 2 stats
      if (player2Id && playerStatsMap.has(player2Id)) {
        const stats = playerStatsMap.get(player2Id);
        stats.totalMatches++;
        
        if (winnerId === player2Id) {
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

      // For doubles matches, update player 3 and player 4 stats
      if (match.player3Id) {
        const player3Id = match.player3Id.toString();
        if (playerStatsMap.has(player3Id)) {
          const stats = playerStatsMap.get(player3Id);
          stats.totalMatches++;
          
          if (winnerId === player1Id || winnerId === player3Id) {
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
      }

      if (match.player4Id) {
        const player4Id = match.player4Id.toString();
        if (playerStatsMap.has(player4Id)) {
          const stats = playerStatsMap.get(player4Id);
          stats.totalMatches++;
          
          if (winnerId === player2Id || winnerId === player4Id) {
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
    return NextResponse.json(
      { success: false, error: 'Failed to fetch player stats' },
      { status: 500 }
    );
  }
}

