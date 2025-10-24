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
    _id: new ObjectId(session.userId)
  });

  return user;
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const db = await connectToDatabase();
    const user = await getAuthenticatedUser(request);
    const { id: participantId } = await params;

    // Check if user is admin
    if (!user || !user.roles?.includes('admin')) {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      );
    }

    // Validate participant ID
    if (!ObjectId.isValid(participantId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid participant ID' },
        { status: 400 }
      );
    }

    // Check if participant exists
    const participant = await db.collection(COLLECTIONS.PARTICIPANTS).findOne({
      _id: new ObjectId(participantId)
    });

    if (!participant) {
      return NextResponse.json(
        { success: false, error: 'Participant not found' },
        { status: 404 }
      );
    }

    // Get tournament details for notification
    const tournament = await db.collection(COLLECTIONS.TOURNAMENTS).findOne({
      _id: participant.tournamentId
    });

    // Delete the participant
    await db.collection(COLLECTIONS.PARTICIPANTS).deleteOne({
      _id: new ObjectId(participantId)
    });

    // Create notification for the player
    if (tournament) {
      await db.collection(COLLECTIONS.NOTIFICATIONS).insertOne({
        userId: participant.userId,
        type: 'participant_removed',
        title: 'Removed from Tournament',
        message: `You have been removed from ${tournament.name} by an administrator.`,
        tournamentId: participant.tournamentId,
        isRead: false,
        createdAt: new Date(),
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Participant removed successfully'
    });

  } catch (error) {
    console.error('Error removing participant:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to remove participant' },
      { status: 500 }
    );
  }
}

