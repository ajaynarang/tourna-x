import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { COLLECTIONS } from '@repo/schemas';
import { getAuthUser } from '@/lib/auth-utils';
import { ObjectId } from 'mongodb';

// Helper function to get authenticated user

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const db = await connectToDatabase();
    const user = await getAuthUser(request);
    const { id: matchId } = await params;

    // Check if user is admin
    if (!user || !user.roles?.includes('admin')) {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      );
    }

    const { date, time, venue } = await request.json();

    if (!date || !time) {
      return NextResponse.json(
        { success: false, error: 'Date and time are required' },
        { status: 400 }
      );
    }

    // Update match schedule
    const result = await db.collection(COLLECTIONS.MATCHES).updateOne(
      { _id: new ObjectId(matchId) },
      {
        $set: {
          scheduledDate: date,
          scheduledTime: time,
          venue: venue || null,
          updatedAt: new Date(),
        }
      }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { success: false, error: 'Match not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Match scheduled successfully'
    });

  } catch (error) {
    console.error('Error scheduling match:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to schedule match' },
      { status: 500 }
    );
  }
}

