"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

import { useWebSocket } from "@/hooks/use-websocket";
import { Icon, type IconName } from "@/components/stoxify-icon";
import { LogoutButton } from "@/components/logout-button";

type TraderUser = {
  user_id: string;
  name: string;
  email: string;
  phone: string;
  state: string;
  user_type?: string;
};

const navItems: Array<{
  href: string;
  label: string;
  icon: IconName;
}> = [
  { href: "/trader/dashboard", label: "Dashboard", icon: "barChart" },
  { href: "/trader/discover", label: "Discover", icon: "search" },
  { href: "/trader/profile?tab=subscriptions", label: "Subscriptions", icon: "listChecks" },
  { href: "/trader/notifications", label: "Notifications", icon: "bell" },
  { href: "/trader/profile", label: "Profile", icon: "users" },
  { href: "/trader/support", label: "Help & Support", icon: "helpCircle" },
];

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "U";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return parts
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();
}

export function TraderShell({ user, children }: { user: TraderUser; children: React.ReactNode }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const { latestNotification } = useWebSocket();

  const { data: unreadData, mutate: mutateUnread } = useSWR(
    "/api/trader/notifications?read=false&limit=1",
    fetcher
  );
  const hasUnread = (unreadData?.notifications?.length ?? unreadData?.data?.length ?? 0) > 0;

  useEffect(() => {
    if (latestNotification) {
      mutateUnread();
      toast.success(String(latestNotification.title ?? ""), {
        description: String(latestNotification.message ?? ""),
        duration: 5000,
      });
    }
  }, [latestNotification, mutateUnread]);

  // If the user visits the notifications page, optimistically clear the badge
  // until the page actually marks them as read.
  useEffect(() => {
    if (pathname === "/trader/notifications") {
      mutateUnread({ notifications: [] }, { revalidate: true });
    }
  }, [pathname, mutateUnread]);

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--surface)]">
      {/* ─── DESKTOP SIDEBAR ─── */}
      <aside className="hidden w-[260px] shrink-0 flex-col border-r border-[var(--line)] bg-white lg:flex">
        {/* Logo */}
        <div className="flex h-[66px] items-center px-6 border-b border-[var(--line)]">
          <Link
            href="/"
            className="flex items-center font-sans text-[21px] font-extrabold tracking-[-0.5px] text-[var(--ink)]"
          >
            Stoxify
          </Link>
        </div>

        {/* Nav Items */}
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <ul className="flex list-none flex-col gap-0.5">
            {navItems.map((item) => {
              const isProfilePage = pathname === "/trader/profile";
              const isSubscriptionsLink = item.href.includes("tab=subscriptions");
              const isProfileLink = item.href === "/trader/profile";

              let isActive = false;
              if (isProfilePage) {
                const isTabSub =
                  typeof window !== "undefined" &&
                  window.location.search.includes("tab=subscriptions");
                if (isTabSub) {
                  isActive = isSubscriptionsLink;
                } else {
                  isActive = isProfileLink;
                }
              } else {
                isActive =
                  !isSubscriptionsLink &&
                  !isProfileLink &&
                  (pathname === item.href ||
                    (item.href !== "/trader/dashboard" && pathname.startsWith(item.href)));
              }
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={[
                      "flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13.5px] font-medium transition-all",
                      isActive
                        ? "bg-[var(--brand-light)] text-[var(--brand)] font-semibold"
                        : "text-[var(--muted)] hover:bg-[var(--line-2)] hover:text-[var(--ink)]",
                    ].join(" ")}
                  >
                    <Icon
                      name={item.icon}
                      className={[
                        "h-4 w-4",
                        isActive ? "text-[var(--brand)]" : "text-[var(--muted-2)]",
                      ].join(" ")}
                    />
                    <div className="flex flex-1 items-center justify-between">
                      <span>{item.label}</span>
                      {item.label === "Notifications" && hasUnread && (
                        <span className="h-2 w-2 shrink-0 rounded-full bg-[var(--brand)] animate-pulse" />
                      )}
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* User Footer */}
        <div className="border-t border-[var(--line)] px-4 py-4">
          <Link
            href={user.user_type === "ANALYST" ? "/dashboard" : "/trader/profile"}
            className="flex items-center gap-3 hover:opacity-90 transition-opacity"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--brand)] text-[11px] font-extrabold text-white select-none">
              {getInitials(user.name || user.email || "U")}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[13px] font-bold text-[var(--ink)] truncate">
                {user.name || "Trader"}
              </div>
              <div className="text-[11px] text-[var(--muted-2)] truncate">
                {user.phone || user.email}
              </div>
            </div>
          </Link>
          <LogoutButton className="mt-3 w-full rounded-lg border border-[var(--line)] bg-transparent px-3 py-2 text-[12px] font-semibold text-[var(--muted)] transition-colors hover:border-[var(--red)] hover:bg-[var(--red-light)] hover:text-[var(--red)]">
            Sign out
          </LogoutButton>
        </div>
      </aside>

      {/* ─── MOBILE OVERLAY ─── */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-[300] bg-black/40 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ─── MOBILE SIDEBAR ─── */}
      <aside
        className={[
          "fixed inset-y-0 left-0 z-[301] w-[280px] flex flex-col border-r border-[var(--line)] bg-white transition-transform duration-300 ease-out lg:hidden",
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
        ].join(" ")}
      >
        <div className="flex h-[60px] items-center justify-between px-5 border-b border-[var(--line)]">
          <Link
            href="/"
            className="font-sans text-[20px] font-extrabold tracking-[-0.5px] text-[var(--ink)]"
          >
            Stoxify
          </Link>
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--muted)] hover:bg-[var(--line-2)]"
          >
            <Icon name="x" className="h-4 w-4" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <ul className="flex list-none flex-col gap-0.5">
            {navItems.map((item) => {
              const isProfilePage = pathname === "/trader/profile";
              const isSubscriptionsLink = item.href.includes("tab=subscriptions");
              const isProfileLink = item.href === "/trader/profile";

              let isActive = false;
              if (isProfilePage) {
                const isTabSub =
                  typeof window !== "undefined" &&
                  window.location.search.includes("tab=subscriptions");
                if (isTabSub) {
                  isActive = isSubscriptionsLink;
                } else {
                  isActive = isProfileLink;
                }
              } else {
                isActive =
                  !isSubscriptionsLink &&
                  !isProfileLink &&
                  (pathname === item.href ||
                    (item.href !== "/trader/dashboard" && pathname.startsWith(item.href)));
              }
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={[
                      "flex items-center gap-3 rounded-lg px-3 py-2.5 text-[14px] font-medium transition-all",
                      isActive
                        ? "bg-[var(--brand-light)] text-[var(--brand)] font-semibold"
                        : "text-[var(--muted)] hover:bg-[var(--line-2)] hover:text-[var(--ink)]",
                    ].join(" ")}
                  >
                    <Icon
                      name={item.icon}
                      className={[
                        "h-4 w-4",
                        isActive ? "text-[var(--brand)]" : "text-[var(--muted-2)]",
                      ].join(" ")}
                    />
                    <div className="flex flex-1 items-center justify-between">
                      <span>{item.label}</span>
                      {item.label === "Notifications" && hasUnread && (
                        <span className="h-2 w-2 shrink-0 rounded-full bg-[var(--brand)] animate-pulse" />
                      )}
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="border-t border-[var(--line)] px-4 py-4">
          <Link
            href={user.user_type === "ANALYST" ? "/dashboard" : "/trader/profile"}
            onClick={() => setSidebarOpen(false)}
            className="flex items-center gap-3 mb-3 hover:opacity-90 transition-opacity"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--brand)] text-[11px] font-extrabold text-white select-none">
              {getInitials(user.name || user.email || "U")}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[13px] font-bold text-[var(--ink)] truncate">
                {user.name || "Trader"}
              </div>
              <div className="text-[11px] text-[var(--muted-2)] truncate">
                {user.phone || user.email}
              </div>
            </div>
          </Link>
          <LogoutButton className="w-full rounded-lg border border-[var(--line)] bg-transparent px-3 py-2 text-[12px] font-semibold text-[var(--muted)] transition-colors hover:border-[var(--red)] hover:bg-[var(--red-light)] hover:text-[var(--red)]">
            Sign out
          </LogoutButton>
        </div>
      </aside>

      {/* ─── MAIN CONTENT ─── */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top Bar (mobile) */}
        <header className="flex h-[60px] shrink-0 items-center justify-between border-b border-[var(--line)] bg-white px-4 lg:hidden">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-[var(--ink)] hover:bg-[var(--line-2)]"
            aria-label="Open menu"
          >
            <span className="flex flex-col gap-[4px]">
              <span className="block h-[2px] w-[18px] rounded-full bg-[var(--ink)]" />
              <span className="block h-[2px] w-[18px] rounded-full bg-[var(--ink)]" />
              <span className="block h-[2px] w-[18px] rounded-full bg-[var(--ink)]" />
            </span>
          </button>
          <Link
            href="/"
            className="font-sans text-[18px] font-extrabold tracking-[-0.5px] text-[var(--ink)]"
          >
            Stoxify
          </Link>
          <Link
            href={user.user_type === "ANALYST" ? "/dashboard" : "/trader/profile"}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--brand)] text-[10px] font-extrabold text-white select-none hover:opacity-90 transition-opacity"
          >
            {getInitials(user.name || user.email || "U")}
          </Link>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
