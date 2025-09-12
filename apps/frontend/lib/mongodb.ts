import { MongoClient, Db } from 'mongodb';
import { COLLECTIONS } from '@repo/schemas';

let client: MongoClient;
let db: Db;

export async function connectToDatabase(): Promise<Db> {
  if (db) {
    return db;
  }

  if (!process.env.MONGODB_URI) {
    throw new Error(
      "MONGODB_URI must be set. Did you forget to configure MongoDB connection?",
    );
  }

  const databaseName = process.env.MONGODB_DATABASE || 'tourna-x';

  try {
    client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    db = client.db(databaseName);
    
    // Create indexes for better performance
    await createIndexes();
    
    console.log(`Connected to MongoDB database: ${databaseName}`);
    return db;
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
    throw error;
  }
}

async function createIndexes(): Promise<void> {
  try {
    // Create indexes for users collection
    await db.collection(COLLECTIONS.USERS).createIndex({ email: 1 }, { unique: true, sparse: true });
    await db.collection(COLLECTIONS.USERS).createIndex({ phone: 1 }, { unique: true });
    await db.collection(COLLECTIONS.USERS).createIndex({ role: 1 });
    
    // Create indexes for tournaments collection
    await db.collection(COLLECTIONS.TOURNAMENTS).createIndex({ createdBy: 1 });
    await db.collection(COLLECTIONS.TOURNAMENTS).createIndex({ status: 1 });
    await db.collection(COLLECTIONS.TOURNAMENTS).createIndex({ sport: 1 });
    await db.collection(COLLECTIONS.TOURNAMENTS).createIndex({ createdAt: -1 });
    await db.collection(COLLECTIONS.TOURNAMENTS).createIndex({ isPublished: 1 });
    
    // Create indexes for participants collection
    await db.collection(COLLECTIONS.PARTICIPANTS).createIndex({ tournamentId: 1 });
    await db.collection(COLLECTIONS.PARTICIPANTS).createIndex({ userId: 1 });
    await db.collection(COLLECTIONS.PARTICIPANTS).createIndex({ registeredAt: -1 });
    
    // Create indexes for matches collection
    await db.collection(COLLECTIONS.MATCHES).createIndex({ tournamentId: 1 });
    await db.collection(COLLECTIONS.MATCHES).createIndex({ roundNumber: 1 });
    await db.collection(COLLECTIONS.MATCHES).createIndex({ status: 1 });
    await db.collection(COLLECTIONS.MATCHES).createIndex({ createdAt: -1 });
    
    // Create indexes for whatsapp_groups collection
    await db.collection(COLLECTIONS.WHATSAPP_GROUPS).createIndex({ sport: 1 });
    await db.collection(COLLECTIONS.WHATSAPP_GROUPS).createIndex({ location: 1 });
    await db.collection(COLLECTIONS.WHATSAPP_GROUPS).createIndex({ isActive: 1 });
    await db.collection(COLLECTIONS.WHATSAPP_GROUPS).createIndex({ memberCount: -1 });
    
    // Create indexes for otps collection
    await db.collection(COLLECTIONS.OTPS).createIndex({ phone: 1 });
    await db.collection(COLLECTIONS.OTPS).createIndex({ expiresAt: 1 });
    await db.collection(COLLECTIONS.OTPS).createIndex({ createdAt: -1 });
    
    console.log('Database indexes created successfully');
  } catch (error) {
    console.error('Failed to create indexes:', error);
    // Don't throw error here as indexes might already exist
  }
}

export async function getDatabase(): Promise<Db> {
  if (!db) {
    await connectToDatabase();
  }
  return db;
}

export async function getCollections() {
  const database = await getDatabase();
  return {
    users: database.collection(COLLECTIONS.USERS),
    tournaments: database.collection(COLLECTIONS.TOURNAMENTS),
    participants: database.collection(COLLECTIONS.PARTICIPANTS),
    matches: database.collection(COLLECTIONS.MATCHES),
    whatsappGroups: database.collection(COLLECTIONS.WHATSAPP_GROUPS),
    otps: database.collection(COLLECTIONS.OTPS),
  };
}
