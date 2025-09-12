import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { COLLECTIONS } from '@repo/schemas';
import bcrypt from 'bcrypt';

// DELETE - Clear all data
export async function DELETE(request: NextRequest) {
  try {
    const db = await connectToDatabase();
    
    // Clear all collections
    await Promise.all([
      db.collection(COLLECTIONS.USERS).deleteMany({}),
      db.collection(COLLECTIONS.TOURNAMENTS).deleteMany({}),
      db.collection(COLLECTIONS.PARTICIPANTS).deleteMany({}),
      db.collection(COLLECTIONS.MATCHES).deleteMany({}),
      db.collection(COLLECTIONS.OTPS).deleteMany({}),
    ]);

    return NextResponse.json({ 
      success: true, 
      message: 'Database cleared successfully' 
    });

  } catch (error) {
    console.error('Database clear error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to clear database' },
      { status: 500 }
    );
  }
}

// POST - Initialize database with sample data
export async function POST(request: NextRequest) {
  try {
    const db = await connectToDatabase();
    
    // Create admin user (with both admin and player roles)
    const adminUser = {
      username: 'admin',
      password: await bcrypt.hash('admin123', 10),
      roles: ['admin', 'player'], // Admin can also be a player
      name: 'Admin User',
      email: 'admin@tourna-x.com',
      phone: '+919876543210',
      age: 30,
      gender: 'male',
      society: 'Green Valley Apartments',
      block: 'Block A',
      flatNumber: '101',
      createdAt: new Date(),
    };

    // Create sample player user
    const playerUser = {
      name: 'John Player',
      phone: '+919876543211',
      email: 'player@example.com',
      roles: ['player'],
      age: 25,
      gender: 'male',
      society: 'Green Valley Apartments',
      block: 'Block B',
      flatNumber: '202',
      createdAt: new Date(),
    };

    // Insert users
    const adminResult = await db.collection(COLLECTIONS.USERS).insertOne(adminUser);
    const playerResult = await db.collection(COLLECTIONS.USERS).insertOne(playerUser);
    const adminUserId = adminResult.insertedId;

    // Create sample tournaments
    const sampleTournaments = [
      {
        name: 'Spring Badminton Championship',
        sport: 'badminton',
        categories: ['singles', 'doubles'],
        ageGroups: ['U-18', 'U-25', 'Open'],
        format: 'knockout',
        startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
        venue: 'Sports Complex, Mumbai',
        location: 'Sports Complex, Mumbai',
        entryFee: 500,
        maxParticipants: 32,
        rules: 'Standard badminton rules apply. Best of 3 sets, 21 points per set.',
        prizes: {
          winner: 5000,
          runnerUp: 3000,
          semiFinalist: 1500,
        },
        tournamentType: 'open',
        status: 'registration_open',
        isPublished: true,
        createdBy: adminUserId,
        createdAt: new Date(),
      },
      {
        name: 'Society Tennis Tournament',
        sport: 'tennis',
        categories: ['singles', 'doubles'],
        ageGroups: ['U-21', 'Open'],
        format: 'round_robin',
        startDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
        endDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000), // 21 days from now
        venue: 'Tennis Court, Green Valley',
        location: 'Green Valley Apartments',
        entryFee: 300,
        maxParticipants: 16,
        rules: 'Standard tennis rules. Best of 3 sets, 6 games per set.',
        prizes: {
          winner: 3000,
          runnerUp: 2000,
          semiFinalist: 1000,
        },
        tournamentType: 'society_only',
        allowedSociety: 'Green Valley Apartments',
        status: 'published',
        isPublished: true,
        createdBy: adminUserId,
        createdAt: new Date(),
      }
    ];

    await db.collection(COLLECTIONS.TOURNAMENTS).insertMany(sampleTournaments);

    return NextResponse.json({ 
      success: true, 
      message: 'Database initialized successfully with admin user (dual role), player user, and 2 sample tournaments' 
    });

  } catch (error) {
    console.error('Database initialization error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to initialize database' },
      { status: 500 }
    );
  }
}