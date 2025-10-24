import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { COLLECTIONS, insertParticipantSchema } from '@repo/schemas';
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

    // Check if user already registered for this tournament
    const existingRegistration = await db.collection(COLLECTIONS.PARTICIPANTS).findOne({
      tournamentId: new ObjectId(id),
      userId: user._id
    });

    if (existingRegistration) {
      return NextResponse.json(
        { success: false, error: 'You are already registered for this tournament' },
        { status: 400 }
      );
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
      isEligible = user.society === tournament.allowedSociety;
    }

    // Validate registration data
    const validatedData = insertParticipantSchema.parse({
      tournamentId: new ObjectId(id),
      userId: user._id,
      name: registrationData.name || user.name,
      phone: registrationData.phone || user.phone,
      email: registrationData.email || user.email,
      age: registrationData.age || user.age,
      gender: registrationData.gender || user.gender,
      society: registrationData.society || user.society,
      block: registrationData.block || user.block,
      flatNumber: registrationData.flatNumber || user.flatNumber,
      category: registrationData.category,
      ageGroup: registrationData.ageGroup,
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
