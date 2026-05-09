"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useSocket } from "../hooks/useSocket";
import { useGameStore } from "../store/gameStore";
import { createClient } from "../lib/supabase-browser";
import AnimatedBackground from "./AnimatedBackground";
import RobotAvatar from "./RobotAvatar";

export default function HomeScreen() {
  const socket = useSocket();
  const router = useRouter();
  const { username, setUsername, userId } = useGameStore();
  const [roomCode, setRoomCode] = useState("");
  const [error, setError] = useState("");

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  };

  const handleCreate = () => {
    if (!username.trim()) { setError("Enter your name first!"); return; }
    setError("");
    socket.emit("room:create", username.trim(), userId || undefined);
  };

  const handleJoin = () => {
    if (!username.trim()) { setError("Enter your name first!"); return; }
    if (!roomCode.trim()) { setError("Enter a room code!"); return; }
    setError("");
    socket.emit("room:join", roomCode.trim(), username.trim(), userId || undefined);
  };

  return (
    <div className="min-h-screen flex items-center justify-center overflow-auto relative">
      <AnimatedBackground />

      <div className="relative z-10 w-full max-w-md mx-4 py-8">
        {/* Logo + Mascots */}
        <motion.div
          className="text-center mb-8"
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Floating robots */}
          <div className="flex justify-center gap-4 mb-4">
            <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 2, repeat: Infinity, delay: 0 }}>
              <RobotAvatar index={0} size={48} />
            </motion.div>
            <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 2, repeat: Infinity, delay: 0.3 }}>
              <RobotAvatar index={3} size={56} />
            </motion.div>
            <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 2, repeat: Infinity, delay: 0.6 }}>
              <RobotAvatar index={5} size={48} />
            </motion.div>
          </div>

          {/* Game title */}
          <h1 className="text-5xl font-black gradient-text mb-2">
            NoorGameZone
          </h1>
          <motion.div
            className="flex items-center justify-center gap-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <span className="text-yellow-400 text-lg">&#9998;</span>
            <p className="text-purple-300 text-sm font-medium">
              Draw, Guess & Dominate!
            </p>
            <span className="text-yellow-400 text-lg">&#9998;</span>
          </motion.div>
        </motion.div>

        {/* Main Card */}
        <motion.div
          className="glass-card rounded-2xl p-6 shadow-2xl"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          {/* Logout */}
          <div className="flex justify-end mb-4">
            <button
              onClick={handleLogout}
              className="text-xs text-gray-400 hover:text-red-400 transition-colors"
            >
              Log out
            </button>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-red-500/20 border border-red-500/30 text-red-300 px-4 py-2 rounded-lg mb-4 text-sm text-center font-medium"
            >
              {error}
            </motion.div>
          )}

          <div className="space-y-4">
            {/* Username */}
            <div>
              <label className="block text-sm font-semibold text-purple-300 mb-1.5">
                Your Name
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your name..."
                maxLength={20}
                className="w-full px-4 py-3 bg-white/10 border-2 border-purple-500/30 rounded-xl focus:border-purple-400 focus:outline-none text-base text-white placeholder-gray-500 transition-colors"
              />
            </div>

            {/* Create Room */}
            <button
              onClick={handleCreate}
              className="btn-3d w-full py-3.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-xl text-lg shadow-lg shadow-purple-500/25"
            >
              Create Room
            </button>

            {/* Divider */}
            <div className="flex items-center gap-3">
              <hr className="flex-1 border-white/10" />
              <span className="text-gray-500 text-xs font-bold uppercase tracking-wider">or join</span>
              <hr className="flex-1 border-white/10" />
            </div>

            {/* Room Code + Join */}
            <div className="flex gap-2">
              <input
                type="text"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                placeholder="CODE"
                maxLength={6}
                className="flex-1 px-4 py-3 bg-white/10 border-2 border-cyan-500/30 rounded-xl focus:border-cyan-400 focus:outline-none text-base text-center tracking-[0.3em] font-mono font-bold text-white uppercase placeholder-gray-500 transition-colors"
              />
              <button
                onClick={handleJoin}
                className="btn-3d px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold rounded-xl text-lg shadow-lg shadow-cyan-500/25"
              >
                Join
              </button>
            </div>
          </div>
        </motion.div>

        {/* Footer tagline */}
        <motion.p
          className="text-center text-gray-600 text-xs mt-6 font-medium"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          Challenge your friends in real-time!
        </motion.p>
      </div>
    </div>
  );
}
