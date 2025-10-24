import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { COLLECTIONS } from '@repo/schemas';
import { ObjectId } from 'mongodb';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const db = await connectToDatabase();
    const { id } = await params;

    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid tournament ID' },
        { status: 400 }
      );
    }

    // Get tournament details
    const tournament = await db.collection(COLLECTIONS.TOURNAMENTS).findOne({
      _id: new ObjectId(id)
    });

    if (!tournament) {
      return NextResponse.json(
        { success: false, error: 'Tournament not found' },
        { status: 404 }
      );
    }

    // Get participants for this tournament
    const participants = await db.collection(COLLECTIONS.PARTICIPANTS)
      .find({ tournamentId: new ObjectId(id) })
      .sort({ registeredAt: -1 })
      .toArray();

    // Get matches for this tournament
    const matches = await db.collection(COLLECTIONS.MATCHES)
      .find({ tournamentId: new ObjectId(id) })
      .sort({ roundNumber: 1, matchNumber: 1 })
      .toArray();

    // Get tournament creator details
    const creator = await db.collection(COLLECTIONS.USERS).findOne({
      _id: tournament.createdBy
    });

    const tournamentData = {
      ...tournament,
      creator: creator ? {
        name: creator.name,
        phone: creator.phone
      } : null,
      participants,
      matches,
      participantCount: participants.length,
      approvedParticipants: participants.filter(p => p.isApproved).length
    };

    return NextResponse.json({
      success: true,
      data: tournamentData
    });

  } catch (error) {
    console.error('Error fetching tournament details:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch tournament details' },
      { status: 500 }
    );
  }
}
