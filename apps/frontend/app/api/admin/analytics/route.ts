import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { COLLECTIONS } from '@repo/schemas';
import { getAuthUser } from '@/lib/auth-utils';

export async function GET(request: NextRequest) {
  try {
    const db = await connectToDatabase();
    const authUser = await getAuthUser(request);

    if (!authUser || !authUser.roles.includes('admin')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const timeRange = searchParams.get('timeRange') || '6months';

    // Calculate date range
    const now = new Date();
    let startDate = new Date();
    
    switch (timeRange) {
      case '1month':
        startDate.setMonth(now.getMonth() - 1);
        break;
      case '3months':
        startDate.setMonth(now.getMonth() - 3);
        break;
      case '6months':
        startDate.setMonth(now.getMonth() - 6);
        break;
      case '1year':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      case 'all':
        startDate = new Date('2020-01-01');
        break;
    }

    // Fetch overview stats
    const totalTournaments = await db.collection(COLLECTIONS.TOURNAMENTS).countDocuments({
      createdAt: { $gte: startDate }
    });

    const totalParticipants = await db.collection(COLLECTIONS.PARTICIPANTS).countDocuments({
      registeredAt: { $gte: startDate }
    });

    const totalMatches = await db.collection(COLLECTIONS.MATCHES).countDocuments({
      createdAt: { $gte: startDate }
    });

    const completedMatches = await db.collection(COLLECTIONS.MATCHES).countDocuments({
      status: 'completed',
      createdAt: { $gte: startDate }
    });

    // Calculate revenue (sum of entry fees)
    const revenueResult = await db.collection(COLLECTIONS.TOURNAMENTS).aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $lookup: {
          from: COLLECTIONS.PARTICIPANTS,
          localField: '_id',
          foreignField: 'tournamentId',
          as: 'participants'
        }
      },
      {
        $project: {
          revenue: { $multiply: ['$entryFee', { $size: '$participants' }] }
        }
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$revenue' }
        }
      }
    ]).toArray();

    const totalRevenue = revenueResult[0]?.totalRevenue || 0;

    // Fetch trends data
    const monthlyTournaments = await db.collection(COLLECTIONS.TOURNAMENTS).aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 }
      }
    ]).toArray();

    const monthlyParticipants = await db.collection(COLLECTIONS.PARTICIPANTS).aggregate([
      { $match: { registeredAt: { $gte: startDate } } },
      {
        $group: {
          _id: {
            year: { $year: '$registeredAt' },
            month: { $month: '$registeredAt' }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 }
      }
    ]).toArray();

    // Fetch category breakdown
    const categories = await db.collection(COLLECTIONS.TOURNAMENTS).aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      { $unwind: '$categories' },
      {
        $group: {
          _id: '$categories',
          count: { $sum: 1 },
          participants: { $sum: '$participantCount' },
          revenue: { $sum: { $multiply: ['$entryFee', '$participantCount'] } }
        }
      }
    ]).toArray();

    // Fetch top players
    const topPlayers = await db.collection(COLLECTIONS.PLAYER_STATS).aggregate([
      {
        $lookup: {
          from: COLLECTIONS.USERS,
          localField: 'playerId',
          foreignField: '_id',
          as: 'user'
        }
      },
      { $unwind: '$user' },
      {
        $project: {
          name: '$user.name',
          tournaments: '$totalTournaments',
          wins: '$wins',
          winRate: '$winRate',
          totalPoints: '$totalPoints'
        }
      },
      { $sort: { winRate: -1, totalPoints: -1 } },
      { $limit: 10 }
    ]).toArray();

    // Fetch recent activity
    const recentActivity = await db.collection(COLLECTIONS.TOURNAMENTS).aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $project: {
          type: 'tournament_created',
          description: { $concat: ['Tournament "', '$name', '" was created'] },
          timestamp: '$createdAt',
          tournamentId: '$_id'
        }
      },
      { $sort: { timestamp: -1 } },
      { $limit: 10 }
    ]).toArray();

    return NextResponse.json({
      success: true,
      data: {
        overview: {
          totalTournaments,
          totalParticipants,
          totalMatches,
          totalRevenue,
          averageParticipantsPerTournament: totalTournaments > 0 ? Math.round(totalParticipants / totalTournaments) : 0,
          averageMatchesPerTournament: totalTournaments > 0 ? Math.round(totalMatches / totalTournaments) : 0,
          completionRate: totalMatches > 0 ? Math.round((completedMatches / totalMatches) * 100) : 0,
        },
        trends: {
          monthlyTournaments: monthlyTournaments.map(item => ({
            month: `${item._id.year}-${item._id.month.toString().padStart(2, '0')}`,
            count: item.count
          })),
          monthlyParticipants: monthlyParticipants.map(item => ({
            month: `${item._id.year}-${item._id.month.toString().padStart(2, '0')}`,
            count: item.count
          })),
          monthlyRevenue: [], // TODO: Implement revenue trends
        },
        categories: categories.map(item => ({
          category: item._id,
          count: item.count,
          participants: item.participants,
          revenue: item.revenue
        })),
        topPlayers: topPlayers.map(item => ({
          name: item.name,
          tournaments: item.tournaments,
          wins: item.wins,
          winRate: item.winRate,
          totalPoints: item.totalPoints
        })),
        recentActivity: recentActivity.map(item => ({
          type: item.type,
          description: item.description,
          timestamp: item.timestamp,
          tournamentId: item.tournamentId
        }))
      }
    });

  } catch (error) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}
