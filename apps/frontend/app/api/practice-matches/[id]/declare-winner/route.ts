import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { COLLECTIONS } from '@repo/schemas';
import { getAuthUser } from '@/lib/auth-utils';
import { ObjectId } from 'mongodb';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const db = await connectToDatabase();
    const authUser = await getAuthUser(request);
    const { id } = await params;

    if (!authUser) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid match ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { winnerId, reason, completionReason, player1Score, player2Score, games } = body;

    if (!winnerId) {
      return NextResponse.json(
        { success: false, error: 'Winner ID is required' },
        { status: 400 }
      );
    }

    if (!reason) {
      return NextResponse.json(
        { success: false, error: 'Completion reason is required (walkover, forfeit, disqualification, manual, retired)' },
        { status: 400 }
      );
    }

    // Get the match
    const match = await db.collection(COLLECTIONS.MATCHES).findOne({
      _id: new ObjectId(id)
    });

    if (!match) {
      return NextResponse.json(
        { success: false, error: 'Match not found' },
        { status: 404 }
      );
    }

    // Verify it's a practice match
    if (match.matchType !== 'practice') {
      return NextResponse.json(
        { success: false, error: 'This endpoint is only for practice matches' },
        { status: 400 }
      );
    }

    // Determine winner and loser
    // Handle both ObjectId and player name (for guest players)
    const isPlayer1Winner = winnerId === match.player1Id?.toString() || winnerId === match.player1Name;
    const isPlayer3Winner = winnerId === match.player3Id?.toString() || winnerId === match.player3Name;
    const isTeam1Winner = isPlayer1Winner || isPlayer3Winner;
    
    // Set winner name based on category
    let winnerName: string;
    if (match.category === 'singles') {
      winnerName = isPlayer1Winner ? match.player1Name : match.player2Name;
    } else {
      // For doubles/mixed, show team name
      winnerName = isTeam1Winner 
        ? `${match.player1Name} / ${match.player3Name}`
        : `${match.player2Name} / ${match.player4Name}`;
    }

    // Determine if scores were provided
    const hasScores = player1Score && player2Score && player1Score.length > 0;

    // Update match with winner declaration - NEW STRUCTURE
    const updateData: any = {
      status: 'completed',
      winnerTeam: isTeam1Winner ? 'team1' : 'team2',
      winnerIds: match.category === 'singles'
        ? (ObjectId.isValid(winnerId) ? [new ObjectId(winnerId)] : []) // Handle guest players
        : isTeam1Winner
          ? [match.player1Id, match.player3Id].filter(id => id && ObjectId.isValid(id)).map((id: any) => new ObjectId(id))
          : [match.player2Id, match.player4Id].filter(id => id && ObjectId.isValid(id)).map((id: any) => new ObjectId(id)),
      winnerName,
      completedAt: new Date(),
      updatedAt: new Date(),
      completionType: reason, // Set the completion type (walkover, forfeit, disqualification, manual, retired)
      completionReason: completionReason || undefined, // Optional additional details
      lastModifiedBy: new ObjectId(authUser.userId),
    };

    // Handle scores based on completion type and whether scores were provided
    if (hasScores) {
      // User provided scores - use them
      updateData.player1Score = player1Score;
      updateData.player2Score = player2Score;
      
      // Calculate match result from scores
      let player1GamesWon = 0;
      let player2GamesWon = 0;
      
      if (games && games.length > 0) {
        updateData.games = games;
        player1GamesWon = games.filter((g: any) => g.winner === 'player1').length;
        player2GamesWon = games.filter((g: any) => g.winner === 'player2').length;
      } else {
        // Calculate games won from scores array
        for (let i = 0; i < Math.min(player1Score.length, player2Score.length); i++) {
          if (player1Score[i] > player2Score[i]) {
            player1GamesWon++;
          } else if (player2Score[i] > player1Score[i]) {
            player2GamesWon++;
          }
        }
      }
      
      updateData.matchResult = {
        player1GamesWon,
        player2GamesWon,
        completedAt: new Date(),
      };
    } else {
      // No scores provided - leave empty (don't add default [21,0,0])
      // The completion type will indicate why there are no scores
      updateData.player1Score = [];
      updateData.player2Score = [];
    }

    await db.collection(COLLECTIONS.MATCHES).updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );

    // Update practice stats for all players
    await updatePracticeStats(db, { ...match, ...updateData });

    return NextResponse.json({
      success: true,
      message: `Match completed. Winner: ${winnerName}`,
      data: {
        matchId: id,
        winnerTeam: updateData.winnerTeam,
        winnerIds: updateData.winnerIds,
        winnerName,
        completionType: reason,
      }
    });

  } catch (error) {
    console.error('Error declaring winner:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to declare winner' },
      { status: 500 }
    );
  }
}

