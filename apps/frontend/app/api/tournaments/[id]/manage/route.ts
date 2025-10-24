import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { COLLECTIONS } from '@repo/schemas';
import { getAuthUser } from '@/lib/auth-utils';
import { ObjectId } from 'mongodb';

// Helper function to get authenticated user

// Define valid state transitions
const VALID_TRANSITIONS: Record<string, string[]> = {
  draft: ['published', 'cancelled'],
  published: ['registration_open', 'draft', 'cancelled'],
  registration_open: ['ongoing', 'published', 'cancelled'],
  ongoing: ['completed', 'cancelled'],
  completed: [], // Terminal state
  cancelled: ['draft'], // Can only go back to draft
};

// Validate state transition
function isValidTransition(currentStatus: string, newStatus: string): boolean {
  return VALID_TRANSITIONS[currentStatus]?.includes(newStatus) || false;
}

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
        { success: false, error: 'Invalid tournament ID' },
        { status: 400 }
      );
    }

    const { action, data } = await request.json();

    // Get current tournament
    const tournament = await db.collection(COLLECTIONS.TOURNAMENTS).findOne({
      _id: new ObjectId(id)
    });

    if (!tournament) {
      return NextResponse.json(
        { success: false, error: 'Tournament not found' },
        { status: 404 }
      );
    }

    let result;
    let message = '';

    switch (action) {
      case 'change_status':
        const { status: newStatus } = data;
        
        if (!isValidTransition(tournament.status, newStatus)) {
          return NextResponse.json(
            { 
              success: false, 
              error: `Cannot transition from ${tournament.status} to ${newStatus}`,
              validTransitions: VALID_TRANSITIONS[tournament.status]
            },
            { status: 400 }
          );
        }

        result = await db.collection(COLLECTIONS.TOURNAMENTS).updateOne(
          { _id: new ObjectId(id) },
          { 
            $set: { 
              status: newStatus,
              isPublished: newStatus === 'published' || newStatus === 'registration_open' || newStatus === 'ongoing',
              updatedAt: new Date()
            } 
          }
        );

        message = `Tournament status changed to ${newStatus}`;
        break;

      case 'update_properties':
        const updateData = {
          ...data,
          updatedAt: new Date(),
        };

        // Convert date strings to Date objects if present
        if (updateData.startDate) updateData.startDate = new Date(updateData.startDate);
        if (updateData.endDate) updateData.endDate = new Date(updateData.endDate);
        if (updateData.registrationDeadline) updateData.registrationDeadline = new Date(updateData.registrationDeadline);

        result = await db.collection(COLLECTIONS.TOURNAMENTS).updateOne(
          { _id: new ObjectId(id) },
          { $set: updateData }
        );

        message = 'Tournament properties updated successfully';
        break;

      case 'duplicate':
        const duplicateData = {
          ...tournament,
          name: `${tournament.name} (Copy)`,
          status: 'draft',
          isPublished: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        delete duplicateData._id;

        const duplicateResult = await db.collection(COLLECTIONS.TOURNAMENTS).insertOne(duplicateData);
        
        return NextResponse.json({
          success: true,
          data: { _id: duplicateResult.insertedId },
          message: 'Tournament duplicated successfully'
        });

      case 'archive':
        result = await db.collection(COLLECTIONS.TOURNAMENTS).updateOne(
          { _id: new ObjectId(id) },
          { 
            $set: { 
              status: 'cancelled',
              isPublished: false,
              updatedAt: new Date()
            } 
          }
        );

        message = 'Tournament archived successfully';
        break;

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }

    if (result && result.matchedCount === 0) {
      return NextResponse.json(
        { success: false, error: 'Tournament not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message
    });

  } catch (error) {
    console.error('Error managing tournament:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to manage tournament' },
      { status: 500 }
    );
  }
}

// GET endpoint to fetch tournament management info
export async function GET(
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
        { success: false, error: 'Invalid tournament ID' },
        { status: 400 }
      );
    }

    const tournament = await db.collection(COLLECTIONS.TOURNAMENTS).findOne({
      _id: new ObjectId(id)
    });

    if (!tournament) {
      return NextResponse.json(
        { success: false, error: 'Tournament not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        tournament,
        availableTransitions: VALID_TRANSITIONS[tournament.status] || [],
        canEdit: ['draft', 'published'].includes(tournament.status),
        canDelete: tournament.status === 'draft',
        canDuplicate: true,
        canArchive: !['completed', 'cancelled'].includes(tournament.status)
      }
    });

  } catch (error) {
    console.error('Error fetching tournament management info:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch tournament info' },
      { status: 500 }
    );
  }
}
