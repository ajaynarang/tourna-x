# Tourna-X - Badminton Tournament Management System Specification

## 📋 Project Overview

**Tourna-X** is a comprehensive badminton tournament management system designed for administrators, super administrators, and players. The system supports tournament creation, player registration, fixture generation, live scoring, practice match tracking, and comprehensive analytics.

## 🎯 Core Features

### Super Admin Features

Super admins have the highest level of access and can manage the entire system.

- **Admin Request Management**
  - View and process admin role requests from players
  - Approve or deny admin access requests
  - Track request history and processing details
  - View requester information (name, phone, email, society details)

- **System-Wide Practice Match Access**
  - View all practice matches created by any admin
  - Full visibility across all practice sessions
  - System-wide practice statistics and analytics

- **User Management**
  - Manually set super admin status for users
  - Manage admin roles and permissions
  - View all user accounts and their roles

- **All Admin Features**
  - Super admins have access to all admin features listed below

### Admin Features

Admins can manage tournaments, participants, and practice matches within their scope.

- **Tournament Management**
  - Create tournaments with multi-step form (5 steps)
    - Basic Information (name, sport, venue, dates)
    - Categories (singles, doubles, mixed)
    - Age Groups (U-16, U-19, Open, etc.) with multiple age group support
    - Tournament Settings (format, entry fee, max participants)
    - Review and Publish
  - Support for singles, doubles, and mixed categories
  - Age group categorization with flexible min/max age ranges
  - Entry fee management
  - Tournament type: Open or Society-only (restricted to specific society)
  - Tournament status workflow:
    - `draft` → `published` → `registration_open` → `ongoing` → `completed` → `cancelled`
  - Edit tournament details before fixtures are generated
  - View tournament history and timeline
  - Print-friendly tournament brackets

- **Participant Management**
  - View all participants across tournaments or filter by specific tournament
  - Approve/reject player registrations
  - Payment tracking (pending, paid, N/A)
  - Add participants manually to tournaments
  - Multi-category registration support (players can register for multiple categories)
  - Age group eligibility validation
  - Partner selection for doubles/mixed categories
  - Bulk operations and filtering
  - Registration analytics
  - View participant details (player info, partner info, contact details)
  - Cannot reject/remove participants after fixtures are generated
  - Emergency contact tracking

- **Fixture Generation**
  - Knockout tournament brackets
  - Round-robin fixtures
  - Automatic scheduling with court assignment
  - Seeding methods:
    - Random seeding
    - Skill-based seeding
    - Manual seeding
  - Group by category and/or age group
  - Configure match scheduling:
    - Start date and time
    - Match duration
    - Break between matches
    - Number of courts available
  - Preview fixtures before generation
  - Sync fixtures with tournament participants
  - Print-friendly fixture schedules
  - Cannot modify participants after fixtures are generated

- **Match Management**
  - View all tournament matches
  - Filter by tournament, status, category
  - Schedule matches with court and time assignment
  - Update match scores
  - Declare winners
  - Complete matches
  - Track match status (scheduled, in_progress, completed, cancelled)

- **Live Scoring**
  - Real-time score updates
  - Badminton rules validation (21-point games, best of 3 sets)
  - Automatic bracket progression
  - Game-by-game tracking
  - Deuce and advantage handling
  - Walkover support
  - Match result recording

- **Analytics Dashboard**
  - Tournament metrics (total tournaments, participants, matches)
  - Revenue tracking and entry fee analytics
  - Player statistics and performance trends
  - Time-range filtering (6 months, 1 year, all time)
  - Category-wise analytics
  - Top players leaderboard
  - Recent activity feed
  - Monthly trends (tournaments, participants, revenue)
  - Completion rate tracking
  - Average participants per tournament
  - Average matches per tournament

- **Practice Match Recording**
  - Create standalone practice matches (independent of tournaments)
  - Support for registered players and guest players (phone + name only)
  - Full badminton scoring with game tracking
  - Categories: Singles, Doubles, Mixed
  - Court and venue assignment
  - Match notes and comments
  - Separate practice statistics tracking
  - Practice match history and analytics
  - Filter by status (scheduled, in_progress, completed)
  - Filter by category
  - Delete practice matches (only non-completed matches)
  - Regular admins can only see matches they created
  - Super admins can see all practice matches system-wide

