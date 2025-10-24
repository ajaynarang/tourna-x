import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { COLLECTIONS } from '@repo/schemas';

export async function POST(request: NextRequest) {
  try {
    const db = await connectToDatabase();
    const sessionToken = request.cookies.get('session')?.value;

    if (sessionToken) {
      // Delete session from database
      await db.collection(COLLECTIONS.SESSIONS).deleteOne({
        sessionToken
      });
    }

    // Create response
    const response = NextResponse.json({
      success: true,
      message: 'Logged out successfully'
    });

    // Clear session cookie
    response.cookies.set('session', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0,
      path: '/',
    });

    return response;

  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}