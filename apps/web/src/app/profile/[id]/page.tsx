"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { api } from "../../../lib/api";
import ProfileCard from "../../../components/ProfileCard";
import GameHistoryList from "../../../components/GameHistoryList";
import type { UserProfile, GameHistoryEntry } from "shared";

export default function UserProfilePage() {
  const params = useParams();
  const userId = params.id as string;
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<Record<string, unknown> | null>(null);
  const [history, setHistory] = useState<GameHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    loadUserProfile();
  }, [userId]);

  async function loadUserProfile() {
    try {
      const [profileData, historyData, leaderboard] = await Promise.all([
        api.getProfile(userId),
        api.getHistory(userId).catch(() => ({ data: [] })),
        api.getLeaderboard().catch(() => []),
      ]);

      setProfile(profileData as UserProfile);
      setHistory(((historyData as Record<string, unknown>).data || []) as GameHistoryEntry[]);

      const myStats = (leaderboard as Record<string, unknown>[]).find((e) => e.user_id === userId);
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
      console.error("Failed to load user profile:", err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 pt-20 px-4">
        <div className="max-w-2xl mx-auto space-y-4">
          <div className="glass-card rounded-2xl h-48 animate-pulse" />
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 pt-20 flex items-center justify-center">
        <p className="text-white/40">User not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 pt-20 pb-8 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <ProfileCard profile={profile} stats={stats} />
        <div className="glass-card rounded-2xl p-6">
          <h3 className="text-lg font-bold mb-4">Recent Games</h3>
          <GameHistoryList history={history} />
        </div>
      </div>
    </div>
  );
}