- **Dashboard**
  - Overview of active tournaments
  - Pending approval count
  - Upcoming matches
  - Total participants
  - Quick actions:
    - Create new tournament
    - Record practice match
    - View participants
    - View analytics

- **Command Palette (Cmd+K)**
  - Quick navigation to all admin pages
  - Search tournaments, participants, matches
  - Quick actions for common tasks
  - Keyboard shortcuts for power users

### Player Features

Players can register for tournaments, track their performance, and manage practice matches.

- **Registration System**
  - Phone-based OTP authentication (no password required)
  - Automatic account creation on first login
  - Profile management with detailed information:
    - Personal info (name, phone, email, age, gender)
    - Society information (society, block, flat number)
    - Skill level (beginner, intermediate, advanced, expert, elite)
  - Tournament discovery and browsing
  - Registration for singles/doubles/mixed categories
  - Multi-category registration in single tournament
  - Multi-age group registration (if tournament allows)
  - Partner selection for doubles/mixed
  - Registration status tracking (pending approval, approved)
  - Payment status tracking
  - Eligibility checking for society-only tournaments

- **Dashboard**
  - Personal statistics overview:
    - Total matches played
    - Win/loss record
    - Win rate percentage
    - Active tournaments
    - Tournament wins
    - Practice matches
    - Practice win rate
  - Quick actions:
    - Browse tournaments
    - Create practice matches
    - View match history
    - View detailed stats
  - Upcoming matches display
  - Recent match results
  - Tournament registrations with status

- **Tournament Discovery**
  - Browse all published tournaments
  - Filter by status (registration_open, ongoing, completed)
  - Search by name, location, venue
  - View tournament details:
    - Sport and format
    - Venue and location
    - Start/end dates
    - Entry fee
    - Participant count and capacity
    - Categories and age groups
  - Registration status badges
  - Eligibility indicators for society-only tournaments
  - One-click registration for eligible tournaments

- **Match Management**
  - View upcoming matches
  - Match history with results
  - Live score tracking
  - Tournament brackets visualization
  - Filter by tournament, status, category
  - Match details:
    - Opponent information
    - Court and venue
    - Scheduled time
    - Match scores by game
    - Winner information

- **Statistics & Analytics**
  - Comprehensive stats dashboard with tabs:
    - **Overall Stats**: Combined tournament and practice performance
    - **Tournament Stats**: Tournament-specific performance
    - **Practice Stats**: Practice match performance
  - Performance metrics:
    - Total matches played
    - Wins and losses
    - Win rate percentage
    - Games won/lost
    - Points scored
  - Category-wise breakdown (singles, doubles, mixed)
  - Recent match history
  - Performance trends
  - Achievement tracking

- **Practice Matches**
  - Create practice matches as organizer
  - Invite registered players or add guest players
  - Full scoring capability
  - Track practice match history
  - View practice statistics separately from tournaments
  - Filter by status and category
  - Delete own practice matches (non-completed only)

- **Profile Management**
  - Edit personal information
  - Update society details
  - Set and update skill level with descriptions:
    - Beginner: Just starting out, learning basic strokes
    - Intermediate: Comfortable with basic strokes and rules
    - Advanced: Strong technical skills, competitive play
    - Expert: High-level competitive experience
    - Elite: National/international competitive level
  - View account creation date
  - Manage notification preferences
  - Privacy settings
  - Session management and logout

- **Role Switching**
  - Seamless switching between player and admin roles (if user has both)
  - Role-specific navigation and features
  - Visual role indicator in UI

- **Welcome Experience**
  - Onboarding flow for new players
  - Feature introduction
  - Quick start guide
  - Tournament discovery prompts

## 🔐 Authentication System

### Admin Authentication
- Username/password login
- Session-based authentication with cookies
- Role-based access control (admin, super admin)
- Admin role request system for players
- Session expiration handling

