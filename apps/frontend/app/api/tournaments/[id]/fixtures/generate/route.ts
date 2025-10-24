import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { COLLECTIONS, insertMatchSchema } from '@repo/schemas';
import { ObjectId } from 'mongodb';

// Helper function to get authenticated user
async function getAuthenticatedUser(request: NextRequest) {
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

  return user;
}

// Fixture generation algorithms
function generateKnockoutBracket(participants: any[], category: string, ageGroup?: string) {
  const bracketSize = Math.pow(2, Math.ceil(Math.log2(participants.length)));
  const byes = bracketSize - participants.length;
  
  // Create first round matches
  const matches = [];
  const totalRounds = Math.log2(bracketSize);
  
  for (let round = 1; round <= totalRounds; round++) {
    const matchesInRound = bracketSize / Math.pow(2, round);
    
    for (let match = 1; match <= matchesInRound; match++) {
      const matchData = {
        category,
        ageGroup,
        round: round === totalRounds ? 'Final' : 
               round === totalRounds - 1 ? 'Semi Final' :
               round === totalRounds - 2 ? 'Quarter Final' :
               `Round of ${bracketSize / Math.pow(2, round)}`,
        roundNumber: round,
        matchNumber: match,
        player1Id: null,
        player2Id: null,
        player1Name: 'TBD',
        player2Name: 'TBD',
        player1Score: [],
        player2Score: [],
        status: 'scheduled',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      // For first round, assign actual participants
      if (round === 1) {
        const player1Index = match - 1;
        const player2Index = bracketSize - match;
        
        if (player1Index < participants.length) {
          matchData.player1Id = participants[player1Index].userId;
          matchData.player1Name = participants[player1Index].name;
        }
        
        if (player2Index < participants.length) {
          matchData.player2Id = participants[player2Index].userId;
          matchData.player2Name = participants[player2Index].name;
        }
      }
      
      matches.push(matchData);
    }
  }
  
  return matches;
}

function generateRoundRobin(participants: any[], category: string, ageGroup?: string) {
  const matches = [];
  const n = participants.length;
  
  // Generate all vs all matches
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      matches.push({
        category,
        ageGroup,
        round: 'Group Stage',
        roundNumber: 1,
        matchNumber: matches.length + 1,
        player1Id: participants[i].userId,
        player2Id: participants[j].userId,
        player1Name: participants[i].name,
        player2Name: participants[j].name,
        player1Score: [],
        player2Score: [],
        status: 'scheduled',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
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
    const user = await getAuthenticatedUser(request);
    const { id } = await params;

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

    // Get approved participants grouped by category and age group
    const participants = await db.collection(COLLECTIONS.PARTICIPANTS).find({
      tournamentId: new ObjectId(id),
      isApproved: true
    }).toArray();

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

    // Group participants by category and age group
    const groupedParticipants: Record<string, any[]> = {};
    
    participants.forEach(participant => {
      const key = `${participant.category}-${participant.ageGroup || 'open'}`;
      if (!groupedParticipants[key]) {
        groupedParticipants[key] = [];
      }
      groupedParticipants[key].push(participant);
    });

    // Generate fixtures for each group
    const allMatches = [];
    
    for (const [key, groupParticipants] of Object.entries(groupedParticipants)) {
      const [category, ageGroup] = key.split('-');
      
      let matches;
      if (tournament.format === 'knockout') {
        matches = generateKnockoutBracket(groupParticipants, category, ageGroup === 'open' ? undefined : ageGroup);
      } else {
        matches = generateRoundRobin(groupParticipants, category, ageGroup === 'open' ? undefined : ageGroup);
      }
      
      // Add tournament ID to each match
      matches.forEach(match => {
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
      data: { matchCount: allMatches.length }
    });

  } catch (error) {
    console.error('Error generating fixtures:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate fixtures' },
      { status: 500 }
    );
  }
}
