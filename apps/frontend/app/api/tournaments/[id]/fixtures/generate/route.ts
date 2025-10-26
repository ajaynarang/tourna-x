import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { COLLECTIONS, insertMatchSchema } from '@repo/schemas';
import { getAuthUser } from '@/lib/auth-utils';
import { ObjectId } from 'mongodb';

// Helper function to get authenticated user

// Seeding helpers
function seedParticipants(participants: any[], method: string) {
  if (method === 'random') {
    // Fisher-Yates shuffle for random seeding
    const shuffled = [...participants];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  } else if (method === 'skill') {
    // Sort by skill level (professional > advanced > intermediate > beginner)
    const skillOrder: Record<string, number> = {
      'professional': 4,
      'advanced': 3,
      'intermediate': 2,
      'beginner': 1,
    };
    return [...participants].sort((a, b) => {
      const skillA = skillOrder[a.skillLevel || 'intermediate'] || 2;
      const skillB = skillOrder[b.skillLevel || 'intermediate'] || 2;
      return skillB - skillA; // Higher skill first
    });
  }
  return participants;
}

// Fixture generation algorithms
function generateKnockoutBracket(participants: any[], category: string, seedingMethod: string, ageGroup?: string, startMatchNumber: number = 1) {
  // Seed participants first
  const seededParticipants = seedParticipants(participants, seedingMethod);
  
  const bracketSize = Math.pow(2, Math.ceil(Math.log2(seededParticipants.length)));
  
  // Create all matches with sequential numbering
  const matches = [];
  const totalRounds = Math.log2(bracketSize);
  let globalMatchNumber = startMatchNumber;
  
  // Store match references for progression
  const matchesByRound: any[][] = [];
  
  for (let round = 1; round <= totalRounds; round++) {
    const matchesInRound = bracketSize / Math.pow(2, round);
    matchesByRound[round - 1] = [];
    
    for (let matchInRound = 1; matchInRound <= matchesInRound; matchInRound++) {
      const matchData: any = {
        category,
        ageGroup,
        round: round === totalRounds ? 'Final' : 
               round === totalRounds - 1 ? 'Semi Final' :
               round === totalRounds - 2 ? 'Quarter Final' :
               matchesInRound === 8 ? 'Quarter Final' :
               matchesInRound === 16 ? 'Round of 16' :
               matchesInRound === 32 ? 'Round of 32' :
               `Round ${round}`,
        roundNumber: round,
        matchNumber: globalMatchNumber++,
        matchType: 'tournament',
        player1Id: null,
        player2Id: null,
        player3Id: null,
        player4Id: null,
        player1Name: 'TBD',
        player2Name: 'TBD',
        player3Name: null,
        player4Name: null,
        scoringFormat: {
          pointsPerGame: 21,
          gamesPerMatch: 3,
          winBy: 2,
          maxPoints: 30,
        },
        games: [],
        player1Score: [],
        player2Score: [],
        status: 'scheduled',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      // For first round, assign actual participants
      if (round === 1) {
        const player1Index = matchInRound - 1;
        const player2Index = bracketSize - matchInRound;
        
        if (player1Index < seededParticipants.length) {
          const p1 = seededParticipants[player1Index];
          matchData.player1Id = p1.userId;
          matchData.player1Name = p1.name || 'TBD';
          
          if (category === 'doubles' || category === 'mixed') {
            matchData.player3Id = p1.partnerId || null;
            matchData.player3Name = p1.partnerName || 'TBD';
          }
        }
        
        if (player2Index < seededParticipants.length) {
          const p2 = seededParticipants[player2Index];
          matchData.player2Id = p2.userId;
          matchData.player2Name = p2.name || 'TBD';
          
          if (category === 'doubles' || category === 'mixed') {
            matchData.player4Id = p2.partnerId || null;
            matchData.player4Name = p2.partnerName || 'TBD';
          }
        }
        
        // NEW: Populate team arrays
        if (category === 'singles') {
          matchData.team1PlayerIds = matchData.player1Id ? [matchData.player1Id] : [];
          matchData.team2PlayerIds = matchData.player2Id ? [matchData.player2Id] : [];
        } else {
          matchData.team1PlayerIds = [matchData.player1Id, matchData.player3Id].filter(Boolean);
          matchData.team2PlayerIds = [matchData.player2Id, matchData.player4Id].filter(Boolean);
        }
        
        // BYE LOGIC: Only in first round when one slot is empty (odd number of players)
        // Player gets automatic bye - no match needed, just advances
        if (round === 1 && matchData.player1Name !== 'TBD' && matchData.player2Name === 'TBD') {
          // Player 1 gets bye (no opponent)
          matchData.status = 'completed';
          matchData.winnerTeam = 'team1';
          matchData.winnerIds = matchData.team1PlayerIds;
          matchData.winnerName = matchData.player1Name;
          matchData.player1Score = []; // No score for bye
          matchData.player2Score = [];
          matchData.completionType = 'walkover';
          matchData.completionReason = 'Bye - no opponent';
        } else if (round === 1 && matchData.player2Name !== 'TBD' && matchData.player1Name === 'TBD') {
          // Player 2 gets bye (no opponent)
          matchData.status = 'completed';
          matchData.winnerTeam = 'team2';
          matchData.winnerIds = matchData.team2PlayerIds;
          matchData.winnerName = matchData.player2Name;
          matchData.player1Score = [];
          matchData.player2Score = [];
          matchData.completionType = 'walkover';
          matchData.completionReason = 'Bye - no opponent';
        }
      }
      
      matchesByRound[round - 1]?.push(matchData);
      matches.push(matchData);
    }
  }
  
  // AUTO-ADVANCE BYE WINNERS TO NEXT ROUND
  // Only advance players who got first-round byes
  for (let round = 0; round < totalRounds - 1; round++) {
    const currentRoundMatches = matchesByRound[round];
    const nextRoundMatches = matchesByRound[round + 1];
    
    if (!currentRoundMatches || !nextRoundMatches) continue;
    
    currentRoundMatches.forEach((match: any, matchIndex: number) => {
      // Only advance if it's a bye (not a walkover from organizer)
      if (match.isBye && match.winnerId) {
        // Find which match in next round this winner goes to
        const nextMatchIndex = Math.floor(matchIndex / 2);
        const nextMatch = nextRoundMatches[nextMatchIndex];
        
        if (nextMatch) {
          // Determine if winner goes to player1 or player2 position
          if (matchIndex % 2 === 0) {
            // Even index -> player1 position
            nextMatch.player1Id = match.winnerId;
            nextMatch.player1Name = match.winnerName;
            if (match.category === 'doubles' || match.category === 'mixed') {
              nextMatch.player3Id = match.winnerId === match.player1Id ? match.player3Id : match.player4Id;
              nextMatch.player3Name = match.winnerId === match.player1Id ? match.player3Name : match.player4Name;
            }
          } else {
            // Odd index -> player2 position
            nextMatch.player2Id = match.winnerId;
            nextMatch.player2Name = match.winnerName;
            if (match.category === 'doubles' || match.category === 'mixed') {
              nextMatch.player4Id = match.winnerId === match.player1Id ? match.player3Id : match.player4Id;
              nextMatch.player4Name = match.winnerId === match.player1Id ? match.player3Name : match.player4Name;
            }
          }
          
          // Note: We do NOT auto-complete the next match
          // Organizer must conduct it or declare winner manually
        }
      }
    });
  }
  
  return matches;
}

function generateRoundRobin(participants: any[], category: string, ageGroup?: string, startMatchNumber: number = 1) {
  const matches = [];
  const n = participants.length;
  let matchNumber = startMatchNumber;
  
  // Generate all vs all matches
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const matchData: any = {
        category,
        ageGroup,
        round: 'Group Stage',
        roundNumber: 1,
        matchNumber: matchNumber++,
        player1Id: participants[i].userId,
        player2Id: participants[j].userId,
        player3Id: null,
        player4Id: null,
        player1Name: participants[i].name || 'TBD',
        player2Name: participants[j].name || 'TBD',
        player3Name: null,
        player4Name: null,
        // Flexible scoring system
        scoringFormat: {
          pointsPerGame: 21,
          gamesPerMatch: 3,
          winBy: 2,
          maxPoints: 30,
        },
        games: [],
        player1Score: [],
        player2Score: [],
        status: 'scheduled',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      // For doubles/mixed, add partner info
      if (category === 'doubles' || category === 'mixed') {
        matchData.player3Id = participants[i].partnerId || null;
        matchData.player3Name = participants[i].partnerName || 'TBD';
        matchData.player4Id = participants[j].partnerId || null;
        matchData.player4Name = participants[j].partnerName || 'TBD';
      }
      
      // NEW: Populate team arrays
      if (category === 'singles') {
        matchData.team1PlayerIds = [matchData.player1Id];
        matchData.team2PlayerIds = [matchData.player2Id];
      } else {
        matchData.team1PlayerIds = [matchData.player1Id, matchData.player3Id].filter(Boolean);
        matchData.team2PlayerIds = [matchData.player2Id, matchData.player4Id].filter(Boolean);
      }
      
      matches.push(matchData);
    }
  }
  
  return matches;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const db = await connectToDatabase();
    const user = await getAuthUser(request);
    const { id } = await params;
    
    // Get configuration from request body
    const body = await request.json().catch(() => ({}));
    const config = {
      seedingMethod: body.seedingMethod || 'skill',
      groupByCategory: true, // ALWAYS separate by category
      groupByAgeGroup: body.groupByAgeGroup !== false,
    };

    if (!user || !user.roles?.includes('admin')) {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      );
    }

    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid tournament ID' },
        { status: 400 }
      );
    }

    // Get tournament details
    const tournament = await db.collection(COLLECTIONS.TOURNAMENTS).findOne({
      _id: new ObjectId(id)
    });

    if (!tournament) {
      return NextResponse.json(
        { success: false, error: 'Tournament not found' },
        { status: 404 }
      );
    }

    // Get approved participants with user details
    const participants = await db.collection(COLLECTIONS.PARTICIPANTS)
      .aggregate([
        {
          $match: {
            tournamentId: new ObjectId(id),
            isApproved: true
          }
        },
        {
          $lookup: {
            from: COLLECTIONS.USERS,
            localField: 'userId',
            foreignField: '_id',
            as: 'userDetails'
          }
        },
        {
          $unwind: {
            path: '$userDetails',
            preserveNullAndEmptyArrays: true
          }
        },
        {
          $project: {
            userId: 1,
            category: 1,
            gender: 1,
            ageGroup: 1,
            skillLevel: 1,
            partnerName: 1,
            partnerId: 1,
            name: { $ifNull: ['$userDetails.name', 'Unknown Player'] },
            phone: { $ifNull: ['$userDetails.phone', ''] }
          }
        }
      ])
      .toArray();

    console.log('Participants fetched for fixture generation:', participants.length, 'with config:', config);

    if (participants.length < 2) {
      return NextResponse.json(
        { success: false, error: 'At least 2 approved participants required' },
        { status: 400 }
      );
    }

    // Clear existing matches
    await db.collection(COLLECTIONS.MATCHES).deleteMany({
      tournamentId: new ObjectId(id)
    });

    // Group participants based on configuration
    const groupedParticipants: Record<string, any[]> = {};
    
    participants.forEach(participant => {
      let key = 'all';
      
      if (config.groupByCategory && config.groupByAgeGroup) {
        key = `${participant.category}-${participant.ageGroup || 'open'}`;
      } else if (config.groupByCategory) {
        key = participant.category;
      } else if (config.groupByAgeGroup) {
        key = participant.ageGroup || 'open';
      }
      
      if (!groupedParticipants[key]) {
        groupedParticipants[key] = [];
      }
      groupedParticipants[key]!.push(participant);
    });

    // Generate fixtures for each group with sequential match numbering
    const allMatches = [];
    let globalMatchNumber = 1;
    
    // Sort groups for consistent ordering (singles, doubles, mixed)
    const sortedGroups = Object.entries(groupedParticipants).sort((a, b) => {
      const categoryOrder: Record<string, number> = { 'singles': 1, 'doubles': 2, 'mixed': 3 };
      const catA = a[0].split('-')[0] || '';
      const catB = b[0].split('-')[0] || '';
      return (categoryOrder[catA] || 99) - (categoryOrder[catB] || 99);
    });
    
    for (const [key, groupParticipants] of sortedGroups) {
      // Parse the key to get category and age group
      let category = groupParticipants[0]?.category || 'singles';
      let ageGroup = '';
      
      if (key.includes('-')) {
        const parts = key.split('-');
        category = parts[0] || 'singles';
        ageGroup = parts[1] || '';
      } else if (config.groupByCategory) {
        category = key;
      } else if (config.groupByAgeGroup) {
        ageGroup = key;
      }
      
      let matches;
      if (tournament.format === 'knockout') {
        matches = generateKnockoutBracket(
          groupParticipants, 
          category || '', 
          config.seedingMethod,
          ageGroup === 'open' ? '' : (ageGroup || ''),
          globalMatchNumber
        );
      } else {
        matches = generateRoundRobin(
          groupParticipants, 
          category || '', 
          ageGroup === 'open' ? '' : (ageGroup || ''),
          globalMatchNumber
        );
      }
      
      // Update global match number for next group
      globalMatchNumber += matches.length;
      
      // Add tournament ID to each match
      matches.forEach((match: any) => {
        match.tournamentId = new ObjectId(id);
      });
      
      allMatches.push(...matches);
    }

    // Insert all matches
    if (allMatches.length > 0) {
      await db.collection(COLLECTIONS.MATCHES).insertMany(allMatches);
    }

    // Update tournament status
    await db.collection(COLLECTIONS.TOURNAMENTS).updateOne(
      { _id: new ObjectId(id) },
      { 
        $set: { 
          status: 'ongoing',
          updatedAt: new Date()
        } 
      }
    );

    return NextResponse.json({
      success: true,
      message: `Generated ${allMatches.length} matches successfully`,
      matchesCreated: allMatches.length,
      data: { 
        matchCount: allMatches.length,
        groups: Object.keys(groupedParticipants).length,
        seedingMethod: config.seedingMethod
      }
    });

  } catch (error) {
    console.error('Error generating fixtures:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate fixtures' },
      { status: 500 }
    );
  }
}
