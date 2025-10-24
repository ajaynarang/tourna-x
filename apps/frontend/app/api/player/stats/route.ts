import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { COLLECTIONS } from '@repo/schemas';
import { getAuthUser } from '@/lib/auth-utils';
import { ObjectId } from 'mongodb';

export async function GET(request: NextRequest) {
  try {
    const db = await connectToDatabase();
    const authUser = await getAuthUser(request);

    if (!authUser || !authUser.userId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const tournamentId = searchParams.get('tournamentId');

    // Build aggregation pipeline for player stats
    const pipeline: any[] = [
      { $match: { playerId: new ObjectId(authUser.userId) } }
    ];

    if (tournamentId) {
      pipeline.push({
        $lookup: {
          from: COLLECTIONS.MATCHES,
          localField: 'playerId',
          foreignField: '$or',
          let: { playerId: '$playerId' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$tournamentId', new ObjectId(tournamentId)] },
                    {
                      $or: [
                        { $eq: ['$player1Id', '$$playerId'] },
                        { $eq: ['$player2Id', '$$playerId'] }
                      ]
                    }
                  ]
                }
              }
            }
          ],
          as: 'tournamentMatches'
        }
      });
    }

    const playerStats = await db.collection(COLLECTIONS.PLAYER_STATS)
      .aggregate(pipeline)
      .toArray();

    return NextResponse.json({
      success: true,
      data: playerStats[0] || {
        playerId: authUser.userId,
        totalTournaments: 0,
        totalMatches: 0,
        wins: 0,
        losses: 0,
        winRate: 0,
        titles: 0,
        runnerUps: 0,
        currentStreak: 0,
        longestStreak: 0,
        favoriteCategory: '',
        totalPoints: 0,
        averageMatchDuration: 0,
        recentForm: [],
        updatedAt: new Date()
      }
    });

  } catch (error) {
    console.error('Error fetching player stats:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch player stats' },
      { status: 500 }
    );
  }
}
