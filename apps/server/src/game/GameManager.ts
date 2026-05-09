import { Server } from "socket.io";
import { ClientEvents, ServerEvents, Stroke, DRAWING_TIME, WORD_CHOOSE_TIME, SCORES, HINT_REVEAL_TIMES } from "shared";
import { store, RoomState } from "../store/RedisStore";
import { getRandomWords } from "../data/words";
import { supabase } from "../lib/supabase";

const MIN_PLAYERS = 3;

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function generateHint(word: string, revealCount: number): string {
  const indices = Array.from({ length: word.length }, (_, i) => i)
    .filter((i) => word[i] !== " ");
  const toReveal = shuffle(indices).slice(0, revealCount);

  return word
    .split("")
    .map((ch, i) => {
      if (ch === " ") return "  ";
      if (toReveal.includes(i)) return ch;
      return "_";
    })
    .join(" ");
}

export class GameManager {
  private io: Server<ClientEvents, ServerEvents>;

  constructor(io: Server<ClientEvents, ServerEvents>) {
    this.io = io;
  }

  startGame(roomId: string, requesterId: string): boolean {
    const room = store.getRoom(roomId);
    if (!room) return false;
    if (room.host !== requesterId) return false;
    if (room.players.length < MIN_PLAYERS) return false;
    if (room.status !== "lobby") return false;

    room.status = "playing";
    room.round = 1;
    room.drawerOrder = shuffle(room.players.map((p) => p.id));
    room.currentDrawerIndex = 0;

    store.syncRoom(roomId);
    this.io.to(roomId).emit("game:started");
    this.startTurn(roomId);
    return true;
  }

  private startTurn(roomId: string): void {
    const room = store.getRoom(roomId);
    if (!room) return;

    const drawerId = room.drawerOrder[room.currentDrawerIndex];
    room.currentDrawer = drawerId;
    room.guessedPlayers = new Set();
    room.strokes = [];
    room.guessOrder = 0;

    // Pick 3 words
    const words = getRandomWords(3, room.usedWords);
    room.wordOptions = words;

    // Send word options to drawer only
    this.io.to(drawerId).emit("game:word-options", words);

    // Auto-pick first word if drawer doesn't choose in time
    room.wordChooseTimer = setTimeout(() => {
      if (room.wordOptions.length > 0) {
        this.handleWordChoice(roomId, drawerId, room.wordOptions[0]);
      }
    }, WORD_CHOOSE_TIME * 1000);
  }

  handleWordChoice(roomId: string, playerId: string, word: string): boolean {
    const room = store.getRoom(roomId);
    if (!room) return false;
    if (room.currentDrawer !== playerId) return false;
    if (!room.wordOptions.includes(word)) return false;

    // Clear word choose timer
    if (room.wordChooseTimer) {
      clearTimeout(room.wordChooseTimer);
      room.wordChooseTimer = null;
    }

    room.secretWord = word;
    room.usedWords.add(word);
    room.wordOptions = [];
    room.turnStartTime = Date.now();

    // Generate initial hint (all underscores)
    room.currentHint = word
      .split("")
      .map((ch) => (ch === " " ? "  " : "_"))
      .join(" ");

    // Tell everyone the turn started
    this.io.to(roomId).emit("game:turn-start", playerId, word.length);
    this.io.to(roomId).emit("game:hint", room.currentHint);
    this.io.to(roomId).emit("game:timer", DRAWING_TIME);

    // Start countdown timer
    let timeLeft = DRAWING_TIME;
    room.timerInterval = setInterval(() => {
      timeLeft--;
      this.io.to(roomId).emit("game:timer", timeLeft);
      if (timeLeft <= 0) {
        if (room.timerInterval) clearInterval(room.timerInterval);
      }
    }, 1000);

    // Schedule hints
    room.hintTimers = HINT_REVEAL_TIMES.map((seconds, index) =>
      setTimeout(() => {
        if (room.secretWord) {
          const revealCount = index + 1;
          room.currentHint = generateHint(room.secretWord, revealCount);
          this.io.to(roomId).emit("game:hint", room.currentHint);
        }
      }, seconds * 1000)
    );

    // End turn when time runs out
    room.turnTimer = setTimeout(() => {
      this.endTurn(roomId);
    }, DRAWING_TIME * 1000);

    store.syncRoom(roomId);
    return true;
  }

