import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { insertUserSchema, COLLECTIONS } from '@repo/schemas';

export async function POST(request: NextRequest) {
  try {
    const { name, phone, email, age, gender, society, block, flatNumber, otp } = await request.json();

    if (!name || !phone || !otp) {
      return NextResponse.json(
        { error: 'Name, phone number, and OTP are required' },
        { status: 400 }
      );
    }

    // Validate phone number format (should include country code)
    if (!phone.startsWith('+91') || phone.length !== 13) {
      return NextResponse.json(
        { error: 'Please enter a valid Indian phone number with country code (+91)' },
        { status: 400 }
      );
    }

    // Extract phone number without country code for database storage
    const phoneNumber = phone.replace('+91', '');

    const db = await connectToDatabase();
    const otpsCollection = db.collection(COLLECTIONS.OTPS);
    const usersCollection = db.collection(COLLECTIONS.USERS);

    // Verify OTP
    const otpRecord = await otpsCollection.findOne({
      phone: phoneNumber,
      otp,
      isUsed: false,
      expiresAt: { $gt: new Date() },
    });

    if (!otpRecord) {
      return NextResponse.json(
        { error: 'Invalid or expired OTP' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await usersCollection.findOne({ phone: phoneNumber });
    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this phone number already exists' },
        { status: 400 }
      );
    }

    // Create new user
    const userData = insertUserSchema.parse({
      name,
      phone: phoneNumber,
      email: email || undefined,
      age: age || undefined,
      gender: gender || undefined,
      society: society || undefined,
      block: block || undefined,
      flatNumber: flatNumber || undefined,
      role: 'player',
    });

    const result = await usersCollection.insertOne(userData);

    // Mark OTP as used
    await otpsCollection.updateOne(
      { _id: otpRecord._id },
      { $set: { isUsed: true } }
    );

    return NextResponse.json({
      message: 'Registration successful',
      user: {
        _id: result.insertedId.toString(),
        ...userData,
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Registration failed' },
      { status: 500 }
    );
  }
}
