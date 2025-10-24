import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { COLLECTIONS, userSchema, sessionSchema, insertSessionSchema } from '@repo/schemas';
import bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const db = await connectToDatabase();
    const { username, password } = await request.json();

    // Validate input
    if (!username || !password) {
      return NextResponse.json(
        { success: false, error: 'Username and password are required' },
        { status: 400 }
      );
    }

    // Find user by username or email
    const user = await db.collection(COLLECTIONS.USERS).findOne({
      $or: [
        { username: username },
        { email: username }
      ]
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Check if user has admin role
    if (!user.roles?.includes('admin')) {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      );
    }

    // Verify password
    if (!user.password) {
      return NextResponse.json(
        { success: false, error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return NextResponse.json(
        { success: false, error: 'Invalid credentials' },
        { status: 401 }
      );
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
        username: user.username,
        name: user.name,
        email: user.email,
        roles: user.roles,
        phone: user.phone,
        society: user.society,
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
    console.error('Login error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}