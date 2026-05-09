"use client";

import { useEffect, useState } from "react";
import { getSocket } from "../hooks/useSocket";

type Status = "connected" | "connecting" | "disconnected";

export default function ConnectionStatus() {
  const [status, setStatus] = useState<Status>("connecting");
  const [show, setShow] = useState(false);

  useEffect(() => {
    const socket = getSocket();

    const onConnect = () => {
      setStatus("connected");
      // Show "connected" briefly, then hide
      setShow(true);
      setTimeout(() => setShow(false), 2000);
    };

    const onDisconnect = () => {
      setStatus("disconnected");
      setShow(true);
    };

    const onReconnectAttempt = () => {
      setStatus("connecting");
      setShow(true);
    };

    // Set initial status
    if (socket.connected) {
      setStatus("connected");
      setShow(false);
    } else {
      setStatus("connecting");
      setShow(true);
    }

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.io.on("reconnect_attempt", onReconnectAttempt);

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.io.off("reconnect_attempt", onReconnectAttempt);
    };
  }, []);

  if (!show) return null;

  const config = {
    connected: {
      bg: "bg-green-500",
      text: "Connected",
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      ),
    },
    connecting: {
      bg: "bg-yellow-500",
      text: "Reconnecting...",
      icon: (
        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      ),
    },
    disconnected: {
      bg: "bg-red-500",
      text: "Disconnected - trying to reconnect",
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 5.636a9 9 0 010 12.728M5.636 5.636a9 9 0 000 12.728M12 12h.01" />
        </svg>
      ),
    },
  };

  const c = config[status];

  return (
    <div
      className={`fixed top-0 left-0 right-0 z-[110] ${c.bg} text-white text-center py-1.5 text-sm font-medium flex items-center justify-center gap-2 animate-slide-in-down`}
    >
      {c.icon}
      {c.text}
    </div>
  );
}
