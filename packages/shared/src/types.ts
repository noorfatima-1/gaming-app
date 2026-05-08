// Player
export interface Player {
  id: string;
  username: string;
  avatar: string;
  score: number;
}

// Room
export interface Room {
  id: string;
  host: string;
  players: Player[];
  status: "lobby" | "playing" | "finished";
  currentDrawer: string | null;
  secretWord: string | null;
  round: number;
  totalRounds: number;
  maxPlayers: number;
}

// Stroke (drawing data)
export interface Point {
  x: number;
  y: number;
}

export interface Stroke {
  points: Point[];
  color: string;
  thickness: number;
  tool: "brush" | "eraser";
}

// Socket Events - Client sends to Server
export interface ClientEvents {
  "room:create": (username: string) => void;
  "room:join": (roomId: string, username: string) => void;
  "room:leave": () => void;
  "game:start": () => void;
  "game:word-choice": (word: string) => void;
  "game:draw": (stroke: Stroke) => void;
  "game:guess": (guess: string) => void;
}

// Socket Events - Server sends to Client
export interface ServerEvents {
  "room:created": (room: Room) => void;
  "room:joined": (room: Room) => void;
  "room:player-joined": (player: Player) => void;
  "room:player-left": (playerId: string) => void;
  "game:started": () => void;
  "game:word-options": (words: string[]) => void;
  "game:turn-start": (drawerId: string, wordLength: number) => void;
  "game:draw": (stroke: Stroke) => void;
  "game:guess-result": (playerId: string, correct: boolean) => void;
  "game:hint": (hint: string) => void;
  "game:turn-end": (word: string, scores: Record<string, number>) => void;
  "game:over": (scores: Record<string, number>) => void;
  "error": (message: string) => void;
}
