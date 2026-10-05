"use client";

import Link from "next/link";
import type { LeaderboardEntry } from "shared";

interface Props {
  entries: LeaderboardEntry[];
  isLoading?: boolean;
}

export default function LeaderboardTable({ entries, isLoading }: Props) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="bg-white/5 rounded-lg h-14 animate-pulse" />
        ))}
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="text-center py-8 text-white/40">
        No players on the leaderboard yet.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {entries.map((entry, index) => (
        <Link
          key={entry.user_id}
          href={`/profile/${entry.user_id}`}
          className="bg-white/5 hover:bg-white/10 rounded-lg p-3 flex items-center gap-3 transition-colors block"
        >
          {/* Rank */}
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
            index === 0 ? "bg-yellow-500/20 text-yellow-400" :
            index === 1 ? "bg-gray-400/20 text-gray-300" :
            index === 2 ? "bg-amber-600/20 text-amber-500" :
            "bg-white/10 text-white/40"
          }`}>
            {index + 1}
          </div>

          {/* Avatar + Name */}
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-xs font-bold shrink-0">
            {entry.avatar_url ? (
              <img src={entry.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
            ) : (
              entry.username?.charAt(0).toUpperCase() || "?"
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium truncate">{entry.display_name || entry.username}</div>
            <div className="text-xs text-white/40">Level {entry.level}</div>
          </div>

          {/* Stats */}
          <div className="hidden sm:flex gap-6 text-right">
            <div>
              <div className="text-sm font-bold">{entry.games_played}</div>
              <div className="text-xs text-white/40">Games</div>
            </div>
            <div>
              <div className="text-sm font-bold text-yellow-400">{entry.wins}</div>
              <div className="text-xs text-white/40">Wins</div>
            </div>
          </div>

          {/* Score */}
          <div className="text-right">
            <div className="text-sm font-bold text-purple-400">{entry.total_score}</div>
            <div className="text-xs text-white/40">Total</div>
          </div>
        </Link>
      ))}
    </div>
  );
}
