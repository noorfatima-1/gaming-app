import type { Card, Suit } from "shared";

export function cardMatches(card: Card, topCard: Card, currentSuit: Suit): boolean {
  if (card.value === "8") return true;
  if (card.suit === currentSuit) return true;
  if (card.value === topCard.value) return true;
  return false;
}