  handleDraw(playerId: string, stroke: Stroke): void {
    const room = store.getRoomByPlayer(playerId);
    if (!room) return;
    if (room.currentDrawer !== playerId) return;
    if (room.status !== "playing") return;

    room.strokes.push(stroke);

    // Broadcast to everyone else in the room
    const socket = this.io.sockets.sockets.get(playerId);
    if (socket) {
      socket.to(room.id).emit("game:draw", stroke);
    }
  }

  handleUndo(playerId: string): void {
    const room = store.getRoomByPlayer(playerId);
    if (!room) return;
    if (room.currentDrawer !== playerId) return;
    if (room.status !== "playing") return;

    if (room.strokes.length > 0) {
      room.strokes.pop();
      const socket = this.io.sockets.sockets.get(playerId);
      if (socket) {
        socket.to(room.id).emit("game:undo");
      }
    }
  }

  handleClearCanvas(playerId: string): void {
    const room = store.getRoomByPlayer(playerId);
    if (!room) return;
    if (room.currentDrawer !== playerId) return;
    if (room.status !== "playing") return;

    room.strokes = [];
    const socket = this.io.sockets.sockets.get(playerId);
    if (socket) {
      socket.to(room.id).emit("game:clear-canvas");
    }
  }

  handleGuess(playerId: string, guess: string): void {
    const room = store.getRoomByPlayer(playerId);
    if (!room) return;
    if (room.currentDrawer === playerId) return; // drawer can't guess
    if (room.guessedPlayers.has(playerId)) return; // already guessed
    if (!room.secretWord) return;
    if (room.status !== "playing") return;

    const player = room.players.find((p) => p.id === playerId);
    if (!player) return;

    const normalizedGuess = guess.trim().toLowerCase();
    const normalizedWord = room.secretWord.trim().toLowerCase();

    if (normalizedGuess === normalizedWord) {
      // Correct guess!
      room.guessOrder++;
      room.guessedPlayers.add(playerId);

      // Calculate score for guesser
      let guesserScore: number;
      if (room.guessOrder === 1) guesserScore = SCORES.FIRST_GUESS;
      else if (room.guessOrder === 2) guesserScore = SCORES.SECOND_GUESS;
      else if (room.guessOrder === 3) guesserScore = SCORES.THIRD_GUESS;
      else guesserScore = SCORES.LATE_GUESS;

      player.score += guesserScore;

      // Drawer gets points too
      const drawer = room.players.find((p) => p.id === room.currentDrawer);
      if (drawer) {
        drawer.score += SCORES.DRAWER_PER_GUESS;
      }

      // Send updated scores immediately so scoreboard updates live
      const liveScores: Record<string, number> = {};
      room.players.forEach((p) => { liveScores[p.id] = p.score; });

      this.io.to(room.id).emit("game:guess-result", playerId, true);
      this.io.to(room.id).emit("game:scores", liveScores);
      this.io.to(room.id).emit("chat:message", "system", "System", `${player.username} guessed the word!`);

      store.syncRoom(room.id);

      // Check if all non-drawer players have guessed
      const nonDrawers = room.players.filter((p) => p.id !== room.currentDrawer);
      if (room.guessedPlayers.size >= nonDrawers.length) {
        this.endTurn(room.id);
      }
    } else {
      // Wrong guess — show it as a chat message
      this.io.to(room.id).emit("game:guess-result", playerId, false);
      this.io.to(room.id).emit("chat:message", playerId, player.username, guess);
    }
  }

