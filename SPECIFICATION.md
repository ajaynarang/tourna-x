# Tourna-X - Badminton Tournament Management System Specification

## 📋 Project Overview

**Tourna-X** is a comprehensive badminton tournament management system designed for both administrators and players. The system supports tournament creation, player registration, fixture generation, live scoring, and comprehensive analytics.

## 🎯 Core Features

### Admin Features
- **Tournament Management**
  - Create tournaments with multi-step form (5 steps)
  - Support for singles, doubles, and mixed categories
  - Age group categorization (U-16, U-19, Open, etc.)
  - Entry fee management
  - Tournament status workflow (draft → published → registration_open → ongoing → completed)

- **Participant Management**
  - Approve/reject player registrations
  - Payment tracking`
  - Bulk operations
  - Registration analytics

- **Fixture Generation**
  - Knockout tournament brackets
  - Round-robin fixtures
  - Automatic scheduling with court assignment
  - Manual scheduling with drag-drop interface

- **Live Scoring**
  - Real-time score updates
  - Badminton rules validation (21-point games, best of 3 sets)
  - Automatic bracket progression
  - Referee role management

- **Analytics Dashboard**
  - Tournament metrics
  - Revenue tracking
  - Player statistics
  - Performance trends

### Player Features
- **Registration System**
  - Phone-based OTP authentication
  - Profile management
  - Tournament discovery
  - Registration for singles/doubles/mixed

- **Match Management**
  - View upcoming matches
  - Match history
  - Live score tracking
  - Tournament brackets

- **Statistics**
  - Personal performance metrics
  - Win/loss records
  - Tournament history
  - Achievement tracking

## 🏗️ Technical Architecture

### Frontend (Next.js 15)
- **Framework**: Next.js 15 with App Router
- **Styling**: Tailwind CSS with custom dark theme
- **UI Components**: shadcn/ui components
- **State Management**: React Context + Zustand
- **Data Fetching**: TanStack Query
- **Animations**: Framer Motion
- **Design System**: Apple-inspired glassmorphism design

### Backend (Next.js API Routes)
- **API Framework**: Next.js API Routes
- **Database**: MongoDB with native driver
- **Validation**: Zod v4 schemas
- **Authentication**: JWT + session cookies
- **File Structure**: All APIs in `/app/api/` directory

### Database Schema
- **Users**: Admin and player accounts
- **Tournaments**: Tournament information and settings
- **Participants**: Player registrations and approvals
- **Matches**: Fixtures, scores, and results
- **Sessions**: Authentication sessions
- **OTPs**: Phone verification codes
- **Notifications**: System notifications
- **Player Stats**: Performance tracking

## 🔐 Authentication System

### Admin Authentication
- Username/password login
- Session-based authentication
- Role-based access control

### Player Authentication
- Phone number + OTP verification
- Automatic account creation
- Session management

## 📱 User Interface Design

### Design Principles
- **Full-screen layouts** with `min-h-screen`
- **Glass card effects** with backdrop blur
- **Dark theme** as default
- **Responsive design** for mobile and desktop
- **Motion animations** for enhanced UX

### Key UI Components
- Command palette (Cmd+K)
- Mobile bottom navigation
- Glass card containers
- Gradient backgrounds
- Status badges and indicators

## 🎮 Tournament Formats

### Knockout Tournaments
- Single elimination brackets
- Automatic bracket progression
- Seeding support
- Bye handling

### Round-Robin Tournaments
- All-play-all format
- Points-based ranking
- Tie-breaker rules
- Group stage support

## 📊 Scoring System

### Badminton Rules
- 21-point games
- Best of 3 sets
- 2-point advantage rule
- Automatic match completion
- Walkover handling

### Live Updates
- Real-time score updates
- Automatic bracket progression
- Match status tracking
- Result notifications

## 🔄 API Endpoints

### Authentication
- `POST /api/auth/login` - Admin login
- `POST /api/auth/send-otp` - Send OTP to player
- `POST /api/auth/phone-login` - Player login with OTP
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - Logout user

### Tournaments
- `GET /api/tournaments` - List tournaments
- `POST /api/tournaments` - Create tournament
- `GET /api/tournaments/[id]` - Get tournament details
- `PUT /api/tournaments/[id]` - Update tournament
- `POST /api/tournaments/[id]/publish` - Publish tournament
- `POST /api/tournaments/[id]/open-registration` - Open registration

### Participants
- `GET /api/participants` - List participants
- `POST /api/tournaments/[id]/register` - Register for tournament
- `POST /api/participants/[id]/approve` - Approve registration
- `POST /api/participants/[id]/reject` - Reject registration

### Matches
- `GET /api/matches` - List matches
- `POST /api/matches` - Create match
- `POST /api/matches/[id]/score` - Update match score

### Fixtures
- `POST /api/tournaments/[id]/fixtures/generate` - Generate fixtures

### Analytics
- `GET /api/admin/dashboard` - Admin dashboard data
- `GET /api/admin/analytics` - Analytics metrics
- `GET /api/player/dashboard` - Player dashboard data
- `GET /api/player/stats` - Player statistics

## 📁 File Structure

```
apps/frontend/
├── app/
│   ├── api/                    # API routes
│   │   ├── auth/              # Authentication endpoints
│   │   ├── tournaments/       # Tournament management
│   │   ├── participants/      # Participant management
│   │   ├── matches/           # Match management
│   │   └── admin/             # Admin-specific APIs
│   ├── admin/                 # Admin pages
│   │   ├── dashboard/         # Admin dashboard
│   │   ├── tournaments/       # Tournament management
│   │   └── analytics/         # Analytics dashboard
│   ├── player/                # Player pages
│   │   ├── dashboard/         # Player dashboard
│   │   └── matches/           # Player matches
│   └── tournaments/           # Public tournament pages
├── components/                # Reusable components
│   ├── layout/                # Layout components
│   └── ui/                    # UI components
└── lib/                       # Utilities and helpers

packages/schemas/
├── src/
│   ├── index.ts              # Main schemas
│   └── ui/                   # UI-specific types
```

## 🚀 Deployment

### Environment Variables
```env
MONGODB_URI=mongodb://localhost:27017
MONGODB_DATABASE=tourna-x
NODE_ENV=production
```

### Build Process
```bash
pnpm build          # Build all packages
pnpm dev            # Start development
pnpm start          # Start production
```

## 📈 Future Enhancements

### Phase 2 Features
- WhatsApp integration for notifications
- Payment gateway integration
- Advanced analytics and reporting
- Tournament templates
- Multi-language support
- Advanced scheduling algorithms

### Phase 3 Features
- Mobile app (React Native)
- Live streaming integration
- Social features
- Tournament marketplace
- Advanced statistics and AI insights

## 🔧 Development Guidelines

### Code Standards
- TypeScript strict mode
- ESLint configuration
- Prettier formatting
- Zod schema validation
- Error boundary handling

### Testing Strategy
- Unit tests for utilities
- Integration tests for APIs
- E2E tests for critical flows
- Performance testing

## 📞 Support

For technical support or feature requests, please refer to the project documentation or contact the development team.

---

**Version**: 1.0.0  
**Last Updated**: December 2024  
**Status**: Production Ready
