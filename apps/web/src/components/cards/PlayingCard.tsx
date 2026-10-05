"use client";

import type { Card } from "shared";

interface Props {
  card: Card;
  onClick?: () => void;
  playable?: boolean;
  small?: boolean;
  faceDown?: boolean;
}

const SUIT_SYMBOLS: Record<string, string> = {
  hearts: "\u2665",
  diamonds: "\u2666",
  clubs: "\u2663",
  spades: "\u2660",
};

const SUIT_COLORS: Record<string, string> = {
  hearts: "text-red-500",
  diamonds: "text-red-500",
  clubs: "text-white",
  spades: "text-white",
};

export default function PlayingCard({ card, onClick, playable = false, small = false, faceDown = false }: Props) {
  if (faceDown) {
    return (
      <div className={`${small ? "w-10 h-14" : "w-16 h-24"} rounded-lg bg-gradient-to-br from-blue-700 to-blue-900 border-2 border-blue-600 flex items-center justify-center`}>
        <div className={`${small ? "w-6 h-8" : "w-10 h-14"} rounded border border-blue-500/30 bg-blue-800/50`} />
      </div>
    );
  }

  const symbol = SUIT_SYMBOLS[card.suit];
  const color = SUIT_COLORS[card.suit];
  const isEight = card.value === "8";

  return (
    <button
      onClick={onClick}
      disabled={!playable}
      className={`
        ${small ? "w-10 h-14 text-xs" : "w-16 h-24 text-sm"}
        rounded-lg bg-white border-2 flex flex-col items-center justify-between p-1
        transition-all duration-200 select-none
        ${playable ? "cursor-pointer hover:-translate-y-2 hover:shadow-lg hover:shadow-purple-500/20 border-white/80" : "cursor-default border-white/40 opacity-70"}
        ${isEight ? "ring-2 ring-yellow-400/50" : ""}
      `}
    >
      <div className={`self-start font-bold ${color} ${small ? "text-[10px]" : "text-xs"}`}>
        {card.value}
      </div>
      <div className={`${color} ${small ? "text-lg" : "text-2xl"}`}>
        {symbol}
      </div>
      <div className={`self-end font-bold ${color} rotate-180 ${small ? "text-[10px]" : "text-xs"}`}>
        {card.value}
      </div>
    </button>
  );
}

// Suit symbol component for the suit picker
export function SuitSymbol({ suit, size = "md" }: { suit: string; size?: "sm" | "md" | "lg" }) {
  const sizeClasses = { sm: "text-lg", md: "text-3xl", lg: "text-5xl" };
  return (
    <span className={`${SUIT_COLORS[suit]} ${sizeClasses[size]}`}>
      {SUIT_SYMBOLS[suit]}
    </span>
  );
}
