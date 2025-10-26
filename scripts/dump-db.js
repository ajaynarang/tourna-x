#!/usr/bin/env node

/**
 * MongoDB Database Dump Script
 * 
 * This script creates a local backup of the MongoDB database using mongodump.
 * It reads the connection string from environment variables and creates
 * timestamped backups in the ./backups directory.
 * 
 * Usage:
 *   pnpm dump-db              # Dump with default settings
 *   pnpm dump-db --name=prod  # Dump with custom name
 */

const { execSync } = require('child_process');
const { existsSync, mkdirSync } = require('fs');
const { join } = require('path');
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

console.log('🚀 Starting MongoDB dump...');
console.log(`📊 Database: ${MONGODB_DATABASE}`);
console.log(`📂 Output: ${backupDir}`);
console.log('');

try {
  // Check if mongodump is available
  try {
    execSync('mongodump --version', { stdio: 'pipe' });
  } catch (error) {
    console.error('❌ Error: mongodump is not installed or not in PATH');
    console.error('');
    console.error('Please install MongoDB Database Tools:');
    console.error('  macOS:   brew install mongodb/brew/mongodb-database-tools');
    console.error('  Linux:   sudo apt-get install mongodb-database-tools');
    console.error('  Windows: Download from https://www.mongodb.com/try/download/database-tools');
    process.exit(1);
  }

  // Build mongodump command
  const command = [
    'mongodump',
    `--uri="${MONGODB_URI}"`,
    `--db=${MONGODB_DATABASE}`,
    `--out="${backupDir}"`,
    '--gzip', // Compress the backup
  ].join(' ');

  // Execute mongodump
  console.log('⏳ Dumping database...');
  execSync(command, { stdio: 'inherit' });

  console.log('');
  console.log('✅ Database dump completed successfully!');
  console.log(`📦 Backup saved to: ${backupDir}`);
  console.log('');
  console.log('To restore this backup, run:');
  console.log(`  pnpm restore-db ${backupName}`);
  console.log('');

} catch (error) {
  console.error('❌ Error during database dump:', error);
  process.exit(1);
}

