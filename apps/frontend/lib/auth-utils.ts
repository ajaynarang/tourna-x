import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { COLLECTIONS, User } from '@repo/schemas';
// Remove circular import
import { ObjectId } from 'mongodb';

export async function getAuthUser(request: NextRequest): Promise<(User & { userId: string }) | null> {
  const db = await connectToDatabase();
  const sessionToken = request.cookies.get('session')?.value;

  if (!sessionToken) {
    return null;
  }

  console.log('Session token:', sessionToken);

  const session = await db.collection(COLLECTIONS.SESSIONS).findOne({
    sessionToken,
    expiresAt: { $gt: new Date() }
  });

  if (!session) {
    return null;
  }

  const user = await db.collection(COLLECTIONS.USERS).findOne({
    _id: new ObjectId(session.userId)
  }) as User | null;

  if (!user) {
    return null;
  }

  return  { ...user, userId: user._id!.toString(), roles: user.roles || [] };
}