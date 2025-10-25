import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { COLLECTIONS } from '@repo/schemas';
import { getAuthUser } from '@/lib/auth-utils';
import { ObjectId } from 'mongodb';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const db = await connectToDatabase();
    const user = await getAuthUser(request);
    const { id: tournamentId } = await params;

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    if (!ObjectId.isValid(tournamentId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid tournament ID' },
        { status: 400 }
      );
    }

    // Get tournament details
    const tournament = await db.collection(COLLECTIONS.TOURNAMENTS).findOne({
      _id: new ObjectId(tournamentId)
    });

    if (!tournament) {
      return NextResponse.json(
        { success: false, error: 'Tournament not found' },
        { status: 404 }
      );
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const gender = searchParams.get('gender');
    const search = searchParams.get('search') || '';

    // Get all registered participants for this tournament
    const registeredParticipants = await db.collection(COLLECTIONS.PARTICIPANTS)
      .find({
        tournamentId: new ObjectId(tournamentId),
        isApproved: true
      })
      .toArray();

    const registeredUserIds = registeredParticipants.map(p => p.userId.toString());

    // Build query for available players
    let query: any = {
      _id: { $nin: registeredUserIds.map(id => new ObjectId(id)) }, // Exclude already registered players
      roles: { $in: ['player'] } // Only players
    };

    // Add search filter
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    // For mixed doubles, filter by gender
    if (category === 'mixed' && gender) {
      query.gender = { $ne: gender }; // Opposite gender
    }

    // Fetch available players
    const availablePlayers = await db.collection(COLLECTIONS.USERS)
      .find(query)
      .limit(50) // Limit results for performance
      .toArray();

    // Format response
    const players = availablePlayers.map(player => ({
      _id: player._id,
      name: player.name,
      phone: player.phone,
      email: player.email,
      gender: player.gender,
      age: player.age,
      society: player.society
    }));

    return NextResponse.json({
      success: true,
      data: players
    });

  } catch (error) {
    console.error('Error fetching available players:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch available players' },
      { status: 500 }
    );
  }
}
