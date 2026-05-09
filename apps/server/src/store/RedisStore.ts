import Redis from "ioredis";
import { Player, Room, Stroke } from "shared";

export interface RoomState extends Room {
  wordOptions: string[];
  guessedPlayers: Set<string>;
  turnStartTime: number;
  turnTimer: ReturnType<typeof setTimeout> | null;
  hintTimers: ReturnType<typeof setTimeout>[];
  wordChooseTimer: ReturnType<typeof setTimeout> | null;
  timerInterval: ReturnType<typeof setInterval> | null;
  strokes: Stroke[];
  drawerOrder: string[];
  currentDrawerIndex: number;
  usedWords: Set<string>;
  guessOrder: number;
  currentHint: string;
}

// Data that gets saved to Redis (no timers — those can't be serialized)
interface RoomData {
  id: string;
  host: string;
  players: Player[];
  status: "lobby" | "playing" | "finished";
  currentDrawer: string | null;
  secretWord: string | null;
  round: number;
  totalRounds: number;
  maxPlayers: number;
  wordOptions: string[];
  guessedPlayers: string[];
  turnStartTime: number;
  strokes: Stroke[];
  drawerOrder: string[];
  currentDrawerIndex: number;
  usedWords: string[];
  guessOrder: number;
  currentHint: string;
}

function roomStateToData(room: RoomState): RoomData {
  return {
    id: room.id,
    host: room.host,
    players: room.players,
    status: room.status,
    currentDrawer: room.currentDrawer,
    secretWord: room.secretWord,
    round: room.round,
    totalRounds: room.totalRounds,
    maxPlayers: room.maxPlayers,
    wordOptions: room.wordOptions,
    guessedPlayers: Array.from(room.guessedPlayers),
    turnStartTime: room.turnStartTime,
    strokes: room.strokes,
    drawerOrder: room.drawerOrder,
    currentDrawerIndex: room.currentDrawerIndex,
    usedWords: Array.from(room.usedWords),
    guessOrder: room.guessOrder,
    currentHint: room.currentHint,
  };
}

function dataToRoomState(data: RoomData): RoomState {
  return {
    ...data,
    guessedPlayers: new Set(data.guessedPlayers),
    usedWords: new Set(data.usedWords),
    // Timers can't be restored — they'll be null after restart
    turnTimer: null,
    hintTimers: [],
    wordChooseTimer: null,
    timerInterval: null,
  };
}

const ROOM_PREFIX = "room:";
const PLAYER_PREFIX = "player:";
const ROOM_TTL = 3600; // 1 hour — auto-cleanup inactive rooms

class RedisBackedStore {
  private redis: Redis;
  // Local cache for fast synchronous access (game logic needs this)
  private rooms: Map<string, RoomState> = new Map();
  private playerToRoom: Map<string, string> = new Map();
  private connected = false;

