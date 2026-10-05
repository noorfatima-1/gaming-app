"use client";

import type { Suit } from "shared";
import { SuitSymbol } from "./PlayingCard";

interface Props {
  onPick: (suit: Suit) => void;
}

const SUITS: Suit[] = ["hearts", "diamonds", "clubs", "spades"];
const SUIT_NAMES: Record<Suit, string> = {
  hearts: "Hearts",
  diamonds: "Diamonds",
  clubs: "Clubs",
  spades: "Spades",
};

export default function SuitPicker({ onPick }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="glass-card rounded-2xl p-6 w-full max-w-xs">
        <h3 className="text-lg font-bold text-center mb-4">Pick a Suit</h3>
        <div className="grid grid-cols-2 gap-3">
          {SUITS.map((suit) => (
            <button
              key={suit}
              onClick={() => onPick(suit)}
              className="bg-white/10 hover:bg-white/20 rounded-xl p-4 flex flex-col items-center gap-2 transition-colors"
            >
              <SuitSymbol suit={suit} size="lg" />
              <span className="text-xs font-medium">{SUIT_NAMES[suit]}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
