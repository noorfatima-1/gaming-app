"use client";

import { create } from "zustand";
import type { UserProfile, Achievement, UserAchievement, GameHistoryEntry } from "shared";

interface UserState {
  profile: UserProfile | null;
  setProfile: (profile: UserProfile | null) => void;

  achievements: Achievement[];
  setAchievements: (a: Achievement[]) => void;

  userAchievements: UserAchievement[];
  setUserAchievements: (a: UserAchievement[]) => void;

  gameHistory: GameHistoryEntry[];
  setGameHistory: (h: GameHistoryEntry[]) => void;

  isLoading: boolean;
  setIsLoading: (v: boolean) => void;
}

export const useUserStore = create<UserState>((set) => ({
  profile: null,
  setProfile: (profile) => set({ profile }),

  achievements: [],
  setAchievements: (achievements) => set({ achievements }),

  userAchievements: [],
  setUserAchievements: (userAchievements) => set({ userAchievements }),

  gameHistory: [],
  setGameHistory: (gameHistory) => set({ gameHistory }),

  isLoading: false,
  setIsLoading: (isLoading) => set({ isLoading }),
}));
