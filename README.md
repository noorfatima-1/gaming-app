# NoorGameZone

Multiplayer gaming platform with real-time Draw & Guess and Crazy Eights card games.

## Tech Stack

- **Frontend**: Next.js 14, React 18, Tailwind CSS, Zustand, Framer Motion, Socket.IO Client
- **Backend**: Express, Socket.IO, Redis (state persistence), Supabase (auth + database)
- **Shared**: TypeScript types and constants package
- **Monitoring**: Sentry error tracking
- **Deployment**: Vercel (web), Railway (server + Redis)

## Project Structure

```
gaming-app/
  apps/
    web/          # Next.js frontend
    server/       # Express + Socket.IO backend
  packages/
    shared/       # Shared types & constants
```

## Getting Started

### Prerequisites

- Node.js 18+
- A Supabase project (free tier works)
- Redis (local or cloud, optional for dev)

### 1. Install dependencies

```bash
npm install
```

### 2. Set up environment variables

Copy the example env files:

```bash
cp apps/server/.env.example apps/server/.env
cp apps/web/.env.example apps/web/.env.local
```

Fill in your Supabase URL, keys, and optional Redis/Sentry config.

### 3. Set up the database

Run `supabase-schema-v2.sql` in your Supabase SQL editor to create all tables, views, and seed data.

### 4. Run locally

```bash
# Start both web and server
npm run dev

# Or run separately
npm run dev:web     # http://localhost:3000
npm run dev:server  # http://localhost:4000
```

### 5. Build for production

```bash
npm run build
npm run start:server
```

## Games

- **Draw & Guess** (3-8 players): Take turns drawing while others guess the word
- **Crazy Eights** (2-6 players): Classic card game - match suit or value, 8s are wild

## Features

- Supabase auth (email/password)
- Real-time multiplayer via WebSockets
- Friends system with online status
- Leaderboard and game history
- Achievements and XP/leveling
- Notifications (friend requests, game invites)
- Admin dashboard
- Sound effects (Web Audio API)
- Mobile-responsive design
