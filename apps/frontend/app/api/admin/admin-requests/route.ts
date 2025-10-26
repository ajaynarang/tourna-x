import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { COLLECTIONS } from '@repo/schemas';
import { ObjectId } from 'mongodb';

// GET - Get all pending admin requests (super admin only)
export async function GET(request: NextRequest) {
  try {
    const db = await connectToDatabase();
    const usersCollection = db.collection(COLLECTIONS.USERS);
    
    // Get session token from cookie
    const sessionToken = request.cookies.get('session')?.value;
    if (!sessionToken) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Verify session and check if user is super admin
    const sessionsCollection = db.collection(COLLECTIONS.SESSIONS);
    const session = await sessionsCollection.findOne({
      sessionToken,
      expiresAt: { $gt: new Date() },
    });

    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Invalid or expired session' },
        { status: 401 }
      );
    }

    const currentUser = await usersCollection.findOne({
      _id: new ObjectId(session.userId),
    });

    if (!currentUser || !currentUser.isSuperAdmin) {
      return NextResponse.json(
        { success: false, error: 'Super admin access required' },
        { status: 403 }
      );
    }

    // Get all users with pending admin requests
    const pendingRequests = await usersCollection
      .find({ adminRequestStatus: 'pending' })
      .sort({ adminRequestedAt: -1 })
      .toArray();

    // Format the response
    const formattedRequests = pendingRequests.map((user) => ({
      _id: user._id.toString(),
      name: user.name,
      phone: user.phone,
      email: user.email,
      society: user.society,
      block: user.block,
      flatNumber: user.flatNumber,
      adminRequestedAt: user.adminRequestedAt,
      createdAt: user.createdAt,
    }));

    return NextResponse.json({
      success: true,
      data: formattedRequests,
    });
  } catch (error) {
    console.error('Error fetching admin requests:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch admin requests' },
      { status: 500 }
    );
  }
}

