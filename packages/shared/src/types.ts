// ============================================
// Game Types
// ============================================
export type GameType = "draw-and-guess" | "crazy-eights";

// ============================================
// Player & Room
// ============================================
export interface Player {
  id: string;
  userId?: string; // Supabase auth user ID
  username: string;
  avatar: string;
  score: number;
}

export interface Room {
  id: string;
  host: string;
  players: Player[];
  status: "lobby" | "playing" | "finished";
  gameType: GameType;
  currentDrawer: string | null;
  secretWord: string | null;
  round: number;
  totalRounds: number;
  maxPlayers: number;
}

// ============================================
// Drawing Types
// ============================================
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

// ============================================
// Card Game Types
// ============================================
export type Suit = "hearts" | "diamonds" | "clubs" | "spades";
export type CardValue = "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "10" | "J" | "Q" | "K" | "A";

export interface Card {
  suit: Suit;
  value: CardValue;
}

export interface CrazyEightsState {
  currentCard: Card;
  currentSuit: Suit;
  currentPlayer: string;
  direction: 1 | -1;
  handSizes: Record<string, number>;
  myHand: Card[];
  drawPileCount: number;
  lastAction: string;
}

// ============================================
// User & Social Types
// ============================================
export interface UserProfile {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  bio: string;
  level: number;
  xp: number;
  coins: number;
  is_online: boolean;
  last_seen: string;
  created_at: string;
}

export interface Friendship {
  id: string;
  requester_id: string;
  addressee_id: string;
  status: "pending" | "accepted" | "declined" | "blocked";
  created_at: string;
  friend?: UserProfile;
}

export interface Notification {
  id: string;
  type: "friend_request" | "game_invite" | "achievement" | "system";
  title: string;
  body: string;
  data: Record<string, unknown>;
  is_read: boolean;
  created_at: string;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  xp_reward: number;
  category: string;
}

export interface UserAchievement {
  achievement_id: string;
  unlocked_at: string;
  achievement?: Achievement;
}

// ============================================
// Leaderboard & History
// ============================================
export interface LeaderboardEntry {
  user_id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  level: number;
  games_played: number;
  total_score: number;
  best_score: number;
  wins: number;
  avg_score: number;
}

export interface GameHistoryEntry {
  id: string;
  room_id: string;
  game_type: GameType;
  played_at: string;
  rounds: number;
  player_count: number;
  duration_seconds: number | null;
  player_score: number;
  player_rank: number;
}

// ============================================
// Socket Events - Client sends to Server
// ============================================
export interface ClientEvents {
  // Room events
  "room:create": (username: string, gameType: GameType, userId?: string) => void;
  "room:join": (roomId: string, username: string, userId?: string) => void;
  "room:leave": () => void;
  // Draw & Guess events
  "game:start": () => void;
  "game:word-choice": (word: string) => void;
  "game:draw": (stroke: Stroke) => void;
  "game:guess": (guess: string) => void;
  "game:undo": () => void;
  "game:clear-canvas": () => void;
  // Card game events
  "cards:play": (card: Card, chosenSuit?: Suit) => void;
  "cards:draw": () => void;
  "cards:pass": () => void;
  // Chat events
  "chat:message": (message: string) => void;
  "lobby:chat": (message: string) => void;
  // Social events
  "social:set-online": (userId: string) => void;
  "social:invite": (friendId: string, roomId: string, gameType: GameType) => void;
}

// ============================================
// Socket Events - Server sends to Client
// ============================================
export interface ServerEvents {
  // Room events
  "room:created": (room: Room) => void;
  "room:joined": (room: Room) => void;
  "room:player-joined": (player: Player) => void;
  "room:player-left": (playerId: string) => void;
  // Draw & Guess events
  "game:started": () => void;
  "game:word-options": (words: string[]) => void;
  "game:turn-start": (drawerId: string, wordLength: number) => void;
  "game:draw": (stroke: Stroke) => void;
  "game:undo": () => void;
  "game:clear-canvas": () => void;
  "game:guess-result": (playerId: string, correct: boolean) => void;
  "game:hint": (hint: string) => void;
  "game:scores": (scores: Record<string, number>) => void;
  "game:turn-end": (word: string, scores: Record<string, number>) => void;
  "game:over": (scores: Record<string, number>) => void;
  "game:timer": (timeLeft: number) => void;
  // Card game events
  "cards:state": (state: CrazyEightsState) => void;
  "cards:played": (playerId: string, card: Card, newSuit: Suit) => void;
  "cards:drew": (playerId: string, newHandSize: number) => void;
  "cards:your-hand": (cards: Card[]) => void;
  "cards:turn": (playerId: string, timeLeft: number) => void;
  "cards:invalid": (reason: string) => void;
  // Chat events
  "chat:message": (playerId: string, username: string, message: string) => void;
  "lobby:chat": (userId: string, username: string, message: string) => void;
  // Social events
  "social:friend-online": (userId: string) => void;
  "social:friend-offline": (userId: string) => void;
  "social:invite-received": (data: { fromUser: UserProfile; roomId: string; gameType: GameType }) => void;
  "notification:new": (notification: Notification) => void;
  // Error
  error: (message: string) => void;
}
