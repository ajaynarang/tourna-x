import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { COLLECTIONS } from '@repo/schemas';
import { getAuthUser } from '@/lib/auth-utils';
import { ObjectId } from 'mongodb';

export async function GET(request: NextRequest) {
  try {
    const db = await connectToDatabase();
    const authUser = await getAuthUser(request);

    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    
    const playerId = searchParams.get('playerId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    if (!playerId) {
      return NextResponse.json(
        { error: 'Player ID is required' },
        { status: 400 }
      );
    }

    if (!ObjectId.isValid(playerId)) {
      return NextResponse.json(
        { error: 'Invalid player ID' },
        { status: 400 }
      );
    }

    // Get practice stats for the player
    const stats = await db.collection(COLLECTIONS.PRACTICE_STATS).findOne({
      playerId: new ObjectId(playerId)
    });

    // Get practice match history
    const matchQuery: any = {
      matchType: 'practice',
      $or: [
        { player1Id: new ObjectId(playerId) },
        { player2Id: new ObjectId(playerId) }
      ],
      status: 'completed'
    };

    if (startDate || endDate) {
      matchQuery.createdAt = {};
      if (startDate) {
        matchQuery.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        matchQuery.createdAt.$lte = new Date(endDate);
      }
    }

    const matches = await db.collection(COLLECTIONS.MATCHES)
      .find(matchQuery)
      .sort({ createdAt: -1 })
      .limit(50)
      .toArray();

    // Calculate additional statistics from matches if needed
    const matchStats = {
      totalMatches: matches.length,
      recentMatches: matches.slice(0, 10),
    };

    return NextResponse.json({
      success: true,
      data: {
        stats: stats || {
          playerId: new ObjectId(playerId),
          totalMatches: 0,
          wins: 0,
          losses: 0,
          winRate: 0,
          totalGamesWon: 0,
          totalGamesLost: 0,
          currentStreak: 0,
          longestStreak: 0,
          recentForm: [],
          singlesRecord: { played: 0, won: 0, lost: 0 },
          doublesRecord: { played: 0, won: 0, lost: 0 },
          mixedRecord: { played: 0, won: 0, lost: 0 },
        },
        matchHistory: matchStats,
      }
    });

  } catch (error) {
    console.error('Error fetching practice stats:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch practice stats' },
      { status: 500 }
    );
  }
}

