import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { COLLECTIONS } from '@repo/schemas';

export async function GET() {
  try {
    const db = await connectToDatabase();
    const tournaments = await db.collection(COLLECTIONS.TOURNAMENTS).find({}).toArray();
    return NextResponse.json(tournaments);
  } catch (error) {
    console.error('Error fetching tournaments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tournaments' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const db = await connectToDatabase();
    const tournamentData = await request.json();
    
    const result = await db.collection(COLLECTIONS.TOURNAMENTS).insertOne({
      ...tournamentData,
      createdAt: new Date(),
    });
    
    return NextResponse.json({ 
      success: true, 
      id: result.insertedId,
      message: 'Tournament created successfully' 
    });
  } catch (error) {
    console.error('Error creating tournament:', error);
    return NextResponse.json(
      { error: 'Failed to create tournament' },
      { status: 500 }
    );
  }
}