"use client";

import { create } from "zustand";
import type { Friendship, Notification } from "shared";

interface SocialState {
  friends: Friendship[];
  setFriends: (f: Friendship[]) => void;

  onlineFriends: Set<string>;
  setFriendOnline: (userId: string) => void;
  setFriendOffline: (userId: string) => void;

  notifications: Notification[];
  setNotifications: (n: Notification[]) => void;
  addNotification: (n: Notification) => void;
  markRead: (id: string) => void;
  unreadCount: number;
}

export const useSocialStore = create<SocialState>((set, get) => ({
  friends: [],
  setFriends: (friends) => set({ friends }),

  onlineFriends: new Set(),
  setFriendOnline: (userId) =>
    set((state) => {
      const next = new Set(state.onlineFriends);
      next.add(userId);
      return { onlineFriends: next };
    }),
  setFriendOffline: (userId) =>
    set((state) => {
      const next = new Set(state.onlineFriends);
      next.delete(userId);
      return { onlineFriends: next };
    }),

  notifications: [],
  setNotifications: (notifications) =>
    set({ notifications, unreadCount: notifications.filter((n) => !n.is_read).length }),
  addNotification: (n) =>
    set((state) => ({
      notifications: [n, ...state.notifications],
      unreadCount: state.unreadCount + 1,
    })),
  markRead: (id) =>
    set((state) => ({
      notifications: state.notifications.map((n) => (n.id === id ? { ...n, is_read: true } : n)),
      unreadCount: Math.max(0, state.unreadCount - 1),
    })),

  unreadCount: 0,
}));
