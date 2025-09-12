import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { COLLECTIONS } from '@repo/schemas';
import bcrypt from 'bcrypt';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    const db = await connectToDatabase();

    // Find admin user by email
    const user = await db.collection(COLLECTIONS.USERS).findOne({
      email,
      role: 'admin',
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Compare hashed password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Create session (in production, use proper session management)
    const response = NextResponse.json({
      message: 'Login successful',
      user: {
        _id: user._id.toString(),
        username: user.username,
        role: user.role,
        phone: user.phone,
        email: user.email,
        name: user.name,
        society: user.society,
        block: user.block,
        flatNumber: user.flatNumber,
        age: user.age,
        gender: user.gender,
      },
    });

    // Set session cookie (in production, use secure session tokens)
    response.cookies.set('session', user._id.toString(), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
