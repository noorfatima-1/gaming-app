import { Server } from "socket.io";
import { Card, Suit, ClientEvents, ServerEvents, CrazyEightsState } from "shared";
import { CRAZY_EIGHTS } from "shared";
import { createDeck, shuffle, dealHands, cardMatches } from "./Deck";
import { store } from "../store/RedisStore";
import { getSupabase } from "../lib/supabase";
import { checkAchievements } from "../lib/achievements";

interface CrazyEightsRoom {
  hands: Map<string, Card[]>;
  drawPile: Card[];
  discardPile: Card[];
  currentPlayer: string;
  currentSuit: Suit;
  playerOrder: string[];
  direction: 1 | -1;
  turnTimer: ReturnType<typeof setTimeout> | null;
  timerInterval: ReturnType<typeof setInterval> | null;
  turnTimeLeft: number;
  hasDrawn: boolean; // Whether current player has drawn this turn
  gameStartTime: number;
}

const crazyEightsRooms: Map<string, CrazyEightsRoom> = new Map();

export class CrazyEightsManager {
  private io: Server<ClientEvents, ServerEvents>;

  constructor(io: Server<ClientEvents, ServerEvents>) {
    this.io = io;
  }

  startGame(roomId: string): boolean {
    const room = store.getRoom(roomId);
    if (!room || room.status !== "lobby") return false;
    if (room.players.length < CRAZY_EIGHTS.MIN_PLAYERS) return false;

    // Create deck and deal
    const deck = shuffle(createDeck());
    const playerIds = room.players.map((p) => p.id);
    const { hands, remaining } = dealHands(deck, playerIds.length, CRAZY_EIGHTS.INITIAL_HAND_SIZE);

    // Find a non-8 card to start the discard pile
    let startCardIndex = 0;
    while (remaining[startCardIndex]?.value === "8" && startCardIndex < remaining.length) {
      startCardIndex++;
    }
    const startCard = remaining.splice(startCardIndex, 1)[0];

    const playerHands = new Map<string, Card[]>();
    playerIds.forEach((id, i) => playerHands.set(id, hands[i]));

    const ceRoom: CrazyEightsRoom = {
      hands: playerHands,
      drawPile: remaining,
      discardPile: [startCard],
      currentPlayer: playerIds[0],
      currentSuit: startCard.suit,
      playerOrder: playerIds,
      direction: 1,
      turnTimer: null,
      timerInterval: null,
      turnTimeLeft: CRAZY_EIGHTS.TURN_TIME,
      hasDrawn: false,
      gameStartTime: Date.now(),
    };

    crazyEightsRooms.set(roomId, ceRoom);

    // Update room status
    room.status = "playing";
    room.round = 1;
    store.syncRoom(roomId);

    // Notify game started
    this.io.to(roomId).emit("game:started");

    // Send each player their hand
    for (const [playerId, hand] of playerHands) {
      this.io.to(playerId).emit("cards:your-hand", hand);
    }

    // Send initial state to all
    this.broadcastState(roomId);
    this.startTurnTimer(roomId);

    return true;
  }

  handlePlayCard(roomId: string, playerId: string, card: Card, chosenSuit?: Suit): boolean {
    const ceRoom = crazyEightsRooms.get(roomId);
    if (!ceRoom) return false;
    if (ceRoom.currentPlayer !== playerId) return false;

    const hand = ceRoom.hands.get(playerId);
    if (!hand) return false;

    // Find the card in hand
    const cardIndex = hand.findIndex((c) => c.suit === card.suit && c.value === card.value);
    if (cardIndex === -1) return false;

    const topCard = ceRoom.discardPile[ceRoom.discardPile.length - 1];
    if (!cardMatches(card, topCard, ceRoom.currentSuit)) {
      this.io.to(playerId).emit("cards:invalid", "Card doesn't match current suit or value");
      return false;
    }

    // Play the card
    hand.splice(cardIndex, 1);
    ceRoom.discardPile.push(card);
    ceRoom.hasDrawn = false;

    // Handle wild 8
    if (card.value === "8" && chosenSuit) {
      ceRoom.currentSuit = chosenSuit;
    } else {
      ceRoom.currentSuit = card.suit;
    }

    // Notify all players
    this.io.to(roomId).emit("cards:played", playerId, card, ceRoom.currentSuit);

    // Send updated hand to player
    this.io.to(playerId).emit("cards:your-hand", hand);

    // Check win condition
    if (hand.length === 0) {
      this.endGame(roomId, playerId);
      return true;
    }

    // Next turn
    this.advanceTurn(roomId);
    return true;
  }

