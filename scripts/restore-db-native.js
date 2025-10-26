#!/usr/bin/env node

/**
 * MongoDB Database Restore Script (Native Node.js)
 * 
 * This script restores a MongoDB database from a backup created by dump-db-native.js
 * No external tools (mongorestore) required!
 * 
 * Usage:
 *   pnpm restore-db-native <backup-name>
 *   pnpm restore-db-native backup_2025-10-26_10-30-45
 */

const { MongoClient } = require('mongodb');
const { existsSync, readdirSync, readFileSync, createReadStream } = require('fs');
const { join } = require('path');
const { createGunzip } = require('zlib');
const { pipeline } = require('stream/promises');
require('dotenv/config');

// Load environment variables
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const MONGODB_DATABASE = process.env.MONGODB_DATABASE || 'tourna-x';

// Parse command line arguments
const args = process.argv.slice(2);
const backupName = args[0];

if (!backupName) {
  console.error('❌ Error: Please provide a backup name');
  console.error('');
  console.error('Usage: pnpm restore-db-native <backup-name>');
  console.error('');
  
  // List available backups
  const backupsRoot = join(process.cwd(), 'backups');
  if (existsSync(backupsRoot)) {
    const backups = readdirSync(backupsRoot);
    if (backups.length > 0) {
      console.log('Available backups:');
      backups.forEach(backup => {
        const metadataPath = join(backupsRoot, backup, 'metadata.json');
        if (existsSync(metadataPath)) {
          const metadata = JSON.parse(readFileSync(metadataPath, 'utf8'));
          console.log(`  - ${backup} (${metadata.collections.length} collections, ${metadata.timestamp})`);
        } else {
          console.log(`  - ${backup}`);
        }
      });
    } else {
      console.log('No backups found in ./backups directory');
    }
  } else {
    console.log('No backups directory found');
  }
  
  process.exit(1);
}

const backupDir = join(process.cwd(), 'backups', backupName);

// Check if backup exists
if (!existsSync(backupDir)) {
  console.error(`❌ Error: Backup not found at ${backupDir}`);
  process.exit(1);
}

// Check for metadata
const metadataPath = join(backupDir, 'metadata.json');
if (!existsSync(metadataPath)) {
  console.error(`❌ Error: Invalid backup - metadata.json not found`);
  process.exit(1);
}

console.log('🚀 Starting MongoDB restore (native)...');
console.log(`📊 Database: ${MONGODB_DATABASE}`);
console.log(`📂 Source: ${backupDir}`);
console.log('');

// Read metadata
const metadata = JSON.parse(readFileSync(metadataPath, 'utf8'));
console.log(`📋 Backup contains ${metadata.collections.length} collections`);
console.log(`📅 Created: ${metadata.timestamp}`);
console.log('');

console.log('⚠️  WARNING: This will replace the current database!');
console.log('Press Ctrl+C to cancel, or wait 5 seconds to continue...');
console.log('');

// Wait 5 seconds before proceeding
setTimeout(async () => {
  await restoreDatabase();
}, 5000);

async function restoreDatabase() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');
    console.log('');
    
    const db = client.db(MONGODB_DATABASE);
    
    // Restore each collection
    for (const collectionMeta of metadata.collections) {
      const collectionName = collectionMeta.name;
      console.log(`⏳ Restoring collection: ${collectionName}`);
      
      const collectionFile = join(backupDir, `${collectionName}.json.gz`);
      
      if (!existsSync(collectionFile)) {
        console.log(`   ⚠️  Warning: File not found, skipping`);
        continue;
      }
      
      // Read and decompress collection data
      const chunks = [];
      const gunzip = createGunzip();
      const source = createReadStream(collectionFile);
      
      await pipeline(
        source,
        gunzip,
        async function* (source) {
          for await (const chunk of source) {
            chunks.push(chunk);
          }
        }
      );
      
      const jsonData = Buffer.concat(chunks).toString('utf8');
      const collectionData = JSON.parse(jsonData);
      
      console.log(`   Found ${collectionData.documents.length} documents`);
      
      // Drop existing collection
      try {
        await db.collection(collectionName).drop();
        console.log(`   ✓ Dropped existing collection`);
      } catch (error) {
        // Collection might not exist, that's okay
        if (error.code !== 26) { // NamespaceNotFound
          console.log(`   ℹ️  Collection doesn't exist yet`);
        }
      }
      
      // Insert documents
      if (collectionData.documents.length > 0) {
        await db.collection(collectionName).insertMany(collectionData.documents);
        console.log(`   ✓ Inserted ${collectionData.documents.length} documents`);
      }
      
      // Recreate indexes (skip _id_ index as it's automatic)
      const indexesToCreate = collectionData.indexes.filter(idx => idx.name !== '_id_');
      if (indexesToCreate.length > 0) {
        for (const index of indexesToCreate) {
          try {
            const indexSpec = { ...index };
            delete indexSpec.v;
            delete indexSpec.ns;
            delete indexSpec.name;
            
            await db.collection(collectionName).createIndex(
              indexSpec.key,
              {
                name: index.name,
                unique: index.unique || false,
                sparse: index.sparse || false,
                background: index.background || false
              }
            );
          } catch (error) {
            console.log(`   ⚠️  Warning: Could not create index ${index.name}: ${error.message}`);
          }
        }
        console.log(`   ✓ Created ${indexesToCreate.length} indexes`);
      }
      
      console.log(`   ✅ Collection restored`);
      console.log('');
    }
    
    console.log('✅ Database restore completed successfully!');
    console.log('');
    
  } catch (error) {
    console.error('❌ Error during database restore:', error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

