import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { insertUserSchema, COLLECTIONS, isSequentialPasscode } from '@repo/schemas';

export async function POST(request: NextRequest) {
  try {
    const { name, phone, email, age, gender, society, block, flatNumber, skillLevel, otp, requestAdminAccess, passcode } = await request.json();

    if (!name || !phone || !otp) {
      return NextResponse.json(
        { error: 'Name, phone number, and OTP are required' },
        { status: 400 }
      );
    }

    if (!skillLevel) {
      return NextResponse.json(
        { error: 'Skill level is required for player registration' },
        { status: 400 }
      );
    }

    // Validate phone number format (should include country code)
    if (!phone.startsWith('+91')) {
      return NextResponse.json(
        { error: 'Please enter a valid Indian phone number with country code (+91)' },
        { status: 400 }
      );
    }

    // Extract phone number without country code for database storage
    const phoneNumber = phone.replace('+91', '');
    
    // Validate Indian phone number (10 digits)
    if (phoneNumber.length !== 10 || !/^\d{10}$/.test(phoneNumber)) {
      return NextResponse.json(
        { error: 'Please enter a valid 10-digit Indian phone number' },
        { status: 400 }
      );
    }

    // Validate passcode if provided (optional)
    if (passcode) {
      if (passcode.length !== 6 || !/^\d{6}$/.test(passcode)) {
        return NextResponse.json(
          { error: 'Passcode must be exactly 6 digits' },
          { status: 400 }
        );
      }
      
      if (isSequentialPasscode(passcode)) {
        return NextResponse.json(
          { error: 'Passcode cannot be sequential (e.g., 123456 or 654321)' },
          { status: 400 }
        );
      }
    }

    const db = await connectToDatabase();
    const otpsCollection = db.collection(COLLECTIONS.OTPS);
    const usersCollection = db.collection(COLLECTIONS.USERS);

    // Verify OTP
    const otpRecord = await otpsCollection.findOne({
      phone: phoneNumber,
      countryCode: '+91',
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
      countryCode: '+91', // Extract country code from phone
      email: email || undefined,
      age: age || undefined,
      gender: gender || undefined,
      society: society || undefined,
      block: block || undefined,
      flatNumber: flatNumber || undefined,
      skillLevel: skillLevel,
      passcode: passcode || undefined, // Optional passcode
      roles: ['player'],
      isSuperAdmin: false,
      adminRequestStatus: requestAdminAccess ? 'pending' : 'none',
      adminRequestedAt: requestAdminAccess ? new Date() : undefined,
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