  handleDrawCard(roomId: string, playerId: string): boolean {
    const ceRoom = crazyEightsRooms.get(roomId);
    if (!ceRoom) return false;
    if (ceRoom.currentPlayer !== playerId) return false;
    if (ceRoom.hasDrawn) return false; // Can only draw once per turn

    // If draw pile is empty, reshuffle discard (keep top card)
    if (ceRoom.drawPile.length === 0) {
      const topCard = ceRoom.discardPile.pop()!;
      ceRoom.drawPile = shuffle(ceRoom.discardPile);
      ceRoom.discardPile = [topCard];
    }

    if (ceRoom.drawPile.length === 0) {
      // No cards left anywhere - pass
      this.advanceTurn(roomId);
      return true;
    }

    const drawnCard = ceRoom.drawPile.pop()!;
    const hand = ceRoom.hands.get(playerId)!;
    hand.push(drawnCard);
    ceRoom.hasDrawn = true;

    // Notify everyone of new hand size
    this.io.to(roomId).emit("cards:drew", playerId, hand.length);

    // Send updated hand to the player
    this.io.to(playerId).emit("cards:your-hand", hand);

    // If the drawn card is playable, player can play it. Otherwise they must pass.
    const topCard = ceRoom.discardPile[ceRoom.discardPile.length - 1];
    if (!cardMatches(drawnCard, topCard, ceRoom.currentSuit)) {
      // Auto-pass if drawn card isn't playable
      this.advanceTurn(roomId);
    }
    // Otherwise, player can choose to play the drawn card or pass

    return true;
  }

  handlePass(roomId: string, playerId: string): boolean {
    const ceRoom = crazyEightsRooms.get(roomId);
    if (!ceRoom) return false;
    if (ceRoom.currentPlayer !== playerId) return false;
    if (!ceRoom.hasDrawn) {
      this.io.to(playerId).emit("cards:invalid", "You must draw before passing");
      return false;
    }

    this.advanceTurn(roomId);
    return true;
  }

  private advanceTurn(roomId: string): void {
    const ceRoom = crazyEightsRooms.get(roomId);
    if (!ceRoom) return;

    this.clearTurnTimer(ceRoom);

    const currentIndex = ceRoom.playerOrder.indexOf(ceRoom.currentPlayer);
    const nextIndex = (currentIndex + ceRoom.direction + ceRoom.playerOrder.length) % ceRoom.playerOrder.length;
    ceRoom.currentPlayer = ceRoom.playerOrder[nextIndex];
    ceRoom.hasDrawn = false;

    this.broadcastState(roomId);
    this.startTurnTimer(roomId);
  }

  private startTurnTimer(roomId: string): void {
    const ceRoom = crazyEightsRooms.get(roomId);
    if (!ceRoom) return;

    ceRoom.turnTimeLeft = CRAZY_EIGHTS.TURN_TIME;

    // Emit initial turn
    this.io.to(roomId).emit("cards:turn", ceRoom.currentPlayer, ceRoom.turnTimeLeft);

    // Countdown
    ceRoom.timerInterval = setInterval(() => {
      ceRoom.turnTimeLeft--;
      this.io.to(roomId).emit("cards:turn", ceRoom.currentPlayer, ceRoom.turnTimeLeft);

      if (ceRoom.turnTimeLeft <= 0) {
        this.clearTurnTimer(ceRoom);
        // Auto-draw and pass if time runs out
        if (!ceRoom.hasDrawn) {
          this.handleDrawCard(roomId, ceRoom.currentPlayer);
        }
        // If still this player's turn (drawn card was playable but they didn't act)
        if (crazyEightsRooms.get(roomId)?.currentPlayer === ceRoom.currentPlayer) {
          this.advanceTurn(roomId);
        }
      }
    }, 1000);
  }

  private clearTurnTimer(ceRoom: CrazyEightsRoom): void {
    if (ceRoom.turnTimer) {
      clearTimeout(ceRoom.turnTimer);
      ceRoom.turnTimer = null;
    }
    if (ceRoom.timerInterval) {
      clearInterval(ceRoom.timerInterval);
      ceRoom.timerInterval = null;
    }
  }

