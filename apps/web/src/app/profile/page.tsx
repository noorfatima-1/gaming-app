"use client";

import { useEffect, useState } from "react";
import { createClient } from "../../lib/supabase-browser";
import { api } from "../../lib/api";
import ProfileCard from "../../components/ProfileCard";
import GameHistoryList from "../../components/GameHistoryList";
import type { UserProfile, GameHistoryEntry, UserAchievement, Achievement, LeaderboardEntry } from "shared";

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<{ games_played: number; wins: number; total_score: number; best_score: number; avg_score: number } | undefined>(undefined);
  const [history, setHistory] = useState<GameHistoryEntry[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [userAchievements, setUserAchievements] = useState<UserAchievement[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editBio, setEditBio] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [profileData, historyData, allAchievements, unlockedAchievements] = await Promise.all([
        api.getProfile(user.id),
        api.getHistory(user.id).catch(() => ({ data: [] })),
        api.getAllAchievements().catch(() => []),
        api.getUserAchievements(user.id).catch(() => []),
      ]);

      setProfile(profileData as UserProfile);
      setEditName((profileData as UserProfile).display_name);
      setEditBio((profileData as UserProfile).bio || "");
      setHistory(((historyData as { data: GameHistoryEntry[] }).data) || []);
      setAchievements(allAchievements as Achievement[]);
      setUserAchievements(unlockedAchievements as UserAchievement[]);

      // Load stats from leaderboard
      const leaderboard = await api.getLeaderboard().catch(() => []);
      const myStats = (leaderboard as LeaderboardEntry[]).find((e) => e.user_id === user.id);
      if (myStats) {
        setStats({
          games_played: myStats.games_played,
          wins: myStats.wins,
          total_score: myStats.total_score,
          best_score: myStats.best_score,
          avg_score: myStats.avg_score,
        });
      }
    } catch (err) {
      console.error("Failed to load profile:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    try {
      const updated = await api.updateProfile({
        display_name: editName,
        bio: editBio,
      });
      setProfile(updated as UserProfile);
      setIsEditing(false);
    } catch (err) {
      console.error("Failed to update profile:", err);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 pt-20 px-4">
        <div className="max-w-2xl mx-auto space-y-4">
          <div className="glass-card rounded-2xl h-48 animate-pulse" />
          <div className="glass-card rounded-2xl h-64 animate-pulse" />
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 pt-20 flex items-center justify-center">
        <p className="text-white/40">Profile not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 pt-20 pb-8 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Profile card or edit form */}
        {isEditing ? (
          <div className="glass-card rounded-2xl p-6 space-y-4">
            <h2 className="text-lg font-bold">Edit Profile</h2>
            <div>
              <label className="text-sm text-white/60 block mb-1">Display Name</label>
              <input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                maxLength={30}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-500"
              />
            </div>
            <div>
              <label className="text-sm text-white/60 block mb-1">Bio</label>
              <textarea
                value={editBio}
                onChange={(e) => setEditBio(e.target.value)}
                maxLength={200}
                rows={3}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-500 resize-none"
              />
            </div>
            <div className="flex gap-2">
              <button onClick={handleSave} className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-sm font-medium transition-colors">
                Save
              </button>
              <button onClick={() => setIsEditing(false)} className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-medium transition-colors">
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="relative">
            <ProfileCard profile={profile} stats={stats} />
            <button
              onClick={() => setIsEditing(true)}
              className="absolute top-4 right-4 px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-xs font-medium transition-colors"
            >
              Edit
            </button>
          </div>
        )}

        {/* Achievements */}
        <div className="glass-card rounded-2xl p-6">
          <h3 className="text-lg font-bold mb-4">Achievements</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {achievements.map((a) => {
              const unlocked = userAchievements.some((ua) => ua.achievement_id === a.id);
              return (
                <div
                  key={a.id}
                  className={`rounded-lg p-3 text-center ${
                    unlocked ? "bg-purple-500/20 border border-purple-500/30" : "bg-white/5 opacity-50"
                  }`}
                >
                  <div className="text-2xl mb-1">{getAchievementEmoji(a.icon)}</div>
                  <div className="text-xs font-medium">{a.name}</div>
                  <div className="text-xs text-white/40 mt-0.5">{a.description}</div>
                  {unlocked && <div className="text-xs text-purple-400 mt-1">+{a.xp_reward} XP</div>}
                </div>
              );
            })}
          </div>
        </div>

        {/* Game History */}
        <div className="glass-card rounded-2xl p-6">
          <h3 className="text-lg font-bold mb-4">Recent Games</h3>
          <GameHistoryList history={history} />
        </div>
      </div>
    </div>
  );
}

function getAchievementEmoji(icon: string): string {
  const map: Record<string, string> = {
    gamepad: "🎮", trophy: "🏆", target: "🎯", flame: "💪",
    fire: "🔥", star: "⭐", zap: "🌟", heart: "🤝",
    pen: "🎨", bolt: "⚡",
  };
  return map[icon] || "🏅";
}
