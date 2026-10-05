"use client";

import { useSocket } from "../hooks/useSocket";
import { useSocialStore } from "../store/socialStore";
import type { Friendship, GameType } from "shared";

interface Props {
  roomId: string;
  gameType: GameType;
  onClose: () => void;
}

export default function InviteModal({ roomId, gameType, onClose }: Props) {
  const socket = useSocket();
  const friends = useSocialStore((s) => s.friends);
  const onlineFriends = useSocialStore((s) => s.onlineFriends);

  const acceptedFriends = friends.filter((f) => f.status === "accepted");

  function handleInvite(friendId: string) {
    if (socket) {
      socket.emit("social:invite", friendId, roomId, gameType);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4" onClick={onClose}>
      <div className="glass-card rounded-2xl p-6 w-full max-w-sm space-y-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">Invite Friends</h2>
          <button onClick={onClose} className="text-white/40 hover:text-white">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-2 max-h-64 overflow-y-auto">
          {acceptedFriends.length === 0 ? (
            <p className="text-sm text-white/40 text-center py-4">No friends to invite</p>
          ) : (
            acceptedFriends.map((f) => {
              if (!f.friend) return null;
              const isOnline = onlineFriends.has(f.friend.id);
              return (
                <div key={f.id} className="bg-white/5 rounded-lg p-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-xs font-bold">
                        {f.friend.display_name?.charAt(0).toUpperCase() || "?"}
                      </div>
                      <div className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-[#0f0a1a] ${
                        isOnline ? "bg-green-400" : "bg-white/20"
                      }`} />
                    </div>
                    <span className="text-sm">{f.friend.display_name}</span>
                  </div>
                  <button
                    onClick={() => handleInvite(f.friend!.id)}
                    disabled={!isOnline}
                    className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-30 rounded-lg text-xs font-medium transition-colors"
                  >
                    {isOnline ? "Invite" : "Offline"}
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
