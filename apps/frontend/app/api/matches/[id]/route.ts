import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { COLLECTIONS } from '@repo/schemas';
import { ObjectId } from 'mongodb';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid match ID' },
        { status: 400 }
      );
    }

    const db = await connectToDatabase();
    
    // Get match details
    const match = await db
      .collection(COLLECTIONS.MATCHES)
      .findOne({ _id: new ObjectId(id) });

    if (!match) {
      return NextResponse.json(
        { success: false, error: 'Match not found' },
        { status: 404 }
      );
    }

    // If it's a tournament match, get tournament details
    if (match.tournamentId) {
      const tournament = await db
        .collection(COLLECTIONS.TOURNAMENTS)
        .findOne({ _id: new ObjectId(match.tournamentId) });
      
      if (tournament) {
        match.tournamentName = tournament.name;
      }
    }

    return NextResponse.json({
      success: true,
      data: match,
    });

  } catch (error) {
    console.error('Error fetching match:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch match' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid match ID' },
        { status: 400 }
      );
    }

    const db = await connectToDatabase();
    const updateData = await request.json();

    // Remove _id from update data if present
    delete updateData._id;

    // Add updated timestamp
    updateData.updatedAt = new Date();

    const result = await db
      .collection(COLLECTIONS.MATCHES)
      .updateOne(
        { _id: new ObjectId(id) },
        { $set: updateData }
      );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { success: false, error: 'Match not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Match updated successfully',
    });

  } catch (error) {
    console.error('Error updating match:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update match' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid match ID' },
        { status: 400 }
      );
    }

    const db = await connectToDatabase();

    const result = await db
      .collection(COLLECTIONS.MATCHES)
      .deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { success: false, error: 'Match not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Match deleted successfully',
    });

  } catch (error) {
    console.error('Error deleting match:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete match' },
      { status: 500 }
    );
  }
}

