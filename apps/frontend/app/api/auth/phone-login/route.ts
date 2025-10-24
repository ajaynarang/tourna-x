import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { COLLECTIONS, otpSchema, userSchema, insertUserSchema, sessionSchema, insertSessionSchema } from '@repo/schemas';
import { randomBytes } from 'crypto';

export async function POST(request: NextRequest) {
  try {
    console.log('Phone login request received');
    const db = await connectToDatabase();
    const { phone, otp } = await request.json();

    console.log('Phone login data:', { phone, otp: otp ? otp : 'missing' });

    // Validate input
    if (!phone || !otp) {
      console.log('Missing phone or OTP');
      return NextResponse.json(
        { success: false, error: 'Phone number and OTP are required' },
        { status: 400 }
      );
    }

    // Verify OTP
    console.log('Looking for OTP record...');
    const otpRecord = await db.collection(COLLECTIONS.OTPS).findOne({
      phone,
      otp,
      isUsed: false
    });

    console.log('OTP record found:', !!otpRecord);

    if (!otpRecord) {
      console.log('Invalid or expired OTP');
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
    console.log('Looking for user...');
    let user = await db.collection(COLLECTIONS.USERS).findOne({ phone });

    if (!user) {
      console.log('Creating new user...');
      // Create new player user
      const newUser = insertUserSchema.parse({
        phone,
        roles: ['player'],
        name: `Player ${phone.slice(-4)}`, // Temporary name
      });

      const result = await db.collection(COLLECTIONS.USERS).insertOne(newUser);
      user = { ...newUser, _id: result.insertedId };
      console.log('New user created:', user._id);
    } else {
      console.log('Existing user found:', user._id);
    }

    // Create session
    console.log('Creating session...');
    const sessionToken = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const sessionData = insertSessionSchema.parse({
      userId: user._id.toString(),
      sessionToken,
      expiresAt,
    });

    await db.collection(COLLECTIONS.SESSIONS).insertOne(sessionData);
    console.log('Session created successfully');

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

    console.log('Phone login successful');
    return response;

  } catch (error) {
    console.error('Phone login error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}