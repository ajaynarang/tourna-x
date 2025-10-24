import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { COLLECTIONS } from '@repo/schemas';
import { ObjectId } from 'mongodb';

// Helper function to get authenticated user
async function getAuthenticatedUser(request: NextRequest) {
  const db = await connectToDatabase();
  const sessionToken = request.cookies.get('session')?.value;

  if (!sessionToken) {
    return null;
  }

  const session = await db.collection(COLLECTIONS.SESSIONS).findOne({
    sessionToken,
    expiresAt: { $gt: new Date() }
  });

  if (!session) {
    return null;
  }

  const user = await db.collection(COLLECTIONS.USERS).findOne({
    _id: session.userId
  });

  return user;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const db = await connectToDatabase();
    const user = await getAuthenticatedUser(request);
    const { id } = await params;

    if (!user || !user.roles?.includes('admin')) {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      );
    }

    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid tournament ID' },
        { status: 400 }
      );
    }

    // Update tournament status to registration_open
    const result = await db.collection(COLLECTIONS.TOURNAMENTS).updateOne(
      { _id: new ObjectId(id) },
      { 
        $set: { 
          status: 'registration_open',
          updatedAt: new Date()
        } 
      }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { success: false, error: 'Tournament not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Tournament registration opened successfully'
    });

  } catch (error) {
    console.error('Error opening registration:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to open registration' },
      { status: 500 }
    );
  }
}
