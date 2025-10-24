import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { COLLECTIONS, insertParticipantSchema, participantSchema } from '@repo/schemas';
import { ObjectId } from 'mongodb';

// Helper function to get authenticated user
async function getAuthenticatedUser(request: NextRequest) {
  const db = await connectToDatabase();
  const sessionToken = request.cookies.get('session')?.value;

  if (!sessionToken) {
    return null;
  }

  const session = await db.collection(COLLECTIONS.SESSIONS).findOne({
    sessionToken,
    expiresAt: { $gt: new Date() }
  });

  if (!session) {
    return null;
  }

  const user = await db.collection(COLLECTIONS.USERS).findOne({
    _id: session.userId
  });

  return user;
}

export async function GET(request: NextRequest) {
  try {
    const db = await connectToDatabase();
    const user = await getAuthenticatedUser(request);
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

    // Get participants with pagination
    const skip = (page - 1) * limit;
    const participants = await db.collection(COLLECTIONS.PARTICIPANTS)
      .find(query)
      .sort({ registeredAt: -1 })
      .skip(skip)
      .limit(limit)
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