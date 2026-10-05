"use client";

import type { UserProfile } from "shared";
import { XP_PER_LEVEL } from "shared";

interface Props {
  profile: UserProfile;
  stats?: {
    games_played: number;
    wins: number;
    total_score: number;
    best_score: number;
    avg_score: number;
  };
}

export default function ProfileCard({ profile, stats }: Props) {
  const xpProgress = (profile.xp % XP_PER_LEVEL) / XP_PER_LEVEL * 100;

  return (
    <div className="glass-card rounded-2xl p-6 space-y-4">
      {/* Avatar + Name */}
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-2xl font-bold shrink-0">
          {profile.avatar_url ? (
            <img src={profile.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
          ) : (
            profile.display_name?.charAt(0).toUpperCase() || "?"
          )}
        </div>
        <div>
          <h2 className="text-xl font-bold">{profile.display_name}</h2>
          <p className="text-white/40 text-sm">@{profile.username}</p>
          {profile.bio && <p className="text-white/60 text-sm mt-1">{profile.bio}</p>}
        </div>
      </div>

      {/* Level + XP */}
      <div>
        <div className="flex justify-between text-sm mb-1">
          <span className="text-purple-400 font-medium">Level {profile.level}</span>
          <span className="text-white/40">{profile.xp % XP_PER_LEVEL} / {XP_PER_LEVEL} XP</span>
        </div>
        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all"
            style={{ width: `${xpProgress}%` }}
          />
        </div>
      </div>

      {/* Stats grid */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatBox label="Games" value={stats.games_played} />
          <StatBox label="Wins" value={stats.wins} />
          <StatBox label="Best Score" value={stats.best_score} />
          <StatBox label="Avg Score" value={stats.avg_score} />
        </div>
      )}

      {/* Online status */}
      <div className="flex items-center gap-2 text-sm">
        <div className={`w-2 h-2 rounded-full ${profile.is_online ? "bg-green-400" : "bg-white/20"}`} />
        <span className="text-white/40">
          {profile.is_online ? "Online" : `Last seen ${new Date(profile.last_seen).toLocaleDateString()}`}
        </span>
      </div>
    </div>
  );
}

function StatBox({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-white/5 rounded-lg p-3 text-center">
      <div className="text-lg font-bold">{value}</div>
      <div className="text-xs text-white/40">{label}</div>
    </div>
  );
}
