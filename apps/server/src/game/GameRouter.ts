import { Server, Socket } from "socket.io";
import { ClientEvents, ServerEvents, Card, Suit } from "shared";
import { GameManager } from "./GameManager";
import { CrazyEightsManager } from "./CrazyEightsManager";
import { store } from "../store/RedisStore";

// Routes game events to the correct manager based on room's gameType
export class GameRouter {
  private drawGuess: GameManager;
  private crazyEights: CrazyEightsManager;

  constructor(io: Server<ClientEvents, ServerEvents>) {
    this.drawGuess = new GameManager(io);
    this.crazyEights = new CrazyEightsManager(io);
  }

  startGame(roomId: string, requesterId: string): boolean {
    const room = store.getRoom(roomId);
    if (!room) return false;

    if (room.gameType === "crazy-eights") {
      return this.crazyEights.startGame(roomId);
    }
    return this.drawGuess.startGame(roomId, requesterId);
  }

  // Draw & Guess specific
  handleWordChoice(roomId: string, playerId: string, word: string): boolean {
    return this.drawGuess.handleWordChoice(roomId, playerId, word);
  }

  handleDraw(playerId: string, stroke: any): void {
    this.drawGuess.handleDraw(playerId, stroke);
  }

  handleUndo(playerId: string): void {
    this.drawGuess.handleUndo(playerId);
  }

  handleClearCanvas(playerId: string): void {
    this.drawGuess.handleClearCanvas(playerId);
  }

  handleGuess(playerId: string, guess: string): void {
    this.drawGuess.handleGuess(playerId, guess);
  }

  // Card game specific
  handlePlayCard(roomId: string, playerId: string, card: Card, chosenSuit?: Suit): boolean {
    return this.crazyEights.handlePlayCard(roomId, playerId, card, chosenSuit);
  }

  handleDrawCard(roomId: string, playerId: string): boolean {
    return this.crazyEights.handleDrawCard(roomId, playerId);
  }

  handlePass(roomId: string, playerId: string): boolean {
    return this.crazyEights.handlePass(roomId, playerId);
  }

  // Shared
  handlePlayerDisconnect(playerId: string): { roomId: string | null; username: string | null } {
    const room = store.getRoomByPlayer(playerId);

    if (room?.gameType === "crazy-eights" && room.status === "playing") {
      this.crazyEights.handlePlayerDisconnect(room.id, playerId);
    }

    return this.drawGuess.handlePlayerDisconnect(playerId);
  }
}
