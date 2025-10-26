import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { COLLECTIONS } from '@repo/schemas';
import { getAuthUser } from '@/lib/auth-utils';
import { ObjectId } from 'mongodb';

export async function GET(request: NextRequest) {
  try {
    const db = await connectToDatabase();
    const authUser = await getAuthUser(request);

    if (!authUser) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const userId = authUser._id;

    // Get all matches for the player (both practice and tournament)
    // Include player3Id and player4Id for doubles/mixed matches
    const matches = await db.collection(COLLECTIONS.MATCHES)
      .aggregate([
        {
          $match: {
            $or: [
              { player1Id: userId },
              { player2Id: userId },
              { player3Id: userId },
              { player4Id: userId }
            ]
          }
        },
        {
          $lookup: {
            from: COLLECTIONS.USERS,
            localField: 'player1Id',
            foreignField: '_id',
            as: 'player1'
          }
        },
        {
          $lookup: {
            from: COLLECTIONS.USERS,
            localField: 'player2Id',
            foreignField: '_id',
            as: 'player2'
          }
        },
        {
          $lookup: {
            from: COLLECTIONS.TOURNAMENTS,
            localField: 'tournamentId',
            foreignField: '_id',
            as: 'tournament'
          }
        },
        {
          $lookup: {
            from: COLLECTIONS.USERS,
            localField: 'player3Id',
            foreignField: '_id',
            as: 'player3'
          }
        },
        {
          $lookup: {
            from: COLLECTIONS.USERS,
            localField: 'player4Id',
            foreignField: '_id',
            as: 'player4'
          }
        },
        {
          $addFields: {
            player1Name: { $arrayElemAt: ['$player1.name', 0] },
            player2Name: { $arrayElemAt: ['$player2.name', 0] },
            player3Name: { $arrayElemAt: ['$player3.name', 0] },
            player4Name: { $arrayElemAt: ['$player4.name', 0] },
            tournamentName: { $arrayElemAt: ['$tournament.name', 0] },
            tournamentVenue: { $arrayElemAt: ['$tournament.venue', 0] },
            // Determine opponent name based on current user and match type
            opponentName: {
              $cond: {
                if: { $in: ['$category', ['doubles', 'mixed']] },
                then: {
                  $cond: {
                    if: { $or: [{ $eq: ['$player1Id', userId] }, { $eq: ['$player3Id', userId] }] },
                    then: {
                      $concat: [
                        { $ifNull: [{ $arrayElemAt: ['$player2.name', 0] }, ''] },
                        ' & ',
                        { $ifNull: [{ $arrayElemAt: ['$player4.name', 0] }, ''] }
                      ]
                    },
                    else: {
                      $concat: [
                        { $ifNull: [{ $arrayElemAt: ['$player1.name', 0] }, ''] },
                        ' & ',
                        { $ifNull: [{ $arrayElemAt: ['$player3.name', 0] }, ''] }
                      ]
                    }
                  }
                },
                else: {
                  $cond: {
                    if: { $eq: ['$player1Id', userId] },
                    then: { $arrayElemAt: ['$player2.name', 0] },
                    else: { $arrayElemAt: ['$player1.name', 0] }
                  }
                }
              }
            },
            opponentId: {
              $cond: {
                if: { $eq: ['$player1Id', userId] },
                then: '$player2Id',
                else: '$player1Id'
              }
            },
            // Determine if current user is player1 or player2
            isPlayer1: { 
              $or: [
                { $eq: ['$player1Id', userId] },
                { $eq: ['$player3Id', userId] }
              ]
            }
          }
        },
        {
          $project: {
            player1: 0,
            player2: 0,
            player3: 0,
            player4: 0,
            tournament: 0
          }
        },
        {
          $sort: { scheduledDate: -1, createdAt: -1 }
        }
      ])
      .toArray();

    return NextResponse.json({
      success: true,
      data: matches
    });

  } catch (error) {
    console.error('Error fetching player matches:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch matches' },
      { status: 500 }
    );
  }
}

