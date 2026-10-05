"use client";

import { useEffect, useState } from "react";
import { api } from "../../lib/api";
import LeaderboardTable from "../../components/LeaderboardTable";
import type { LeaderboardEntry } from "shared";

type GameFilter = "" | "draw-and-guess" | "crazy-eights";

export default function LeaderboardPage() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [gameFilter, setGameFilter] = useState<GameFilter>("");

  useEffect(() => {
    loadLeaderboard();
  }, [gameFilter]);

  async function loadLeaderboard() {
    setLoading(true);
    try {
      const data = await api.getLeaderboard(gameFilter || undefined);
      setEntries(data as LeaderboardEntry[]);
    } catch (err) {
      console.error("Failed to load leaderboard:", err);
    } finally {
      setLoading(false);
    }
  }

  const filters: { label: string; value: GameFilter }[] = [
    { label: "All Games", value: "" },
    { label: "Draw & Guess", value: "draw-and-guess" },
    { label: "Crazy Eights", value: "crazy-eights" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 pt-20 pb-8 px-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-black gradient-text mb-6">Leaderboard</h1>

        {/* Game filter tabs */}
        <div className="flex gap-2 mb-6">
          {filters.map((f) => (
            <button
              key={f.value}
              onClick={() => setGameFilter(f.value)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                gameFilter === f.value
                  ? "bg-purple-600 text-white"
                  : "bg-white/10 text-white/60 hover:bg-white/20"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <LeaderboardTable entries={entries} isLoading={loading} />
      </div>
    </div>
  );
}
