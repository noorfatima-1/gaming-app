"use client";

import Link from "next/link";
import { useSocialStore } from "../store/socialStore";
import type { Friendship } from "shared";

interface Props {
  friends: Friendship[];
  isLoading?: boolean;
}

export default function FriendsList({ friends, isLoading }: Props) {
  const onlineFriends = useSocialStore((s) => s.onlineFriends);

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white/5 rounded-lg h-16 animate-pulse" />
        ))}
      </div>
    );
  }

  if (friends.length === 0) {
    return (
      <div className="text-center py-8 text-white/40">
        No friends yet. Add some friends to play together!
      </div>
    );
  }

  // Sort: online first
  const sorted = [...friends].sort((a, b) => {
    const aOnline = a.friend ? onlineFriends.has(a.friend.id) : false;
    const bOnline = b.friend ? onlineFriends.has(b.friend.id) : false;
    if (aOnline && !bOnline) return -1;
    if (!aOnline && bOnline) return 1;
    return 0;
  });

  return (
    <div className="space-y-2">
      {sorted.map((f) => {
        if (!f.friend) return null;
        const isOnline = onlineFriends.has(f.friend.id);

        return (
          <Link
            key={f.id}
            href={`/profile/${f.friend.id}`}
            className="bg-white/5 hover:bg-white/10 rounded-lg p-3 flex items-center gap-3 transition-colors block"
          >
            <div className="relative">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-sm font-bold">
                {f.friend.avatar_url ? (
                  <img src={f.friend.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
                ) : (
                  f.friend.display_name?.charAt(0).toUpperCase() || "?"
                )}
              </div>
              <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[#0f0a1a] ${
                isOnline ? "bg-green-400" : "bg-white/20"
              }`} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate">{f.friend.display_name}</div>
              <div className="text-xs text-white/40">
                {isOnline ? "Online" : "Offline"} - Level {f.friend.level}
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
