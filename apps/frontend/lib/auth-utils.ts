import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { COLLECTIONS } from '@repo/schemas';
import { getAuthUser } from '@/lib/auth-utils';
import { ObjectId } from 'mongodb';

export async function getAuthUser(request: NextRequest) {
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

  if (!user) {
    return null;
  }

  return {
    userId: user._id.toString(),
    roles: user.roles || [],
    name: user.name,
    email: user.email,
    phone: user.phone
  };
}