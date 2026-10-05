"use client";

import { useEffect, useState } from "react";
import { api } from "../../lib/api";
import { useSocialStore } from "../../store/socialStore";
import FriendsList from "../../components/FriendsList";
import FriendRequestCard from "../../components/FriendRequestCard";
import AddFriendModal from "../../components/AddFriendModal";
import type { Friendship } from "shared";

export default function FriendsPage() {
  const friends = useSocialStore((s) => s.friends);
  const setFriends = useSocialStore((s) => s.setFriends);
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFriends();
  }, []);

  async function loadFriends() {
    try {
      const data = await api.getFriends();
      setFriends(data as Friendship[]);
    } catch (err) {
      console.error("Failed to load friends:", err);
    } finally {
      setLoading(false);
    }
  }

  const accepted = friends.filter((f) => f.status === "accepted");
  const pendingReceived = friends.filter(
    (f) => f.status === "pending" && f.friend // friend is the other user
  );

  async function handleRespond(id: string, status: "accepted" | "declined") {
    try {
      await api.respondFriendRequest(id, status);
      await loadFriends(); // Refresh
    } catch (err) {
      console.error("Failed to respond:", err);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 pt-20 pb-8 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-black gradient-text">Friends</h1>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-sm font-medium transition-colors"
          >
            Add Friend
          </button>
        </div>

        {/* Pending requests */}
        {pendingReceived.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-sm font-medium text-white/60">
              Pending Requests ({pendingReceived.length})
            </h2>
            {pendingReceived.map((f) => (
              <FriendRequestCard
                key={f.id}
                friendship={f}
                onAccept={() => handleRespond(f.id, "accepted")}
                onDecline={() => handleRespond(f.id, "declined")}
              />
            ))}
          </div>
        )}

        {/* Friends list */}
        <div>
          <h2 className="text-sm font-medium text-white/60 mb-3">
            Friends ({accepted.length})
          </h2>
          <FriendsList friends={accepted} isLoading={loading} />
        </div>

        {showAddModal && (
          <AddFriendModal
            onClose={() => setShowAddModal(false)}
            onSent={() => loadFriends()}
          />
        )}
      </div>
    </div>
  );
}
