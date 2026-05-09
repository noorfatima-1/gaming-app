"use client";

import { useEffect, useState } from "react";
import { createClient } from "../lib/supabase-browser";
import { useGameStore } from "../store/gameStore";
import { useGameEvents } from "../hooks/useGameEvents";
import HomeScreen from "../components/HomeScreen";
import LobbyScreen from "../components/LobbyScreen";
import GameScreen from "../components/GameScreen";
import ResultsScreen from "../components/ResultsScreen";
import ToastContainer from "../components/Toast";
import ConnectionStatus from "../components/ConnectionStatus";

export default function Home() {
  useGameEvents();
  const screen = useGameStore((s) => s.screen);
  const setUsername = useGameStore((s) => s.setUsername);
  const setUserId = useGameStore((s) => s.setUserId);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        const name =
          user.user_metadata?.display_name ||
          user.email?.split("@")[0] ||
          "Player";
        setUsername(name);
        setUserId(user.id);
      }
      setReady(true);
    });
  }, [setUsername, setUserId]);

  if (!ready) {
    return <LoadingScreen />;
  }

  return (
    <>
      <ConnectionStatus />
      <ToastContainer />
      <div className="screen-transition" key={screen}>
        {screen === "lobby" ? (
          <LobbyScreen />
        ) : screen === "game" ? (
          <GameScreen />
        ) : screen === "results" ? (
          <ResultsScreen />
        ) : (
          <HomeScreen />
        )}
      </div>
    </>
  );
}

function LoadingScreen() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900">
      <div className="animate-fade-in-up flex flex-col items-center">
        <div className="relative mb-6">
          <svg className="w-20 h-20 text-purple-400 animate-wiggle" fill="currentColor" viewBox="0 0 24 24">
            <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a.996.996 0 000-1.41l-2.34-2.34a.996.996 0 00-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
          </svg>
          <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-400 rounded-full animate-ping" />
        </div>

        <h1 className="text-4xl font-black gradient-text mb-3">
          NoorGameZone
        </h1>

        <div className="flex gap-2 mt-4">
          <div className="w-3 h-3 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
          <div className="w-3 h-3 bg-pink-500 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
          <div className="w-3 h-3 bg-yellow-500 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
        </div>

        <p className="text-purple-300/60 text-sm mt-4 font-medium">
          Loading your game...
        </p>
      </div>
    </div>
  );
}
