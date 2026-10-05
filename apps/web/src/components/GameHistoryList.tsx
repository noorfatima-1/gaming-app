"use client";

import type { GameHistoryEntry } from "shared";

interface Props {
  history: GameHistoryEntry[];
  isLoading?: boolean;
}

export default function GameHistoryList({ history, isLoading }: Props) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white/5 rounded-lg h-16 animate-pulse" />
        ))}
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="text-center py-8 text-white/40">
        No games played yet. Start playing to see your history!
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {history.map((game) => (
        <div key={game.id} className="bg-white/5 rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg ${
              game.game_type === "draw-and-guess"
                ? "bg-purple-500/20 text-purple-400"
                : "bg-blue-500/20 text-blue-400"
            }`}>
              {game.game_type === "draw-and-guess" ? (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25z" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14z" />
                </svg>
              )}
            </div>
            <div>
              <div className="text-sm font-medium">
                {game.game_type === "draw-and-guess" ? "Draw & Guess" : "Crazy Eights"}
              </div>
              <div className="text-xs text-white/40">
                {new Date(game.played_at).toLocaleDateString()} - {game.player_count} players
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className={`text-sm font-bold ${
              game.player_rank === 1 ? "text-yellow-400" :
              game.player_rank === 2 ? "text-gray-300" :
              game.player_rank === 3 ? "text-amber-600" : "text-white/60"
            }`}>
              #{game.player_rank}
            </div>
            <div className="text-xs text-white/40">{game.player_score} pts</div>
          </div>
        </div>
      ))}
    </div>
  );
}
