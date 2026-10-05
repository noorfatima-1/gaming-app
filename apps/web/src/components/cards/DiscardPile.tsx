"use client";

import type { Card, Suit } from "shared";
import PlayingCard, { SuitSymbol } from "./PlayingCard";

interface Props {
  topCard: Card | null;
  currentSuit: Suit | null;
  drawPileCount: number;
  canDraw: boolean;
  onDraw: () => void;
}

export default function DiscardPile({ topCard, currentSuit, drawPileCount, canDraw, onDraw }: Props) {
  return (
    <div className="flex items-center gap-8 justify-center">
      {/* Draw pile */}
      <div className="text-center">
        <button
          onClick={onDraw}
          disabled={!canDraw}
          className={`w-16 h-24 rounded-lg bg-gradient-to-br from-blue-700 to-blue-900 border-2 border-blue-600 flex items-center justify-center transition-all ${
            canDraw ? "hover:scale-105 hover:shadow-lg cursor-pointer" : "opacity-50 cursor-default"
          }`}
        >
          <span className="text-white/60 text-xs font-bold">{drawPileCount}</span>
        </button>
        <p className="text-xs text-white/40 mt-1">Draw</p>
      </div>

      {/* Discard pile */}
      <div className="text-center">
        {topCard ? (
          <PlayingCard card={topCard} />
        ) : (
          <div className="w-16 h-24 rounded-lg border-2 border-dashed border-white/20" />
        )}
        <p className="text-xs text-white/40 mt-1">Discard</p>
      </div>

      {/* Current suit indicator */}
      {currentSuit && (
        <div className="text-center">
          <div className="w-16 h-24 rounded-lg bg-white/5 border border-white/20 flex items-center justify-center">
            <SuitSymbol suit={currentSuit} size="lg" />
          </div>
          <p className="text-xs text-white/40 mt-1">Play this</p>
        </div>
      )}
    </div>
  );
}
