"use client";

import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { useSocialStore } from "../store/socialStore";
import type { Notification } from "shared";

export default function NotificationBell() {
  const notifications = useSocialStore((s) => s.notifications);
  const setNotifications = useSocialStore((s) => s.setNotifications);
  const markRead = useSocialStore((s) => s.markRead);
  const unreadCount = useSocialStore((s) => s.unreadCount);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    api.getNotifications().then((data) => {
      setNotifications(data as Notification[]);
    }).catch(() => {});
  }, [setNotifications]);

  async function handleMarkRead(id: string) {
    markRead(id);
    await api.markNotificationRead(id).catch(() => {});
  }

  async function handleMarkAllRead() {
    useSocialStore.setState({
      notifications: notifications.map((n) => ({ ...n, is_read: true })),
      unreadCount: 0,
    });
    await api.markAllNotificationsRead().catch(() => {});
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative text-white/60 hover:text-white transition-colors"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[10px] flex items-center justify-center font-bold">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-8 z-50 w-80 glass-card rounded-xl border border-white/10 shadow-2xl max-h-96 overflow-hidden">
            <div className="p-3 border-b border-white/10 flex items-center justify-between">
              <span className="text-sm font-bold">Notifications</span>
              {unreadCount > 0 && (
                <button onClick={handleMarkAllRead} className="text-xs text-purple-400 hover:text-purple-300">
                  Mark all read
                </button>
              )}
            </div>
            <div className="overflow-y-auto max-h-72">
              {notifications.length === 0 ? (
                <div className="p-4 text-sm text-white/40 text-center">No notifications</div>
              ) : (
                notifications.slice(0, 20).map((n) => (
                  <button
                    key={n.id}
                    onClick={() => handleMarkRead(n.id)}
                    className={`w-full text-left p-3 border-b border-white/5 hover:bg-white/5 transition-colors ${
                      n.is_read ? "opacity-50" : ""
                    }`}
                  >
                    <div className="text-xs font-medium">{n.title}</div>
                    {n.body && <div className="text-xs text-white/40 mt-0.5">{n.body}</div>}
                    <div className="text-[10px] text-white/20 mt-1">
                      {new Date(n.created_at).toLocaleDateString()}
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
