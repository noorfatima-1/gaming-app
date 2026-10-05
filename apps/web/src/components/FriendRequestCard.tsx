"use client";

import type { Friendship } from "shared";

interface Props {
  friendship: Friendship;
  onAccept: () => void;
  onDecline: () => void;
}

export default function FriendRequestCard({ friendship, onAccept, onDecline }: Props) {
  const friend = friendship.friend;
  if (!friend) return null;

  return (
    <div className="bg-white/5 rounded-lg p-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-sm font-bold">
          {friend.display_name?.charAt(0).toUpperCase() || "?"}
        </div>
        <div>
          <div className="text-sm font-medium">{friend.display_name}</div>
          <div className="text-xs text-white/40">Level {friend.level}</div>
        </div>
      </div>
      <div className="flex gap-2">
        <button
          onClick={onAccept}
          className="px-3 py-1.5 bg-green-600 hover:bg-green-700 rounded-lg text-xs font-medium transition-colors"
        >
          Accept
        </button>
        <button
          onClick={onDecline}
          className="px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-xs font-medium transition-colors"
        >
          Decline
        </button>
      </div>
    </div>
  );
}
