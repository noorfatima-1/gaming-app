"use client";

import { useEffect } from "react";
import { useSocket } from "./useSocket";
import { useGameStore } from "../store/gameStore";
import { sounds } from "../lib/sounds";
import { DRAWING_TIME } from "shared";

export function useGameEvents() {
  const socket = useSocket();

  useEffect(() => {
    const gs = () => useGameStore.getState();

    // Room events
    socket.on("room:created", (room) => {
      gs().setRoom(room);
      gs().setIsHost(true);
      gs().setScreen("lobby");
    });

    socket.on("room:joined", (room) => {
      gs().setRoom(room);
      gs().setIsHost(false);
      gs().setScreen("lobby");
    });

    socket.on("room:player-joined", (player) => {
      gs().addPlayer(player);
      sounds.playerJoin();
      gs().addMessage({
        id: Date.now().toString() + "_join",
        playerId: "system",
        username: "",
        text: `${player.username} joined the room`,
        isSystem: true,
      });
    });

    socket.on("room:player-left", (playerId) => {
      const player = gs().room?.players.find((p) => p.id === playerId);
      const name = player?.username || "A player";
      gs().removePlayer(playerId);
      sounds.playerLeave();
      gs().addMessage({
        id: Date.now().toString() + "_leave",
        playerId: "system",
        username: "",
        text: `${name} left the room`,
        isSystem: true,
      });
    });

    // Game events
    socket.on("game:started", () => {
      gs().clearStrokes();
      gs().setScreen("game");
      sounds.turnStart();
    });

    socket.on("game:word-options", (words) => {
      gs().setWordOptions(words);
      gs().setIsDrawer(true);
      sounds.yourTurn();
    });

    socket.on("game:turn-start", (drawerId, wordLength) => {
      gs().clearStrokes();
      gs().setWordOptions([]);
      gs().clearGuessedPlayers();
      gs().setWordHint("_".repeat(wordLength).split("").join(" "));
      gs().setTotalTime(DRAWING_TIME);
      const isMe = socket.id === drawerId;
      gs().setIsDrawer(isMe);
      // Only clear currentWord for non-drawers — the drawer already set it when they chose
      if (!isMe) {
        gs().setCurrentWord(null);
      }
      const room = gs().room;
      if (room) {
        gs().setRoom({ ...room, currentDrawer: drawerId });
      }
      if (!isMe) {
        sounds.turnStart();
      }
    });

    socket.on("game:draw", (stroke) => {
      gs().addStroke(stroke);
    });

    socket.on("game:undo", () => {
      gs().undoStroke();
    });

    socket.on("game:clear-canvas", () => {
      gs().clearStrokes();
    });

    socket.on("game:hint", (hint) => {
      gs().setWordHint(hint);
    });

    socket.on("game:guess-result", (playerId, correct) => {
      if (correct) {
        gs().addGuessedPlayer(playerId);
        sounds.correctGuess();
        const player = gs().room?.players.find((p) => p.id === playerId);
        const name = player?.username || "Someone";
        gs().addMessage({
          id: Date.now().toString() + playerId,
          playerId,
          username: name,
          text: `${name} guessed the word!`,
          isSystem: true,
          isCorrect: true,
        });
      }
    });

    socket.on("game:scores", (scores) => {
      gs().setScores(scores);
    });

    socket.on("game:turn-end", (word, scores) => {
      gs().setScores(scores);
      gs().setCurrentWord(word);
      gs().setShowScoreboard(true);
      sounds.turnEnd();
      gs().addMessage({
        id: Date.now().toString() + "_turnend",
        playerId: "system",
        username: "",
        text: `The word was: ${word}`,
        isSystem: true,
      });
      // Hide scoreboard after 5 seconds (matches server delay before next turn)
      setTimeout(() => {
        gs().setShowScoreboard(false);
      }, 5000);
    });

    socket.on("game:over", (scores) => {
      gs().setScores(scores);
      gs().setScreen("results");
      sounds.gameOver();
    });

    socket.on("game:timer", (timeLeft) => {
      gs().setTimeLeft(timeLeft);
      // Tick sound for last 5 seconds
      if (timeLeft > 0 && timeLeft <= 5) {
        sounds.tick();
      }
    });

    // Chat
    socket.on("chat:message", (playerId, username, message) => {
      gs().addMessage({
        id: Date.now().toString() + playerId,
        playerId,
        username,
        text: message,
      });
    });

    socket.on("error", (message) => {
      console.error("Server error:", message);
      sounds.error();
      gs().addToast(message, "error");
    });

    return () => {
      socket.off("room:created");
      socket.off("room:joined");
      socket.off("room:player-joined");
      socket.off("room:player-left");
      socket.off("game:started");
      socket.off("game:word-options");
      socket.off("game:turn-start");
      socket.off("game:draw");
      socket.off("game:undo");
      socket.off("game:clear-canvas");
      socket.off("game:hint");
      socket.off("game:guess-result");
      socket.off("game:scores");
      socket.off("game:turn-end");
      socket.off("game:over");
      socket.off("game:timer");
      socket.off("chat:message");
      socket.off("error");
    };
  }, [socket]);
}