### Player Authentication
- Phone number + OTP verification
- Country code support (default: +91)
- Automatic account creation on first login
- No password required
- Session management with automatic refresh
- Secure OTP delivery

### Multi-Role Support
- Users can have multiple roles (admin + player)
- Role switching capability
- Role-specific dashboards and features
- Unified profile across roles

## 📱 User Interface Design

### Design Principles
- **Full-screen layouts** with `min-h-screen`
- **Glass card effects** with backdrop blur (glassmorphism)
- **Dark theme** as default with light theme support
- **Responsive design** for mobile, tablet, and desktop
- **Motion animations** with Framer Motion for enhanced UX
- **Apple-inspired design** with clean, modern aesthetics
- **Gradient accents** for visual hierarchy
- **Status badges** with color coding

### Key UI Components
- **Command palette** (Cmd+K) for quick navigation
- **Mobile bottom navigation** for easy access
- **Glass card containers** with blur effects
- **Gradient backgrounds** with animated effects
- **Status badges** and indicators
- **Role switcher** for multi-role users
- **Loading states** with spinners and skeletons
- **Empty states** with helpful illustrations
- **Modal dialogs** for confirmations and forms
- **Toast notifications** for feedback
- **Tabs** for organized content
- **Filters** with segmented controls
- **Search bars** with instant filtering

### Navigation Structure
- **Admin Navigation**:
  - Dashboard
  - Tournaments
  - Participants
  - Fixtures
  - Tournament Matches
  - Practice Matches
  - Analytics
  - Admin Requests (super admin only)

- **Player Navigation**:
  - Dashboard
  - Tournaments
  - My Matches
  - Practice Matches
  - Statistics
  - Profile
  - Notifications

## 🎮 Tournament Formats

### Knockout Tournaments
- Single elimination brackets
- Automatic bracket progression
- Seeding support (random, skill-based, manual)
- Bye handling for odd number of participants
- Round tracking (Round of 16, Quarter-finals, Semi-finals, Finals)
- Winner advancement logic

### Round-Robin Tournaments
- All-play-all format
- Points-based ranking
- Tie-breaker rules
- Group stage support
- Match scheduling optimization

## 📊 Scoring System

### Badminton Rules
- 21-point games
- Best of 3 sets
- 2-point advantage rule (deuce)
- Win by 2 points requirement
- Maximum 30 points per game
- Automatic match completion when player wins 2 games
- Walkover handling

### Live Updates
- Real-time score updates
- Automatic bracket progression
- Match status tracking (scheduled, in_progress, completed)
- Result notifications
- Game-by-game history
- Winner declaration

### Match Types
- **Tournament Matches**: Linked to tournaments, affect tournament progression
- **Practice Matches**: Standalone matches, separate statistics tracking

## 🔄 API Endpoints

### Authentication
- `POST /api/auth/login` - Admin login with username/password
- `POST /api/auth/send-otp` - Send OTP to player phone number
- `POST /api/auth/phone-login` - Player login with OTP verification
- `POST /api/auth/register` - Register new user account
- `GET /api/auth/me` - Get current user profile
- `PUT /api/auth/me` - Update user profile
- `POST /api/auth/logout` - Logout and clear session

### Tournaments
- `GET /api/tournaments` - List all tournaments (published only for players)
- `POST /api/tournaments` - Create new tournament (admin)
- `GET /api/tournaments/[id]` - Get tournament details
- `GET /api/tournaments/[id]/details` - Get detailed tournament info
- `PUT /api/tournaments/[id]` - Update tournament (admin)
- `POST /api/tournaments/[id]/publish` - Publish tournament (admin)
- `POST /api/tournaments/[id]/open-registration` - Open registration (admin)
- `GET /api/tournaments/[id]/check-registration` - Check user registration status
- `GET /api/tournaments/[id]/participants` - Get tournament participants
- `GET /api/tournaments/[id]/available-players` - Get available players for partner selection
- `POST /api/tournaments/[id]/add-participant` - Add participant manually (admin)
- `GET /api/tournaments/stats` - Get tournament statistics

