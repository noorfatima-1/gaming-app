"use client";

import { useEffect, useState } from "react";

interface Props {
  title: string;
  xpReward?: number;
  onDismiss: () => void;
}

export default function AchievementToast({ title, xpReward, onDismiss }: Props) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Animate in
    requestAnimationFrame(() => setVisible(true));

    // Auto-dismiss after 5 seconds
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onDismiss, 300);
    }, 5000);

    return () => clearTimeout(timer);
  }, [onDismiss]);

  return (
    <div
      className={`fixed top-20 left-1/2 -translate-x-1/2 z-50 transition-all duration-300 ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4"
      }`}
    >
      <div className="bg-gradient-to-r from-yellow-600/90 to-amber-600/90 backdrop-blur-lg border border-yellow-400/30 rounded-xl px-6 py-3 shadow-2xl shadow-yellow-500/20 flex items-center gap-3">
        <span className="text-2xl">🏆</span>
        <div>
          <div className="text-sm font-bold text-white">{title}</div>
          {xpReward && (
            <div className="text-xs text-yellow-200">+{xpReward} XP</div>
          )}
        </div>
      </div>
    </div>
  );
}
