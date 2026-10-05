"use client";

import type { Card, Suit } from "shared";
import PlayingCard from "./PlayingCard";
import { cardMatches } from "./cardUtils";

interface Props {
  cards: Card[];
  currentCard: Card | null;
  currentSuit: Suit | null;
  isMyTurn: boolean;
  onPlayCard: (card: Card) => void;
}

export default function CardHand({ cards, currentCard, currentSuit, isMyTurn, onPlayCard }: Props) {
  // Sort hand by suit then value
  const sorted = [...cards].sort((a, b) => {
    const suitOrder = ["hearts", "diamonds", "clubs", "spades"];
    const valOrder = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A"];
    const sd = suitOrder.indexOf(a.suit) - suitOrder.indexOf(b.suit);
    if (sd !== 0) return sd;
    return valOrder.indexOf(a.value) - valOrder.indexOf(b.value);
  });

  return (
    <div className="flex justify-center items-end gap-1 flex-wrap py-2 px-4">
      {sorted.map((card, i) => {
        const playable = isMyTurn && currentCard !== null && currentSuit !== null &&
          cardMatches(card, currentCard, currentSuit);

        return (
          <div
            key={`${card.suit}-${card.value}-${i}`}
            className="transition-transform"
            style={{ marginLeft: i > 0 ? "-8px" : "0" }}
          >
            <PlayingCard
              card={card}
              playable={playable}
              onClick={() => playable && onPlayCard(card)}
            />
          </div>
        );
      })}
    </div>
  );
}
