import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { COLLECTIONS, insertMatchSchema } from '@repo/schemas';
import { getAuthUser } from '@/lib/auth-utils';
import { ObjectId } from 'mongodb';
import { z } from 'zod';

export async function GET(request: NextRequest) {
  try {
    const db = await connectToDatabase();
    const authUser = await getAuthUser(request);

    console.log('Auth user:', authUser);

    if (!authUser || (!authUser.roles.includes('admin') && !authUser.roles.includes('player'))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    
    const status = searchParams.get('status');
    const category = searchParams.get('category');
    const playerId = searchParams.get('playerId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    // Build query for practice matches only
    const query: any = {
      matchType: 'practice'
    };
    
    // Check if user is super admin
    const usersCollection = db.collection(COLLECTIONS.USERS);
    const currentUser = await usersCollection.findOne({ _id: new ObjectId(authUser.userId) });
    const isSuperAdmin = currentUser?.isSuperAdmin === true;
    
    // Non-super admins can only see matches they created
    if (!isSuperAdmin) {
      query.createdBy = new ObjectId(authUser.userId);
    }
    
    if (status && status !== 'all') {
      query.status = status;
    }
    
    if (category && category !== 'all') {
      query.category = category;
    }

    if (playerId && ObjectId.isValid(playerId)) {
      query.$or = [
        { player1Id: new ObjectId(playerId) },
        { player2Id: new ObjectId(playerId) },
        { player3Id: new ObjectId(playerId) },
        { player4Id: new ObjectId(playerId) }
      ];
    }

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) {
        query.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        query.createdAt.$lte = new Date(endDate);
      }
    }

    // Get matches with pagination
    const skip = (page - 1) * limit;
    
    const matches = await db.collection(COLLECTIONS.MATCHES)
      .find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    const total = await db.collection(COLLECTIONS.MATCHES).countDocuments(query);

    return NextResponse.json({
      success: true,
      data: matches,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: skip + matches.length < total
      }
    });

  } catch (error) {
    console.error('Error fetching practice matches:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch practice matches' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const db = await connectToDatabase();
    const authUser = await getAuthUser(request);

    if (!authUser || (!authUser.roles.includes('admin') && !authUser.roles.includes('player'))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check daily rate limit for players (admins are exempt)
    if (authUser.roles.includes('player') && !authUser.roles.includes('admin')) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const todayMatchCount = await db.collection(COLLECTIONS.MATCHES).countDocuments({
        matchType: 'practice',
        createdBy: new ObjectId(authUser.userId),
        createdAt: {
          $gte: today,
          $lt: tomorrow
        }
      });
      
      if (todayMatchCount >= 10) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Daily limit reached. You can create maximum 10 practice matches per day.' 
          },
          { status: 429 }
        );
      }
    }

    const body = await request.json();
    
    // Validate practice match data
    const practiceMatchData: any = {
      matchType: 'practice',
      tournamentId: null,
      category: body.category,
      player1Id: body.player1?.userId ? new ObjectId(body.player1.userId) : undefined,
      player1Name: body.player1?.name || '',
      player1Phone: body.player1?.phone,
      player1IsGuest: body.player1?.isGuest || false,
      player1Gender: body.player1?.gender,
      player2Id: body.player2?.userId ? new ObjectId(body.player2.userId) : undefined,
      player2Name: body.player2?.name || '',
      player2Phone: body.player2?.phone,
      player2IsGuest: body.player2?.isGuest || false,
      player2Gender: body.player2?.gender,
      court: body.court,
      venue: body.venue,
      notes: body.notes,
      scoringFormat: body.scoringFormat || {
        pointsPerGame: 21,
        gamesPerMatch: 3,
        winBy: 2,
        maxPoints: 30,
      },
      games: [],
      player1Score: [],
      player2Score: [],
      status: 'scheduled',
      createdBy: new ObjectId(authUser.userId),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // For doubles/mixed doubles, add team partners
    if (body.category === 'doubles' || body.category === 'mixed') {
      practiceMatchData.player3Id = body.player3?.userId ? new ObjectId(body.player3.userId) : undefined;
      practiceMatchData.player3Name = body.player3?.name || '';
      practiceMatchData.player3Phone = body.player3?.phone;
      practiceMatchData.player3IsGuest = body.player3?.isGuest || false;
      practiceMatchData.player3Gender = body.player3?.gender;
      
      practiceMatchData.player4Id = body.player4?.userId ? new ObjectId(body.player4.userId) : undefined;
      practiceMatchData.player4Name = body.player4?.name || '';
      practiceMatchData.player4Phone = body.player4?.phone;
      practiceMatchData.player4IsGuest = body.player4?.isGuest || false;
      practiceMatchData.player4Gender = body.player4?.gender;
    }

    // Validate that we have either userId or phone+name for all players
    if (!practiceMatchData.player1Id && (!practiceMatchData.player1Phone || !practiceMatchData.player1Name)) {
      return NextResponse.json(
        { error: 'Player 1 must have either a user ID or phone and name' },
        { status: 400 }
      );
    }

    if (!practiceMatchData.player2Id && (!practiceMatchData.player2Phone || !practiceMatchData.player2Name)) {
      return NextResponse.json(
        { error: 'Player 2 must have either a user ID or phone and name' },
        { status: 400 }
      );
    }

    // Validate doubles/mixed doubles requirements
    if (body.category === 'doubles' || body.category === 'mixed') {
      if (!practiceMatchData.player3Id && (!practiceMatchData.player3Phone || !practiceMatchData.player3Name)) {
        return NextResponse.json(
          { error: 'Team 1 Player 2 must have either a user ID or phone and name' },
          { status: 400 }
        );
      }

      if (!practiceMatchData.player4Id && (!practiceMatchData.player4Phone || !practiceMatchData.player4Name)) {
        return NextResponse.json(
          { error: 'Team 2 Player 2 must have either a user ID or phone and name' },
          { status: 400 }
        );
      }

      // Validate mixed doubles gender requirements
      if (body.category === 'mixed') {
        // Check if team 1 has different genders
        if (practiceMatchData.player1Gender && practiceMatchData.player3Gender) {
          if (practiceMatchData.player1Gender === practiceMatchData.player3Gender) {
            return NextResponse.json(
              { error: 'Mixed doubles requires each team to have one male and one female player' },
              { status: 400 }
            );
          }
        }

        // Check if team 2 has different genders
        if (practiceMatchData.player2Gender && practiceMatchData.player4Gender) {
          if (practiceMatchData.player2Gender === practiceMatchData.player4Gender) {
            return NextResponse.json(
              { error: 'Mixed doubles requires each team to have one male and one female player' },
              { status: 400 }
            );
          }
        }
      }
    }

    const result = await db.collection(COLLECTIONS.MATCHES).insertOne(practiceMatchData);
    
    // Create notifications for all players with player role
    try {
      const allPlayers = await db.collection(COLLECTIONS.USERS)
        .find({ roles: 'player' })
        .toArray();
      
      const creatorName = (authUser as any).name || 'A player';
      const matchCategory = body.category === 'singles' ? 'Singles' : 
                           body.category === 'doubles' ? 'Doubles' : 'Mixed Doubles';
      
      const notifications = allPlayers.map((player: any) => ({
        userId: player._id,
        type: 'practice_match_created',
        title: 'New Practice Match Created',
        message: `${creatorName} has created a new ${matchCategory} practice match${body.venue ? ` at ${body.venue}` : ''}.`,
        matchId: result.insertedId,
        isRead: false,
        createdAt: new Date(),
      }));
      
      if (notifications.length > 0) {
        await db.collection(COLLECTIONS.NOTIFICATIONS).insertMany(notifications);
      }
    } catch (notifError) {
      console.error('Error creating notifications:', notifError);
      // Don't fail the match creation if notifications fail
    }
    
    return NextResponse.json({
      success: true,
      data: { _id: result.insertedId },
      message: 'Practice match created successfully'
    });

  } catch (error) {
    console.error('Error creating practice match:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.issues }, { status: 400 });
    }
    return NextResponse.json(
      { success: false, error: 'Failed to create practice match' },
      { status: 500 }
    );
  }
}

