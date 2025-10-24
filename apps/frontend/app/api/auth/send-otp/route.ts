import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { COLLECTIONS, otpSchema, insertOtpSchema, userSchema, insertUserSchema, sessionSchema, insertSessionSchema } from '@repo/schemas';
import { randomBytes } from 'crypto';


const MAX_OTPS_PER_HOUR = 30;
// Mock SMS service - replace with actual SMS provider
const sendSMS = async (phone: string, otp: string) => {
  console.log(`Sending OTP ${otp} to ${phone}`);
  // In production, integrate with Twilio, MSG91, etc.
  return true;
};

export async function POST(request: NextRequest) {
  try {
    const db = await connectToDatabase();
    const { phone, purpose = 'login' } = await request.json();

    // Validate phone number format (should include country code)
    if (!phone || !phone.startsWith('+91')) {
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

    // Check if user exists
    const existingUser = await db.collection(COLLECTIONS.USERS).findOne({ phone: phoneNumber });

    // For login purpose: user must exist
    if (purpose === 'login' && !existingUser) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'No account found with this phone number. Please register first.',
          userExists: false
        },
        { status: 404 }
      );
    }

    // For registration purpose: user must not exist
    if (purpose === 'register' && existingUser) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'An account with this phone number already exists. Please sign in instead.',
          userExists: true
        },
        { status: 409 }
      );
    }

    // Check rate limiting (max 3 OTPs per hour per phone)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentOtps = await db.collection(COLLECTIONS.OTPS).countDocuments({
      phone: phoneNumber,
      createdAt: { $gte: oneHourAgo }
    });

    if (recentOtps >= MAX_OTPS_PER_HOUR) {
      return NextResponse.json(
        { success: false, error: 'Too many OTP requests. Please try again later.' },
        { status: 429 }
      );
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    // Store OTP
    const otpData = insertOtpSchema.parse({
      phone: phoneNumber,
      countryCode: '+91', // Store country code separately
      otp,
      expiresAt,
    });

    await db.collection(COLLECTIONS.OTPS).insertOne(otpData);

    // Send SMS
    await sendSMS(phoneNumber, otp);

    return NextResponse.json({
      success: true,
      message: 'OTP sent successfully',
    });

  } catch (error) {
    console.error('Send OTP error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to send OTP' },
      { status: 500 }
    );
  }
}