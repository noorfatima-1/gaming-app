import { Server } from "socket.io";
import { getSupabase } from "../lib/supabase";
import type { ClientEvents, ServerEvents } from "shared";

class OnlineTracker {
  // userId -> Set of socketIds (one user can have multiple tabs)
  private onlineUsers: Map<string, Set<string>> = new Map();
  // socketId -> userId
  private socketToUser: Map<string, string> = new Map();

  private io: Server<ClientEvents, ServerEvents> | null = null;

  setIO(io: Server<ClientEvents, ServerEvents>) {
    this.io = io;
  }

  async setOnline(socketId: string, userId: string): Promise<void> {
    this.socketToUser.set(socketId, userId);

    let sockets = this.onlineUsers.get(userId);
    const wasOffline = !sockets || sockets.size === 0;

    if (!sockets) {
      sockets = new Set();
      this.onlineUsers.set(userId, sockets);
    }
    sockets.add(socketId);

    // If user just came online, notify their friends
    if (wasOffline) {
      await this.updateOnlineStatus(userId, true);
      await this.notifyFriends(userId, "social:friend-online");
    }
  }

  async setOffline(socketId: string): Promise<void> {
    const userId = this.socketToUser.get(socketId);
    if (!userId) return;

    this.socketToUser.delete(socketId);
    const sockets = this.onlineUsers.get(userId);
    if (sockets) {
      sockets.delete(socketId);

      // If no more sockets, user is fully offline
      if (sockets.size === 0) {
        this.onlineUsers.delete(userId);
        await this.updateOnlineStatus(userId, false);
        await this.notifyFriends(userId, "social:friend-offline");
      }
    }
  }

  isOnline(userId: string): boolean {
    const sockets = this.onlineUsers.get(userId);
    return !!sockets && sockets.size > 0;
  }

  getSocketsForUser(userId: string): Set<string> {
    return this.onlineUsers.get(userId) || new Set();
  }

  private async updateOnlineStatus(userId: string, isOnline: boolean): Promise<void> {
    try {
      const supabase = getSupabase();
      await supabase
        .from("profiles")
        .update({
          is_online: isOnline,
          ...(isOnline ? {} : { last_seen: new Date().toISOString() }),
        })
        .eq("id", userId);
    } catch (err) {
      console.error("Failed to update online status:", err);
    }
  }

  private async notifyFriends(userId: string, event: "social:friend-online" | "social:friend-offline"): Promise<void> {
    if (!this.io) return;

    try {
      const supabase = getSupabase();
      const { data: friendships } = await supabase
        .from("friendships")
        .select("requester_id, addressee_id")
        .eq("status", "accepted")
        .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`);

      if (!friendships) return;

      for (const f of friendships) {
        const friendId = f.requester_id === userId ? f.addressee_id : f.requester_id;
        const friendSockets = this.getSocketsForUser(friendId);
        for (const socketId of friendSockets) {
          this.io.to(socketId).emit(event, userId);
        }
      }
    } catch (err) {
      console.error("Failed to notify friends:", err);
    }
  }
}

export const onlineTracker = new OnlineTracker();
