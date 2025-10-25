import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { COLLECTIONS } from '@repo/schemas';
import { ObjectId } from 'mongodb';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid tournament ID' },
        { status: 400 }
      );
    }

    const db = await connectToDatabase();

    // Fetch all matches for this tournament
    const matches = await db
      .collection(COLLECTIONS.MATCHES)
      .find({ tournamentId: new ObjectId(id) })
      .sort({ roundNumber: 1, matchNumber: 1 })
      .toArray();

    return NextResponse.json({
      success: true,
      data: matches,
      count: matches.length,
    });
  } catch (error) {
    console.error('Error fetching fixtures:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch fixtures' },
      { status: 500 }
    );
  }
}

