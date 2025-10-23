# Tourna-X - Tournament Management System

A modern tournament management system built with Next.js v15, Express.js, MongoDB, and Turborepo.

## 🏗️ Architecture

This is a **Turborepo monorepo** with the following structure:

```
tourna-x/
├── apps/
│   ├── frontend/          # Next.js v15 application
│   └── backend/           # Express.js API server
├── packages/
│   ├── schemas/           # Shared MongoDB schemas
│   ├── ui/               # Shared UI components
│   ├── typescript-config/ # Shared TS configs
│   └── eslint-config/    # Shared ESLint configs
├── turbo.json            # Turborepo configuration
└── package.json          # Root package.json
```

## 🚀 Quick Start

### Prerequisites
- Node.js >= 20.x
- pnpm 9.0.0
- MongoDB (local or Atlas)

### Installation

1. **Install dependencies:**
   ```bash
   pnpm install
   ```

2. **Set up environment variables:**
   ```bash
   cp env.example .env
   ```
   
   Update `.env` with your MongoDB connection:
   ```env
   MONGODB_URI=mongodb://localhost:27017
   MONGODB_DATABASE=tourna-x
   ```

3. **Initialize database:**
   - Visit http://localhost:3000/init-db
   - Click "Initialize Database" button
   - This creates an admin user and sample tournament

4. **Start development:**
   ```bash
   pnpm dev
   ```

This will start:
- Frontend: http://localhost:3000 (with API routes)
- Backend: http://localhost:3001 (placeholder only)

## 📦 Available Scripts

- `pnpm dev` - Start all apps in development mode
- `pnpm build` - Build all apps for production
- `pnpm lint` - Lint all packages
- `pnpm check-types` - Type check all packages
- `pnpm db:init` - Initialize database with sample data

## 🗄️ Database

The application uses **MongoDB** with the following collections:
- `users` - User accounts and authentication
- `tournaments` - Tournament information
- `participants` - Player registrations
- `matches` - Match fixtures and results
- `whatsapp_groups` - Community groups

## 🎨 Frontend (Next.js v15)

- **Framework:** Next.js v15 with App Router
- **Styling:** Tailwind CSS with custom themes
- **UI Components:** Radix UI primitives
- **State Management:** Zustand
- **Data Fetching:** TanStack Query

## 🔧 Backend (Express.js - Placeholder)

- **Framework:** Express.js (placeholder only)
- **API:** All APIs handled by Next.js API routes
- **Database:** MongoDB with native driver
- **Validation:** Zod schemas

## 🎯 Features

- ✅ Tournament creation and management
- ✅ Player registration system
- ✅ Match fixture generation
- ✅ Live scoring system
- ✅ WhatsApp group management
- ✅ Admin dashboard
- ✅ Mobile-responsive design
- ✅ PWA support

## 🔐 Default Credentials

After running `pnpm db:init`:
- **Username:** admin
- **Password:** admin123

## 📱 PWA Support

The frontend includes Progressive Web App features:
- Service worker for offline functionality
- App manifest for installation
- Mobile-optimized UI

## 🎨 Theming

The app includes multiple themes:
- **Default:** Clean and professional
- **EduVibrant:** Colorful and playful
- **StudyZen:** Calm and focused

## 🚀 Deployment

### Frontend (Vercel)
```bash
pnpm build:frontend
```

### Backend (Railway/Render)
```bash
pnpm build:backend
```

## 📄 License

MIT License - see LICENSE file for details.
