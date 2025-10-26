import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { COLLECTIONS, insertNotificationSchema } from '@repo/schemas';
import { ObjectId } from 'mongodb';

// POST - Approve or deny an admin request (super admin only)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { action } = await request.json(); // action: 'approve' or 'deny'

    if (!action || !['approve', 'deny'].includes(action)) {
      return NextResponse.json(
        { success: false, error: 'Invalid action. Must be "approve" or "deny"' },
        { status: 400 }
      );
    }

    const db = await connectToDatabase();
    const usersCollection = db.collection(COLLECTIONS.USERS);
    const notificationsCollection = db.collection(COLLECTIONS.NOTIFICATIONS);
    
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

    // Find the user with the admin request
    const targetUser = await usersCollection.findOne({
      _id: new ObjectId(id),
      adminRequestStatus: 'pending',
    });

    if (!targetUser) {
      return NextResponse.json(
        { success: false, error: 'Admin request not found or already processed' },
        { status: 404 }
      );
    }

    // Update user based on action
    const updateData: any = {
      adminRequestStatus: action === 'approve' ? 'approved' : 'denied',
      adminRequestProcessedAt: new Date(),
      adminRequestProcessedBy: currentUser._id.toString(),
    };

    // If approved, add admin role
    if (action === 'approve') {
      // Add 'admin' to roles array if not already present
      if (!targetUser.roles?.includes('admin')) {
        updateData.roles = [...(targetUser.roles || []), 'admin'];
      }
    }

    await usersCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );

    // Create notification for the user
    const notificationData = insertNotificationSchema.parse({
      userId: id,
      type: action === 'approve' ? 'admin_request_approved' : 'admin_request_denied',
      title: action === 'approve' ? 'Admin Request Approved' : 'Admin Request Denied',
      message:
        action === 'approve'
          ? 'Congratulations! Your request for admin access has been approved. You now have admin privileges.'
          : 'Your request for admin access has been denied. Please contact support if you have questions.',
      isRead: false,
    });

    await notificationsCollection.insertOne({
      ...notificationData,
      userId: new ObjectId(id),
    });

    return NextResponse.json({
      success: true,
      message: `Admin request ${action === 'approve' ? 'approved' : 'denied'} successfully`,
    });
  } catch (error) {
    console.error('Error processing admin request:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process admin request' },
      { status: 500 }
    );
  }
}

