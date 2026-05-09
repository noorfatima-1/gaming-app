"use client";

import { motion } from "framer-motion";

const SHAPES = [
  { type: "star", color: "#FFD700", size: 30, x: "10%", y: "15%", delay: 0 },
  { type: "circle", color: "#FF6B6B", size: 20, x: "85%", y: "20%", delay: 1 },
  { type: "triangle", color: "#4ECDC4", size: 25, x: "70%", y: "75%", delay: 0.5 },
  { type: "square", color: "#A78BFA", size: 22, x: "15%", y: "70%", delay: 1.5 },
  { type: "star", color: "#F472B6", size: 18, x: "50%", y: "10%", delay: 2 },
  { type: "circle", color: "#34D399", size: 28, x: "90%", y: "55%", delay: 0.8 },
  { type: "diamond", color: "#FBBF24", size: 20, x: "30%", y: "85%", delay: 1.2 },
  { type: "star", color: "#60A5FA", size: 24, x: "75%", y: "40%", delay: 1.8 },
  { type: "circle", color: "#F97316", size: 16, x: "5%", y: "45%", delay: 0.3 },
  { type: "triangle", color: "#EC4899", size: 20, x: "40%", y: "60%", delay: 2.2 },
  { type: "square", color: "#8B5CF6", size: 15, x: "60%", y: "90%", delay: 0.7 },
  { type: "diamond", color: "#14B8A6", size: 22, x: "25%", y: "30%", delay: 1.6 },
];

function StarSVG({ size, color }: { size: number; color: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  );
}

function TriangleSVG({ size, color }: { size: number; color: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <path d="M12 2L2 22h20L12 2z" />
    </svg>
  );
}

function DiamondSVG({ size, color }: { size: number; color: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <path d="M12 2L2 12l10 10 10-10L12 2z" />
    </svg>
  );
}

function Shape({ type, size, color }: { type: string; size: number; color: string }) {
  if (type === "star") return <StarSVG size={size} color={color} />;
  if (type === "triangle") return <TriangleSVG size={size} color={color} />;
  if (type === "diamond") return <DiamondSVG size={size} color={color} />;
  if (type === "square")
    return (
      <div
        className="rounded-sm"
        style={{ width: size, height: size, backgroundColor: color }}
      />
    );
  return (
    <div
      className="rounded-full"
      style={{ width: size, height: size, backgroundColor: color }}
    />
  );
}

export default function AnimatedBackground() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      {/* Gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900" />

      {/* Animated gradient overlay */}
      <motion.div
        className="absolute inset-0 opacity-30"
        style={{
          background:
            "radial-gradient(circle at 30% 50%, rgba(99, 102, 241, 0.4) 0%, transparent 50%), radial-gradient(circle at 70% 50%, rgba(236, 72, 153, 0.4) 0%, transparent 50%)",
        }}
        animate={{
          background: [
            "radial-gradient(circle at 30% 50%, rgba(99, 102, 241, 0.4) 0%, transparent 50%), radial-gradient(circle at 70% 50%, rgba(236, 72, 153, 0.4) 0%, transparent 50%)",
            "radial-gradient(circle at 50% 30%, rgba(99, 102, 241, 0.4) 0%, transparent 50%), radial-gradient(circle at 50% 70%, rgba(236, 72, 153, 0.4) 0%, transparent 50%)",
            "radial-gradient(circle at 70% 50%, rgba(99, 102, 241, 0.4) 0%, transparent 50%), radial-gradient(circle at 30% 50%, rgba(236, 72, 153, 0.4) 0%, transparent 50%)",
          ],
        }}
        transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
      />

      {/* Floating shapes */}
      {SHAPES.map((shape, i) => (
        <motion.div
          key={i}
          className="absolute opacity-20"
          style={{ left: shape.x, top: shape.y }}
          animate={{
            y: [0, -20, 0, 20, 0],
            rotate: [0, 180, 360],
            scale: [1, 1.2, 1, 0.8, 1],
          }}
          transition={{
            duration: 6 + i * 0.5,
            delay: shape.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <Shape type={shape.type} size={shape.size} color={shape.color} />
        </motion.div>
      ))}

      {/* Grid pattern overlay */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />
    </div>
  );
}
