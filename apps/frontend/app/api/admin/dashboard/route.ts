import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { COLLECTIONS } from '@repo/schemas';
import { getAuthUser } from '@/lib/auth-utils';
import { ObjectId } from 'mongodb';

export async function GET(request: NextRequest) {
  try {
    const db = await connectToDatabase();
    const authUser = await getAuthUser(request);

    if (!authUser || !authUser.roles?.includes('admin')) {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      );
    }

    // Get dashboard statistics
    const [
      totalTournaments,
      activeTournaments,
      totalParticipants,
      pendingApprovals,
      upcomingMatches,
      completedMatches
    ] = await Promise.all([
      db.collection(COLLECTIONS.TOURNAMENTS).countDocuments(),
      db.collection(COLLECTIONS.TOURNAMENTS).countDocuments({
        status: { $in: ['published', 'registration_open', 'ongoing'] }
      }),
      db.collection(COLLECTIONS.PARTICIPANTS).countDocuments(),
      db.collection(COLLECTIONS.PARTICIPANTS).countDocuments({
        isApproved: false
      }),
      db.collection(COLLECTIONS.MATCHES).countDocuments({
        status: 'scheduled',
        scheduledDate: { $gte: new Date() }
      }),
      db.collection(COLLECTIONS.MATCHES).countDocuments({
        status: 'completed'
      })
    ]);

    // Calculate total revenue
    const tournaments = await db.collection(COLLECTIONS.TOURNAMENTS).find({}).toArray();
    const totalRevenue = tournaments.reduce((sum, tournament) => {
      return sum + (tournament.participantCount * tournament.entryFee);
    }, 0);

    // Get recent tournaments
    const recentTournaments = await db.collection(COLLECTIONS.TOURNAMENTS)
      .find({})
      .sort({ createdAt: -1 })
      .limit(5)
      .toArray();

    // Get recent participants
    const recentParticipants = await db.collection(COLLECTIONS.PARTICIPANTS)
      .find({})
      .sort({ registeredAt: -1 })
      .limit(5)
      .toArray();

    // Get recent matches
    const recentMatches = await db.collection(COLLECTIONS.MATCHES)
      .find({})
      .sort({ createdAt: -1 })
      .limit(5)
      .toArray();

    // Get recent notifications
    const recentNotifications = await db.collection(COLLECTIONS.NOTIFICATIONS)
      .find({})
      .sort({ createdAt: -1 })
      .limit(10)
      .toArray();

    const dashboardData = {
      stats: {
        totalTournaments,
        activeTournaments,
        totalParticipants,
        totalRevenue,
        pendingApprovals,
        upcomingMatches,
        completedMatches
      },
      recentActivity: {
        tournaments: recentTournaments,
        participants: recentParticipants,
        matches: recentMatches,
        notifications: recentNotifications
      }
    };

    return NextResponse.json({
      success: true,
      data: dashboardData
    });

  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch dashboard data' },
      { status: 500 }
    );
  }
}
