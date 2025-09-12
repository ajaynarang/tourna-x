import { NextRequest, NextResponse } from 'next/server';
import { getCollections } from '@/lib/mongodb';
import { insertTournamentSchema } from '@repo/schemas';
import { ObjectId } from 'mongodb';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { tournaments } = await getCollections();
    const tournament = await tournaments.findOne({ _id: new ObjectId(id) });
    
    if (!tournament) {
      return NextResponse.json(
        { error: 'Tournament not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(tournament);
  } catch (error) {
    console.error('Get tournament error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tournament' },
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
    const body = await request.json();
    const tournamentData = insertTournamentSchema.partial().parse(body);
    
    const { tournaments } = await getCollections();
    const result = await tournaments.findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: tournamentData },
      { returnDocument: 'after' }
    );
    
    if (!result) {
      return NextResponse.json(
        { error: 'Tournament not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Update tournament error:', error);
    return NextResponse.json(
      { error: 'Invalid tournament data' },
      { status: 400 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { tournaments } = await getCollections();
    await tournaments.deleteOne({ _id: new ObjectId(id) });
    
    return NextResponse.json(null, { status: 204 });
  } catch (error) {
    console.error('Delete tournament error:', error);
    return NextResponse.json(
      { error: 'Failed to delete tournament' },
      { status: 500 }
    );
  }
}
