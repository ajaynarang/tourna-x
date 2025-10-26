import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { COLLECTIONS } from '@repo/schemas';
import { ObjectId } from 'mongodb';

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
      _id: new ObjectId(session.userId)
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
        skillLevel: user.skillLevel,
        createdAt: user.createdAt,
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
    const { name, email, age, gender, society, block, flatNumber, skillLevel } = body;

    // Build update object with only provided fields
    const updateFields: any = {};
    if (name !== undefined) updateFields.name = name;
    if (email !== undefined) updateFields.email = email;
    if (age !== undefined) updateFields.age = age;
    if (gender !== undefined) updateFields.gender = gender;
    if (society !== undefined) updateFields.society = society;
    if (block !== undefined) updateFields.block = block;
    if (flatNumber !== undefined) updateFields.flatNumber = flatNumber;
    if (skillLevel !== undefined) updateFields.skillLevel = skillLevel;

    // Update user
    const result = await db.collection(COLLECTIONS.USERS).findOneAndUpdate(
      { _id: new ObjectId(session.userId) },
      { $set: updateFields },
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
      data: {
        _id: result._id,
        username: result.username,
        name: result.name,
        phone: result.phone,
        email: result.email,
        roles: result.roles,
        society: result.society,
        block: result.block,
        flatNumber: result.flatNumber,
        age: result.age,
        gender: result.gender,
        skillLevel: result.skillLevel,
        createdAt: result.createdAt,
      }
    });

  } catch (error) {
    console.error('Update profile error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update profile' },
      { status: 500 }
    );
  }
}