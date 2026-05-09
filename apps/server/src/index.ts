import dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.resolve(__dirname, "../.env") });

import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import helmet from "helmet";
import { v4 as uuidv4 } from "uuid";
import { ClientEvents, ServerEvents } from "shared";
import { store } from "./store/RedisStore";
import { GameManager } from "./game/GameManager";
import { initSentry, Sentry } from "./lib/sentry";
import { rateLimiter, RATE_LIMITS } from "./lib/rateLimiter";
import { sanitizeString, isValidUsername, isValidRoomCode, isValidGuess } from "./lib/validation";

initSentry();

const app = express();
const httpServer = createServer(app);

const allowedOrigins = (process.env.CLIENT_URL || "http://localhost:3000").split(",");

const io = new Server<ClientEvents, ServerEvents>(httpServer, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
  },
  // Security: limit payload size
  maxHttpBufferSize: 1e6, // 1MB max per message
});

app.use(helmet());
app.use(cors({ origin: allowedOrigins }));
app.use(express.json({ limit: "1mb" }));

// Health check
app.get("/health", (_req, res) => {
  res.json({ status: "ok", message: "Game server is running" });
});

const gameManager = new GameManager(io as any);

io.on("connection", (socket) => {
  console.log(`Player connected: ${socket.id}`);

  // Create a new room
  socket.on("room:create", (username: string, userId?: string) => {
    if (!rateLimiter.check(`create:${socket.id}`, RATE_LIMITS.roomCreate.max, RATE_LIMITS.roomCreate.windowMs)) {
      socket.emit("error", "Too many requests. Slow down!");
      return;
    }

    const cleanName = sanitizeString(username, 20);
    if (!cleanName || !isValidUsername(cleanName)) {
      socket.emit("error", "Username is required (1-20 characters)");
      return;
    }

    const roomId = uuidv4().slice(0, 6).toUpperCase();
    const room = store.createRoom(roomId, socket.id, cleanName, userId);

    socket.join(roomId);
    socket.emit("room:created", {
      id: room.id,
      host: room.host,
      players: room.players,
      status: room.status,
      currentDrawer: room.currentDrawer,
      secretWord: null,
      round: room.round,
      totalRounds: room.totalRounds,
      maxPlayers: room.maxPlayers,
    });

    console.log(`Room ${roomId} created by ${cleanName} (${socket.id})`);
  });

  // Join an existing room
  socket.on("room:join", (roomId: string, username: string, userId?: string) => {
    if (!rateLimiter.check(`join:${socket.id}`, RATE_LIMITS.roomJoin.max, RATE_LIMITS.roomJoin.windowMs)) {
      socket.emit("error", "Too many requests. Slow down!");
      return;
    }

    const cleanName = sanitizeString(username, 20);
    if (!cleanName || !isValidUsername(cleanName)) {
      socket.emit("error", "Username is required (1-20 characters)");
      return;
    }
    if (!isValidRoomCode(roomId)) {
      socket.emit("error", "Invalid room code");
      return;
    }

    const normalizedId = roomId.trim().toUpperCase();
    const room = store.joinRoom(normalizedId, socket.id, cleanName, userId);

    if (!room) {
      socket.emit("error", "Room not found, is full, or game already started");
      return;
    }

    socket.join(normalizedId);

    const roomData = {
      id: room.id,
      host: room.host,
      players: room.players,
      status: room.status,
      currentDrawer: room.currentDrawer,
      secretWord: null,
      round: room.round,
      totalRounds: room.totalRounds,
      maxPlayers: room.maxPlayers,
    };

    socket.emit("room:joined", roomData);

    const newPlayer = room.players.find((p) => p.id === socket.id);
    if (newPlayer) {
      socket.to(normalizedId).emit("room:player-joined", newPlayer);
    }

    console.log(`${cleanName} (${socket.id}) joined room ${normalizedId}`);
  });

  // Leave room
  socket.on("room:leave", () => {
    const { roomId, username } = gameManager.handlePlayerDisconnect(socket.id);
    if (roomId) {
      socket.leave(roomId);
      console.log(`${username} (${socket.id}) left room ${roomId}`);
    }
  });

  // Start game (host only)
  socket.on("game:start", () => {
    if (!rateLimiter.check(`start:${socket.id}`, RATE_LIMITS.gameStart.max, RATE_LIMITS.gameStart.windowMs)) {
      return;
    }

    const room = store.getRoomByPlayer(socket.id);
    if (!room) {
      socket.emit("error", "You are not in a room");
      return;
    }

    const success = gameManager.startGame(room.id, socket.id);
    if (!success) {
      socket.emit("error", "Cannot start game. Are you the host? Do you have enough players?");
    }
  });

  // Drawer picks a word
  socket.on("game:word-choice", (word: string) => {
    if (typeof word !== "string") return;

    const room = store.getRoomByPlayer(socket.id);
    if (!room) return;

    const success = gameManager.handleWordChoice(room.id, socket.id, word);
    if (!success) {
      socket.emit("error", "Invalid word choice");
    }
  });

  // Drawer sends a stroke
  socket.on("game:draw", (stroke) => {
    if (!rateLimiter.check(`draw:${socket.id}`, RATE_LIMITS.draw.max, RATE_LIMITS.draw.windowMs)) {
      return; // silently drop excess strokes
    }
    gameManager.handleDraw(socket.id, stroke);
  });

  // Drawer undoes last stroke
  socket.on("game:undo", () => {
    gameManager.handleUndo(socket.id);
  });

  // Drawer clears canvas
  socket.on("game:clear-canvas", () => {
    gameManager.handleClearCanvas(socket.id);
  });

  // Player guesses
  socket.on("game:guess", (guess: string) => {
    if (!rateLimiter.check(`guess:${socket.id}`, RATE_LIMITS.guess.max, RATE_LIMITS.guess.windowMs)) {
      socket.emit("error", "Slow down! You're guessing too fast.");
      return;
    }

    const cleanGuess = sanitizeString(guess, 50);
    if (!cleanGuess || !isValidGuess(cleanGuess)) return;
    gameManager.handleGuess(socket.id, cleanGuess);
  });

  // Disconnect
  socket.on("disconnect", () => {
    const { roomId, username } = gameManager.handlePlayerDisconnect(socket.id);
    if (roomId) {
      console.log(`${username} (${socket.id}) disconnected from room ${roomId}`);
    } else {
      console.log(`Player disconnected: ${socket.id}`);
    }
  });
});

// Graceful shutdown — save state to Redis before exit
async function shutdown(signal: string) {
  console.log(`\n${signal} received — shutting down gracefully...`);
  await store.shutdown();
  httpServer.close(() => {
    console.log("Server closed");
    process.exit(0);
  });
  // Force exit after 5 seconds if cleanup hangs
  setTimeout(() => process.exit(1), 5000);
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

const PORT = parseInt(process.env.PORT || "4000", 10);

// Hydrate from Redis, then start the server
store.hydrate().then(() => {
  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Game server running on 0.0.0.0:${PORT}`);
  });
});
