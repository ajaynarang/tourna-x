import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { COLLECTIONS, insertTournamentSchema, tournamentSchema } from '@repo/schemas';
import { getAuthUser } from '@/lib/auth-utils';
import { ObjectId } from 'mongodb';

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
    const authUser = await getAuthUser(request);

    console.log('Auth user:', authUser);

    if (!authUser || !authUser.roles?.includes('admin')) {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      );
    }

    const tournamentData = await request.json();
    
    // Convert date strings to Date objects
    const processedData = {
      ...tournamentData,
      startDate: tournamentData.startDate ? new Date(tournamentData.startDate) : undefined,
      endDate: tournamentData.endDate ? new Date(tournamentData.endDate) : undefined,
      registrationDeadline: tournamentData.registrationDeadline ? new Date(tournamentData.registrationDeadline) : undefined,
      createdBy: authUser.userId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    // Validate tournament data
    const validatedData = insertTournamentSchema.parse(processedData);

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