### Participants
- `GET /api/participants` - List all participants (admin)
- `POST /api/tournaments/[id]/register` - Register for tournament (player)
- `POST /api/participants/[id]/approve` - Approve registration (admin)
- `POST /api/participants/[id]/reject` - Reject registration (admin)
- `DELETE /api/participants/[id]` - Remove participant (admin)
- `GET /api/participants/[id]` - Get participant details

### Matches
- `GET /api/matches` - List matches with filters
- `POST /api/matches` - Create match (admin)
- `GET /api/matches/[id]` - Get match details
- `PUT /api/matches/[id]` - Update match
- `POST /api/matches/[id]/score` - Update match score
- `POST /api/matches/[id]/schedule` - Schedule match (admin)
- `POST /api/matches/[id]/complete` - Complete match (admin)
- `POST /api/matches/[id]/declare-winner` - Declare winner (admin)

### Practice Matches
- `GET /api/practice-matches` - List practice matches (filtered by creator unless super admin)
- `POST /api/practice-matches` - Create practice match
- `GET /api/practice-matches/[id]` - Get practice match details
- `PUT /api/practice-matches/[id]` - Update practice match
- `DELETE /api/practice-matches/[id]` - Delete practice match (non-completed only)
- `POST /api/practice-matches/[id]/score` - Update practice match score
- `POST /api/practice-matches/[id]/declare-winner` - Declare practice match winner
- `GET /api/practice-matches/stats` - Get practice statistics

### Fixtures
- `POST /api/tournaments/[id]/fixtures/generate` - Generate tournament fixtures (admin)
- `GET /api/tournaments/[id]/fixtures` - Get tournament fixtures
- `POST /api/tournaments/[id]/fixtures/sync` - Sync fixtures with participants (admin)

### Analytics
- `GET /api/admin/dashboard` - Admin dashboard data
- `GET /api/admin/analytics` - Analytics metrics with time range filter
- `GET /api/player/dashboard` - Player dashboard data
- `GET /api/player/stats` - Player statistics (overall, tournament, practice)
- `GET /api/player/matches` - Player match history
- `GET /api/stats` - General statistics

### Admin Management (Super Admin Only)
- `GET /api/admin/admin-requests` - Get pending admin role requests
- `POST /api/admin/admin-requests/[id]` - Process admin request (approve/deny)
- `GET /api/admin/players` - Get all players list
- `GET /api/admin/users` - Get all users

### Notifications
- `GET /api/notifications` - Get user notifications
- `POST /api/notifications` - Create notification (admin)

## 📁 File Structure

