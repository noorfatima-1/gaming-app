"use client";

import type { Player } from "shared";

interface Props {
  players: Player[];
  handSizes: Record<string, number>;
  currentPlayer: string | null;
  myId: string;
}

export default function OpponentHands({ players, handSizes, currentPlayer, myId }: Props) {
  const opponents = players.filter((p) => p.id !== myId);

  return (
    <div className="flex justify-center gap-4 flex-wrap">
      {opponents.map((player) => {
        const cardCount = handSizes[player.id] || 0;
        const isCurrentTurn = currentPlayer === player.id;

        return (
          <div
            key={player.id}
            className={`text-center p-3 rounded-xl transition-all ${
              isCurrentTurn ? "bg-yellow-500/20 ring-2 ring-yellow-500/50" : "bg-white/5"
            }`}
          >
            <div className="w-10 h-10 mx-auto rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-sm font-bold mb-1">
              {player.username.charAt(0).toUpperCase()}
            </div>
            <div className="text-xs font-medium truncate max-w-[80px]">{player.username}</div>
            <div className="flex justify-center gap-0.5 mt-1">
              {Array.from({ length: Math.min(cardCount, 10) }).map((_, i) => (
                <div
                  key={i}
                  className="w-3 h-4 rounded-sm bg-gradient-to-br from-blue-600 to-blue-800 border border-blue-500/50"
                />
              ))}
            </div>
            <div className="text-[10px] text-white/40 mt-0.5">{cardCount} cards</div>
          </div>
        );
      })}
    </div>
  );
}
