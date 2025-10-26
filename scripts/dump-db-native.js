#!/usr/bin/env node

/**
 * MongoDB Database Dump Script (Native Node.js)
 * 
 * This script creates a local backup of the MongoDB database using the native MongoDB driver.
 * No external tools (mongodump) required!
 * 
 * Usage:
 *   pnpm dump-db-native              # Dump with default settings
 *   pnpm dump-db-native --name=prod  # Dump with custom name
 */

const { MongoClient } = require('mongodb');
const { existsSync, mkdirSync, writeFileSync } = require('fs');
const { join } = require('path');
const { createGzip } = require('zlib');
const { createWriteStream } = require('fs');
const { pipeline } = require('stream/promises');
require('dotenv/config');

// Load environment variables
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const MONGODB_DATABASE = process.env.MONGODB_DATABASE || 'tourna-x';

// Parse command line arguments
const args = process.argv.slice(2);
const customName = args.find(arg => arg.startsWith('--name='))?.split('=')[1];

// Generate timestamp
const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0] + '_' + 
                  new Date().toISOString().replace(/[:.]/g, '-').split('T')[1].split('Z')[0];

// Create backup directory name
const backupName = customName 
  ? `${customName}_${timestamp}` 
  : `backup_${timestamp}`;

const backupDir = join(process.cwd(), 'backups', backupName);

// Ensure backups directory exists
const backupsRoot = join(process.cwd(), 'backups');
if (!existsSync(backupsRoot)) {
  mkdirSync(backupsRoot, { recursive: true });
  console.log('📁 Created backups directory');
}

if (!existsSync(backupDir)) {
  mkdirSync(backupDir, { recursive: true });
}

console.log('🚀 Starting MongoDB dump (native)...');
console.log(`📊 Database: ${MONGODB_DATABASE}`);
console.log(`📂 Output: ${backupDir}`);
console.log('');

async function dumpDatabase() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db(MONGODB_DATABASE);
    
    // Get all collections
    const collections = await db.listCollections().toArray();
    console.log(`📋 Found ${collections.length} collections`);
    console.log('');
    
    const metadata = {
      database: MONGODB_DATABASE,
      timestamp: new Date().toISOString(),
      collections: []
    };
    
    // Dump each collection
    for (const collectionInfo of collections) {
      const collectionName = collectionInfo.name;
      console.log(`⏳ Dumping collection: ${collectionName}`);
      
      const collection = db.collection(collectionName);
      
      // Get all documents
      const documents = await collection.find({}).toArray();
      console.log(`   Found ${documents.length} documents`);
      
      // Get indexes
      const indexes = await collection.indexes();
      
      // Save collection data
      const collectionData = {
        name: collectionName,
        documents: documents,
        indexes: indexes,
        count: documents.length
      };
      
      // Write to file (with compression)
      const outputFile = join(backupDir, `${collectionName}.json.gz`);
      const gzip = createGzip();
      const source = JSON.stringify(collectionData, null, 2);
      const destination = createWriteStream(outputFile);
      
      await pipeline(
        async function* () {
          yield Buffer.from(source);
        },
        gzip,
        destination
      );
      
      console.log(`   ✓ Saved to ${collectionName}.json.gz`);
      
      metadata.collections.push({
        name: collectionName,
        count: documents.length,
        indexes: indexes.length
      });
    }
    
    // Save metadata
    const metadataFile = join(backupDir, 'metadata.json');
    writeFileSync(metadataFile, JSON.stringify(metadata, null, 2));
    console.log('');
    console.log('✅ Metadata saved');
    
    console.log('');
    console.log('✅ Database dump completed successfully!');
    console.log(`📦 Backup saved to: ${backupDir}`);
    console.log('');
    console.log('To restore this backup, run:');
    console.log(`  pnpm restore-db-native ${backupName}`);
    console.log('');
    
  } catch (error) {
    console.error('❌ Error during database dump:', error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

dumpDatabase();

