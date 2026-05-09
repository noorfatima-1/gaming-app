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

class MemoryStore {
  private rooms: Map<string, RoomState> = new Map();
  private playerToRoom: Map<string, string> = new Map();

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

    if (room.players.length === 0) {
      this.deleteRoom(roomId);
      return { room: null, removedPlayer };
    }

    // If host left, assign new host
    if (room.host === playerId) {
      room.host = room.players[0].id;
    }

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
      room.players.forEach((p) => this.playerToRoom.delete(p.id));
      this.rooms.delete(roomId);
    }
  }

  getPlayer(playerId: string): Player | null {
    const room = this.getRoomByPlayer(playerId);
    if (!room) return null;
    return room.players.find((p) => p.id === playerId) || null;
  }
}

export const store = new MemoryStore();
