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

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const db = await connectToDatabase();
    const user = await getAuthenticatedUser(request);
    const { id: tournamentId } = await params;

    // Check if user is admin
    if (!user || !user.roles?.includes('admin')) {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      );
    }

    const { playerId, isApproved, paymentStatus } = await request.json();

    // Validate input
    if (!playerId) {
      return NextResponse.json(
        { success: false, error: 'Player ID is required' },
        { status: 400 }
      );
    }

    // Check if tournament exists
    const tournament = await db.collection(COLLECTIONS.TOURNAMENTS).findOne({
      _id: new ObjectId(tournamentId)
    });

    if (!tournament) {
      return NextResponse.json(
        { success: false, error: 'Tournament not found' },
        { status: 404 }
      );
    }

    // Check if player exists
    const player = await db.collection(COLLECTIONS.USERS).findOne({
      _id: new ObjectId(playerId)
    });

    if (!player) {
      return NextResponse.json(
        { success: false, error: 'Player not found' },
        { status: 404 }
      );
    }

    // Check if player is already registered
    const existingParticipant = await db.collection(COLLECTIONS.PARTICIPANTS).findOne({
      tournamentId: new ObjectId(tournamentId),
      userId: new ObjectId(playerId)
    });

    if (existingParticipant) {
      return NextResponse.json(
        { success: false, error: 'Player is already registered for this tournament' },
        { status: 400 }
      );
    }

    // Check if tournament is full
    const participantCount = await db.collection(COLLECTIONS.PARTICIPANTS).countDocuments({
      tournamentId: new ObjectId(tournamentId),
      isApproved: true
    });

    if (participantCount >= tournament.maxParticipants) {
      return NextResponse.json(
        { success: false, error: 'Tournament is full' },
        { status: 400 }
      );
    }

    // Create participant entry
    const participant = {
      tournamentId: new ObjectId(tournamentId),
      userId: new ObjectId(playerId),
      category: tournament.categories[0] || 'Open', // Default to first category
      gender: player.gender || 'male', // Use player's gender
      isApproved: isApproved !== undefined ? isApproved : true,
      paymentStatus: paymentStatus || 'na',
      registeredAt: new Date(),
      addedBy: 'admin',
      addedByUserId: user._id,
    };

    const result = await db.collection(COLLECTIONS.PARTICIPANTS).insertOne(participant);

    // Create notification for the player
    await db.collection(COLLECTIONS.NOTIFICATIONS).insertOne({
      userId: new ObjectId(playerId),
      type: 'registration_approved',
      title: 'Added to Tournament',
      message: `You have been added to ${tournament.name} by an administrator.`,
      tournamentId: new ObjectId(tournamentId),
      isRead: false,
      createdAt: new Date(),
    });

    return NextResponse.json({
      success: true,
      data: { _id: result.insertedId },
      message: 'Participant added successfully'
    });

  } catch (error) {
    console.error('Error adding participant:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to add participant' },
      { status: 500 }
    );
  }
}

