import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { COLLECTIONS, userSettingsSchema } from '@repo/schemas';
import { getAuthUser } from '@/lib/auth-utils';
import { ObjectId } from 'mongodb';

// GET - Get user's settings
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

    // Get or create default settings
    let settings = await db.collection(COLLECTIONS.USER_SETTINGS).findOne({
      userId: new ObjectId(authUser.userId)
    });

    if (!settings) {
      // Create default settings
      const defaultSettings = {
        userId: new ObjectId(authUser.userId),
        profileVisibility: 'public',
        showEmail: false,
        showPhone: false,
        showStats: true,
        theme: 'auto',
        language: 'en',
        timezone: 'Asia/Kolkata',
        preferredCategories: [],
        preferredTimeSlots: [],
        allowDirectMessages: true,
        allowMatchInvites: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = await db.collection(COLLECTIONS.USER_SETTINGS).insertOne(defaultSettings);
      settings = { ...defaultSettings, _id: result.insertedId };
    }

    return NextResponse.json({
      success: true,
      data: settings
    });

  } catch (error) {
    console.error('Error fetching user settings:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch user settings' },
      { status: 500 }
    );
  }
}

// PUT - Update user's settings
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
      'profileVisibility',
      'showEmail',
      'showPhone',
      'showStats',
      'theme',
      'language',
      'timezone',
      'preferredCategories',
      'preferredTimeSlots',
      'allowDirectMessages',
      'allowMatchInvites',
    ];

    const updateFields: any = { updatedAt: new Date() };
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateFields[field] = body[field];
      }
    }

    // Update or create settings
    const result = await db.collection(COLLECTIONS.USER_SETTINGS).findOneAndUpdate(
      { userId: new ObjectId(authUser.userId) },
      { $set: updateFields },
      { upsert: true, returnDocument: 'after' }
    );

    return NextResponse.json({
      success: true,
      data: result,
      message: 'Settings updated successfully'
    });

  } catch (error) {
    console.error('Error updating user settings:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update user settings' },
      { status: 500 }
    );
  }
}

