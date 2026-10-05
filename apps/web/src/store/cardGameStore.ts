"use client";

import { create } from "zustand";
import type { Card, Suit, CrazyEightsState } from "shared";

interface CardGameState {
  myHand: Card[];
  setMyHand: (cards: Card[]) => void;

  discardTop: Card | null;
  currentSuit: Suit | null;
  currentPlayer: string | null;
  handSizes: Record<string, number>;
  drawPileCount: number;
  direction: 1 | -1;

  showSuitPicker: boolean;
  setShowSuitPicker: (val: boolean) => void;
  pendingCard: Card | null;
  setPendingCard: (card: Card | null) => void;

  turnTimeLeft: number;
  setTurnTimeLeft: (t: number) => void;

  updateFromState: (state: CrazyEightsState) => void;

  resetCardGame: () => void;
}

export const useCardGameStore = create<CardGameState>((set) => ({
  myHand: [],
  setMyHand: (myHand) => set({ myHand }),

  discardTop: null,
  currentSuit: null,
  currentPlayer: null,
  handSizes: {},
  drawPileCount: 0,
  direction: 1,

  showSuitPicker: false,
  setShowSuitPicker: (showSuitPicker) => set({ showSuitPicker }),
  pendingCard: null,
  setPendingCard: (pendingCard) => set({ pendingCard }),

  turnTimeLeft: 0,
  setTurnTimeLeft: (turnTimeLeft) => set({ turnTimeLeft }),

  updateFromState: (state) =>
    set({
      myHand: state.myHand,
      discardTop: state.currentCard,
      currentSuit: state.currentSuit,
      currentPlayer: state.currentPlayer,
      handSizes: state.handSizes,
      drawPileCount: state.drawPileCount,
      direction: state.direction,
    }),

  resetCardGame: () =>
    set({
      myHand: [],
      discardTop: null,
      currentSuit: null,
      currentPlayer: null,
      handSizes: {},
      drawPileCount: 0,
      direction: 1,
      showSuitPicker: false,
      pendingCard: null,
      turnTimeLeft: 0,
    }),
}));
