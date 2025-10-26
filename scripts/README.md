# Database Backup & Restore Scripts

This directory contains scripts for backing up and restoring the MongoDB database.

## Two Approaches Available

### 1. Native Node.js Scripts (✨ Recommended - No Installation Required)
- **`dump-db-native.js`** / **`restore-db-native.js`**
- Uses MongoDB Node.js driver (already installed)
- Works immediately without additional tools
- Cross-platform compatible
- Perfect for development and small to medium databases

### 2. MongoDB Tools Scripts (For Large Databases)
- **`dump-db.js`** / **`restore-db.js`**
- Uses official `mongodump` and `mongorestore` tools
- Better performance for very large databases
- Requires MongoDB Database Tools installation

## Prerequisites

### For Native Scripts (Recommended)
✅ **No additional installation needed!** Uses the MongoDB driver that's already in your project.

### For MongoDB Tools Scripts
You need to have MongoDB Database Tools installed on your system:

#### macOS
```bash
brew install mongodb/brew/mongodb-database-tools
```

#### Linux (Ubuntu/Debian)
```bash
sudo apt-get install mongodb-database-tools
```

#### Windows
Download from [MongoDB Database Tools](https://www.mongodb.com/try/download/database-tools)

## Environment Setup

Make sure you have a `.env` file in the root directory with:

```env
MONGODB_URI=mongodb://localhost:27017
MONGODB_DATABASE=tourna-x
```

## Usage

### Option 1: Native Scripts (✨ Recommended)

#### Dump (Backup) Database

Create a backup of your MongoDB database:

```bash
# Basic dump with timestamp
pnpm dump-db-native

# Dump with custom name (useful for production backups)
pnpm dump-db-native --name=prod
pnpm dump-db-native --name=before-migration
```

#### Restore Database

Restore a database from a backup:

```bash
# List available backups (run without arguments)
pnpm restore-db-native

# Restore from a specific backup
pnpm restore-db-native backup_2025-10-26_14-30-45
```

### Option 2: MongoDB Tools Scripts

#### Dump (Backup) Database

```bash
# Basic dump with timestamp
pnpm dump-db

# Dump with custom name
pnpm dump-db --name=prod
```

#### Restore Database

```bash
# List available backups
pnpm restore-db

# Restore from a specific backup
pnpm restore-db backup_2025-10-26_14-30-45
```

### Important Notes

Backups are saved to `./backups/` directory with timestamps:
- `backups/backup_2025-10-26_14-30-45/`
- `backups/prod_2025-10-26_14-30-45/`

**⚠️ WARNING:** The restore operation will:
- Drop all existing collections in the target database
- Replace them with the backup data
- Wait 5 seconds before proceeding (giving you time to cancel with Ctrl+C)

## Backup Features

### Native Scripts
- ✅ **No installation required** - Works immediately
- ✅ **Compression** - All backups are gzip-compressed to save disk space
- ✅ **Timestamped** - Each backup includes a timestamp for easy identification
- ✅ **Custom naming** - Use `--name` flag for meaningful backup names
- ✅ **Index preservation** - Saves and restores all indexes
- ✅ **Metadata** - Includes backup metadata for easy identification
- ✅ **Cross-platform** - Works on any system with Node.js

### MongoDB Tools Scripts
- ✅ **High performance** - Optimized for large databases
- ✅ **Industry standard** - Uses official MongoDB tools
- ✅ **Binary format** - More efficient for very large datasets

## Backup Structure

### Native Scripts Format
```
backups/
├── backup_2025-10-26_14-30-45/
│   ├── metadata.json
│   ├── tournaments.json.gz
│   ├── participants.json.gz
│   ├── matches.json.gz
│   └── ...
└── prod_2025-10-26_15-00-00/
    └── ...
```

### MongoDB Tools Format
```
backups/
├── backup_2025-10-26_14-30-45/
│   └── tourna-x/
│       ├── tournaments.bson.gz
│       ├── tournaments.metadata.json.gz
│       ├── participants.bson.gz
│       └── ...
```

## Which Script Should I Use?

### Use Native Scripts (`-native`) When:
- ✅ You're in development
- ✅ You want quick backups without installing tools
- ✅ Your database is small to medium sized (< 10GB)
- ✅ You want cross-platform compatibility
- ✅ You're working on a system where you can't install MongoDB tools

### Use MongoDB Tools Scripts When:
- ✅ You have very large databases (> 10GB)
- ✅ You need maximum performance
- ✅ You're doing production backups with strict requirements
- ✅ You already have MongoDB tools installed

## Best Practices

1. **Before major changes**: Always create a backup before:
   - Database migrations
   - Schema changes
   - Major feature deployments
   - Data cleanup operations

2. **Production backups**: Use custom names for production backups:
   ```bash
   pnpm dump-db-native --name=prod
   # or
   pnpm dump-db --name=prod
   ```

3. **Regular backups**: Set up a cron job or scheduled task for automatic backups

4. **Backup retention**: Regularly clean up old backups to save disk space

5. **Test restores**: Periodically test your backups by restoring to a test database

## Troubleshooting

### "mongodump is not installed"
Install MongoDB Database Tools (see Prerequisites above)

### "Error: Backup not found"
Check available backups by running `pnpm restore-db` without arguments

### Permission errors
Ensure the scripts have execute permissions:
```bash
chmod +x scripts/dump-db.js scripts/restore-db.js
```

## Manual Commands

If you need more control, you can use the MongoDB tools directly:

### Manual Dump
```bash
mongodump --uri="mongodb://localhost:27017" --db=tourna-x --out="./manual-backup" --gzip
```

### Manual Restore
```bash
mongorestore --uri="mongodb://localhost:27017" --db=tourna-x --gzip --drop "./manual-backup/tourna-x"
```

## Notes

- Backups are automatically excluded from git (via `.gitignore`)
- Each backup is self-contained and includes all collections
- Metadata files preserve indexes and collection options
- Compressed backups save approximately 70-90% disk space

