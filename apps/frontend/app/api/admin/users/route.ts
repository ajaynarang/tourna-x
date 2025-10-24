import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { COLLECTIONS } from '@repo/schemas';
import { getAuthUser } from '@/lib/auth-utils';

export async function GET(request: NextRequest) {
  try {
    const db = await connectToDatabase();
    const authUser = await getAuthUser(request);

    if (!authUser || !authUser.roles.includes('admin')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const limit = parseInt(searchParams.get('limit') || '100');

    // Build query
    const query: any = {};
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    // Get users (exclude password field)
    const users = await db.collection(COLLECTIONS.USERS)
      .find(query, { projection: { password: 0 } })
      .sort({ name: 1 })
      .limit(limit)
      .toArray();

    return NextResponse.json({
      success: true,
      data: users,
    });

  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}

