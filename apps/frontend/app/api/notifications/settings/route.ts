import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { COLLECTIONS, notificationSettingsSchema } from '@repo/schemas';
import { getAuthUser } from '@/lib/auth-utils';
import { ObjectId } from 'mongodb';

// GET - Get user's notification settings
export async function GET(request: NextRequest) {
  try {
    const db = await connectToDatabase();
    const authUser = await getAuthUser(request);

    if (!authUser || !authUser.userId) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get or create default notification settings
    let settings = await db.collection(COLLECTIONS.NOTIFICATION_SETTINGS).findOne({
      userId: new ObjectId(authUser.userId)
    });

    if (!settings) {
      // Create default settings
      const defaultSettings = {
        userId: new ObjectId(authUser.userId),
        emailNotifications: true,
        smsNotifications: true,
        pushNotifications: true,
        tournamentUpdates: true,
        matchReminders: true,
        registrationUpdates: true,
        resultNotifications: true,
        practiceMatchNotifications: true,
        adminNotifications: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = await db.collection(COLLECTIONS.NOTIFICATION_SETTINGS).insertOne(defaultSettings);
      settings = { ...defaultSettings, _id: result.insertedId };
    }

    return NextResponse.json({
      success: true,
      data: settings
    });

  } catch (error) {
    console.error('Error fetching notification settings:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch notification settings' },
      { status: 500 }
    );
  }
}

// PUT - Update user's notification settings
export async function PUT(request: NextRequest) {
  try {
    const db = await connectToDatabase();
    const authUser = await getAuthUser(request);

    if (!authUser || !authUser.userId) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();

    // Build update object with only allowed fields
    const allowedFields = [
      'emailNotifications',
      'smsNotifications',
      'pushNotifications',
      'tournamentUpdates',
      'matchReminders',
      'registrationUpdates',
      'resultNotifications',
      'practiceMatchNotifications',
      'adminNotifications',
    ];

    const updateFields: any = { updatedAt: new Date() };
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateFields[field] = body[field];
      }
    }

    // Update or create settings
    const result = await db.collection(COLLECTIONS.NOTIFICATION_SETTINGS).findOneAndUpdate(
      { userId: new ObjectId(authUser.userId) },
      { $set: updateFields },
      { upsert: true, returnDocument: 'after' }
    );

    return NextResponse.json({
      success: true,
      data: result,
      message: 'Notification settings updated successfully'
    });

  } catch (error) {
    console.error('Error updating notification settings:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update notification settings' },
      { status: 500 }
    );
  }
}