```
apps/frontend/
├── app/
│   ├── api/                           # API routes
│   │   ├── auth/                      # Authentication endpoints
│   │   │   ├── login/                 # Admin login
│   │   │   ├── phone-login/           # Player OTP login
│   │   │   ├── send-otp/              # Send OTP
│   │   │   ├── register/              # User registration
│   │   │   ├── me/                    # User profile
│   │   │   └── logout/                # Logout
│   │   ├── tournaments/               # Tournament management
│   │   │   ├── [id]/                  # Tournament-specific routes
│   │   │   │   ├── register/          # Player registration
│   │   │   │   ├── participants/      # Participant list
│   │   │   │   ├── fixtures/          # Fixture management
│   │   │   │   │   └── generate/      # Generate fixtures
│   │   │   │   ├── add-participant/   # Add participant manually
│   │   │   │   ├── available-players/ # Get available partners
│   │   │   │   └── check-registration/# Check registration status
│   │   │   └── stats/                 # Tournament statistics
│   │   ├── participants/              # Participant management
│   │   │   └── [id]/
│   │   │       ├── approve/           # Approve participant
│   │   │       └── reject/            # Reject participant
│   │   ├── matches/                   # Match management
│   │   │   └── [id]/
│   │   │       ├── score/             # Update score
│   │   │       ├── schedule/          # Schedule match
│   │   │       ├── complete/          # Complete match
│   │   │       └── declare-winner/    # Declare winner
│   │   ├── practice-matches/          # Practice match management
│   │   │   ├── [id]/
│   │   │   │   ├── score/             # Update practice score
│   │   │   │   └── declare-winner/    # Declare practice winner
│   │   │   └── stats/                 # Practice statistics
│   │   ├── admin/                     # Admin-specific APIs
│   │   │   ├── dashboard/             # Admin dashboard data
│   │   │   ├── analytics/             # Analytics data
│   │   │   ├── admin-requests/        # Admin role requests (super admin)
│   │   │   ├── players/               # Players list
│   │   │   └── users/                 # Users management
│   │   ├── player/                    # Player-specific APIs
│   │   │   ├── dashboard/             # Player dashboard data
│   │   │   ├── matches/               # Player matches
│   │   │   ├── stats/                 # Player statistics
│   │   │   └── profile/               # Player profile
│   │   └── notifications/             # Notifications
│   ├── admin/                         # Admin pages
│   │   ├── dashboard/                 # Admin dashboard
│   │   ├── tournaments/               # Tournament management
│   │   │   ├── create/                # Create tournament
│   │   │   └── [id]/                  # Tournament details
│   │   │       ├── edit/              # Edit tournament
│   │   │       ├── participants/      # Manage participants
│   │   │       ├── fixtures/          # View/manage fixtures
│   │   │       │   └── print/         # Print fixtures
│   │   │       ├── schedule/          # Schedule matches
│   │   │       └── history/           # Tournament history
│   │   ├── participants/              # All participants
│   │   ├── fixtures/                  # Fixtures overview
│   │   ├── tournament-matches/        # Tournament matches
│   │   │   └── [id]/                  # Match scoring
│   │   ├── analytics/                 # Analytics dashboard
│   │   └── admin-requests/            # Admin requests (super admin)
│   ├── player/                        # Player pages
│   │   ├── dashboard/                 # Player dashboard
│   │   ├── welcome/                   # Welcome/onboarding
│   │   ├── matches/                   # Match history
│   │   ├── stats/                     # Statistics
│   │   ├── scoring/                   # Live scoring
│   │   ├── notifications/             # Notifications
│   │   └── profile/                   # Profile management
│   ├── practice-matches/              # Practice matches (shared)
│   │   ├── create/                    # Create practice match
│   │   └── [id]/                      # Practice match details/scoring
│   ├── tournaments/                   # Public tournament pages
│   │   └── [id]/                      # Tournament details
│   │       ├── register/              # Registration page
│   │       └── bracket-print/         # Print bracket
│   ├── profile/                       # User profile
│   ├── login/                         # Login page
│   ├── register/                      # Registration page
│   ├── notifications/                 # Notifications page
│   └── layout.tsx                     # Root layout
├── components/                        # Reusable components
│   ├── auth-guard.tsx                 # Authentication guard
│   ├── command-palette.tsx            # Command palette (Cmd+K)
│   ├── role-switcher.tsx              # Role switching component
│   ├── layout/                        # Layout components
│   │   ├── mobile-bottom-navigation.tsx
│   │   └── header.tsx
│   └── ui/                            # UI components (from @repo/ui)
├── contexts/                          # React contexts
│   └── scoring-context.tsx            # Scoring state management
├── hooks/                             # Custom hooks
│   ├── use-page-title.ts              # Page title hook
│   ├── use-toast.ts                   # Toast notifications
│   └── use-tournaments.ts             # Tournament data hook
├── lib/                               # Utilities and helpers
│   ├── mongodb.ts                     # MongoDB connection
│   ├── auth.tsx                       # Auth context and utilities
│   ├── auth-utils.ts                  # Auth helper functions
│   └── utils.ts                       # General utilities
└── styles/
    └── globals.css                    # Global styles

packages/schemas/
├── src/
│   └── index.ts                       # Zod schemas and types
│       ├── userSchema                 # User schema with roles
│       ├── tournamentSchema           # Tournament schema
│       ├── participantSchema          # Participant schema
│       ├── matchSchema                # Match schema
│       └── COLLECTIONS                # Collection names

packages/ui/
└── src/                               # Shared UI components
    ├── button.tsx
    ├── card.tsx
    ├── badge.tsx
    ├── dialog.tsx
    ├── select.tsx
    ├── tabs.tsx
    └── ...                            # Other shadcn/ui components
```

## 🗄️ Database Schema