  private broadcastState(roomId: string): void {
    const ceRoom = crazyEightsRooms.get(roomId);
    if (!ceRoom) return;

    const topCard = ceRoom.discardPile[ceRoom.discardPile.length - 1];
    const handSizes: Record<string, number> = {};
    for (const [id, hand] of ceRoom.hands) {
      handSizes[id] = hand.length;
    }

    // Send state to each player (with their own hand)
    for (const playerId of ceRoom.playerOrder) {
      const state: CrazyEightsState = {
        currentCard: topCard,
        currentSuit: ceRoom.currentSuit,
        currentPlayer: ceRoom.currentPlayer,
        direction: ceRoom.direction,
        handSizes,
        myHand: ceRoom.hands.get(playerId) || [],
        drawPileCount: ceRoom.drawPile.length,
        lastAction: "",
      };
      this.io.to(playerId).emit("cards:state", state);
    }
  }

  private async endGame(roomId: string, winnerId: string): Promise<void> {
    const ceRoom = crazyEightsRooms.get(roomId);
    const room = store.getRoom(roomId);
    if (!ceRoom || !room) return;

    this.clearTurnTimer(ceRoom);

    // Calculate scores: winner gets points based on remaining cards in opponents' hands
    const scores: Record<string, number> = {};
    let totalRemaining = 0;

    for (const [playerId, hand] of ceRoom.hands) {
      const handValue = hand.reduce((sum, card) => sum + getCardPoints(card), 0);
      if (playerId === winnerId) {
        scores[playerId] = 0; // Will be set to total of others
      } else {
        scores[playerId] = 0;
        totalRemaining += handValue;
      }
    }

    // Winner gets points equal to sum of all other players' remaining card values
    scores[winnerId] = totalRemaining;

    // Update player scores in room
    for (const player of room.players) {
      player.score = scores[player.id] || 0;
    }

    room.status = "finished";
    store.syncRoom(roomId);

    // Emit game over
    this.io.to(roomId).emit("game:over", scores);

    // Save to database
    await this.saveResults(roomId, room, scores, ceRoom.gameStartTime);

    // Cleanup
    crazyEightsRooms.delete(roomId);
  }

  private async saveResults(
    roomId: string,
    room: any,
    scores: Record<string, number>,
    startTime: number
  ): Promise<void> {
    try {
      const supabase = getSupabase();
      const duration = Math.round((Date.now() - startTime) / 1000);

      const { data: gameResult } = await supabase
        .from("game_results")
        .insert({
          room_id: roomId,
          game_type: "crazy-eights",
          rounds: 1,
          player_count: room.players.length,
          duration_seconds: duration,
        })
        .select("id")
        .single();

      if (!gameResult) return;

      // Rank players by score (higher is better in crazy eights)
      const sorted = room.players
        .map((p: any) => ({ ...p, score: scores[p.id] || 0 }))
        .sort((a: any, b: any) => b.score - a.score);

      const playerScores = sorted.map((p: any, i: number) => ({
        game_id: gameResult.id,
        user_id: p.userId || null,
        username: p.username,
        score: p.score,
        rank: i + 1,
      }));

      await supabase.from("player_scores").insert(playerScores);

      // Check achievements
      const results = sorted.map((p: any, i: number) => ({
        userId: p.userId || "",
        score: p.score,
        rank: i + 1,
        gameType: "crazy-eights",
      }));
      await checkAchievements(results);
    } catch (err) {
      console.error("Failed to save crazy eights results:", err);
    }
  }

  handlePlayerDisconnect(roomId: string, playerId: string): void {
    const ceRoom = crazyEightsRooms.get(roomId);
    if (!ceRoom) return;

    // Remove from player order
    ceRoom.playerOrder = ceRoom.playerOrder.filter((id) => id !== playerId);
    ceRoom.hands.delete(playerId);

    // If less than 2 players, end game
    if (ceRoom.playerOrder.length < 2) {
      if (ceRoom.playerOrder.length === 1) {
        this.endGame(roomId, ceRoom.playerOrder[0]);
      } else {
        this.clearTurnTimer(ceRoom);
        crazyEightsRooms.delete(roomId);
      }
      return;
    }

    // If it was the disconnected player's turn, advance
    if (ceRoom.currentPlayer === playerId) {
      this.advanceTurn(roomId);
    }
  }

  hasActiveGame(roomId: string): boolean {
    return crazyEightsRooms.has(roomId);
  }
}

function getCardPoints(card: Card): number {
  if (card.value === "8") return 50;
  if (["J", "Q", "K"].includes(card.value)) return 10;
  if (card.value === "A") return 1;
  return parseInt(card.value);
}
