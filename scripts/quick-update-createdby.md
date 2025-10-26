# Quick Scripts to Update Practice Matches CreatedBy

## Prerequisites
Connect to your MongoDB database using mongosh or MongoDB Compass.

---

## Option 1: Set First Super Admin as Creator (Recommended)

This sets the first super admin (or any admin if no super admin exists) as the creator of all practice matches without a `createdBy` field.

```javascript
use('tourna-x'); // Change to your database name

// Find a super admin or admin
const creator = db.users.findOne({ isSuperAdmin: true }) || db.users.findOne({ roles: 'admin' });

if (creator) {
  const result = db.matches.updateMany(
    { matchType: 'practice', createdBy: { $exists: false } },
    { $set: { createdBy: creator._id } }
  );
  print(`Updated ${result.modifiedCount} matches. Creator: ${creator.name}`);
} else {
  print('No admin found! Create an admin user first.');
}
```

---

## Option 2: Set Specific User as Creator

Replace `USER_ID_HERE` with the actual ObjectId of the user you want to set as creator.

```javascript
use('tourna-x'); // Change to your database name

const result = db.matches.updateMany(
  { matchType: 'practice', createdBy: { $exists: false } },
  { $set: { createdBy: ObjectId('USER_ID_HERE') } }
);

print(`Updated ${result.modifiedCount} practice matches`);
```

---

## Option 3: Use Player1 as Creator

This assumes the first player in each match is the one who created it.

```javascript
use('tourna-x'); // Change to your database name

const matches = db.matches.find({
  matchType: 'practice',
  createdBy: { $exists: false },
  player1Id: { $exists: true }
}).toArray();

let updated = 0;
matches.forEach(match => {
  if (db.users.findOne({ _id: match.player1Id })) {
    db.matches.updateOne(
      { _id: match._id },
      { $set: { createdBy: match.player1Id } }
    );
    updated++;
  }
});

print(`Updated ${updated} practice matches`);
```

---

## Option 4: Check Current Status

See how many matches need updating:

```javascript
use('tourna-x'); // Change to your database name

const total = db.matches.countDocuments({ matchType: 'practice' });
const withCreator = db.matches.countDocuments({ matchType: 'practice', createdBy: { $exists: true } });
const without = total - withCreator;

print(`Total practice matches: ${total}`);
print(`With createdBy: ${withCreator}`);
print(`Without createdBy: ${without}`);
```

---

## Option 5: List Matches Without Creator

View all practice matches that need updating:

```javascript
use('tourna-x'); // Change to your database name

db.matches.find({
  matchType: 'practice',
  createdBy: { $exists: false }
}).forEach(match => {
  print(`Match ID: ${match._id}`);
  print(`  Players: ${match.player1Name} vs ${match.player2Name}`);
  print(`  Created: ${match.createdAt}`);
  print('');
});
```

---

## Option 6: Update Single Match

Update a specific match by its ID:

```javascript
use('tourna-x'); // Change to your database name

db.matches.updateOne(
  { _id: ObjectId('MATCH_ID_HERE') },
  { $set: { createdBy: ObjectId('USER_ID_HERE') } }
);
```

---

## Verification

After running any update script, verify the changes:

```javascript
use('tourna-x'); // Change to your database name

// Check a few matches
db.matches.find({ 
  matchType: 'practice' 
}).limit(5).forEach(match => {
  const creator = db.users.findOne({ _id: match.createdBy });
  print(`Match: ${match.player1Name} vs ${match.player2Name}`);
  print(`Creator: ${creator ? creator.name : 'NOT SET'}`);
  print('---');
});
```

---

## Rollback (If Needed)

If you need to remove the createdBy field from all practice matches:

```javascript
use('tourna-x'); // Change to your database name

const result = db.matches.updateMany(
  { matchType: 'practice' },
  { $unset: { createdBy: "" } }
);

print(`Removed createdBy from ${result.modifiedCount} matches`);
```

---

## Notes

- **Option 1** is recommended if you want one admin to "own" all historical matches
- **Option 3** is good if players typically create their own matches
- Always check the status before and after running scripts
- Make a backup of your database before running bulk updates
- The database name is set to `'tourna-x'` - change it to match your setup

