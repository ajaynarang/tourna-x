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
    const { phone } = await request.json();

    // Validate phone number
    if (!phone || phone.length < 10) {
      return NextResponse.json(
        { success: false, error: 'Valid phone number is required' },
        { status: 400 }
      );
    }

    // Check rate limiting (max 3 OTPs per hour per phone)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentOtps = await db.collection(COLLECTIONS.OTPS).countDocuments({
      phone,
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
      phone,
      otp,
      expiresAt,
    });

    await db.collection(COLLECTIONS.OTPS).insertOne(otpData);

    // Send SMS
    await sendSMS(phone, otp);

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