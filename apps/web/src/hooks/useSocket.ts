"use client";

import { useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";
import type { ClientEvents, ServerEvents } from "shared";

const SERVER_URL = process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:4000";

type GameSocket = Socket<ServerEvents, ClientEvents>;

let globalSocket: GameSocket | null = null;

export function getSocket(): GameSocket {
  if (!globalSocket) {
    globalSocket = io(SERVER_URL, {
      autoConnect: false,
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 20,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 10000,
    });
  }
  return globalSocket;
}

export function useSocket(): GameSocket {
  const socketRef = useRef<GameSocket>(getSocket());

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket.connected) {
      socket.connect();
    }

    return () => {
      // Don't disconnect on unmount — we want persistent connection
    };
  }, []);

  return socketRef.current;
}
