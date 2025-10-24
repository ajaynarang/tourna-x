import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { COLLECTIONS } from '@repo/schemas';

export async function GET(request: NextRequest) {
  try {
    const db = await connectToDatabase();
    
    // Test database connection
    const collections = await db.listCollections().toArray();
    
    // Test OTP collection
    const otpCount = await db.collection(COLLECTIONS.OTPS).countDocuments();
    
    // Test Users collection
    const userCount = await db.collection(COLLECTIONS.USERS).countDocuments();
    
    return NextResponse.json({
      success: true,
      message: 'Database connection successful',
      data: {
        collections: collections.map(c => c.name),
        otpCount,
        userCount,
        database: db.databaseName
      }
    });

  } catch (error) {
    console.error('Database test error:', error);
    return NextResponse.json(
      { success: false, error: 'Database connection failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
