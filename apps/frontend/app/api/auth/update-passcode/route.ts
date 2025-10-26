import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { COLLECTIONS, isSequentialPasscode } from '@repo/schemas';
import { ObjectId } from 'mongodb';

export async function PUT(request: NextRequest) {
  try {
    const db = await connectToDatabase();
    const sessionToken = request.cookies.get('session')?.value;

    if (!sessionToken) {
      return NextResponse.json(
        { success: false, error: 'No session found' },
        { status: 401 }
      );
    }

    // Find session
    const session = await db.collection(COLLECTIONS.SESSIONS).findOne({
      sessionToken,
      expiresAt: { $gt: new Date() }
    });

    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Invalid or expired session' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { passcode } = body;

    // Validate passcode
    if (!passcode) {
      return NextResponse.json(
        { success: false, error: 'Passcode is required' },
        { status: 400 }
      );
    }

    // Validate passcode format
    if (passcode.length !== 6 || !/^\d{6}$/.test(passcode)) {
      return NextResponse.json(
        { success: false, error: 'Passcode must be exactly 6 digits' },
        { status: 400 }
      );
    }

    // Check for sequential passcode
    if (isSequentialPasscode(passcode)) {
      return NextResponse.json(
        { success: false, error: 'Passcode cannot be sequential (e.g., 123456 or 654321)' },
        { status: 400 }
      );
    }

    // Update user's passcode
    const result = await db.collection(COLLECTIONS.USERS).findOneAndUpdate(
      { _id: new ObjectId(session.userId) },
      { $set: { passcode } },
      { returnDocument: 'after' }
    );

    if (!result) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Passcode updated successfully',
    });

  } catch (error) {
    console.error('Update passcode error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update passcode' },
      { status: 500 }
    );
  }
}

