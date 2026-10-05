"use client";

import { useSocket } from "../../hooks/useSocket";
import { useCardGameEvents } from "../../hooks/useCardGameEvents";
import { useCardGameStore } from "../../store/cardGameStore";
import { useGameStore } from "../../store/gameStore";
import CardHand from "./CardHand";
import DiscardPile from "./DiscardPile";
import SuitPicker from "./SuitPicker";
import OpponentHands from "./OpponentHands";
import type { Card, Suit } from "shared";

export default function CardGameScreen() {
  useCardGameEvents();
  const socket = useSocket();

  const room = useGameStore((s) => s.room);
  const myHand = useCardGameStore((s) => s.myHand);
  const discardTop = useCardGameStore((s) => s.discardTop);
  const currentSuit = useCardGameStore((s) => s.currentSuit);
  const currentPlayer = useCardGameStore((s) => s.currentPlayer);
  const handSizes = useCardGameStore((s) => s.handSizes);
  const drawPileCount = useCardGameStore((s) => s.drawPileCount);
  const turnTimeLeft = useCardGameStore((s) => s.turnTimeLeft);
  const showSuitPicker = useCardGameStore((s) => s.showSuitPicker);
  const setShowSuitPicker = useCardGameStore((s) => s.setShowSuitPicker);
  const pendingCard = useCardGameStore((s) => s.pendingCard);
  const setPendingCard = useCardGameStore((s) => s.setPendingCard);

  if (!room || !socket) return null;

  const myId = socket.id || "";
  const isMyTurn = currentPlayer === myId;
  const currentTurnPlayer = room.players.find((p) => p.id === currentPlayer);

  function handlePlayCard(card: Card) {
    if (card.value === "8") {
      // Show suit picker for wild 8s
      setPendingCard(card);
      setShowSuitPicker(true);
    } else {
      socket!.emit("cards:play", card);
    }
  }

  function handleSuitPick(suit: Suit) {
    if (pendingCard) {
      socket!.emit("cards:play", pendingCard, suit);
    }
    setShowSuitPicker(false);
    setPendingCard(null);
  }

  function handleDraw() {
    socket!.emit("cards:draw");
  }

  function handlePass() {
    socket!.emit("cards:pass");
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex flex-col">
      {/* Header */}
      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-bold">Crazy Eights</h2>
          <span className="text-sm text-white/40">Room: {room.id}</span>
        </div>
        <div className="flex items-center gap-3">
          {isMyTurn && (
            <button
              onClick={handlePass}
              className="px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-xs font-medium transition-colors"
            >
              Pass
            </button>
          )}
          <div className={`text-sm font-mono font-bold ${turnTimeLeft <= 5 ? "text-red-400" : "text-white/60"}`}>
            {turnTimeLeft}s
          </div>
        </div>
      </div>

      {/* Turn indicator */}
      <div className="text-center px-4 pb-2">
        <span className={`text-sm font-medium ${isMyTurn ? "text-yellow-400" : "text-white/60"}`}>
          {isMyTurn ? "Your turn!" : `${currentTurnPlayer?.username || "..."}'s turn`}
        </span>
      </div>

      {/* Opponents */}
      <div className="px-4 py-2">
        <OpponentHands
          players={room.players}
          handSizes={handSizes}
          currentPlayer={currentPlayer}
          myId={myId}
        />
      </div>

      {/* Center: Discard pile + Draw pile */}
      <div className="flex-1 flex items-center justify-center px-4">
        <DiscardPile
          topCard={discardTop}
          currentSuit={currentSuit}
          drawPileCount={drawPileCount}
          canDraw={isMyTurn}
          onDraw={handleDraw}
        />
      </div>

      {/* My hand */}
      <div className="bg-black/20 border-t border-white/10 pb-4 pt-2">
        <div className="text-center text-xs text-white/40 mb-1">
          Your hand ({myHand.length} cards)
        </div>
        <CardHand
          cards={myHand}
          currentCard={discardTop}
          currentSuit={currentSuit}
          isMyTurn={isMyTurn}
          onPlayCard={handlePlayCard}
        />
      </div>

      {/* Suit picker modal */}
      {showSuitPicker && <SuitPicker onPick={handleSuitPick} />}
    </div>
  );
}
