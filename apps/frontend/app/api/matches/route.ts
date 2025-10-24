import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { COLLECTIONS, insertMatchSchema, matchSchema } from '@repo/schemas';
import { getAuthUser } from '@/lib/auth-utils';
import { ObjectId } from 'mongodb';
import { z } from 'zod';

export async function GET(request: NextRequest) {
  try {
    const db = await connectToDatabase();
    const { searchParams } = new URL(request.url);
    
    const tournamentId = searchParams.get('tournamentId');
    const status = searchParams.get('status');
    const category = searchParams.get('category');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    // Build query
    const query: any = {};
    
    if (tournamentId) {
      if (!ObjectId.isValid(tournamentId)) {
        return NextResponse.json({ error: 'Invalid tournament ID' }, { status: 400 });
      }
      query.tournamentId = new ObjectId(tournamentId);
    }
    
    if (status && status !== 'all') {
      query.status = status;
    }
    
    if (category && category !== 'all') {
      query.category = category;
    }

    // Get matches with pagination - no need for limit when fetching for a specific tournament
    const skip = tournamentId ? 0 : (page - 1) * limit;
    const actualLimit = tournamentId ? 1000 : limit; // Get all matches for a tournament
    
    const matches = await db.collection(COLLECTIONS.MATCHES)
      .find(query)
      .sort({ roundNumber: 1, matchNumber: 1 })
      .skip(skip)
      .limit(actualLimit)
      .toArray();

    const total = await db.collection(COLLECTIONS.MATCHES).countDocuments(query);

    return NextResponse.json({
      success: true,
      data: matches,
      pagination: {
        page,
        limit: actualLimit,
        total,
        totalPages: Math.ceil(total / actualLimit)
      }
    });

  } catch (error) {
    console.error('Error fetching matches:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch matches' },
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

    const matchData = await request.json();
    
    // Validate match data
    const validatedData = insertMatchSchema.parse({
      ...matchData,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const result = await db.collection(COLLECTIONS.MATCHES).insertOne(validatedData);
    
    return NextResponse.json({
      success: true,
      data: { _id: result.insertedId },
      message: 'Match created successfully'
    });

  } catch (error) {
    console.error('Error creating match:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.issues }, { status: 400 });
    }
    return NextResponse.json(
      { success: false, error: 'Failed to create match' },
      { status: 500 }
    );
  }
}
