# Tournament Management System

## Overview

TournamentPro is a comprehensive tournament management platform designed for badminton and tennis tournaments. It provides a mobile-first Progressive Web App (PWA) experience with admin tools for tournament creation and management, participant registration, fixture generation, live scoring, and WhatsApp group integration. The system supports multiple tournament formats (knockout, round robin, swiss) and categories (singles, doubles, mixed doubles) with comprehensive participant management and real-time scoring capabilities.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript using Vite as the build tool
- **UI Library**: Shadcn/UI components built on Radix UI primitives
- **Styling**: Tailwind CSS with CSS custom properties for theming
- **State Management**: TanStack Query (React Query) for server state management
- **Routing**: Wouter for lightweight client-side routing
- **Form Handling**: React Hook Form with Zod validation
- **PWA Features**: Service worker implementation with offline support and install prompts

### Backend Architecture
- **Runtime**: Node.js with Express.js server framework
- **Language**: TypeScript with ES modules
- **Database ORM**: Drizzle ORM with type-safe database operations
- **API Design**: RESTful API structure with comprehensive CRUD operations
- **Session Management**: Express sessions with PostgreSQL session store
- **Authentication**: Bcrypt for password hashing (user system prepared)

### Database Design
- **Primary Database**: PostgreSQL with Neon serverless connection
- **Schema Management**: Drizzle Kit for migrations and schema management
- **Key Entities**:
  - Users (authentication and authorization)
  - Tournaments (with comprehensive metadata)
  - Participants (with partner support for doubles)
  - Matches (with scoring and round tracking)
  - WhatsApp Groups (for community features)

### Mobile-First Design
- **Responsive Layout**: Desktop sidebar with mobile hamburger navigation
- **Touch Optimized**: Mobile bottom tab navigation for key functions
- **PWA Support**: Installable app with offline functionality
- **Performance**: Optimized for mobile networks and devices

### Real-Time Features
- **Live Scoring**: Real-time match score updates with set-by-set tracking
- **Tournament Progress**: Dynamic fixture generation and bracket visualization
- **Status Management**: Real-time tournament and participant status updates

## External Dependencies

### Database and Storage
- **Neon Database**: Serverless PostgreSQL hosting
- **Drizzle ORM**: Type-safe database operations and migrations

### UI and Styling
- **Radix UI**: Accessible component primitives
- **Tailwind CSS**: Utility-first CSS framework
- **Lucide React**: Icon library
- **Inter Font**: Typography via Google Fonts

### Development Tools
- **Vite**: Frontend build tool with HMR
- **TypeScript**: Type safety across the stack
- **ESBuild**: Backend bundling for production
- **Replit Integration**: Development environment optimizations

### Authentication and Security
- **Bcrypt**: Password hashing
- **Express Sessions**: Session management
- **Connect PG Simple**: PostgreSQL session store

### Form and Validation
- **React Hook Form**: Form state management
- **Zod**: Schema validation
- **Hookform Resolvers**: Integration between React Hook Form and Zod