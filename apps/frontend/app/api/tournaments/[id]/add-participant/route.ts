import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { COLLECTIONS } from '@repo/schemas';
import { getAuthUser } from '@/lib/auth-utils';
import { ObjectId } from 'mongodb';

// Helper function to get authenticated user

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const db = await connectToDatabase();
    const user = await getAuthUser(request);
    const { id: tournamentId } = await params;

    // Check if user is admin
    if (!user || !user.roles?.includes('admin')) {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      );
    }

    const { playerId, isApproved, paymentStatus, category, ageGroups, partnerId } = await request.json();

    console.log('Add participant request:', {
      tournamentId,
      playerId,
      category,
      ageGroups,
      partnerId,
      isApproved,
      paymentStatus
    });

    // Validate input
    if (!playerId) {
      console.log('Validation failed: Player ID is required');
      return NextResponse.json(
        { success: false, error: 'Player ID is required' },
        { status: 400 }
      );
    }

    if (!category) {
      console.log('Validation failed: Category is required');
      return NextResponse.json(
        { success: false, error: 'Category is required' },
        { status: 400 }
      );
    }

    // Check if tournament exists
    const tournament = await db.collection(COLLECTIONS.TOURNAMENTS).findOne({
      _id: new ObjectId(tournamentId)
    });

    if (!tournament) {
      return NextResponse.json(
        { success: false, error: 'Tournament not found' },
        { status: 404 }
      );
    }

    // Check if player exists
    const player = await db.collection(COLLECTIONS.USERS).findOne({
      _id: new ObjectId(playerId)
    });

    if (!player) {
      return NextResponse.json(
        { success: false, error: 'Player not found' },
        { status: 404 }
      );
    }

    // Validate age groups if provided
    if (ageGroups && tournament.ageGroups) {
      const playerAge = player.age;
      
      if (!playerAge) {
        return NextResponse.json(
          { success: false, error: 'Player age is required for age group validation' },
          { status: 400 }
        );
      }

      // Validate multiple age group registration
      if (!tournament.allowMultipleAgeGroups && ageGroups.length > 1) {
        return NextResponse.json(
          { success: false, error: 'This tournament does not allow registration in multiple age groups' },
          { status: 400 }
        );
      }

      // Validate age eligibility for each selected age group
      for (const selectedAgeGroupName of ageGroups) {
        const ageGroup = tournament.ageGroups.find((ag: any) => ag.name === selectedAgeGroupName);
        if (ageGroup) {
          const minAge = ageGroup.minAge;
          const maxAge = ageGroup.maxAge;
          
          if (minAge && playerAge < minAge) {
            return NextResponse.json(
              { success: false, error: `Player is not eligible for age group '${selectedAgeGroupName}'. Age requirement: ${minAge}+` },
              { status: 400 }
            );
          }
          
          if (maxAge && playerAge > maxAge) {
            return NextResponse.json(
              { success: false, error: `Player is not eligible for age group '${selectedAgeGroupName}'. Age requirement: up to ${maxAge}` },
              { status: 400 }
            );
          }
        }
      }
    }

    // Validate partner for doubles/mixed categories
    if ((category === 'doubles' || category === 'mixed') && !partnerId) {
      console.log('Validation failed: Partner is required for doubles/mixed categories');
      return NextResponse.json(
        { success: false, error: 'Partner is required for doubles and mixed doubles' },
        { status: 400 }
      );
    }

    // Check if partner exists and get partner details (if provided)
    let partnerDetails = null;
    if (partnerId) {
      partnerDetails = await db.collection(COLLECTIONS.USERS).findOne({
        _id: new ObjectId(partnerId)
      });

      if (!partnerDetails) {
        console.log('Validation failed: Partner not found');
        return NextResponse.json(
          { success: false, error: 'Partner not found' },
          { status: 404 }
        );
      }
    }

    // Check if player is already registered for this specific category
    const existingParticipant = await db.collection(COLLECTIONS.PARTICIPANTS).findOne({
      tournamentId: new ObjectId(tournamentId),
      userId: new ObjectId(playerId),
      category: category
    });

    if (existingParticipant) {
      console.log(`Player already registered for ${category} category`);
      return NextResponse.json(
        { success: false, error: `Player is already registered for ${category} category in this tournament` },
        { status: 400 }
      );
    }

    // For doubles/mixed doubles, validate partner if provided
    if (partnerId && (category === 'doubles' || category === 'mixed')) {
      const partner = await db.collection(COLLECTIONS.USERS).findOne({
        _id: new ObjectId(partnerId)
      });

      if (!partner) {
        return NextResponse.json(
          { success: false, error: 'Partner not found' },
          { status: 400 }
        );
      }

      // Check if partner is already registered
      const partnerRegistration = await db.collection(COLLECTIONS.PARTICIPANTS).findOne({
        tournamentId: new ObjectId(tournamentId),
        userId: new ObjectId(partnerId)
      });

      if (partnerRegistration) {
        return NextResponse.json(
          { success: false, error: 'Partner is already registered for this tournament' },
          { status: 400 }
        );
      }
    }

    // Check if tournament is full
    const participantCount = await db.collection(COLLECTIONS.PARTICIPANTS).countDocuments({
      tournamentId: new ObjectId(tournamentId),
      isApproved: true
    });

    if (participantCount >= tournament.maxParticipants) {
      return NextResponse.json(
        { success: false, error: 'Tournament is full' },
        { status: 400 }
      );
    }

    // Create participant entry
    const participant = {
      tournamentId: new ObjectId(tournamentId),
      userId: new ObjectId(playerId),
      name: player.name,
      phone: player.phone,
      email: player.email,
      age: player.age,
      gender: player.gender,
      society: player.society,
      block: player.block,
      flatNumber: player.flatNumber,
      category: category || tournament.categories[0] || 'singles',
      ageGroups: ageGroups || [],
      partnerId: partnerId ? new ObjectId(partnerId) : undefined,
      partnerName: partnerDetails ? partnerDetails.name : undefined,
      partnerPhone: partnerDetails ? partnerDetails.phone : undefined,
      partnerAge: partnerDetails ? partnerDetails.age : undefined,
      partnerGender: partnerDetails ? partnerDetails.gender : undefined,
      isApproved: isApproved !== undefined ? isApproved : true,
      paymentStatus: paymentStatus || 'na',
      registeredAt: new Date(),
      addedBy: 'admin',
      addedByUserId: user.userId,
    };

    const result = await db.collection(COLLECTIONS.PARTICIPANTS).insertOne(participant);

    // Create notification for the player
    await db.collection(COLLECTIONS.NOTIFICATIONS).insertOne({
      userId: new ObjectId(playerId),
      type: 'registration_approved',
      title: 'Added to Tournament',
      message: `You have been added to ${tournament.name} by an administrator.`,
      tournamentId: new ObjectId(tournamentId),
      isRead: false,
      createdAt: new Date(),
    });

    return NextResponse.json({
      success: true,
      data: { _id: result.insertedId },
      message: 'Participant added successfully'
    });

  } catch (error) {
    console.error('Error adding participant:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to add participant' },
      { status: 500 }
    );
  }
}

