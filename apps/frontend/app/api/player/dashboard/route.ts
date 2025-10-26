import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { COLLECTIONS } from '@repo/schemas';
import { getAuthUser } from '@/lib/auth-utils';
import { ObjectId } from 'mongodb';

// Helper function to get authenticated user

export async function GET(request: NextRequest) {
  try {
    const db = await connectToDatabase();
    const user = await getAuthUser(request);

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get player's participations
    const participations = await db.collection(COLLECTIONS.PARTICIPANTS)
      .find({ userId: user.userId })
      .sort({ registeredAt: -1 })
      .toArray();

    // Get player's matches - separate tournament and practice
    const playerMatches = await db.collection(COLLECTIONS.MATCHES)
      .find({
        $or: [
          { player1Id: user.userId },
          { player2Id: user.userId }
        ]
      })
      .sort({ createdAt: -1 })
      .toArray();

    // Separate tournament and practice matches
    const tournamentMatches = playerMatches.filter(m => m.matchType === 'tournament');
    const practiceMatches = playerMatches.filter(m => m.matchType === 'practice');

    // Get upcoming matches (both types)
    const upcomingMatches = await db.collection(COLLECTIONS.MATCHES)
      .find({
        $or: [
          { player1Id: user.userId },
          { player2Id: user.userId }
        ],
        status: { $in: ['scheduled', 'in_progress'] },
        scheduledDate: { $gte: new Date() }
      })
      .sort({ scheduledDate: 1 })
      .limit(5)
      .toArray();

    // Get available tournaments for registration (exclude already registered)
    const registeredTournamentIds = participations.map(p => p.tournamentId.toString());
    const availableTournaments = await db.collection(COLLECTIONS.TOURNAMENTS)
      .find({
        status: 'registration_open',
        $or: [
          { registrationDeadline: { $gte: new Date() } },
          { registrationDeadline: { $exists: false } }
        ],
        _id: { $nin: registeredTournamentIds.map(id => new ObjectId(id)) }
      })
      .sort({ startDate: 1 })
      .limit(5)
      .toArray();

    // Get registered tournaments with details
    const registeredTournaments = await db.collection(COLLECTIONS.TOURNAMENTS)
      .find({
        _id: { $in: registeredTournamentIds.map(id => new ObjectId(id)) }
      })
      .sort({ startDate: 1 })
      .toArray();

    // Enhance registered tournaments with participation status
    const myTournaments = registeredTournaments.map(tournament => {
      const participation = participations.find(p => p.tournamentId.toString() === tournament._id.toString());
      return {
        ...tournament,
        registrationStatus: participation?.isApproved ? 'approved' : 'pending',
        paymentStatus: participation?.paymentStatus,
        category: participation?.category,
        registeredAt: participation?.registeredAt
      };
    });

    // Calculate player stats - separate tournament and practice
    const totalTournamentMatches = tournamentMatches.length;
    const tournamentWins = tournamentMatches.filter(match => 
      match.status === 'completed' && match.winnerId === user.userId
    ).length;
    const tournamentLosses = tournamentMatches.filter(match => 
      match.status === 'completed' && match.winnerId && match.winnerId !== user.userId
    ).length;
    const tournamentWinRate = totalTournamentMatches > 0 ? (tournamentWins / totalTournamentMatches) * 100 : 0;

    const totalPracticeMatches = practiceMatches.length;
    const practiceWins = practiceMatches.filter(match => 
      match.status === 'completed' && match.winnerId === user.userId
    ).length;
    const practiceLosses = practiceMatches.filter(match => 
      match.status === 'completed' && match.winnerId && match.winnerId !== user.userId
    ).length;
    const practiceWinRate = totalPracticeMatches > 0 ? (practiceWins / totalPracticeMatches) * 100 : 0;

    const totalMatches = playerMatches.length;
    const wins = tournamentWins + practiceWins;
    const losses = tournamentLosses + practiceLosses;
    const winRate = totalMatches > 0 ? (wins / totalMatches) * 100 : 0;

    // Get player's notifications
    const notifications = await db.collection(COLLECTIONS.NOTIFICATIONS)
      .find({ userId: user.userId })
      .sort({ createdAt: -1 })
      .limit(10)
      .toArray();

    const dashboardData = {
      player: {
        _id: user.userId,
        name: user.name,
        phone: user.phone,
        email: user.email,
        society: (user as any).society || '',
        skillLevel: (user as any).skillLevel || '',
        stats: {
          totalMatches,
          wins,
          losses,
          winRate: Math.round(winRate * 100) / 100,
          totalTournaments: participations.length,
          // Separate tournament and practice stats
          tournamentMatches: totalTournamentMatches,
          tournamentWins,
          tournamentLosses,
          tournamentWinRate: Math.round(tournamentWinRate * 100) / 100,
          practiceMatches: totalPracticeMatches,
          practiceWins,
          practiceLosses,
          practiceWinRate: Math.round(practiceWinRate * 100) / 100,
          activeTournaments: myTournaments.filter(t => t.status === 'ongoing' || t.status === 'registration_open').length
        }
      },
      upcomingMatches,
      availableTournaments,
      myTournaments,
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
