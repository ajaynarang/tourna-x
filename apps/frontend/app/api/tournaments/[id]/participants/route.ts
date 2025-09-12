import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { COLLECTIONS } from '@repo/schemas';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: tournamentId } = await params;

    if (!tournamentId) {
      return NextResponse.json(
        { error: 'Tournament ID is required' },
        { status: 400 }
      );
    }

    const db = await connectToDatabase();

    // Fetch participants for this tournament
    const participants = await db.collection(COLLECTIONS.PARTICIPANTS)
      .find({ tournamentId })
      .sort({ registeredAt: -1 })
      .toArray();

    // Transform participants data for frontend
    const participantsData = participants.map(participant => ({
      _id: participant._id.toString(),
      name: participant.name,
      phone: participant.phone,
      category: participant.category,
      paymentStatus: participant.paymentStatus,
      isApproved: participant.isApproved,
      registeredAt: participant.registeredAt,
    }));

    return NextResponse.json(participantsData);
  } catch (error) {
    console.error('Error fetching tournament participants:', error);
    return NextResponse.json(
      { error: 'Failed to fetch participants' },
      { status: 500 }
    );
  }
}
