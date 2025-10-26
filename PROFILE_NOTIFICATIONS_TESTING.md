# Profile, Settings & Notifications Testing Guide

This guide will help you test the newly implemented profile, settings, and notifications features.

## Features Implemented

### 1. **Notification System**
- ✅ Notification settings schema added to `@repo/schemas`
- ✅ API routes for notification management:
  - `GET /api/notifications` - Fetch user notifications
  - `GET /api/notifications/settings` - Get notification preferences
  - `PUT /api/notifications/settings` - Update notification preferences
  - `POST /api/notifications/[id]/read` - Mark notification as read
  - `POST /api/notifications/read-all` - Mark all as read
  - `DELETE /api/notifications/[id]` - Delete notification
  - `POST /api/admin/notifications/test` - Create test notification (admin only)

### 2. **User Settings**
- ✅ User settings schema added to `@repo/schemas`
- ✅ API routes for settings management:
  - `GET /api/settings` - Get user settings
  - `PUT /api/settings` - Update user settings
- ✅ Settings include:
  - Privacy settings (profile visibility, show email/phone/stats)
  - Display preferences (theme, language, timezone)
  - Match preferences (preferred categories, time slots)
  - Communication preferences (direct messages, match invites)

### 3. **Enhanced Profile Page**
- ✅ Works for both players and admins
- ✅ Three tabs: Profile, Stats (players only), Settings
- ✅ Profile editing with validation
- ✅ Player statistics display:
  - Overall stats (total matches, wins, losses, win rate)
  - Tournament stats (tournaments, matches, wins, win rate)
  - Practice match stats (matches, wins, losses, win rate)
  - Active tournaments count
- ✅ Settings management UI

## Testing Instructions

### Prerequisites
1. Ensure the development server is running:
   ```bash
   cd /Users/ajay-admin/code/tourna-x
   pnpm dev
   ```

2. Ensure MongoDB is connected and accessible

### Test 1: Profile Page (Player Account)

1. **Login as a Player**
   - Navigate to `/login`
   - Login with a player account (phone + OTP)

2. **View Profile**
   - Navigate to `/profile`
   - Verify you see three tabs: Profile, Stats, Settings
   - Check that profile information is displayed correctly

3. **Edit Profile**
   - Click "Edit Profile" button
   - Update fields like name, email, age, gender, society info
   - Update skill level (for players)
   - Click "Save" and verify changes persist

4. **View Stats Tab**
   - Click on "Stats" tab
   - Verify you see:
     - Overall statistics card
     - Tournament statistics card
     - Practice match statistics card
     - Active tournaments (if any)
   - Stats should show real data from your matches

5. **View Settings Tab**
   - Click on "Settings" tab
   - Verify you see account settings options
   - Test logout functionality

### Test 2: Profile Page (Admin Account)

1. **Login as Admin**
   - Navigate to `/login`
   - Login with admin credentials

2. **View Profile**
   - Navigate to `/profile`
   - Verify you see two tabs: Profile, Settings (no Stats tab for admins)
   - Check that profile information is displayed correctly

3. **Edit Profile**
   - Click "Edit Profile" button
   - Update admin profile fields
   - Click "Save" and verify changes persist

### Test 3: Notifications System

1. **Access Notifications Page**
   - Navigate to `/notifications`
   - Verify you see two tabs: Notifications, Settings

2. **View Notifications**
   - Check if any existing notifications are displayed
   - Verify notification icons and colors match their types:
     - ✅ Green: Registration approved
     - ❌ Red: Registration rejected
     - 📅 Blue: Match scheduled
     - 🔔 Yellow: Match starting
     - 🏆 Purple: Match result
     - ℹ️ Cyan: Tournament update
     - 👥 Orange: Practice match created

3. **Test Notification Actions**
   - **Mark as Read**: Click "Mark Read" on an unread notification
   - **Mark All as Read**: Click "Mark All Read" button
   - **Delete**: Click trash icon to delete a notification
   - **View Tournament**: Click "View" button (if notification has tournamentId)
   - **Refresh**: Click "Refresh" button to reload notifications

4. **Test Notification Filters**
   - Use search box to filter notifications by title/message
   - Use filter dropdown to show:
     - All Notifications
     - Unread Only
     - Read Only

5. **Test Notification Settings**
   - Click on "Settings" tab
   - Toggle notification channels:
     - Email Notifications
     - SMS Notifications
     - Push Notifications
   - Toggle notification types:
     - Tournament Updates
     - Match Reminders
     - Registration Updates
     - Result Notifications
   - Verify settings are saved (check for success feedback)

