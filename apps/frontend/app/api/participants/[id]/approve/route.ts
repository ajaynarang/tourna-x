import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { COLLECTIONS } from '@repo/schemas';
import { getAuthUser } from '@/lib/auth-utils';
import { ObjectId } from 'mongodb';

// Helper function to get authenticated user

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const db = await connectToDatabase();
    const user = await getAuthUser(request);
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

    // Update participant status to approved
    const result = await db.collection(COLLECTIONS.PARTICIPANTS).updateOne(
      { _id: new ObjectId(id) },
      { 
        $set: { 
          isApproved: true,
          approvedAt: new Date(),
          approvedBy: user._id,
          rejectionReason: null
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
        type: 'registration_approved',
        title: 'Registration Approved',
        message: `Your registration for the tournament has been approved.`,
        tournamentId: participant.tournamentId,
        isRead: false,
        createdAt: new Date(),
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Participant approved successfully'
    });

  } catch (error) {
    console.error('Error approving participant:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to approve participant' },
      { status: 500 }
    );
  }
}
