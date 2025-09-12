import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { COLLECTIONS } from '@repo/schemas';

export async function POST(request: NextRequest) {
  try {
    const { phone, otp } = await request.json();

    if (!phone || !otp) {
      return NextResponse.json(
        { error: 'Phone number and OTP are required' },
        { status: 400 }
      );
    }

    const db = await connectToDatabase();
    const usersCollection = db.collection(COLLECTIONS.USERS);

    // Hardcoded verification code for testing
    const HARDCODED_OTP = '123456';
    
    if (otp !== HARDCODED_OTP) {
      return NextResponse.json(
        { error: 'Invalid verification code. Use 123456 for testing.' },
        { status: 400 }
      );
    }

    // Normalize phone number - ensure it starts with +91
    let normalizedPhone = phone.trim();
    if (!normalizedPhone.startsWith('+')) {
      if (normalizedPhone.startsWith('91')) {
        normalizedPhone = '+' + normalizedPhone;
      } else {
        normalizedPhone = '+91' + normalizedPhone;
      }
    }

    console.log(`Login attempt: original phone=${phone}, normalized phone=${normalizedPhone}`);

    // Find user by phone (could be admin or player) - try both formats
    let user = await usersCollection.findOne({ phone: normalizedPhone });
    
    // If not found with normalized format, try the original format
    if (!user) {
      user = await usersCollection.findOne({ phone });
    }
    
    if (!user) {
      // Create new user as player by default
      const newUser = {
        phone: normalizedPhone, // Use normalized phone number
        name: 'Player', // Default name, can be updated later
        roles: ['player'],
        createdAt: new Date(),
      };
      
      const result = await usersCollection.insertOne(newUser);
      user = { _id: result.insertedId, ...newUser };
    }

    // Create session (simplified - in production use proper session management)
    const response = NextResponse.json({
      message: 'Login successful',
      user: {
        _id: user._id.toString(),
        name: user.name,
        phone: user.phone,
        roles: user.roles || [user.role] || ['player'], // Handle both old and new schema
        email: user.email,
        society: user.society,
        block: user.block,
        flatNumber: user.flatNumber,
        age: user.age,
        gender: user.gender,
      },
    });

    // Set session cookie (simplified)
    response.cookies.set('session', user._id.toString(), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });

    return response;
  } catch (error) {
    console.error('Phone login error:', error);
    return NextResponse.json(
      { error: 'Login failed' },
      { status: 500 }
    );
  }
}
