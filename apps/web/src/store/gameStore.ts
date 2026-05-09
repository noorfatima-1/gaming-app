"use client";

import { create } from "zustand";
import type { Player, Room, Stroke } from "shared";

export type Screen = "home" | "lobby" | "game" | "results";

interface ChatMessage {
  id: string;
  playerId: string;
  username: string;
  text: string;
  isSystem?: boolean;
  isCorrect?: boolean;
}

interface GameState {
  // Navigation
  screen: Screen;
  setScreen: (screen: Screen) => void;

  // User
  username: string;
  setUsername: (name: string) => void;
  userId: string | null;
  setUserId: (id: string | null) => void;

  // Room
  room: Room | null;
  setRoom: (room: Room | null) => void;
  isHost: boolean;
  setIsHost: (val: boolean) => void;
  updatePlayers: (players: Player[]) => void;
  addPlayer: (player: Player) => void;
  removePlayer: (playerId: string) => void;

  // Game
  isDrawer: boolean;
  setIsDrawer: (val: boolean) => void;
  wordOptions: string[];
  setWordOptions: (words: string[]) => void;
  currentWord: string | null;
  setCurrentWord: (word: string | null) => void;
  wordHint: string;
  setWordHint: (hint: string) => void;
  timeLeft: number;
  setTimeLeft: (t: number) => void;
  totalTime: number;
  setTotalTime: (t: number) => void;

  // Drawing
  strokes: Stroke[];
  addStroke: (stroke: Stroke) => void;
  undoStroke: () => void;
  clearStrokes: () => void;

  // Guessed tracking
  guessedPlayers: string[];
  addGuessedPlayer: (id: string) => void;
  clearGuessedPlayers: () => void;

  // Chat
  messages: ChatMessage[];
  addMessage: (msg: ChatMessage) => void;

  // Scores
  scores: Record<string, number>;
  setScores: (scores: Record<string, number>) => void;
  showScoreboard: boolean;
  setShowScoreboard: (val: boolean) => void;

  // Toasts
  toasts: { id: string; message: string; type: "error" | "success" | "info" }[];
  addToast: (message: string, type: "error" | "success" | "info") => void;
  removeToast: (id: string) => void;

  // Reset
  resetGame: () => void;
  resetAll: () => void;
}

export const useGameStore = create<GameState>((set) => ({
  screen: "home",
  setScreen: (screen) => set({ screen }),

  username: "",
  setUsername: (username) => set({ username }),
  userId: null,
  setUserId: (userId) => set({ userId }),

  room: null,
  setRoom: (room) => set({ room }),
  isHost: false,
  setIsHost: (isHost) => set({ isHost }),
  updatePlayers: (players) =>
    set((state) => (state.room ? { room: { ...state.room, players } } : {})),
  addPlayer: (player) =>
    set((state) =>
      state.room
        ? { room: { ...state.room, players: [...state.room.players, player] } }
        : {}
    ),
  removePlayer: (playerId) =>
    set((state) =>
      state.room
        ? {
            room: {
              ...state.room,
              players: state.room.players.filter((p) => p.id !== playerId),
            },
          }
        : {}
    ),

  isDrawer: false,
  setIsDrawer: (isDrawer) => set({ isDrawer }),
  wordOptions: [],
  setWordOptions: (wordOptions) => set({ wordOptions }),
  currentWord: null,
  setCurrentWord: (currentWord) => set({ currentWord }),
  wordHint: "",
  setWordHint: (wordHint) => set({ wordHint }),
  timeLeft: 0,
  setTimeLeft: (timeLeft) => set({ timeLeft }),
  totalTime: 80,
  setTotalTime: (totalTime) => set({ totalTime }),

  strokes: [],
  addStroke: (stroke) =>
    set((state) => ({ strokes: [...state.strokes, stroke] })),
  undoStroke: () =>
    set((state) => ({ strokes: state.strokes.slice(0, -1) })),
  clearStrokes: () => set({ strokes: [] }),

  guessedPlayers: [],
  addGuessedPlayer: (id) =>
    set((state) => ({
      guessedPlayers: state.guessedPlayers.includes(id)
        ? state.guessedPlayers
        : [...state.guessedPlayers, id],
    })),
  clearGuessedPlayers: () => set({ guessedPlayers: [] }),

  messages: [],
  addMessage: (msg) =>
    set((state) => ({ messages: [...state.messages, msg] })),

  scores: {},
  setScores: (scores) => set({ scores }),
  showScoreboard: false,
  setShowScoreboard: (showScoreboard) => set({ showScoreboard }),

  toasts: [],
  addToast: (message, type) =>
    set((state) => ({
      toasts: [...state.toasts, { id: Date.now().toString(), message, type }],
    })),
  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),

  resetGame: () =>
    set({
      isDrawer: false,
      wordOptions: [],
      currentWord: null,
      wordHint: "",
      timeLeft: 0,
      strokes: [],
      messages: [],
      scores: {},
      guessedPlayers: [],
      showScoreboard: false,
    }),

  resetAll: () =>
    set({
      screen: "home",
      room: null,
      isHost: false,
      showScoreboard: false,
      isDrawer: false,
      wordOptions: [],
      currentWord: null,
      wordHint: "",
      timeLeft: 0,
      strokes: [],
      messages: [],
      scores: {},
      guessedPlayers: [],
    }),
}));
