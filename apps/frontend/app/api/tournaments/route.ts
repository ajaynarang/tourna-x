import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { COLLECTIONS, insertTournamentSchema, tournamentSchema } from '@repo/schemas';

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
    const { searchParams } = new URL(request.url);
    
    const status = searchParams.get('status');
    const sport = searchParams.get('sport');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    // Build query
    const query: any = {};
    
    if (status && status !== 'all') {
      query.status = status;
    }
    
    if (sport) {
      query.sport = sport;
    }
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { venue: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } }
      ];
    }

    // Get tournaments with pagination
    const skip = (page - 1) * limit;
    const tournaments = await db.collection(COLLECTIONS.TOURNAMENTS)
      .find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    const total = await db.collection(COLLECTIONS.TOURNAMENTS).countDocuments(query);

    return NextResponse.json({
      success: true,
      data: tournaments,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching tournaments:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch tournaments' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const db = await connectToDatabase();
    const user = await getAuthenticatedUser(request);

    if (!user || !user.roles?.includes('admin')) {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      );
    }

    const tournamentData = await request.json();
    
    // Validate tournament data
    const validatedData = insertTournamentSchema.parse({
      ...tournamentData,
      createdBy: user._id,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const result = await db.collection(COLLECTIONS.TOURNAMENTS).insertOne(validatedData);
    
    return NextResponse.json({
      success: true,
      data: { _id: result.insertedId },
      message: 'Tournament created successfully'
    });

  } catch (error) {
    console.error('Error creating tournament:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create tournament' },
      { status: 500 }
    );
  }
}