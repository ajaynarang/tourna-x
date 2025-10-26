import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { COLLECTIONS } from '@repo/schemas';
import { getAuthUser } from '@/lib/auth-utils';
import { ObjectId } from 'mongodb';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = await connectToDatabase();
    const authUser = await getAuthUser(request);

    if (!authUser || (!authUser.roles.includes('admin') && !authUser.roles.includes('player'))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid match ID' }, { status: 400 });
    }

    const match = await db.collection(COLLECTIONS.MATCHES).findOne({
      _id: new ObjectId(id),
      matchType: 'practice'
    });

    if (!match) {
      return NextResponse.json({ error: 'Practice match not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: match
    });

  } catch (error) {
    console.error('Error fetching practice match:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch practice match' },
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
    const db = await connectToDatabase();
    const authUser = await getAuthUser(request);

    if (!authUser || (!authUser.roles.includes('admin') && !authUser.roles.includes('player'))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid match ID' }, { status: 400 });
    }

    const match = await db.collection(COLLECTIONS.MATCHES).findOne({
      _id: new ObjectId(id),
      matchType: 'practice'
    });

    if (!match) {
      return NextResponse.json({ error: 'Practice match not found' }, { status: 404 });
    }

    // Don't allow updates if match has started
    if (match.status !== 'scheduled') {
      return NextResponse.json(
        { error: 'Cannot update a match that has already started' },
        { status: 400 }
      );
    }

    const body = await request.json();
    
    const updates: any = {
      updatedAt: new Date()
    };

    // Update allowed fields
    if (body.court !== undefined) updates.court = body.court;
    if (body.venue !== undefined) updates.venue = body.venue;
    if (body.notes !== undefined) updates.notes = body.notes;

    await db.collection(COLLECTIONS.MATCHES).updateOne(
      { _id: new ObjectId(id) },
      { $set: updates }
    );

    return NextResponse.json({
      success: true,
      message: 'Practice match updated successfully'
    });

  } catch (error) {
    console.error('Error updating practice match:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update practice match' },
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
    console.log('DELETE request for practice match:', id);
    
    const db = await connectToDatabase();
    const authUser = await getAuthUser(request);

    if (!authUser || (!authUser.roles.includes('admin') && !authUser.roles.includes('player'))) {
      console.log('Unauthorized delete attempt');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!ObjectId.isValid(id)) {
      console.log('Invalid match ID:', id);
      return NextResponse.json({ error: 'Invalid match ID' }, { status: 400 });
    }

    const match = await db.collection(COLLECTIONS.MATCHES).findOne({
      _id: new ObjectId(id),
      matchType: 'practice'
    });

    if (!match) {
      console.log('Practice match not found:', id);
      return NextResponse.json({ error: 'Practice match not found' }, { status: 404 });
    }

    console.log('Found match to delete:', { id, status: match.status });

    // Don't allow deletion of completed matches
    if (match.status === 'completed') {
      console.log('Cannot delete completed match');
      return NextResponse.json(
        { error: 'Cannot delete a completed match' },
        { status: 400 }
      );
    }

    const deleteResult = await db.collection(COLLECTIONS.MATCHES).deleteOne({
      _id: new ObjectId(id)
    });

    console.log('Delete result:', deleteResult);

    return NextResponse.json({
      success: true,
      message: 'Practice match deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting practice match:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete practice match' },
      { status: 500 }
    );
  }
}

