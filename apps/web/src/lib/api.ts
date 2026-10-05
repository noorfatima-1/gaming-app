import { createClient } from "./supabase-browser";

const API_URL = process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:4000";

async function apiFetch<T = unknown>(path: string, options: RequestInit = {}): Promise<T> {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();

  const res = await fetch(`${API_URL}/api${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(session ? { Authorization: `Bearer ${session.access_token}` } : {}),
      ...options.headers,
    },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `API error: ${res.status}`);
  }

  return res.json();
}

// ============================================
// API Methods
// ============================================
export const api = {
  // Profiles
  getProfile: (id: string) =>
    apiFetch(`/profiles/${id}`),
  updateProfile: (data: { display_name?: string; bio?: string; avatar_url?: string }) =>
    apiFetch("/profiles/me", { method: "PATCH", body: JSON.stringify(data) }),

  // Leaderboard
  getLeaderboard: (game?: string, limit?: number) =>
    apiFetch(`/leaderboard?game=${game || ""}&limit=${limit || 50}`),

  // Game History
  getHistory: (userId: string, page = 1, limit = 20) =>
    apiFetch(`/history/${userId}?page=${page}&limit=${limit}`),

  // Friends
  getFriends: () =>
    apiFetch("/friends"),
  sendFriendRequest: (addresseeId: string) =>
    apiFetch("/friends", { method: "POST", body: JSON.stringify({ addressee_id: addresseeId }) }),
  respondFriendRequest: (id: string, status: "accepted" | "declined") =>
    apiFetch(`/friends/${id}`, { method: "PATCH", body: JSON.stringify({ status }) }),

  // Notifications
  getNotifications: (limit?: number) =>
    apiFetch(`/notifications?limit=${limit || 30}`),
  markNotificationRead: (id: string) =>
    apiFetch(`/notifications/${id}/read`, { method: "PATCH" }),
  markAllNotificationsRead: () =>
    apiFetch("/notifications/read-all", { method: "PATCH" }),

  // Achievements
  getAllAchievements: () =>
    apiFetch("/achievements"),
  getUserAchievements: (userId: string) =>
    apiFetch(`/achievements/${userId}`),

  // Search
  searchUsers: (query: string) =>
    apiFetch(`/search/users?q=${encodeURIComponent(query)}`),

  // Account
  deleteAccount: () =>
    apiFetch("/profiles/me", { method: "DELETE" }),
  uploadAvatar: (avatar_data: string, content_type: string) =>
    apiFetch<{ avatar_url: string }>("/profiles/me/avatar", {
      method: "POST",
      body: JSON.stringify({ avatar_data, content_type }),
    }),

  // Admin
  getAdminStats: () =>
    apiFetch("/admin/stats"),
  getAdminUsers: (page = 1) =>
    apiFetch(`/admin/users?page=${page}`),
  getAdminGames: (page = 1) =>
    apiFetch(`/admin/games?page=${page}`),
};
