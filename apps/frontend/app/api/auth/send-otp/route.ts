import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { insertOtpSchema, COLLECTIONS } from '@repo/schemas';

export async function POST(request: NextRequest) {
  try {
    const { phone } = await request.json();

    if (!phone) {
      return NextResponse.json(
        { error: 'Phone number is required' },
        { status: 400 }
      );
    }

    // For testing, just return success
    // The hardcoded OTP is 123456
    console.log(`OTP request for ${phone}: Use 123456 for testing`);

    return NextResponse.json({
      message: 'Verification code sent successfully. Use 123456 for testing.',
    });
  } catch (error) {
    console.error('Send OTP error:', error);
    return NextResponse.json(
      { error: 'Failed to send verification code' },
      { status: 500 }
    );
  }
}
