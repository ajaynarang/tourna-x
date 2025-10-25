import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { COLLECTIONS } from '@repo/schemas';
import { ObjectId } from 'mongodb';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: tournamentId } = await params;

    if (!tournamentId) {
      return NextResponse.json(
        { success: false, error: 'Tournament ID is required' },
        { status: 400 }
      );
    }

    const db = await connectToDatabase();

    // Fetch participants for this tournament with user details populated
    const participants = await db.collection(COLLECTIONS.PARTICIPANTS)
      .aggregate([
        {
          $match: { 
            tournamentId: new ObjectId(tournamentId)
          }
        },
        {
          $lookup: {
            from: COLLECTIONS.USERS,
            localField: 'userId',
            foreignField: '_id',
            as: 'userDetails'
          }
        },
        {
          $unwind: {
            path: '$userDetails',
            preserveNullAndEmptyArrays: true
          }
        },
        {
          $sort: { registeredAt: -1 }
        },
        {
          $project: {
            _id: 1,
            userId: {
              _id: '$userDetails._id',
              name: '$userDetails.name',
              phone: '$userDetails.phone',
              email: '$userDetails.email',
              age: '$userDetails.age',
              gender: '$userDetails.gender'
            },
            category: 1,
            gender: 1,
            ageGroups: 1,
            isApproved: 1,
            paymentStatus: 1,
            registeredAt: 1,
            partnerName: 1,
            partnerPhone: 1,
            partnerAge: 1,
            partnerGender: 1,
            emergencyContact: 1,
            emergencyContactName: 1,
            medicalInfo: 1,
            addedBy: 1
          }
        }
      ])
      .toArray();

    return NextResponse.json({
      success: true,
      data: participants
    });
  } catch (error) {
    console.error('Error fetching tournament participants:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch participants' },
      { status: 500 }
    );
  }
}
