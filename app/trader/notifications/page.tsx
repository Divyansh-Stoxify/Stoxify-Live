"use client";

import { useCallback, useEffect, useState } from "react";

import { Icon, type IconName } from "@/components/stoxify-icon";

type Notification = {
  notification_id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  created_at: string;
  related_entity_type?: string;
  related_entity_id?: string;
  data?: Record<string, unknown>;
};

function timeAgo(dateString: string): string {
  const now = Date.now();
  const then = new Date(dateString).getTime();
  const diff = Math.max(0, now - then);
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateString).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
  });
}

function getNotifStyle(type: string): {
  icon: IconName;
  iconWrap: string;
  iconColor: string;
} {
  switch (type) {
    case "TRADE_CREATED":
      return {
        icon: "zap",
        iconWrap: "bg-[var(--green-light)]",
        iconColor: "text-[var(--green)]",
      };
    case "TRADE_MODIFIED":
      return {
        icon: "lineChart",
        iconWrap: "bg-[var(--orange-light)]",
        iconColor: "text-[var(--orange)]",
      };
    case "TRADE_CLOSED":
      return {
        icon: "target",
        iconWrap: "bg-[var(--brand-light)]",
        iconColor: "text-[var(--brand)]",
      };
    case "SUBSCRIPTION_EXPIRING":
    case "SUBSCRIPTION_EXPIRED":
      return {
        icon: "timer",
        iconWrap: "bg-[var(--red-light)]",
        iconColor: "text-[var(--red)]",
      };
    case "SYSTEM_ANNOUNCEMENT":
      return {
        icon: "bell",
        iconWrap: "bg-[rgba(139,92,246,0.08)]",
        iconColor: "text-[#6D28D9]",
      };
    default:
      return {
        icon: "bell",
        iconWrap: "bg-[var(--surface)]",
        iconColor: "text-[var(--muted)]",
      };
  }
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "unread">("all");

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: "30" });
      if (filter === "unread") params.set("read", "false");
      const res = await fetch(`/api/trader/notifications?${params.toString()}`, {
        credentials: "same-origin",
        cache: "no-store",
      });
      const data = await res.json().catch(() => ({}));
      setNotifications(data.notifications ?? data.data ?? []);
    } catch {
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    Promise.resolve().then(() => {
      fetchNotifications();
    });
  }, [fetchNotifications]);

  const markAsRead = async (notificationId: string) => {
    // Optimistic update
    setNotifications((prev) =>
      prev.map((n) => (n.notification_id === notificationId ? { ...n, read: true } : n))
    );

    try {
      await fetch("/api/trader/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ notification_id: notificationId }),
      });
    } catch {
      // Revert on error
      setNotifications((prev) =>
        prev.map((n) => (n.notification_id === notificationId ? { ...n, read: false } : n))
      );
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="px-6 py-6 lg:px-8 lg:py-8 max-w-[800px] mx-auto">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-[24px] font-extrabold tracking-[-0.5px] text-[var(--ink)]">
            Notifications
          </h1>
          <p className="mt-1 text-[13px] text-[var(--muted)]">
            {unreadCount > 0
              ? `You have ${unreadCount} unread notification${unreadCount > 1 ? "s" : ""}`
              : "You're all caught up!"}
          </p>
        </div>
        <div className="flex rounded-lg border border-[var(--line)] bg-[var(--surface)] p-0.5">
          <button
            type="button"
            onClick={() => setFilter("all")}
            className={[
              "rounded-md px-3.5 py-1.5 text-[12px] font-bold transition-all",
              filter === "all"
                ? "bg-white text-[var(--brand)] shadow-sm"
                : "text-[var(--muted)] hover:text-[var(--ink)]",
            ].join(" ")}
          >
            All
          </button>
          <button
            type="button"
            onClick={() => setFilter("unread")}
            className={[
              "rounded-md px-3.5 py-1.5 text-[12px] font-bold transition-all",
              filter === "unread"
                ? "bg-white text-[var(--brand)] shadow-sm"
                : "text-[var(--muted)] hover:text-[var(--ink)]",
            ].join(" ")}
          >
            Unread
          </button>
        </div>
      </div>

      {/* Notification List */}
      {loading ? (
        <div className="flex flex-col gap-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="rounded-xl border border-[var(--line)] bg-white p-4 animate-pulse flex items-start gap-3"
            >
              <div className="h-10 w-10 rounded-lg bg-[var(--line)] shrink-0" />
              <div className="flex-1">
                <div className="h-3.5 w-40 rounded bg-[var(--line)] mb-2" />
                <div className="h-3 w-full rounded bg-[var(--line)] mb-1" />
                <div className="h-3 w-2/3 rounded bg-[var(--line)]" />
              </div>
            </div>
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--brand-light)] text-[var(--brand)]">
            <Icon name="bell" className="h-6 w-6" />
          </div>
          <h3 className="text-[15px] font-bold text-[var(--ink)] mb-1.5">
            {filter === "unread" ? "No unread notifications" : "No notifications yet"}
          </h3>
          <p className="text-[13px] text-[var(--muted)] max-w-[300px]">
            {filter === "unread"
              ? "You've read all your notifications. Switch to 'All' to see your history."
              : "Subscribe to analysts to start receiving trade alerts and updates."}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {notifications.map((notif) => {
            const style = getNotifStyle(notif.type);
            return (
              <button
                key={notif.notification_id}
                type="button"
                onClick={() => {
                  if (!notif.read) markAsRead(notif.notification_id);
                }}
                className={[
                  "w-full text-left rounded-xl border-[1.5px] p-4 transition-all flex items-start gap-3",
                  notif.read
                    ? "border-[var(--line)] bg-white hover:bg-[var(--surface)]"
                    : "border-[var(--brand-mid)] bg-[var(--brand-light)]/30 hover:bg-[var(--brand-light)]/50",
                ].join(" ")}
              >
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${style.iconWrap}`}
                >
                  <Icon name={style.icon} className={`h-4 w-4 ${style.iconColor}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <h3
                      className={`text-[13px] truncate ${
                        notif.read
                          ? "font-semibold text-[var(--ink)]"
                          : "font-bold text-[var(--ink)]"
                      }`}
                    >
                      {notif.title}
                    </h3>
                    {!notif.read && (
                      <span className="h-2 w-2 shrink-0 rounded-full bg-[var(--brand)]" />
                    )}
                  </div>
                  <p className="text-[12px] text-[var(--muted)] leading-relaxed line-clamp-2">
                    {notif.message}
                  </p>
                  <div className="mt-1.5 text-[11px] text-[var(--muted-2)]">
                    {timeAgo(notif.created_at)}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
