# Gaming App - Learning Progress

## Project Decisions (Final)

- **Game 1:** Draw & Guess (like Skribbl.io) — 4-8 players per room
- **Game 2:** Card Game (build later)
- **Frontend:** Next.js 14 + HTML5 Canvas API + Tailwind + shadcn/ui
- **Real-time:** Socket.IO (WebSocket + Long Polling fallback)
- **Game Server:** Node.js + Express (Railway)
- **RAM/Cache:** Redis (Railway) — live game state
- **Database:** Supabase (Full — DB + Auth + Realtime + Storage + Edge Functions)
- **Auth:** Supabase Auth (Google, Discord, Email)
- **Deploy Frontend:** Vercel
- **Deploy Backend:** Railway (Game Server + Redis)
- **Monitoring:** Sentry

---

## Architecture Diagram

```
Frontend (Vercel - Next.js)
        |
        | WebSocket (Socket.IO)
        v
Game Server (Railway - Node.js)
        |
   +---------+
   |         |
   v         v
Redis      Supabase
(RAM)      (Database + Auth + Storage)
```

---

## Topics Explained (Completed)

### Topic 1: What is a Web App
- A program that runs in the browser (Chrome, Firefox)
- No download needed — just open a URL
- Our game = a website people open and play on
- Works on phone, laptop, tablet

### Topic 2: What is Frontend
- Everything the player SEES and TOUCHES
- Built with HTML (structure) + CSS (style) + JavaScript (behavior)
- Runs on the player's device in their browser
- In our game: login page, lobby, canvas, chat, scoreboard

### Topic 3: What is Backend (Server)
- The brain that runs behind the scenes — players never see it
- Controls game logic, validates actions, prevents cheating
- One backend serves ALL players
- Server = a computer always ON (24/7) in a data center
- Built with Node.js + Express + Socket.IO

### Topic 4: What is Next.js
- A tool built on top of React to build websites faster
- React = library to build UI with reusable components (LEGO blocks)
- Next.js adds: easy routing (create file = new page), SSR (fast page loads), SEO
- SSR = server builds page first, player sees it instantly (no blank screen)
- Same language (JavaScript) as backend

### Topic 5: What is Canvas (HTML5 Canvas API)
- A blank drawing area in the browser
- Canvas API = ready-made commands to draw (lines, circles, fill color, clear)
- Drawing = hundreds of tiny lines (points) connected together
- We send POINTS to server (not images) — lightweight and fast
- Tools: brush, eraser, color picker, size slider, fill, undo, clear

### Topic 6: What is WebSocket & Socket.IO
- Normal HTTP = send request, get response, connection closes (like letters)
- WebSocket = permanent open connection (like a phone call) — instant both ways
- Socket.IO = library on top of WebSocket that adds:
  - Auto-reconnect (if internet drops)
  - Rooms (group players together)
  - Named events (organized messages)
  - Fallback to Long Polling if WebSocket is blocked
- Long Polling = client calls server, server holds line until there's data
- Socket.IO picks the best method automatically — you write code ONCE
- You give data to Socket.IO, it decides how to deliver it

### Topic 7: What is a Game Server
- The REFEREE of the game — controls everything
- Players send ACTIONS (drew a line, typed a guess)
- Server decides OUTCOMES (correct/wrong, points awarded)
- Server is ALWAYS right (server authoritative) — prevents cheating
- Manages: rooms, turns, timer, scoring, word selection, round flow
- Runs on Railway (cloud computer, always on)

### Topic 8: What is Redis (RAM/Memory)
- RAM = super fast temporary memory (like your desk)
- Hard Disk/Database = slower permanent storage (like a bookshelf)
- Redis = a database that lives in RAM (0.1ms vs 5-50ms)
- Stores LIVE game data: room state, strokes, scores, secret word
- Temporary — data deleted after game ends
- TTL = auto-delete after set time (cleanup inactive rooms)
- Redis for DURING game (fast), Supabase for AFTER game (permanent)

---

### Topic 9: What is Supabase (Database)
- Supabase = a service that gives you a ready-to-use database + extra tools
- Uses PostgreSQL (popular, free, reliable database) under the hood
- SQL = language to talk to databases; PostgreSQL = one software that speaks SQL
- Supabase gives us: Database, Auth, Storage, Realtime, Edge Functions — all-in-one
- We store permanent data: player profiles, game history, scores, leaderboards
- Supabase dashboard lets you manage tables by clicking (no commands needed at first)

