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

    // Check if user is admin
    if (!user || !user.roles?.includes('admin')) {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      );
    }

    // Fetch all players (users with 'player' role)
    const players = await db.collection(COLLECTIONS.USERS)
      .find({
        roles: { $in: ['player'] }
      })
      .project({
        _id: 1,
        name: 1,
        phone: 1,
        email: 1,
        gender: 1,
        society: 1,
      })
      .sort({ name: 1 })
      .toArray();

    return NextResponse.json({
      success: true,
      data: players
    });

  } catch (error) {
    console.error('Error fetching players:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch players' },
      { status: 500 }
    );
  }
}

