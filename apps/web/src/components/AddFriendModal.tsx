"use client";

import { useState } from "react";
import { api } from "../lib/api";
import type { UserProfile } from "shared";

interface Props {
  onClose: () => void;
  onSent: () => void;
}

export default function AddFriendModal({ onClose, onSent }: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<UserProfile[]>([]);
  const [searching, setSearching] = useState(false);
  const [sentIds, setSentIds] = useState<Set<string>>(new Set());

  async function handleSearch() {
    if (query.length < 2) return;
    setSearching(true);
    try {
      const data = await api.searchUsers(query);
      setResults(data as UserProfile[]);
    } catch (err) {
      console.error("Search failed:", err);
    } finally {
      setSearching(false);
    }
  }

  async function handleSend(userId: string) {
    try {
      await api.sendFriendRequest(userId);
      setSentIds((prev) => new Set(Array.from(prev).concat(userId)));
      onSent();
    } catch (err) {
      console.error("Failed to send request:", err);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4" onClick={onClose}>
      <div className="glass-card rounded-2xl p-6 w-full max-w-md space-y-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">Add Friend</h2>
          <button onClick={onClose} className="text-white/40 hover:text-white">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex gap-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder="Search by username..."
            className="flex-1 bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-500"
          />
          <button
            onClick={handleSearch}
            disabled={searching || query.length < 2}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 rounded-lg text-sm font-medium transition-colors"
          >
            {searching ? "..." : "Search"}
          </button>
        </div>

        <div className="space-y-2 max-h-64 overflow-y-auto">
          {results.length === 0 && !searching && query.length >= 2 && (
            <p className="text-sm text-white/40 text-center py-4">No users found</p>
          )}
          {results.map((user) => (
            <div key={user.id} className="bg-white/5 rounded-lg p-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-xs font-bold">
                  {user.display_name?.charAt(0).toUpperCase() || "?"}
                </div>
                <div>
                  <div className="text-sm font-medium">{user.display_name}</div>
                  <div className="text-xs text-white/40">Level {user.level}</div>
                </div>
              </div>
              <button
                onClick={() => handleSend(user.id)}
                disabled={sentIds.has(user.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  sentIds.has(user.id)
                    ? "bg-green-600/20 text-green-400"
                    : "bg-purple-600 hover:bg-purple-700"
                }`}
              >
                {sentIds.has(user.id) ? "Sent" : "Add"}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