### Collections

#### users
```typescript
{
  _id: ObjectId,
  username?: string,                    // For admin users
  password?: string,                    // For admin users (hashed)
  roles: ['admin' | 'player'],          // Multiple roles supported
  isSuperAdmin: boolean,                // Super admin flag
  adminRequestStatus: 'none' | 'pending' | 'approved' | 'denied',
  adminRequestedAt?: Date,
  adminRequestProcessedAt?: Date,
  adminRequestProcessedBy?: ObjectId,   // Super admin who processed
  name: string,
  phone: string,
  countryCode: string,                  // Default: +91
  email?: string,
  society?: string,
  block?: string,
  flatNumber?: string,
  age?: number,
  gender: 'male' | 'female' | 'other',
  skillLevel?: 'beginner' | 'intermediate' | 'advanced' | 'expert' | 'elite',
  createdAt: Date
}
```

#### tournaments
```typescript
{
  _id: ObjectId,
  name: string,
  sport: 'badminton' | 'tennis',
  venue: string,
  location: string,
  startDate: Date,
  endDate: Date,
  categories: ['singles', 'doubles', 'mixed'],
  ageGroups: [{
    name: string,
    minAge?: number,
    maxAge?: number
  }],
  allowMultipleAgeGroups: boolean,
  format: 'knockout' | 'round_robin',
  entryFee: number,
  maxParticipants: number,
  participantCount: number,
  rules?: string,
  prizeWinner?: number,
  prizeRunnerUp?: number,
  prizeSemiFinalist?: number,
  status: 'draft' | 'published' | 'registration_open' | 'ongoing' | 'completed' | 'cancelled',
  isPublished: boolean,
  tournamentType: 'open' | 'society_only',
  allowedSociety?: string,
  createdBy: ObjectId,
  createdAt: Date,
  updatedAt: Date
}
```

#### participants
```typescript
{
  _id: ObjectId,
  userId: ObjectId,
  tournamentId: ObjectId,
  category: 'singles' | 'doubles' | 'mixed',
  gender: 'male' | 'female' | 'mixed',
  ageGroups?: string[],                 // Multiple age groups supported
  partnerId?: ObjectId,                 // For doubles/mixed
  isApproved: boolean,
  paymentStatus: 'pending' | 'paid' | 'na',
  emergencyContact?: string,
  registeredAt: Date
}
```

#### matches
```typescript
{
  _id: ObjectId,
  matchType: 'tournament' | 'practice',
  tournamentId?: ObjectId,              // For tournament matches
  category: 'singles' | 'doubles' | 'mixed',
  ageGroup?: string,
  round?: string,                       // For knockout tournaments
  
  // Players (tournament matches use IDs, practice can have guests)
  player1Id?: ObjectId,
  player2Id?: ObjectId,
  player3Id?: ObjectId,                 // For doubles
  player4Id?: ObjectId,                 // For doubles
  
  // Guest player info (practice matches)
  player1Name?: string,
  player2Name?: string,
  player3Name?: string,
  player4Name?: string,
  player1Phone?: string,
  player2Phone?: string,
  player3Phone?: string,
  player4Phone?: string,
  player1IsGuest?: boolean,
  player2IsGuest?: boolean,
  player3IsGuest?: boolean,
  player4IsGuest?: boolean,
  
  // Match details
  scheduledDate?: Date,
  scheduledTime?: string,
  court?: string,
  venue?: string,
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'walkover',
  
  // Scoring
  games: [{
    gameNumber: number,
    player1Score: number,
    player2Score: number,
    winnerId?: ObjectId,
    completedAt?: Date
  }],
  
  // Result
  winnerId?: ObjectId,
  winnerName?: string,
  matchResult?: {
    player1GamesWon: number,
    player2GamesWon: number,
    totalDuration?: number,
    completedAt?: Date
  },
  
  notes?: string,
  createdBy: ObjectId,
  createdAt: Date,
  updatedAt: Date
}
```

