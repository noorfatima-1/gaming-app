import { describe, it } from "node:test";
import assert from "node:assert";
import { createDeck, shuffle, dealHands, cardMatches } from "../game/Deck";

describe("createDeck", () => {
  it("creates a standard 52-card deck", () => {
    const deck = createDeck();
    assert.strictEqual(deck.length, 52);
  });

  it("has 4 suits with 13 cards each", () => {
    const deck = createDeck();
    const suits = new Set(deck.map((c) => c.suit));
    assert.strictEqual(suits.size, 4);

    for (const suit of suits) {
      const suitCards = deck.filter((c) => c.suit === suit);
      assert.strictEqual(suitCards.length, 13);
    }
  });

  it("has no duplicate cards", () => {
    const deck = createDeck();
    const keys = deck.map((c) => `${c.suit}-${c.value}`);
    const uniqueKeys = new Set(keys);
    assert.strictEqual(uniqueKeys.size, 52);
  });
});

describe("shuffle", () => {
  it("returns same number of elements", () => {
    const deck = createDeck();
    const shuffled = shuffle(deck);
    assert.strictEqual(shuffled.length, 52);
  });

  it("does not mutate original array", () => {
    const original = [1, 2, 3, 4, 5];
    const copy = [...original];
    shuffle(original);
    assert.deepStrictEqual(original, copy);
  });

  it("contains all original elements", () => {
    const deck = createDeck();
    const shuffled = shuffle(deck);
    const originalKeys = deck.map((c) => `${c.suit}-${c.value}`).sort();
    const shuffledKeys = shuffled.map((c) => `${c.suit}-${c.value}`).sort();
    assert.deepStrictEqual(shuffledKeys, originalKeys);
  });
});

describe("dealHands", () => {
  it("deals correct number of cards per hand", () => {
    const deck = createDeck();
    const { hands, remaining } = dealHands(deck, 4, 7);
    assert.strictEqual(hands.length, 4);
    for (const hand of hands) {
      assert.strictEqual(hand.length, 7);
    }
    assert.strictEqual(remaining.length, 52 - 28);
  });

  it("does not mutate original deck", () => {
    const deck = createDeck();
    const originalLength = deck.length;
    dealHands(deck, 2, 5);
    assert.strictEqual(deck.length, originalLength);
  });
});

describe("cardMatches", () => {
  it("eights always match (wild)", () => {
    const eight = { suit: "hearts" as const, value: "8" as const };
    const top = { suit: "spades" as const, value: "K" as const };
    assert.strictEqual(cardMatches(eight, top, "spades"), true);
    assert.strictEqual(cardMatches(eight, top, "clubs"), true);
  });

  it("matches by current suit", () => {
    const card = { suit: "hearts" as const, value: "5" as const };
    const top = { suit: "spades" as const, value: "K" as const };
    // currentSuit is hearts (e.g., after a wild 8 pick)
    assert.strictEqual(cardMatches(card, top, "hearts"), true);
    assert.strictEqual(cardMatches(card, top, "spades"), false);
  });

  it("matches by value", () => {
    const card = { suit: "hearts" as const, value: "K" as const };
    const top = { suit: "spades" as const, value: "K" as const };
    assert.strictEqual(cardMatches(card, top, "spades"), true);
  });

  it("rejects non-matching card", () => {
    const card = { suit: "hearts" as const, value: "5" as const };
    const top = { suit: "spades" as const, value: "K" as const };
    assert.strictEqual(cardMatches(card, top, "spades"), false);
  });
});
