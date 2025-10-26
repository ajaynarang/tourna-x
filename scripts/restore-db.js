#!/usr/bin/env node

/**
 * MongoDB Database Restore Script
 * 
 * This script restores a MongoDB database from a backup created by dump-db.js
 * 
 * Usage:
 *   pnpm restore-db <backup-name>
 *   pnpm restore-db backup_2025-10-26_10-30-45
 */

const { execSync } = require('child_process');
const { existsSync, readdirSync } = require('fs');
const { join } = require('path');
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
  console.error('Usage: pnpm restore-db <backup-name>');
  console.error('');
  
  // List available backups
  const backupsRoot = join(process.cwd(), 'backups');
  if (existsSync(backupsRoot)) {
    const backups = readdirSync(backupsRoot);
    if (backups.length > 0) {
      console.log('Available backups:');
      backups.forEach(backup => {
        console.log(`  - ${backup}`);
      });
    } else {
      console.log('No backups found in ./backups directory');
    }
  } else {
    console.log('No backups directory found');
  }
  
  process.exit(1);
}

const backupDir = join(process.cwd(), 'backups', backupName, MONGODB_DATABASE);

// Check if backup exists
if (!existsSync(backupDir)) {
  console.error(`❌ Error: Backup not found at ${backupDir}`);
  process.exit(1);
}

console.log('🚀 Starting MongoDB restore...');
console.log(`📊 Database: ${MONGODB_DATABASE}`);
console.log(`📂 Source: ${backupDir}`);
console.log('');

// Confirm restore
console.log('⚠️  WARNING: This will replace the current database!');
console.log('Press Ctrl+C to cancel, or wait 5 seconds to continue...');
console.log('');

// Wait 5 seconds before proceeding
try {
  execSync('sleep 5');
} catch (error) {
  // User cancelled
  console.log('Cancelled by user');
  process.exit(0);
}

try {
  // Check if mongorestore is available
  try {
    execSync('mongorestore --version', { stdio: 'pipe' });
  } catch (error) {
    console.error('❌ Error: mongorestore is not installed or not in PATH');
    console.error('');
    console.error('Please install MongoDB Database Tools:');
    console.error('  macOS:   brew install mongodb/brew/mongodb-database-tools');
    console.error('  Linux:   sudo apt-get install mongodb-database-tools');
    console.error('  Windows: Download from https://www.mongodb.com/try/download/database-tools');
    process.exit(1);
  }

  // Build mongorestore command
  const command = [
    'mongorestore',
    `--uri="${MONGODB_URI}"`,
    `--db=${MONGODB_DATABASE}`,
    '--gzip',
    '--drop', // Drop existing collections before restore
    `"${backupDir}"`,
  ].join(' ');

  // Execute mongorestore
  console.log('⏳ Restoring database...');
  execSync(command, { stdio: 'inherit' });

  console.log('');
  console.log('✅ Database restore completed successfully!');
  console.log('');

} catch (error) {
  console.error('❌ Error during database restore:', error);
  process.exit(1);
}

