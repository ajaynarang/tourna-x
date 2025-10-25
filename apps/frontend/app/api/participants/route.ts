import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { COLLECTIONS, insertParticipantSchema, participantSchema } from '@repo/schemas';
import { getAuthUser } from '@/lib/auth-utils';
import { ObjectId } from 'mongodb';

// Helper function to get authenticated user

export async function GET(request: NextRequest) {
  try {
    const db = await connectToDatabase();
    const user = await getAuthUser(request);
    const { searchParams } = new URL(request.url);
    
    const tournamentId = searchParams.get('tournamentId');
    const status = searchParams.get('status');
    const paymentStatus = searchParams.get('paymentStatus');
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    // Build query
    const query: any = {};
    
    if (tournamentId) {
      query.tournamentId = new ObjectId(tournamentId);
    }
    
    if (status && status !== 'all') {
      if (status === 'pending') {
        query.isApproved = false;
      } else if (status === 'approved') {
        query.isApproved = true;
      } else if (status === 'rejected') {
        query.isApproved = false;
        query.rejectionReason = { $exists: true };
      }
    }
    
    if (paymentStatus && paymentStatus !== 'all') {
      query.paymentStatus = paymentStatus;
    }
    
    if (category) {
      query.category = category;
    }
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { partnerName: { $regex: search, $options: 'i' } }
      ];
    }

    // Get participants with pagination and user details
    const skip = (page - 1) * limit;
    const participants = await db.collection(COLLECTIONS.PARTICIPANTS)
      .aggregate([
        { $match: query },
        {
          $lookup: {
            from: COLLECTIONS.USERS,
            localField: 'userId',
            foreignField: '_id',
            as: 'userDetails'
          }
        },
        {
          $lookup: {
            from: COLLECTIONS.TOURNAMENTS,
            localField: 'tournamentId',
            foreignField: '_id',
            as: 'tournamentDetails'
          }
        },
        {
          $unwind: {
            path: '$userDetails',
            preserveNullAndEmptyArrays: true
          }
        },
        {
          $unwind: {
            path: '$tournamentDetails',
            preserveNullAndEmptyArrays: true
          }
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
            tournamentId: '$tournamentDetails._id',
            tournamentName: '$tournamentDetails.name',
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
            medicalInfo: 1
          }
        },
        { $sort: { registeredAt: -1 } },
        { $skip: skip },
        { $limit: limit }
      ])
      .toArray();

    const total = await db.collection(COLLECTIONS.PARTICIPANTS).countDocuments(query);

    return NextResponse.json({
      success: true,
      data: participants,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching participants:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch participants' },
      { status: 500 }
    );
  }
}