  private endTurn(roomId: string): void {
    const room = store.getRoom(roomId);
    if (!room) return;

    // Clear all timers
    if (room.turnTimer) { clearTimeout(room.turnTimer); room.turnTimer = null; }
    if (room.timerInterval) { clearInterval(room.timerInterval); room.timerInterval = null; }
    if (room.wordChooseTimer) { clearTimeout(room.wordChooseTimer); room.wordChooseTimer = null; }
    room.hintTimers.forEach((t) => clearTimeout(t));
    room.hintTimers = [];

    const word = room.secretWord || "???";
    const scores: Record<string, number> = {};
    room.players.forEach((p) => { scores[p.id] = p.score; });

    this.io.to(roomId).emit("game:turn-end", word, scores);

    room.secretWord = null;
    room.strokes = [];
    room.guessedPlayers = new Set();
    room.guessOrder = 0;
    room.currentHint = "";

    // Next drawer or next round
    room.currentDrawerIndex++;

    if (room.currentDrawerIndex >= room.drawerOrder.length) {
      // All players have drawn — next round
      room.round++;

      if (room.round > room.totalRounds) {
        // Game over
        this.endGame(roomId);
        return;
      }

      // New round: reshuffle drawer order
      room.drawerOrder = shuffle(room.players.map((p) => p.id));
      room.currentDrawerIndex = 0;
    }

    store.syncRoom(roomId);

    // Start next turn after a short delay
    setTimeout(() => {
      const r = store.getRoom(roomId);
      if (r && r.status === "playing") {
        this.startTurn(roomId);
      }
    }, 5000);
  }

  private endGame(roomId: string): void {
    const room = store.getRoom(roomId);
    if (!room) return;

    const scores: Record<string, number> = {};
    room.players.forEach((p) => { scores[p.id] = p.score; });

    room.status = "finished";
    room.currentDrawer = null;

    this.io.to(roomId).emit("game:over", scores);
    store.syncRoom(roomId);

    // Save to Supabase
    this.saveGameResults(room).catch((err) =>
      console.error("Failed to save game results:", err)
    );
  }

  private async saveGameResults(room: RoomState): Promise<void> {
    // Sort players by score (highest first) to determine rank
    const ranked = [...room.players].sort((a, b) => b.score - a.score);

    // Insert game result
    const { data: game, error: gameErr } = await supabase
      .from("game_results")
      .insert({
        room_id: room.id,
        rounds: room.totalRounds,
        player_count: room.players.length,
      })
      .select("id")
      .single();

    if (gameErr || !game) {
      console.error("Error saving game result:", gameErr);
      return;
    }

    // Insert player scores
    const playerScores = ranked.map((p, index) => ({
      game_id: game.id,
      user_id: p.userId || null,
      username: p.username,
      score: p.score,
      rank: index + 1,
    }));

    const { error: scoresErr } = await supabase
      .from("player_scores")
      .insert(playerScores);

    if (scoresErr) {
      console.error("Error saving player scores:", scoresErr);
    } else {
      console.log(`Game ${game.id} results saved (${room.players.length} players)`);
    }
  }

  handlePlayerDisconnect(playerId: string): { roomId: string | null; username: string | null } {
    const room = store.getRoomByPlayer(playerId);
    if (!room) return { roomId: null, username: null };

    const player = room.players.find((p) => p.id === playerId);
    const username = player?.username || null;
    const roomId = room.id;

    // If this player was the drawer, end the turn
    const wasDrawer = room.currentDrawer === playerId;

    const { room: updatedRoom } = store.leaveRoom(playerId);

    if (updatedRoom) {
      this.io.to(roomId).emit("room:player-left", playerId);

      if (updatedRoom.status === "playing") {
        // If only 1 player left, end the game
        if (updatedRoom.players.length < 2) {
          this.endGame(roomId);
        } else if (wasDrawer) {
          this.endTurn(roomId);
        }
      }
    }

    return { roomId, username };
  }
}