### Topic 10: What is Authentication (Auth)
- Authentication = proving WHO you are (like showing ID)
- Authorization = what you're ALLOWED to do (like a key card for your room only)
- Supabase Auth handles login for us: Google, Discord, Email
- After login, player gets a TOKEN (like a concert wristband)
- Player sends token with every action → server checks it → prevents faking identity
- We never see player's Google/Discord password — they handle it

### Topic 11: What is a Room System
- Room = a separate game session (like a table at a restaurant)
- Room lifecycle: Create → Wait → Start → Play → End → Destroy
- Room stores: players, host, scores, drawer, secret word, timer, status — all in Redis
- Join by: Room Code (friends share it) or Quick Join (matchmaking)
- Host = room creator, can start game and kick players
- Socket.IO has built-in rooms — messages only go to players in that group

### Topic 12: How Draw & Guess Game Works
- One player draws, others guess by typing in chat
- Turn: server sends 3 words → drawer picks one → draws for 60s → others guess
- Correct guess: guesser gets points (faster = more), drawer also gets points
- Hints: server reveals letters over time (e.g., _ _ _ → e _ _ → e _ t)
- Round = every player draws once; game = multiple rounds (e.g., 5)
- Game over → save results to Supabase, delete room from Redis
- Server controls EVERYTHING (word selection, scoring, timing) — anti-cheat
- Stroke = one continuous line (mouse down → move → mouse up), stored as points

### Topic 13: What is an API
- API = middleman between two systems (like a waiter between you and kitchen)
- Request (what you ask) + Response (what you get back)
- Methods: GET (read), POST (create), PUT (update), DELETE (remove)
- Status codes: 200 OK, 404 Not Found, 401 Unauthorized, 500 Server Error
- Our game: API for slow one-time things (login, leaderboard, profile)
- Socket.IO for fast real-time things (drawing, guessing, timer)

### Topic 14: What is Deployment (Vercel + Railway)
- Deployment = putting code on the internet for everyone to use
- localhost = your computer only; deployment = cloud servers, 24/7, anyone can access
- Frontend (Next.js) → Vercel (fast page loading, CDN worldwide)
- Backend (Node.js + Socket.IO + Redis) → Railway (long-running server, WebSockets)
- CDN = copies of your site around the world (nearest server = fastest)
- Flow: push code to GitHub → Vercel & Railway auto-deploy → live in minutes
- CI/CD = automatic deploy when you push new code

### Topic 15: What is Production Level
- Production level = app is serious, reliable, ready for real users (not a school project)
- Key areas: reliability (auto-restart), security (tokens, validation), performance (Redis, CDN), error handling (friendly messages), monitoring (Sentry alerts), env variables (hide secrets), data integrity (no data loss)

### Topic 16: What is Architecture
- Architecture = blueprint/plan of how all parts connect
- Separation of concerns: each part has ONE job
- Client-Server model: client asks → server decides → server tells everyone
- Layers: Frontend → Communication (API/Socket.IO) → Game Logic → Data (Redis/Supabase)
- Good architecture = easy to add features, find bugs, and add Game 2 later

### Topic 17: What is a Monorepo
- Monorepo = all code in ONE repo (apps/web, apps/server, packages/shared)
- Shared code keeps frontend and backend in sync (same constants, types)
- npm workspaces manages multiple apps from one root folder
- One push to GitHub → Vercel takes frontend, Railway takes backend

### Topic 18: What is Security & Anti-Cheat
- Never trust the client — server decides everything
- Token auth (expires), input validation, rate limiting, CORS
- Secret word only sent to drawer, server checks all guesses
- Environment variables hide API keys from code/GitHub

### Topic 19: What is Scaling
- Vertical = bigger server, Horizontal = more servers
- 1 server handles ~5000 players — enough to start
- Load balancer = traffic cop for multiple servers
- Shared Redis = shared brain between servers
- Build clean architecture now, scale when needed

### Topic 20: What is Monitoring
- Monitoring = security cameras for your app (Sentry)
- Tracks errors (what, where, when), performance (speed), usage (player count)
- Sentry catches errors automatically, sends alerts, shows full details
- Added to both frontend and backend, one dashboard for all
- Logging for development, Sentry for production

## Topics Remaining
- Topic 16: What is Architecture
- Topic 17: What is Monorepo (project structure)
- Topic 18: What is Security & Anti-Cheat
- Topic 19: What is Scaling
- Topic 20: What is Monitoring
- Topic 21: Full picture — how everything connects

---

## Key Rules Decided

1. Server is authoritative — never trust the client
2. Strokes sent as points (not images) — lightweight
3. Redis for speed during game, Supabase for permanent storage
4. Socket.IO handles transport automatically (WebSocket or Long Polling)
5. One server is enough to start (handles ~5000 players)
6. Start with Game 1, add Game 2 later
