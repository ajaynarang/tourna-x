import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { COLLECTIONS, otpSchema, userSchema, insertUserSchema, sessionSchema, insertSessionSchema } from '@repo/schemas';
import { randomBytes } from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const db = await connectToDatabase();
    const { phone, otp } = await request.json();

    // Validate input
    if (!phone || !otp) {
      return NextResponse.json(
        { success: false, error: 'Phone number and OTP are required' },
        { status: 400 }
      );
    }

    // Verify OTP
    const otpRecord = await db.collection(COLLECTIONS.OTPS).findOne({
      phone,
      otp,
      expiresAt: { $gt: new Date() },
      isUsed: false
    });

    if (!otpRecord) {
      return NextResponse.json(
        { success: false, error: 'Invalid or expired OTP' },
        { status: 401 }
      );
    }

    // Mark OTP as used
    await db.collection(COLLECTIONS.OTPS).updateOne(
      { _id: otpRecord._id },
      { $set: { isUsed: true } }
    );

    // Find or create user
    let user = await db.collection(COLLECTIONS.USERS).findOne({ phone });

    if (!user) {
      // Create new player user
      const newUser = insertUserSchema.parse({
        phone,
        roles: ['player'],
        name: `Player ${phone.slice(-4)}`, // Temporary name
      });

      const result = await db.collection(COLLECTIONS.USERS).insertOne(newUser);
      user = { ...newUser, _id: result.insertedId };
    }

    // Create session
    const sessionToken = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const sessionData = insertSessionSchema.parse({
      userId: user._id,
      sessionToken,
      expiresAt,
    });

    await db.collection(COLLECTIONS.SESSIONS).insertOne(sessionData);

    // Create response with session cookie
    const response = NextResponse.json({
      success: true,
      message: 'Login successful',
      user: {
        _id: user._id,
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

    // Set session cookie
    response.cookies.set('session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/',
    });

    return response;

  } catch (error) {
    console.error('Phone login error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}