import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { COLLECTIONS, insertParticipantSchema, validateAgeGroupEligibility, validateMultipleAgeGroupRegistration } from '@repo/schemas';
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
    const { id } = await params;

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
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

    // Check if registration is open
    if (tournament.status !== 'registration_open') {
      return NextResponse.json(
        { success: false, error: 'Registration is not open for this tournament' },
        { status: 400 }
      );
    }

    // Check registration deadline
    if (tournament.registrationDeadline && new Date() > tournament.registrationDeadline) {
      return NextResponse.json(
        { success: false, error: 'Registration deadline has passed' },
        { status: 400 }
      );
    }

    const registrationData = await request.json();

    // Validate category is supported by tournament
    if (!tournament.categories || !tournament.categories.includes(registrationData.category)) {
      return NextResponse.json(
        { success: false, error: `Category '${registrationData.category}' is not supported by this tournament. Supported categories: ${tournament.categories?.join(', ') || 'none'}` },
        { status: 400 }
      );
    }

    // Validate age groups if provided
    if (registrationData.ageGroups && tournament.ageGroups) {
      const participantAge = registrationData.age || (user as any).age;
      
      if (!participantAge) {
        return NextResponse.json(
          { success: false, error: 'Age is required for age group validation' },
          { status: 400 }
        );
      }

      // Validate multiple age group registration
      const multipleValidation = validateMultipleAgeGroupRegistration(registrationData.ageGroups, tournament.allowMultipleAgeGroups, tournament.ageGroups);
      if (!multipleValidation.isValid) {
        return NextResponse.json(
          { success: false, error: multipleValidation.error },
          { status: 400 }
        );
      }

      // Validate age eligibility for each selected age group
      for (const selectedAgeGroupName of registrationData.ageGroups) {
        const ageGroup = tournament.ageGroups.find((ag: any) => ag.name === selectedAgeGroupName);
        if (ageGroup && !validateAgeGroupEligibility(participantAge, ageGroup)) {
          return NextResponse.json(
            { success: false, error: `You are not eligible for age group '${selectedAgeGroupName}'. Age requirement: ${ageGroup.minAge ? `${ageGroup.minAge}+` : ''}${ageGroup.maxAge ? ` and ${ageGroup.maxAge}-` : ''}` },
            { status: 400 }
          );
        }
      }
    }

    // Check if user already registered for this tournament
    const existingRegistration = await db.collection(COLLECTIONS.PARTICIPANTS).findOne({
      tournamentId: new ObjectId(id),
      userId: user.userId
    });

    if (existingRegistration) {
      return NextResponse.json(
        { success: false, error: 'You are already registered for this tournament' },
        { status: 400 }
      );
    }

    // For doubles/mixed doubles, validate partner requirements
    if (registrationData.category === 'doubles' || registrationData.category === 'mixed') {
      // Check if partner is provided
      if (!registrationData.partnerId && !registrationData.partnerName) {
        return NextResponse.json(
          { success: false, error: 'Partner information is required for doubles/mixed doubles' },
          { status: 400 }
        );
      }

      // If partnerId is provided, validate partner exists and check for duplicate enrollment
      if (registrationData.partnerId) {
        const partner = await db.collection(COLLECTIONS.USERS).findOne({
          _id: new ObjectId(registrationData.partnerId)
        });

        if (!partner) {
          return NextResponse.json(
            { success: false, error: 'Partner not found' },
            { status: 400 }
          );
        }

        // Check if partner is already registered for this tournament
        const partnerRegistration = await db.collection(COLLECTIONS.PARTICIPANTS).findOne({
          tournamentId: new ObjectId(id),
          userId: new ObjectId(registrationData.partnerId)
        });

        if (partnerRegistration) {
          return NextResponse.json(
            { success: false, error: 'Your partner is already registered for this tournament' },
            { status: 400 }
          );
        }

        // Check if partner is already paired with someone else for doubles/mixed
        const existingPairing = await db.collection(COLLECTIONS.PARTICIPANTS).findOne({
          tournamentId: new ObjectId(id),
          partnerId: new ObjectId(registrationData.partnerId),
          category: { $in: ['doubles', 'mixed'] }
        });

        if (existingPairing) {
          return NextResponse.json(
            { success: false, error: 'Your partner is already paired with another player for this tournament' },
            { status: 400 }
          );
        }

        // For mixed doubles, validate gender requirements
        if (registrationData.category === 'mixed') {
          const userGender = (user as any).gender;
          const partnerGender = partner.gender;
          
          if (!userGender || !partnerGender) {
            return NextResponse.json(
              { success: false, error: 'Both players must have gender specified for mixed doubles' },
              { status: 400 }
            );
          }

          if (userGender === partnerGender) {
            return NextResponse.json(
              { success: false, error: 'Mixed doubles requires players of different genders' },
              { status: 400 }
            );
          }
        }
      }
    }

    // Check max participants
    const currentParticipants = await db.collection(COLLECTIONS.PARTICIPANTS).countDocuments({
      tournamentId: new ObjectId(id),
      isApproved: true
    });

    if (currentParticipants >= tournament.maxParticipants) {
      return NextResponse.json(
        { success: false, error: 'Tournament is full' },
        { status: 400 }
      );
    }

    // Check society eligibility for society-only tournaments
    let isEligible = true;
    if (tournament.tournamentType === 'society_only' && tournament.allowedSociety) {
      isEligible = (user as any).society === tournament.allowedSociety;
    }

    // Validate registration data
    const validatedData = insertParticipantSchema.parse({
      tournamentId: new ObjectId(id),
      userId: user.userId,
      name: registrationData.name || user.name,
      phone: registrationData.phone || user.phone,
      email: registrationData.email || user.email,
      age: registrationData.age || (user as any).age,
      gender: registrationData.gender || (user as any).gender,
      society: registrationData.society || (user as any).society,
      block: registrationData.block || (user as any).block,
      flatNumber: registrationData.flatNumber || (user as any).flatNumber,
      category: registrationData.category,
      ageGroups: registrationData.ageGroups || [],
      partnerId: registrationData.partnerId ? new ObjectId(registrationData.partnerId) : undefined,
      partnerName: registrationData.partnerName,
      partnerPhone: registrationData.partnerPhone,
      partnerAge: registrationData.partnerAge,
      partnerGender: registrationData.partnerGender,
      paymentStatus: 'pending',
      paymentMethod: registrationData.paymentMethod,
      transactionId: registrationData.transactionId,
      isApproved: false,
      isEligible,
      registeredAt: new Date(),
    });

    const result = await db.collection(COLLECTIONS.PARTICIPANTS).insertOne(validatedData);

    // Update tournament participant count
    await db.collection(COLLECTIONS.TOURNAMENTS).updateOne(
      { _id: new ObjectId(id) },
      { $inc: { participantCount: 1 } }
    );

    return NextResponse.json({
      success: true,
      data: { _id: result.insertedId },
      message: 'Registration submitted successfully. Waiting for admin approval.'
    });

  } catch (error) {
    console.error('Error registering participant:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to register for tournament' },
      { status: 500 }
    );
  }
}
