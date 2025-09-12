import { NextResponse } from 'next/server';
import { getCollections } from '@/lib/mongodb';

export async function GET() {
  try {
    const { tournaments, participants, matches } = await getCollections();
    
    const [activeTournaments, totalParticipants, completedMatches, revenueResult] = await Promise.all([
      tournaments.countDocuments({ status: "active" }),
      participants.countDocuments({}),
      matches.countDocuments({ status: "completed" }),
      tournaments.aggregate([
        {
          $lookup: {
            from: "participants",
            localField: "_id",
            foreignField: "tournamentId",
            as: "participants"
          }
        },
        {
          $project: {
            revenue: { $multiply: ["$entryFee", { $size: "$participants" }] }
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: "$revenue" }
          }
        }
      ]).toArray()
    ]);

    const stats = {
      active: activeTournaments,
      totalParticipants,
      matchesPlayed: completedMatches,
      revenue: revenueResult[0]?.total || 0,
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Get stats error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}
