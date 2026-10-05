// ============================================
// Game Types
// ============================================
export const GAME_TYPES = {
  DRAW_AND_GUESS: "draw-and-guess" as const,
  CRAZY_EIGHTS: "crazy-eights" as const,
};

// ============================================
// Draw & Guess Settings
// ============================================
export const MIN_PLAYERS = 4;
export const MAX_PLAYERS = 8;
export const TOTAL_ROUNDS = 5;

// Timer settings (in seconds)
export const DRAWING_TIME = 60;
export const WORD_CHOOSE_TIME = 10;

// Scoring
export const SCORES = {
  FIRST_GUESS: 100,
  SECOND_GUESS: 80,
  THIRD_GUESS: 60,
  LATE_GUESS: 40,
  DRAWER_PER_GUESS: 20,
};

// Hint settings
export const HINT_REVEAL_TIMES = [20, 40]; // seconds after turn starts

// ============================================
// Crazy Eights Settings
// ============================================
export const CRAZY_EIGHTS = {
  INITIAL_HAND_SIZE: 7,
  MAX_PLAYERS: 6,
  MIN_PLAYERS: 2,
  TURN_TIME: 30, // seconds per turn
};

// ============================================
// XP & Leveling
// ============================================
export const XP_PER_LEVEL = 100;
export const XP_REWARDS = {
  GAME_PLAYED: 10,
  GAME_WON: 25,
  CORRECT_GUESS: 5,
};
