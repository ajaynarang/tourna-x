import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { COLLECTIONS } from '@repo/schemas';

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
    _id: session.userId
  });

  return user;
}

export async function GET(request: NextRequest) {
  try {
    const db = await connectToDatabase();
    const user = await getAuthenticatedUser(request);

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get player's participations
    const participations = await db.collection(COLLECTIONS.PARTICIPANTS)
      .find({ userId: user._id })
      .sort({ registeredAt: -1 })
      .toArray();

    // Get player's matches
    const playerMatches = await db.collection(COLLECTIONS.MATCHES)
      .find({
        $or: [
          { player1Id: user._id },
          { player2Id: user._id }
        ]
      })
      .sort({ createdAt: -1 })
      .toArray();

    // Get upcoming matches
    const upcomingMatches = await db.collection(COLLECTIONS.MATCHES)
      .find({
        $or: [
          { player1Id: user._id },
          { player2Id: user._id }
        ],
        status: 'scheduled',
        scheduledDate: { $gte: new Date() }
      })
      .sort({ scheduledDate: 1 })
      .limit(5)
      .toArray();

    // Get available tournaments for registration
    const availableTournaments = await db.collection(COLLECTIONS.TOURNAMENTS)
      .find({
        status: 'registration_open',
        registrationDeadline: { $gte: new Date() }
      })
      .sort({ startDate: 1 })
      .limit(5)
      .toArray();

    // Calculate player stats
    const totalMatches = playerMatches.length;
    const wins = playerMatches.filter(match => 
      match.status === 'completed' && match.winnerId === user._id
    ).length;
    const losses = totalMatches - wins;
    const winRate = totalMatches > 0 ? (wins / totalMatches) * 100 : 0;

    // Get player's notifications
    const notifications = await db.collection(COLLECTIONS.NOTIFICATIONS)
      .find({ userId: user._id })
      .sort({ createdAt: -1 })
      .limit(10)
      .toArray();

    const dashboardData = {
      player: {
        _id: user._id,
        name: user.name,
        phone: user.phone,
        email: user.email,
        society: user.society,
        stats: {
          totalMatches,
          wins,
          losses,
          winRate: Math.round(winRate * 100) / 100,
          totalTournaments: participations.length
        }
      },
      upcomingMatches,
      availableTournaments,
      recentParticipations: participations.slice(0, 5),
      notifications
    };

    return NextResponse.json({
      success: true,
      data: dashboardData
    });

  } catch (error) {
    console.error('Error fetching player dashboard:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch dashboard data' },
      { status: 500 }
    );
  }
}
