import type { Card, Suit, CardValue } from "shared";

const SUITS: Suit[] = ["hearts", "diamonds", "clubs", "spades"];
const VALUES: CardValue[] = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A"];

export function createDeck(): Card[] {
  const deck: Card[] = [];
  for (const suit of SUITS) {
    for (const value of VALUES) {
      deck.push({ suit, value });
    }
  }
  return deck;
}

// Fisher-Yates shuffle
export function shuffle<T>(arr: T[]): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export function dealHands(
  deck: Card[],
  playerCount: number,
  handSize: number
): { hands: Card[][]; remaining: Card[] } {
  const remaining = [...deck];
  const hands: Card[][] = [];

  for (let i = 0; i < playerCount; i++) {
    hands.push(remaining.splice(0, handSize));
  }

  return { hands, remaining };
}

export function cardMatches(card: Card, topCard: Card, currentSuit: Suit): boolean {
  // Eights are always playable (wild)
  if (card.value === "8") return true;
  // Match suit (using currentSuit which may differ from topCard after a wild 8)
  if (card.suit === currentSuit) return true;
  // Match value
  if (card.value === topCard.value) return true;
  return false;
}
