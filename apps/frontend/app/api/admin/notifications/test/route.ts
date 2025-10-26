import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { COLLECTIONS } from '@repo/schemas';
import { getAuthUser } from '@/lib/auth-utils';
import { ObjectId } from 'mongodb';

// POST - Create a test notification (Admin only)
export async function POST(request: NextRequest) {
  try {
    const db = await connectToDatabase();
    const authUser = await getAuthUser(request);

    if (!authUser || !authUser.roles.includes('admin')) {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { userId, type, title, message } = body;

    if (!userId || !type || !title || !message) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: userId, type, title, message' },
        { status: 400 }
      );
    }

    // Validate userId
    if (!ObjectId.isValid(userId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid user ID' },
        { status: 400 }
      );
    }

    // Create test notification
    const notification = {
      userId: new ObjectId(userId),
      type,
      title,
      message,
      isRead: false,
      createdAt: new Date(),
    };

    const result = await db.collection(COLLECTIONS.NOTIFICATIONS).insertOne(notification);

    return NextResponse.json({
      success: true,
      data: { _id: result.insertedId, ...notification },
      message: 'Test notification created successfully'
    });

  } catch (error) {
    console.error('Error creating test notification:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create test notification' },
      { status: 500 }
    );
  }
}