#### practice_stats
```typescript
{
  _id: ObjectId,
  userId: ObjectId,
  totalMatches: number,
  totalWins: number,
  totalLosses: number,
  winRate: number,
  categoriesPlayed: {
    singles: { played: number, won: number, lost: number },
    doubles: { played: number, won: number, lost: number },
    mixed: { played: number, won: number, lost: number }
  },
  lastUpdated: Date
}
```

#### sessions
```typescript
{
  _id: ObjectId,
  sessionToken: string,
  userId: ObjectId,
  expiresAt: Date,
  createdAt: Date
}
```

#### otps
```typescript
{
  _id: ObjectId,
  phone: string,
  countryCode: string,
  otp: string,
  expiresAt: Date,
  verified: boolean,
  createdAt: Date
}
```

#### notifications
```typescript
{
  _id: ObjectId,
  userId: ObjectId,
  type: string,
  title: string,
  message: string,
  read: boolean,
  relatedId?: ObjectId,
  relatedType?: string,
  createdAt: Date
}
```

### Indexes

```javascript
// Users
users: [
  { phone: 1 },
  { email: 1 },
  { username: 1 },
  { roles: 1 },
  { isSuperAdmin: 1 },
  { adminRequestStatus: 1 }
]

// Tournaments
tournaments: [
  { status: 1 },
  { isPublished: 1 },
  { startDate: 1 },
  { createdBy: 1 },
  { tournamentType: 1, allowedSociety: 1 }
]

// Participants
participants: [
  { tournamentId: 1 },
  { userId: 1 },
  { isApproved: 1 },
  { tournamentId: 1, userId: 1 },
  { tournamentId: 1, category: 1 }
]

// Matches
matches: [
  { matchType: 1 },
  { tournamentId: 1 },
  { status: 1 },
  { player1Id: 1 },
  { player2Id: 1 },
  { createdBy: 1 },
  { matchType: 1, createdBy: 1 }
]

// Sessions
sessions: [
  { sessionToken: 1 },
  { userId: 1 },
  { expiresAt: 1 }
]

// OTPs
otps: [
  { phone: 1 },
  { expiresAt: 1 }
]
```

## 🚀 Deployment

### Environment Variables
```env
MONGODB_URI=mongodb://localhost:27017
MONGODB_DATABASE=tourna-x
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://tourna-x.com
```

### Build Process
```bash
pnpm install          # Install dependencies
pnpm build           # Build all packages
pnpm dev             # Start development server
pnpm start           # Start production server
```

### Database Backup & Restore
```bash
# Backup database
node scripts/dump-db-native.js

# Restore database
node scripts/restore-db-native.js <backup-directory>
```

## 📈 Future Enhancements

### Phase 2 Features
- WhatsApp integration for notifications
- Payment gateway integration (Razorpay, Stripe)
- Advanced analytics and reporting
- Tournament templates and cloning
- Multi-language support (i18n)
- Advanced scheduling algorithms
- Email notifications
- SMS notifications
- Push notifications
- Tournament chat/messaging
- Live streaming integration
- Spectator mode

### Phase 3 Features
- Mobile app (React Native)
- Live streaming integration
- Social features (follow players, share results)
- Tournament marketplace
- Advanced statistics and AI insights
- Player rankings and leaderboards
- Coaching features
- Training programs
- Equipment marketplace
- Venue booking integration
- Referee management system
- Umpire scoring app

## 🔧 Development Guidelines

### Code Standards
- TypeScript strict mode enabled
- ESLint configuration enforced
- Prettier formatting
- Zod schema validation for all data
- Error boundary handling
- Comprehensive error messages

### Testing Strategy
- Unit tests for utilities
- Integration tests for APIs
- E2E tests for critical flows
- Performance testing
- Load testing for concurrent users

### Security
- Session-based authentication
- Secure OTP generation and validation
- Role-based access control
- Input validation and sanitization
- SQL injection prevention (using MongoDB native driver)
- XSS protection
- CSRF protection
- Rate limiting on sensitive endpoints

## 📞 Support

For technical support or feature requests, please refer to the project documentation or contact the development team.

---

**Version**: 2.0.0  
**Last Updated**: October 2025  
**Status**: Production Ready  
**Contributors**: Development Team  
**License**: Proprietary
