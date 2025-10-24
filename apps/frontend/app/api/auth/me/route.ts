import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { COLLECTIONS } from '@repo/schemas';

export async function GET(request: NextRequest) {
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

    // Find user
    const user = await db.collection(COLLECTIONS.USERS).findOne({
      _id: session.userId
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      user: {
        _id: user._id,
        username: user.username,
        name: user.name,
        phone: user.phone,
        email: user.email,
        roles: user.roles,
        society: user.society,
        block: user.block,
        flatNumber: user.flatNumber,
        age: user.age,
        gender: user.gender,
      }
    });

  } catch (error) {
    console.error('Get user error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}