import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { COLLECTIONS, notificationSchema } from '@repo/schemas';
import { getAuthUser } from '@/lib/auth-utils';
import { ObjectId } from 'mongodb';
import { z } from 'zod';

export async function GET(request: NextRequest) {
  try {
    const db = await connectToDatabase();
    const authUser = await getAuthUser(request);

    if (!authUser || !authUser.userId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const unreadOnly = searchParams.get('unreadOnly') === 'true';

    const query: any = { userId: new ObjectId(authUser.userId) };
    
    if (unreadOnly) {
      query.isRead = false;
    }

    const skip = (page - 1) * limit;
    const notifications = await db.collection(COLLECTIONS.NOTIFICATIONS)
      .find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    const total = await db.collection(COLLECTIONS.NOTIFICATIONS).countDocuments(query);

    return NextResponse.json({
      success: true,
      data: notifications,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch notifications' },
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

    const notificationData = await request.json();
    
    const validatedData = notificationSchema.parse({
      ...notificationData,
      createdAt: new Date(),
    });

    const result = await db.collection(COLLECTIONS.NOTIFICATIONS).insertOne(validatedData);
    
    return NextResponse.json({
      success: true,
      data: { _id: result.insertedId },
      message: 'Notification created successfully'
    });

  } catch (error) {
    console.error('Error creating notification:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    return NextResponse.json(
      { success: false, error: 'Failed to create notification' },
      { status: 500 }
    );
  }
}
