"use client";

import { useEffect } from "react";
import { useSocket } from "./useSocket";
import { useSocialStore } from "../store/socialStore";
import { useGameStore } from "../store/gameStore";
import type { Notification, UserProfile, GameType } from "shared";

export function useSocialEvents() {
  const socket = useSocket();
  const userId = useGameStore((s) => s.userId);
  const addToast = useGameStore((s) => s.addToast);

  const setFriendOnline = useSocialStore((s) => s.setFriendOnline);
  const setFriendOffline = useSocialStore((s) => s.setFriendOffline);
  const addNotification = useSocialStore((s) => s.addNotification);

  useEffect(() => {
    if (!socket) return;

    // Tell server we're online
    if (userId) {
      socket.emit("social:set-online", userId);
    }

    const handleFriendOnline = (friendUserId: string) => {
      setFriendOnline(friendUserId);
    };

    const handleFriendOffline = (friendUserId: string) => {
      setFriendOffline(friendUserId);
    };

    const handleInvite = (data: { fromUser: UserProfile; roomId: string; gameType: GameType }) => {
      addToast(`${data.fromUser.display_name} invited you to play ${data.gameType}!`, "info");
      addNotification({
        id: Date.now().toString(),
        type: "game_invite",
        title: "Game Invite",
        body: `${data.fromUser.display_name} invited you to play`,
        data: { roomId: data.roomId, gameType: data.gameType },
        is_read: false,
        created_at: new Date().toISOString(),
      });
    };

    const handleNotification = (notification: Notification) => {
      addNotification(notification);
      if (notification.type === "achievement") {
        addToast(notification.title, "success");
      }
    };

    socket.on("social:friend-online", handleFriendOnline);
    socket.on("social:friend-offline", handleFriendOffline);
    socket.on("social:invite-received", handleInvite);
    socket.on("notification:new", handleNotification);

    return () => {
      socket.off("social:friend-online", handleFriendOnline);
      socket.off("social:friend-offline", handleFriendOffline);
      socket.off("social:invite-received", handleInvite);
      socket.off("notification:new", handleNotification);
    };
  }, [socket, userId, setFriendOnline, setFriendOffline, addNotification, addToast]);
}
