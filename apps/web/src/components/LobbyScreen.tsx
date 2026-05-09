"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useSocket } from "../hooks/useSocket";
import { useGameStore } from "../store/gameStore";
import AnimatedBackground from "./AnimatedBackground";
import RobotAvatar from "./RobotAvatar";

export default function LobbyScreen() {
  const socket = useSocket();
  const { room, username, isHost } = useGameStore();
  const [copied, setCopied] = useState<"code" | "link" | null>(null);

  if (!room) return null;

  const handleStart = () => { socket.emit("game:start"); };
  const handleLeave = () => { socket.emit("room:leave"); useGameStore.getState().resetAll(); };

  const inviteLink = typeof window !== "undefined"
    ? `${window.location.origin}?join=${room.id}`
    : "";

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(room.id);
      setCopied("code");
      setTimeout(() => setCopied(null), 2000);
    } catch { /* fallback */ }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopied("link");
      setTimeout(() => setCopied(null), 2000);
    } catch { /* fallback */ }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Join my NoorGameZone room!",
          text: `Join my Draw & Guess game! Room code: ${room.id}`,
          url: inviteLink,
        });
      } catch { /* user cancelled */ }
    } else {
      handleCopyLink();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center overflow-auto relative">
      <AnimatedBackground />

      <div className="relative z-10 w-full max-w-md mx-4 py-8">
        <motion.div
          className="glass-card rounded-2xl p-6 shadow-2xl"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          {/* Header */}
          <div className="text-center mb-6">
            <motion.h2
              className="text-2xl font-black text-white mb-1"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              Waiting Room
            </motion.h2>
            <p className="text-sm text-purple-300">
              Share the code with your friends!
            </p>
          </div>

          {/* Room Code */}
          <motion.button
            onClick={handleCopyCode}
            className="w-full bg-gradient-to-r from-purple-600/20 to-pink-600/20 hover:from-purple-600/30 hover:to-pink-600/30 border-2 border-dashed border-purple-400/40 rounded-xl p-4 text-center mb-4 transition-all group"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <p className="text-xs text-purple-300 mb-1 font-medium">
              {copied === "code" ? "Code Copied!" : "Tap to copy room code"}
            </p>
            <p className="text-4xl font-mono font-black tracking-[0.3em] gradient-text group-hover:scale-105 transition-transform">
              {room.id}
            </p>
          </motion.button>

          {/* Invite Friends Section */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg">&#128101;</span>
              <h3 className="text-sm font-bold text-purple-300 uppercase tracking-wider">
                Invite Friends
              </h3>
            </div>
            <div className="flex gap-2">
              <motion.button
                onClick={handleCopyLink}
                whileTap={{ scale: 0.95 }}
                className="flex-1 flex items-center justify-center gap-2 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 rounded-xl px-3 py-2.5 transition-colors"
              >
                <svg className="w-4 h-4 text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
                <span className="text-sm font-semibold text-purple-300">
                  {copied === "link" ? "Copied!" : "Copy Link"}
                </span>
              </motion.button>
              <motion.button
                onClick={handleShare}
                whileTap={{ scale: 0.95 }}
                className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-pink-500/20 to-orange-500/20 hover:from-pink-500/30 hover:to-orange-500/30 border border-pink-500/30 rounded-xl px-3 py-2.5 transition-colors"
              >
                <svg className="w-4 h-4 text-pink-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
                <span className="text-sm font-semibold text-pink-300">Share</span>
              </motion.button>
            </div>
          </div>

          {/* Players */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-purple-300 uppercase tracking-wider">
                Players
              </h3>
              <span className="text-sm font-semibold text-gray-500">
                {room.players.length} / {room.maxPlayers}
              </span>
            </div>
            <div className="space-y-2">
              {room.players.map((player, index) => (
                <motion.div
                  key={player.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center gap-3 bg-white/5 rounded-xl px-4 py-3 border border-white/10"
                >
                  <RobotAvatar index={index} size={40} />
                  <span className="font-semibold text-white flex-1">
                    {player.username}
                  </span>
                  {player.id === room.host && (
                    <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2.5 py-1 rounded-full font-bold border border-yellow-500/30 neon-text-subtle">
                      HOST
                    </span>
                  )}
                  {player.username === username && player.id !== room.host && (
                    <span className="text-xs bg-cyan-500/20 text-cyan-400 px-2.5 py-1 rounded-full font-bold border border-cyan-500/30">
                      YOU
                    </span>
                  )}
                </motion.div>
              ))}

              {/* Empty slots */}
              {Array.from({ length: Math.min(room.maxPlayers - room.players.length, 3) }).map((_, i) => (
                <div
                  key={`empty-${i}`}
                  className="flex items-center gap-3 bg-white/[0.02] rounded-xl px-4 py-3 border border-dashed border-white/10"
                >
                  <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center">
                    <span className="text-gray-600 text-lg">?</span>
                  </div>
                  <span className="text-gray-600 text-sm">Waiting for player...</span>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          {isHost ? (
            <motion.button
              onClick={handleStart}
              disabled={room.players.length < 3}
              className="btn-3d w-full py-3.5 bg-gradient-to-r from-green-500 to-emerald-600 disabled:from-gray-700 disabled:to-gray-700 disabled:cursor-not-allowed text-white font-bold rounded-xl text-lg shadow-lg shadow-green-500/25 disabled:shadow-none"
              whileHover={room.players.length >= 3 ? { scale: 1.02 } : {}}
              whileTap={room.players.length >= 3 ? { scale: 0.98 } : {}}
            >
              {room.players.length < 3
                ? `Need ${3 - room.players.length} more player${3 - room.players.length > 1 ? "s" : ""}`
                : "Start Game!"}
            </motion.button>
          ) : (
            <div className="text-center py-3">
              <div className="flex items-center justify-center gap-2 text-purple-300">
                <motion.div
                  className="flex gap-1.5"
                  animate={{ opacity: [0.4, 1, 0.4] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  <div className="w-2 h-2 bg-purple-400 rounded-full" />
                  <div className="w-2 h-2 bg-pink-400 rounded-full" />
                  <div className="w-2 h-2 bg-cyan-400 rounded-full" />
                </motion.div>
                <span className="text-sm font-medium">Waiting for host to start</span>
              </div>
            </div>
          )}

          <button
            onClick={handleLeave}
            className="w-full mt-3 py-2 text-red-400/60 hover:text-red-400 font-medium text-sm transition-colors"
          >
            Leave Room
          </button>
        </motion.div>
      </div>
    </div>
  );
}
