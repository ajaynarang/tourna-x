import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { COLLECTIONS, insertSessionSchema } from '@repo/schemas';
import { randomBytes } from 'crypto';

export async function POST(request: NextRequest) {
  try {
    console.log('Passcode login request received');
    const db = await connectToDatabase();
    const { phone, passcode } = await request.json();

    console.log('Passcode login data:', { phone, passcode: passcode ? '******' : 'missing' });

    // Validate input
    if (!phone || !passcode) {
      console.log('Missing phone or passcode');
      return NextResponse.json(
        { success: false, error: 'Phone number and passcode are required' },
        { status: 400 }
      );
    }

    // Validate phone number format (should include country code)
    if (!phone.startsWith('+91')) {
      return NextResponse.json(
        { success: false, error: 'Please enter a valid Indian phone number with country code (+91)' },
        { status: 400 }
      );
    }

    // Extract phone number without country code for database storage
    const phoneNumber = phone.replace('+91', '');
    
    // Validate Indian phone number (10 digits)
    if (phoneNumber.length !== 10 || !/^\d{10}$/.test(phoneNumber)) {
      return NextResponse.json(
        { success: false, error: 'Please enter a valid 10-digit Indian phone number' },
        { status: 400 }
      );
    }

    // Validate passcode format
    if (passcode.length !== 6 || !/^\d{6}$/.test(passcode)) {
      return NextResponse.json(
        { success: false, error: 'Passcode must be exactly 6 digits' },
        { status: 400 }
      );
    }

    // Find user by phone
    console.log('Looking for user...');
    const user = await db.collection(COLLECTIONS.USERS).findOne({ phone: phoneNumber });

    if (!user) {
      console.log('User not found');
      return NextResponse.json(
        { success: false, error: 'No account found with this phone number. Please register first.' },
        { status: 404 }
      );
    }

    // Check if user has a passcode set
    if (!user.passcode) {
      console.log('User does not have a passcode set');
      return NextResponse.json(
        { success: false, error: 'No passcode set for this account. Please use OTP login or set a passcode in your profile.' },
        { status: 400 }
      );
    }

    // Verify passcode
    if (user.passcode !== passcode) {
      console.log('Invalid passcode');
      return NextResponse.json(
        { success: false, error: 'Invalid passcode. Please try again.' },
        { status: 401 }
      );
    }

    console.log('Passcode verified, user found:', user._id);

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
    console.log('Session created');

    // Set session cookie
    const response = NextResponse.json({
      success: true,
      user: {
        _id: user._id.toString(),
        name: user.name,
        phone: user.phone,
        email: user.email,
        roles: user.roles,
        isSuperAdmin: user.isSuperAdmin || false,
      },
    });

    response.cookies.set('session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/',
    });

    console.log('Login successful');
    return response;

  } catch (error) {
    console.error('Passcode login error:', error);
    return NextResponse.json(
      { success: false, error: 'Login failed. Please try again.' },
      { status: 500 }
    );
  }
}