### Test 4: Create Test Notification (Admin Only)

1. **Using API Directly**
   ```bash
   # Get your user ID from /api/auth/me
   curl -X GET http://localhost:3000/api/auth/me \
     -H "Cookie: session=YOUR_SESSION_TOKEN"

   # Create test notification (as admin)
   curl -X POST http://localhost:3000/api/admin/notifications/test \
     -H "Content-Type: application/json" \
     -H "Cookie: session=YOUR_ADMIN_SESSION_TOKEN" \
     -d '{
       "userId": "YOUR_USER_ID",
       "type": "tournament_update",
       "title": "Test Notification",
       "message": "This is a test notification to verify the system is working!"
     }'
   ```

2. **Verify Test Notification**
   - Navigate to `/notifications`
   - You should see the new test notification
   - Test all notification actions on it

### Test 5: User Settings API

1. **Get Current Settings**
   ```bash
   curl -X GET http://localhost:3000/api/settings \
     -H "Cookie: session=YOUR_SESSION_TOKEN"
   ```

2. **Update Settings**
   ```bash
   curl -X PUT http://localhost:3000/api/settings \
     -H "Content-Type: application/json" \
     -H "Cookie: session=YOUR_SESSION_TOKEN" \
     -d '{
       "theme": "dark",
       "showStats": true,
       "preferredCategories": ["singles", "doubles"]
     }'
   ```

### Test 6: Integration Testing

1. **Register for a Tournament**
   - Register for a tournament as a player
   - Admin should approve/reject the registration
   - Check `/notifications` for registration update notification

2. **Complete a Match**
   - Complete a tournament or practice match
   - Check `/notifications` for match result notification
   - Check `/profile` Stats tab to see updated statistics

3. **Tournament Updates**
   - Admin updates a tournament you're registered for
   - Check `/notifications` for tournament update notification

## Expected Behavior

### Notifications
- ✅ Notifications appear in real-time (after refresh)
- ✅ Unread notifications have blue left border
- ✅ Unread count is displayed
- ✅ Notifications are sorted by date (newest first)
- ✅ Settings persist across sessions
- ✅ Pagination works for large notification lists

### Profile
- ✅ Profile data loads correctly for both players and admins
- ✅ Edit mode allows updating profile fields
- ✅ Phone number cannot be changed (primary identifier)
- ✅ Stats tab only visible for players
- ✅ Stats display real data from matches
- ✅ Skill level selector shows descriptions

### Settings
- ✅ Settings load with default values if not set
- ✅ Settings update immediately
- ✅ Settings persist across sessions
- ✅ Logout works correctly

## Database Collections

The following collections are used:

1. **notifications** - User notifications
2. **notification_settings** - User notification preferences
3. **user_settings** - User general settings
4. **users** - User profiles

## API Endpoints Summary

### Notifications
- `GET /api/notifications` - List notifications
- `POST /api/notifications` - Create notification (admin)
- `GET /api/notifications/settings` - Get settings
- `PUT /api/notifications/settings` - Update settings
- `POST /api/notifications/[id]/read` - Mark as read
- `DELETE /api/notifications/[id]` - Delete notification
- `POST /api/notifications/read-all` - Mark all as read
- `POST /api/admin/notifications/test` - Test notification (admin)

### Profile
- `GET /api/auth/me` - Get current user profile
- `PUT /api/auth/me` - Update user profile
- `GET /api/player/dashboard` - Get player stats

### Settings
- `GET /api/settings` - Get user settings
- `PUT /api/settings` - Update user settings

## Troubleshooting

### Notifications not showing
1. Check browser console for errors
2. Verify session is valid: `GET /api/auth/me`
3. Check MongoDB for notifications: `db.notifications.find({ userId: ObjectId("...") })`
4. Ensure notification API routes are accessible

### Stats not displaying
1. Verify user has played matches
2. Check player dashboard API: `GET /api/player/dashboard`
3. Ensure matches are marked as completed
4. Check MongoDB matches collection

### Settings not saving
1. Check browser console for errors
2. Verify PUT request is successful
3. Check MongoDB for settings documents
4. Ensure user is authenticated

## Next Steps

After testing, you can:
1. Add push notification support (browser notifications)
2. Add email/SMS notification delivery
3. Add notification preferences per tournament
4. Add notification history/archive
5. Add notification grouping/categories
6. Add real-time notifications using WebSockets

## Support

If you encounter any issues:
1. Check browser console for errors
2. Check server logs for API errors
3. Verify MongoDB connection and data
4. Check authentication status
5. Review API responses for error messages

