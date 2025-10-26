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
    const type = searchParams.get('type') || 'overall'; // tournament, practice, or overall

    // Get all matches for the player
    const allMatches = await db.collection(COLLECTIONS.MATCHES)
      .find({
        $or: [
          { player1Id: new ObjectId(authUser.userId) },
          { player2Id: new ObjectId(authUser.userId) }
        ]
      })
      .sort({ createdAt: -1 })
      .toArray();

    // Filter matches based on type
    let matches = allMatches;
    if (type === 'tournament') {
      matches = allMatches.filter(m => m.matchType === 'tournament');
    } else if (type === 'practice') {
      matches = allMatches.filter(m => m.matchType === 'practice');
    }

    // If tournamentId is specified, further filter
    if (tournamentId && type !== 'practice') {
      matches = matches.filter(m => m.tournamentId?.toString() === tournamentId);
    }

    // Calculate stats
    const completedMatches = matches.filter(m => m.status === 'completed');
    const totalMatches = completedMatches.length;
    const wins = completedMatches.filter(m => m.winnerId?.toString() === authUser.userId).length;
    const losses = completedMatches.filter(m => m.winnerId && m.winnerId.toString() !== authUser.userId).length;
    const winRate = totalMatches > 0 ? (wins / totalMatches) * 100 : 0;

    // Category-wise breakdown
    const categories = ['singles', 'doubles', 'mixed'];
    const categoryStats = categories.map(category => {
      const categoryMatches = completedMatches.filter(m => m.category === category);
      const categoryWins = categoryMatches.filter(m => m.winnerId?.toString() === authUser.userId).length;
      return {
        category,
        played: categoryMatches.length,
        won: categoryWins,
        lost: categoryMatches.length - categoryWins,
        winRate: categoryMatches.length > 0 ? (categoryWins / categoryMatches.length) * 100 : 0
      };
    });

    // Recent form (last 10 matches)
    const recentMatches = completedMatches.slice(0, 10);
    const recentForm = recentMatches.map(m => 
      m.winnerId?.toString() === authUser.userId ? 'W' : 'L'
    );

    // Calculate current streak
    let currentStreak = 0;
    let streakType = recentMatches.length > 0 && recentMatches[0].winnerId?.toString() === authUser.userId ? 'W' : 'L';
    for (const match of recentMatches) {
      const isWin = match.winnerId?.toString() === authUser.userId;
      if ((streakType === 'W' && isWin) || (streakType === 'L' && !isWin)) {
        currentStreak++;
      } else {
        break;
      }
    }

    // Calculate longest streak
    let longestStreak = 0;
    let tempStreak = 0;
    let lastResult = '';
    for (const match of completedMatches.reverse()) {
      const result = match.winnerId?.toString() === authUser.userId ? 'W' : 'L';
      if (result === 'W') {
        if (lastResult === 'W') {
          tempStreak++;
        } else {
          tempStreak = 1;
        }
        longestStreak = Math.max(longestStreak, tempStreak);
      } else {
        if (lastResult === 'W') {
          tempStreak = 0;
        }
      }
      lastResult = result;
    }

    // Get tournament-specific stats if type is tournament
    let tournamentStats = {};
    if (type === 'tournament' || type === 'overall') {
      const participations = await db.collection(COLLECTIONS.PARTICIPANTS)
        .find({ userId: new ObjectId(authUser.userId) })
        .toArray();

      tournamentStats = {
        totalTournaments: participations.length,
        titles: 0, // TODO: Calculate from tournament winners
        runnerUps: 0, // TODO: Calculate from tournament results
      };
    }

    const statsData = {
      playerId: authUser.userId,
      type,
      totalMatches,
      wins,
      losses,
      winRate: Math.round(winRate * 100) / 100,
      currentStreak,
      longestStreak,
      recentForm,
      categoryStats,
      ...tournamentStats,
      updatedAt: new Date()
    };

    return NextResponse.json({
      success: true,
      data: statsData
    });

  } catch (error) {
    console.error('Error fetching player stats:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch player stats' },
      { status: 500 }
    );
  }
}
