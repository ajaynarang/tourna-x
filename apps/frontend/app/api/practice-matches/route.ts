import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { COLLECTIONS, insertMatchSchema } from '@repo/schemas';
import { getAuthUser } from '@/lib/auth-utils';
import { ObjectId } from 'mongodb';
import { z } from 'zod';

export async function GET(request: NextRequest) {
  try {
    const db = await connectToDatabase();
    const authUser = await getAuthUser(request);

    console.log('Auth user:', authUser);

    if (!authUser || !authUser.roles.includes('admin')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    
    const status = searchParams.get('status');
    const category = searchParams.get('category');
    const playerId = searchParams.get('playerId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    // Build query for practice matches only
    const query: any = {
      matchType: 'practice'
    };
    
    if (status && status !== 'all') {
      query.status = status;
    }
    
    if (category && category !== 'all') {
      query.category = category;
    }

    if (playerId && ObjectId.isValid(playerId)) {
      query.$or = [
        { player1Id: new ObjectId(playerId) },
        { player2Id: new ObjectId(playerId) }
      ];
    }

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) {
        query.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        query.createdAt.$lte = new Date(endDate);
      }
    }

    // Get matches with pagination
    const skip = (page - 1) * limit;
    
    const matches = await db.collection(COLLECTIONS.MATCHES)
      .find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    const total = await db.collection(COLLECTIONS.MATCHES).countDocuments(query);

    return NextResponse.json({
      success: true,
      data: matches,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: skip + matches.length < total
      }
    });

  } catch (error) {
    console.error('Error fetching practice matches:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch practice matches' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const db = await connectToDatabase();
    const authUser = await getAuthUser(request);

    if (!authUser || !authUser.roles.includes('admin')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    
    // Validate practice match data
    const practiceMatchData = {
      matchType: 'practice',
      tournamentId: null,
      category: body.category,
      player1Id: body.player1?.userId ? new ObjectId(body.player1.userId) : undefined,
      player1Name: body.player1?.name || '',
      player1Phone: body.player1?.phone,
      player1IsGuest: body.player1?.isGuest || false,
      player2Id: body.player2?.userId ? new ObjectId(body.player2.userId) : undefined,
      player2Name: body.player2?.name || '',
      player2Phone: body.player2?.phone,
      player2IsGuest: body.player2?.isGuest || false,
      court: body.court,
      venue: body.venue,
      notes: body.notes,
      scoringFormat: body.scoringFormat || {
        pointsPerGame: 21,
        gamesPerMatch: 3,
        winBy: 2,
        maxPoints: 30,
      },
      games: [],
      player1Score: [],
      player2Score: [],
      status: 'scheduled',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Validate that we have either userId or phone+name for both players
    if (!practiceMatchData.player1Id && (!practiceMatchData.player1Phone || !practiceMatchData.player1Name)) {
      return NextResponse.json(
        { error: 'Player 1 must have either a user ID or phone and name' },
        { status: 400 }
      );
    }

    if (!practiceMatchData.player2Id && (!practiceMatchData.player2Phone || !practiceMatchData.player2Name)) {
      return NextResponse.json(
        { error: 'Player 2 must have either a user ID or phone and name' },
        { status: 400 }
      );
    }

    const result = await db.collection(COLLECTIONS.MATCHES).insertOne(practiceMatchData);
    
    return NextResponse.json({
      success: true,
      data: { _id: result.insertedId },
      message: 'Practice match created successfully'
    });

  } catch (error) {
    console.error('Error creating practice match:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.issues }, { status: 400 });
    }
    return NextResponse.json(
      { success: false, error: 'Failed to create practice match' },
      { status: 500 }
    );
  }
}

