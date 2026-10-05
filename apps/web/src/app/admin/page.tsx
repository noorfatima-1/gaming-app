"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "../../lib/supabase-browser";
import { api } from "../../lib/api";

interface Stats {
  totalUsers: number;
  gamesToday: number;
  totalGames: number;
  activeRooms: number;
}

export default function AdminPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [games, setGames] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const router = useRouter();

  useEffect(() => {
    checkAdminAndLoad();
  }, []);

  async function checkAdminAndLoad() {
    try {
      // Check if user is admin from their profile
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }

      const profile = await api.getProfile(user.id) as any;
      if (!profile?.is_admin) {
        setError("Access denied. Admin privileges required.");
        setLoading(false);
        return;
      }

      setIsAdmin(true);

      const [statsData, usersData, gamesData] = await Promise.all([
        api.getAdminStats(),
        api.getAdminUsers(),
        api.getAdminGames(),
      ]);
      setStats(statsData as Stats);
      setUsers((usersData as any).data || []);
      setGames((gamesData as any).data || []);
    } catch {
      setError("Access denied or failed to load data");
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 pt-20 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="glass-card rounded-xl h-24 animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 pt-20 flex items-center justify-center">
        <div className="glass-card rounded-xl p-6 text-center">
          <p className="text-red-400 font-medium">{error}</p>
          <p className="text-sm text-white/40 mt-2">You need admin privileges to view this page.</p>
          <button
            onClick={() => router.push("/")}
            className="mt-4 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-sm font-medium transition-colors"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 pt-20 pb-8 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-2xl font-black gradient-text">Admin Dashboard</h1>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard label="Total Users" value={stats.totalUsers} color="purple" />
            <StatCard label="Games Today" value={stats.gamesToday} color="green" />
            <StatCard label="Total Games" value={stats.totalGames} color="blue" />
            <StatCard label="Active Rooms" value={stats.activeRooms} color="yellow" />
          </div>
        )}

        {/* Recent Users */}
        <div className="glass-card rounded-2xl p-6">
          <h2 className="font-bold mb-4">Recent Users</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-white/40 border-b border-white/10">
                  <th className="pb-2">User</th>
                  <th className="pb-2">Level</th>
                  <th className="pb-2">XP</th>
                  <th className="pb-2">Joined</th>
                </tr>
              </thead>
              <tbody>
                {users.slice(0, 10).map((u: any) => (
                  <tr key={u.id} className="border-b border-white/5">
                    <td className="py-2">{u.display_name || u.username}</td>
                    <td className="py-2">{u.level}</td>
                    <td className="py-2">{u.xp}</td>
                    <td className="py-2 text-white/40">{new Date(u.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Games */}
        <div className="glass-card rounded-2xl p-6">
          <h2 className="font-bold mb-4">Recent Games</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-white/40 border-b border-white/10">
                  <th className="pb-2">Type</th>
                  <th className="pb-2">Players</th>
                  <th className="pb-2">Rounds</th>
                  <th className="pb-2">Date</th>
                </tr>
              </thead>
              <tbody>
                {games.slice(0, 10).map((g: any) => (
                  <tr key={g.id} className="border-b border-white/5">
                    <td className="py-2">{g.game_type === "crazy-eights" ? "Crazy Eights" : "Draw & Guess"}</td>
                    <td className="py-2">{g.player_count}</td>
                    <td className="py-2">{g.rounds}</td>
                    <td className="py-2 text-white/40">{new Date(g.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  const colorClasses: Record<string, string> = {
    purple: "from-purple-500/20 to-purple-600/20 border-purple-500/30",
    green: "from-green-500/20 to-green-600/20 border-green-500/30",
    blue: "from-blue-500/20 to-blue-600/20 border-blue-500/30",
    yellow: "from-yellow-500/20 to-yellow-600/20 border-yellow-500/30",
  };

  return (
    <div className={`bg-gradient-to-br ${colorClasses[color]} border rounded-xl p-4 text-center`}>
      <div className="text-2xl font-black">{value}</div>
      <div className="text-xs text-white/40">{label}</div>
    </div>
  );
}