  constructor() {
    const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";
    this.redis = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      retryStrategy(times) {
        if (times > 3) return null; // stop retrying after 3 attempts
        return Math.min(times * 500, 2000);
      },
      lazyConnect: true,
    });

    let errorLogged = false;

    this.redis.on("connect", () => {
      console.log("Redis connected");
      this.connected = true;
      errorLogged = false;
    });

    this.redis.on("error", () => {
      // Suppress repeated errors — logged once on first failure
      if (!errorLogged) errorLogged = true;
    });

    this.redis.on("close", () => {
      if (this.connected) {
        this.connected = false;
        console.log("Redis disconnected — using local cache only");
      }
    });
  }

  // Persist room to Redis (fire-and-forget for speed)
  private persistRoom(room: RoomState): void {
    if (!this.connected) return;
    const data = JSON.stringify(roomStateToData(room));
    this.redis
      .setex(`${ROOM_PREFIX}${room.id}`, ROOM_TTL, data)
      .catch((err) => console.error("Redis persist error:", err.message));
  }

  // Persist player-to-room mapping
  private persistPlayer(playerId: string, roomId: string): void {
    if (!this.connected) return;
    this.redis
      .setex(`${PLAYER_PREFIX}${playerId}`, ROOM_TTL, roomId)
      .catch((err) => console.error("Redis persist error:", err.message));
  }

  // Remove from Redis
  private removeFromRedis(key: string): void {
    if (!this.connected) return;
    this.redis.del(key).catch(() => {});
  }

  // Load all rooms from Redis on startup
  async hydrate(): Promise<void> {
    // Try connecting (lazyConnect mode)
    try {
      await this.redis.connect();
    } catch {
      console.log("Redis not available — using local memory only (data won't persist across restarts)");
      return;
    }

    if (!this.connected) {
      return;
    }

    try {
      const keys = await this.redis.keys(`${ROOM_PREFIX}*`);
      let loaded = 0;

      for (const key of keys) {
        const data = await this.redis.get(key);
        if (!data) continue;

        const roomData: RoomData = JSON.parse(data);

        // Skip finished games
        if (roomData.status === "finished") {
          await this.redis.del(key);
          continue;
        }

        // If game was mid-play, reset to lobby (timers are gone after restart)
        if (roomData.status === "playing") {
          roomData.status = "lobby";
          roomData.currentDrawer = null;
          roomData.secretWord = null;
          roomData.strokes = [];
          roomData.guessedPlayers = [];
          roomData.wordOptions = [];
          roomData.guessOrder = 0;
          roomData.currentHint = "";
        }

        const room = dataToRoomState(roomData);
        this.rooms.set(room.id, room);
        room.players.forEach((p) => this.playerToRoom.set(p.id, room.id));
        loaded++;
      }

      console.log(`Loaded ${loaded} rooms from Redis`);
    } catch (err) {
      console.error("Failed to hydrate from Redis:", err);
    }
  }

  createRoom(roomId: string, hostId: string, username: string, userId?: string): RoomState {
    const host: Player = {
      id: hostId,
      userId,
      username,
      avatar: "",
      score: 0,
    };

    const room: RoomState = {
      id: roomId,
      host: hostId,
      players: [host],
      status: "lobby",
      currentDrawer: null,
      secretWord: null,
      round: 0,
      totalRounds: 5,
      maxPlayers: 8,
      wordOptions: [],
      guessedPlayers: new Set(),
      turnStartTime: 0,
      turnTimer: null,
      hintTimers: [],
      wordChooseTimer: null,
      timerInterval: null,
      strokes: [],
      drawerOrder: [],
      currentDrawerIndex: 0,
      usedWords: new Set(),
      guessOrder: 0,
      currentHint: "",
    };

    this.rooms.set(roomId, room);
    this.playerToRoom.set(hostId, roomId);

    this.persistRoom(room);
    this.persistPlayer(hostId, roomId);

    return room;
  }

  joinRoom(roomId: string, playerId: string, username: string, userId?: string): RoomState | null {
    const room = this.rooms.get(roomId);
    if (!room) return null;
    if (room.players.length >= room.maxPlayers) return null;
    if (room.status !== "lobby") return null;

    const player: Player = {
      id: playerId,
      userId,
      username,
      avatar: "",
      score: 0,
    };

    room.players.push(player);
    this.playerToRoom.set(playerId, roomId);

    this.persistRoom(room);
    this.persistPlayer(playerId, roomId);

    return room;
  }

  leaveRoom(playerId: string): { room: RoomState | null; removedPlayer: Player | null } {
    const roomId = this.playerToRoom.get(playerId);
    if (!roomId) return { room: null, removedPlayer: null };

    const room = this.rooms.get(roomId);
    if (!room) return { room: null, removedPlayer: null };

    const removedPlayer = room.players.find((p) => p.id === playerId) || null;
    room.players = room.players.filter((p) => p.id !== playerId);
    this.playerToRoom.delete(playerId);
    this.removeFromRedis(`${PLAYER_PREFIX}${playerId}`);

    if (room.players.length === 0) {
      this.deleteRoom(roomId);
      return { room: null, removedPlayer };
    }

    // If host left, assign new host
    if (room.host === playerId) {
      room.host = room.players[0].id;
    }

    this.persistRoom(room);
    return { room, removedPlayer };
  }

  getRoom(roomId: string): RoomState | null {
    return this.rooms.get(roomId) || null;
  }

  getRoomByPlayer(playerId: string): RoomState | null {
    const roomId = this.playerToRoom.get(playerId);
    if (!roomId) return null;
    return this.rooms.get(roomId) || null;
  }

  deleteRoom(roomId: string): void {
    const room = this.rooms.get(roomId);
    if (room) {
      // Clear all timers
      if (room.turnTimer) clearTimeout(room.turnTimer);
      if (room.wordChooseTimer) clearTimeout(room.wordChooseTimer);
      if (room.timerInterval) clearInterval(room.timerInterval);
      room.hintTimers.forEach((t) => clearTimeout(t));

      // Remove player mappings
      room.players.forEach((p) => {
        this.playerToRoom.delete(p.id);
        this.removeFromRedis(`${PLAYER_PREFIX}${p.id}`);
      });
      this.rooms.delete(roomId);
      this.removeFromRedis(`${ROOM_PREFIX}${roomId}`);
    }
  }

  getPlayer(playerId: string): Player | null {
    const room = this.getRoomByPlayer(playerId);
    if (!room) return null;
    return room.players.find((p) => p.id === playerId) || null;
  }

  // Sync current room state to Redis (call after important state changes)
  syncRoom(roomId: string): void {
    const room = this.rooms.get(roomId);
    if (room) this.persistRoom(room);
  }

  // Graceful shutdown
  async shutdown(): Promise<void> {
    // Persist all rooms one last time
    for (const room of this.rooms.values()) {
      const data = JSON.stringify(roomStateToData(room));
      try {
        await this.redis.setex(`${ROOM_PREFIX}${room.id}`, ROOM_TTL, data);
      } catch {
        // Best effort
      }
    }
    this.redis.disconnect();
    console.log("Redis store shut down");
  }
}

export const store = new RedisBackedStore();
