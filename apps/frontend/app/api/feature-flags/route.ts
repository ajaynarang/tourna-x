import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { COLLECTIONS, FeatureFlags, featureFlagsSchema } from '@repo/schemas';
import { ObjectId } from 'mongodb';

// GET - Fetch current feature flags
export async function GET(request: NextRequest) {
  try {
    const db = await connectToDatabase();
    
    // Get the single feature flags document (there should only be one)
    let featureFlags = await db
      .collection(COLLECTIONS.FEATURE_FLAGS)
      .findOne({});

    // If no feature flags exist, create default ones
    if (!featureFlags) {
      const defaultFlags: Partial<FeatureFlags> = {
        practiceMatches: {
          enabled: true,
          playerEnabled: true,
          adminEnabled: true,
          statsEnabled: true,
        },
        tournaments: {
          enabled: true,
          playerEnabled: true,
          adminEnabled: true,
          statsEnabled: true,
        },
        updatedAt: new Date(),
      };

      const result = await db
        .collection(COLLECTIONS.FEATURE_FLAGS)
        .insertOne(defaultFlags as any);

      featureFlags = {
        _id: result.insertedId as any,
        ...defaultFlags,
      } as any;
    }

    return NextResponse.json({
      success: true,
      data: featureFlags,
    });
  } catch (error) {
    console.error('Error fetching feature flags:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch feature flags' },
      { status: 500 }
    );
  }
}

// PUT - Update feature flags (admin only)
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, updates } = body;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 401 }
      );
    }

    const db = await connectToDatabase();

    // Verify user is admin
    const user = await db
      .collection(COLLECTIONS.USERS)
      .findOne({ _id: new ObjectId(userId) });

    if (!user || !user.roles?.includes('admin')) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized. Admin access required.' },
        { status: 403 }
      );
    }

    // Validate the updates
    const validatedUpdates = {
      practiceMatches: updates.practiceMatches || {
        enabled: true,
        playerEnabled: true,
        adminEnabled: true,
        statsEnabled: true,
      },
      tournaments: updates.tournaments || {
        enabled: true,
        playerEnabled: true,
        adminEnabled: true,
        statsEnabled: true,
      },
      updatedAt: new Date(),
      updatedBy: new ObjectId(userId),
    };

    // Update or insert feature flags (upsert)
    const result = await db
      .collection(COLLECTIONS.FEATURE_FLAGS)
      .findOneAndUpdate(
        {},
        { $set: validatedUpdates },
        { upsert: true, returnDocument: 'after' }
      );

    return NextResponse.json({
      success: true,
      data: result,
      message: 'Feature flags updated successfully',
    });
  } catch (error) {
    console.error('Error updating feature flags:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update feature flags' },
      { status: 500 }
    );
  }
}

