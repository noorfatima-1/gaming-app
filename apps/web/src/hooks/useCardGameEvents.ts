"use client";

import { useEffect } from "react";
import { useSocket } from "./useSocket";
import { useCardGameStore } from "../store/cardGameStore";
import { useGameStore } from "../store/gameStore";
import type { Card, Suit, CrazyEightsState } from "shared";

export function useCardGameEvents() {
  const socket = useSocket();
  const updateFromState = useCardGameStore((s) => s.updateFromState);
  const setMyHand = useCardGameStore((s) => s.setMyHand);
  const setTurnTimeLeft = useCardGameStore((s) => s.setTurnTimeLeft);
  const addToast = useGameStore((s) => s.addToast);

  useEffect(() => {
    if (!socket) return;

    const handleState = (state: CrazyEightsState) => {
      updateFromState(state);
    };

    const handleYourHand = (cards: Card[]) => {
      setMyHand(cards);
    };

    const handlePlayed = (_playerId: string, _card: Card, _newSuit: Suit) => {
      // Visual feedback handled by state update
    };

    const handleDrew = (_playerId: string, _newHandSize: number) => {
      // Visual feedback handled by state update
    };

    const handleTurn = (_playerId: string, timeLeft: number) => {
      setTurnTimeLeft(timeLeft);
    };

    const handleInvalid = (reason: string) => {
      addToast(reason, "error");
    };

    socket.on("cards:state", handleState);
    socket.on("cards:your-hand", handleYourHand);
    socket.on("cards:played", handlePlayed);
    socket.on("cards:drew", handleDrew);
    socket.on("cards:turn", handleTurn);
    socket.on("cards:invalid", handleInvalid);

    return () => {
      socket.off("cards:state", handleState);
      socket.off("cards:your-hand", handleYourHand);
      socket.off("cards:played", handlePlayed);
      socket.off("cards:drew", handleDrew);
      socket.off("cards:turn", handleTurn);
      socket.off("cards:invalid", handleInvalid);
    };
  }, [socket, updateFromState, setMyHand, setTurnTimeLeft, addToast]);
}
