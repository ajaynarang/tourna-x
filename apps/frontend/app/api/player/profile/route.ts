import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { COLLECTIONS } from '@repo/schemas';
import { ObjectId } from 'mongodb';

// Helper function to get authenticated user
async function getAuthenticatedUser(request: NextRequest) {
  const db = await connectToDatabase();
  const sessionToken = request.cookies.get('session')?.value;

  if (!sessionToken) {
    return null;
  }

  const session = await db.collection(COLLECTIONS.SESSIONS).findOne({
    sessionToken,
    expiresAt: { $gt: new Date() }
  });

  if (!session) {
    return null;
  }

  const user = await db.collection(COLLECTIONS.USERS).findOne({
    _id: new ObjectId(session.userId)
  });

  return user;
}

// GET - Get player profile
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Remove sensitive data
    const { ...profileData } = user;

    return NextResponse.json({
      success: true,
      data: profileData
    });

  } catch (error) {
    console.error('Error fetching player profile:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch profile' },
      { status: 500 }
    );
  }
}

// PUT - Update player profile
export async function PUT(request: NextRequest) {
  try {
    const db = await connectToDatabase();
    const user = await getAuthenticatedUser(request);

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const updateData = await request.json();

    // Validate and sanitize the update data
    const allowedFields = [
      'name',
      'email',
      'age',
      'gender',
      'society',
      'block',
      'flatNumber'
    ];

    const sanitizedData: any = {};
    for (const field of allowedFields) {
      if (updateData[field] !== undefined && updateData[field] !== null) {
        sanitizedData[field] = updateData[field];
      }
    }

    // Don't allow phone number updates (it's the primary identifier)
    if (updateData.phone && updateData.phone !== user.phone) {
      return NextResponse.json(
        { success: false, error: 'Phone number cannot be changed' },
        { status: 400 }
      );
    }

    // Update the user profile
    const result = await db.collection(COLLECTIONS.USERS).updateOne(
      { _id: user._id },
      { $set: { ...sanitizedData, updatedAt: new Date() } }
    );

    if (result.modifiedCount === 0) {
      return NextResponse.json(
        { success: false, error: 'No changes were made' },
        { status: 400 }
      );
    }

    // Fetch updated user data
    const updatedUser = await db.collection(COLLECTIONS.USERS).findOne({
      _id: user._id
    });

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully',
      data: updatedUser
    });

  } catch (error) {
    console.error('Error updating player profile:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update profile' },
      { status: 500 }
    );
  }
}

