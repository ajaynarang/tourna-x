import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { COLLECTIONS } from '@repo/schemas';
import { ObjectId } from 'mongodb';

export async function GET(request: NextRequest) {
  try {
    const sessionId = request.cookies.get('session')?.value;

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const db = await connectToDatabase();
    const user = await db.collection(COLLECTIONS.USERS).findOne({
      _id: new ObjectId(sessionId),
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid session' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      _id: user._id.toString(),
      username: user.username,
      roles: user.roles || [user.role] || ['player'], // Handle both old and new schema
      phone: user.phone,
      email: user.email,
      name: user.name,
      society: user.society,
      block: user.block,
      flatNumber: user.flatNumber,
      age: user.age,
      gender: user.gender,
    });
  } catch (error) {
    console.error('Auth check error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