// Update practice stats helper (same as in score route)
async function updatePracticeStats(db: any, match: any) {
  if (!match.winnerTeam) return;

  const player1Id = match.player1Id;
  const player2Id = match.player2Id;
  const player3Id = match.player3Id;
  const player4Id = match.player4Id;
  const winnerTeam = match.winnerTeam; // 'team1' or 'team2'
  const category = match.category;

  // Build list of all players (including doubles partners)
  const allPlayers = [player1Id, player2Id];
  if (category === 'doubles' || category === 'mixed') {
    if (player3Id) allPlayers.push(player3Id);
    if (player4Id) allPlayers.push(player4Id);
  }

  // Only update stats for registered players (not guests)
  for (const playerId of allPlayers) {
    if (!playerId) continue;

    // Determine if this player won
    // Team 1: player1 + player3, Team 2: player2 + player4
    const isTeam1Player = playerId.toString() === player1Id?.toString() || playerId.toString() === player3Id?.toString();
    const isWinner = (isTeam1Player && winnerTeam === 'team1') || (!isTeam1Player && winnerTeam === 'team2');
    
    const stats = await db.collection(COLLECTIONS.PRACTICE_STATS).findOne({ playerId });

    const player1GamesWon = match.matchResult?.player1GamesWon || 0;
    const player2GamesWon = match.matchResult?.player2GamesWon || 0;
    const gamesWon = isTeam1Player ? player1GamesWon : player2GamesWon;
    const gamesLost = isTeam1Player ? player2GamesWon : player1GamesWon;

    if (!stats) {
      // Create new stats
      const newStats = {
        playerId,
        totalMatches: 1,
        wins: isWinner ? 1 : 0,
        losses: isWinner ? 0 : 1,
        winRate: isWinner ? 100 : 0,
        totalGamesWon: gamesWon,
        totalGamesLost: gamesLost,
        currentStreak: isWinner ? 1 : -1,
        longestStreak: isWinner ? 1 : 0,
        favoriteCategory: category,
        totalPoints: 0,
        averageMatchDuration: match.matchResult?.totalDuration || 0,
        recentForm: [isWinner ? 'W' : 'L'],
        singlesRecord: category === 'singles' ? { played: 1, won: isWinner ? 1 : 0, lost: isWinner ? 0 : 1 } : { played: 0, won: 0, lost: 0 },
        doublesRecord: category === 'doubles' ? { played: 1, won: isWinner ? 1 : 0, lost: isWinner ? 0 : 1 } : { played: 0, won: 0, lost: 0 },
        mixedRecord: category === 'mixed' ? { played: 1, won: isWinner ? 1 : 0, lost: isWinner ? 0 : 1 } : { played: 0, won: 0, lost: 0 },
        updatedAt: new Date(),
      };

      await db.collection(COLLECTIONS.PRACTICE_STATS).insertOne(newStats);
    } else {
      // Update existing stats
      const totalMatches = stats.totalMatches + 1;
      const wins = stats.wins + (isWinner ? 1 : 0);
      const losses = stats.losses + (isWinner ? 0 : 1);
      const winRate = (wins / totalMatches) * 100;

      let currentStreak = stats.currentStreak;
      if (isWinner) {
        currentStreak = currentStreak > 0 ? currentStreak + 1 : 1;
      } else {
        currentStreak = currentStreak < 0 ? currentStreak - 1 : -1;
      }

      const longestStreak = Math.max(stats.longestStreak, currentStreak > 0 ? currentStreak : 0);

      const recentForm = [...stats.recentForm, isWinner ? 'W' : 'L'].slice(-10);

      const categoryRecord = `${category}Record`;
      const updatedCategoryRecord = {
        ...stats[categoryRecord],
        played: stats[categoryRecord].played + 1,
        won: stats[categoryRecord].won + (isWinner ? 1 : 0),
        lost: stats[categoryRecord].lost + (isWinner ? 0 : 1),
      };

      await db.collection(COLLECTIONS.PRACTICE_STATS).updateOne(
        { playerId },
        {
          $set: {
            totalMatches,
            wins,
            losses,
            winRate,
            totalGamesWon: stats.totalGamesWon + gamesWon,
            totalGamesLost: stats.totalGamesLost + gamesLost,
            currentStreak,
            longestStreak,
            recentForm,
            [categoryRecord]: updatedCategoryRecord,
            updatedAt: new Date(),
          }
        }
      );
    }
  }
}

