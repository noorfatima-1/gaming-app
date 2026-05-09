"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import confetti from "canvas-confetti";
import { useGameStore } from "../store/gameStore";
import AnimatedBackground from "./AnimatedBackground";
import RobotAvatar from "./RobotAvatar";

const PODIUM_COLORS = ["#FFD700", "#C0C0C0", "#CD7F32"];
const PODIUM_LABELS = ["1st", "2nd", "3rd"];

export default function ResultsScreen() {
  const { room, scores } = useGameStore();

  const sortedPlayers =
    room?.players.slice().sort((a, b) => (scores[b.id] || 0) - (scores[a.id] || 0)) || [];

  const handlePlayAgain = () => { useGameStore.getState().resetAll(); };

  // Fire confetti on mount
  useEffect(() => {
    const duration = 3000;
    const end = Date.now() + duration;
    const frame = () => {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.7 },
        colors: ["#FFD700", "#FF6B6B", "#4ECDC4", "#A78BFA", "#F472B6"],
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.7 },
        colors: ["#FFD700", "#FF6B6B", "#4ECDC4", "#A78BFA", "#F472B6"],
      });
      if (Date.now() < end) requestAnimationFrame(frame);
    };
    frame();
  }, []);

  const topThree = sortedPlayers.slice(0, 3);
  const rest = sortedPlayers.slice(3);

  // Podium order: [2nd, 1st, 3rd]
  const podiumOrder = topThree.length >= 3
    ? [topThree[1], topThree[0], topThree[2]]
    : topThree.length === 2
    ? [topThree[1], topThree[0]]
    : topThree;

  const podiumHeights = topThree.length >= 3 ? [110, 150, 80] : topThree.length === 2 ? [110, 150] : [150];
  const podiumRanks = topThree.length >= 3 ? [1, 0, 2] : topThree.length === 2 ? [1, 0] : [0];

  return (
    <div className="min-h-screen flex items-center justify-center overflow-auto relative">
      <AnimatedBackground />

      <div className="relative z-10 w-full max-w-lg mx-4 py-8">
        <motion.div
          className="glass-card rounded-2xl p-6 shadow-2xl"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", duration: 0.6 }}
        >
          {/* Header */}
          <motion.div
            className="text-center mb-8"
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <h2 className="text-4xl font-black gradient-text mb-1">
              Game Over!
            </h2>
            <p className="text-sm text-purple-300">Final Results</p>
          </motion.div>

          {/* Podium */}
          {topThree.length > 0 && (
            <div className="flex items-end justify-center gap-3 mb-8">
              {podiumOrder.map((player, i) => {
                const rank = podiumRanks[i];
                const origIdx = room?.players.findIndex((p) => p.id === player.id) || 0;
                return (
                  <motion.div
                    key={player.id}
                    className="flex flex-col items-center"
                    initial={{ y: 50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.3 + rank * 0.2, type: "spring" }}
                  >
                    {/* Crown for 1st */}
                    {rank === 0 && (
                      <motion.div
                        className="text-yellow-400 text-2xl mb-1"
                        animate={{ rotate: [-5, 5, -5] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        &#128081;
                      </motion.div>
                    )}
                    <motion.div
                      animate={{ y: [0, -5, 0] }}
                      transition={{ duration: 2, repeat: Infinity, delay: rank * 0.3 }}
                    >
                      <RobotAvatar index={origIdx} size={rank === 0 ? 56 : 44} />
                    </motion.div>
                    <p className="text-sm font-bold text-white mt-1 truncate max-w-[80px]">
                      {player.username}
                    </p>
                    <p className="text-xs text-purple-300 font-semibold mb-2">
                      {scores[player.id] || 0} pts
                    </p>
                    <div
                      className="w-20 rounded-t-lg flex items-start justify-center pt-2 shadow-lg"
                      style={{
                        height: podiumHeights[i],
                        background: `linear-gradient(180deg, ${PODIUM_COLORS[rank]}, ${PODIUM_COLORS[rank]}88)`,
                        boxShadow: `0 0 20px ${PODIUM_COLORS[rank]}40`,
                      }}
                    >
                      <span className="text-white font-black text-lg drop-shadow-md">
                        {PODIUM_LABELS[rank]}
                      </span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}

          {/* Rest */}
          {rest.length > 0 && (
            <div className="space-y-2 mb-6">
              {rest.map((player, index) => {
                const origIdx = room?.players.findIndex((p) => p.id === player.id) || 0;
                return (
                  <motion.div
                    key={player.id}
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.8 + index * 0.1 }}
                    className="flex items-center gap-3 bg-white/5 rounded-xl px-4 py-3 border border-white/10"
                  >
                    <span className="text-sm font-bold text-gray-500 w-6 text-center">#{index + 4}</span>
                    <RobotAvatar index={origIdx} size={36} />
                    <span className="font-semibold text-white flex-1">{player.username}</span>
                    <span className="font-bold text-purple-300">{scores[player.id] || 0} pts</span>
                  </motion.div>
                );
              })}
            </div>
          )}

          {/* Play Again */}
          <motion.button
            onClick={handlePlayAgain}
            className="btn-3d w-full py-3.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-xl text-lg shadow-lg shadow-purple-500/30"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.95 }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
          >
            Play Again
          </motion.button>
        </motion.div>
      </div>
    </div>
  );
}
