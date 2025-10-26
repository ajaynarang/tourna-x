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
    const db = await connectToDatabase();
    const user = await getAuthUser(request);
    const { id } = await params;

    if (!user) {
      return NextResponse.json(
        { success: false, registered: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, registered: false, error: 'Invalid tournament ID' },
        { status: 400 }
      );
    }

    // Check if user is registered for this tournament
    const registration = await db.collection(COLLECTIONS.PARTICIPANTS).findOne({
      tournamentId: new ObjectId(id),
      userId: user._id
    });

    if (!registration) {
      return NextResponse.json({
        success: true,
        registered: false
      });
    }

    // Return registration details
    return NextResponse.json({
      success: true,
      registered: true,
      registration: {
        _id: registration._id,
        category: registration.category,
        ageGroups: registration.ageGroups || [],
        isApproved: registration.isApproved,
        paymentStatus: registration.paymentStatus,
        registeredAt: registration.registeredAt,
        partnerName: registration.partnerName,
        approvedAt: registration.approvedAt,
        rejectionReason: registration.rejectionReason
      }
    });

  } catch (error) {
    console.error('Error checking registration:', error);
    return NextResponse.json(
      { success: false, registered: false, error: 'Failed to check registration status' },
      { status: 500 }
    );
  }
}

