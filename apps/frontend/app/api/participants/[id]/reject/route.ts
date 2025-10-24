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
        { success: false, error: 'Invalid participant ID' },
        { status: 400 }
      );
    }

    const { reason } = await request.json();

    // Update participant status to rejected
    const result = await db.collection(COLLECTIONS.PARTICIPANTS).updateOne(
      { _id: new ObjectId(id) },
      { 
        $set: { 
          isApproved: false,
          rejectionReason: reason || 'Registration rejected by admin',
          approvedAt: null,
          approvedBy: null
        } 
      }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { success: false, error: 'Participant not found' },
        { status: 404 }
      );
    }

    // Create notification for participant
    const participant = await db.collection(COLLECTIONS.PARTICIPANTS).findOne({
      _id: new ObjectId(id)
    });

    if (participant) {
      await db.collection(COLLECTIONS.NOTIFICATIONS).insertOne({
        userId: participant.userId,
        type: 'registration_rejected',
        title: 'Registration Rejected',
        message: `Your registration for the tournament has been rejected. Reason: ${reason || 'Not specified'}`,
        tournamentId: participant.tournamentId,
        isRead: false,
        createdAt: new Date(),
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Participant rejected successfully'
    });

  } catch (error) {
    console.error('Error rejecting participant:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to reject participant' },
      { status: 500 }
    );
  }
}
