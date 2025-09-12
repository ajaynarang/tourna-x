import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { COLLECTIONS } from '@repo/schemas';

export async function GET() {
  try {
    const db = await connectToDatabase();
    
    const stats = await db.collection(COLLECTIONS.TOURNAMENTS).aggregate([
      {
        $group: {
          _id: null,
          totalTournaments: { $sum: 1 },
          activeTournaments: {
            $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] }
          },
          completedTournaments: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
          },
          totalPrizeMoney: { $sum: '$prizeWinner' }
        }
      }
    ]).toArray();

    const participantStats = await db.collection(COLLECTIONS.PARTICIPANTS).aggregate([
      {
        $group: {
          _id: null,
          totalParticipants: { $sum: 1 },
          paidParticipants: {
            $sum: { $cond: [{ $eq: ['$registrationStatus', 'paid'] }, 1, 0] }
          }
        }
      }
    ]).toArray();

    const result = {
      tournaments: stats[0] || {
        totalTournaments: 0,
        activeTournaments: 0,
        completedTournaments: 0,
        totalPrizeMoney: 0
      },
      participants: participantStats[0] || {
        totalParticipants: 0,
        paidParticipants: 0
      }
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching tournament stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tournament stats' },
      { status: 500 }
    );
  }
}
