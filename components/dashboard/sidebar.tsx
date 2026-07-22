"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useActiveTrades } from "@/hooks/use-analyst-dashboard";
import { Logo } from "@/components/logo";
import { Icon } from "@/components/stoxify-icon";

// ─── Nav Config ───────────────────────────────────────────────────────────────

const MAIN_NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: "layoutDashboard" as const },
  { href: "/dashboard/live-trades", label: "Live Trades", icon: "activity" as const },
  { href: "/dashboard/subscribers", label: "Subscribers", icon: "users" as const },
  {
    href: "/dashboard/subscription-plans",
    label: "Batches",
    icon: "creditCard" as const,
  },
  { href: "/dashboard/discounts", label: "Discounts", icon: "ticket" as const },
  { href: "/dashboard/performance", label: "Performance", icon: "barChart" as const },
];

// ─── Component ────────────────────────────────────────────────────────────────

export function Sidebar() {
  const pathname = usePathname();
  const { trades } = useActiveTrades(9999);
  const activeTradesCount = trades?.length ?? 0;

  // A nav item is "active" if the current path exactly matches it,
  // or if we're on a sub-path
  const isActive = (href: string) =>
    href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(href);

  const handleLogout = async () => {
    try {
      if (typeof window !== "undefined") {
        localStorage.removeItem("stoxify_last_activity_timestamp");
      }
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "same-origin",
        cache: "no-store",
      });
    } finally {
      window.location.href = "/";
    }
  };

  // Badge count for Live Trades
  const badgeCounts: Record<string, number> = {
    "/dashboard/live-trades": activeTradesCount,
  };

  return (
    <aside className="fixed inset-y-0 left-0 z-[100] flex w-[200px] flex-col bg-[var(--footer-bg)] text-white select-none">
      {/* ── Logo ── */}
      <div className="flex h-[60px] shrink-0 items-center px-5 border-b border-white/5">
        <Logo asLink href="/dashboard" variant="reversed" size="md" />
      </div>

      {/* ── Navigation List (With icons, no section headers) ── */}
      <nav className="flex flex-1 flex-col overflow-y-auto px-3 py-4">
        <ul className="space-y-1">
          {MAIN_NAV_ITEMS.map((item) => {
            const active = isActive(item.href);
            return (
              <li key={item.href}>
                <Link
                  className={`
                    flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13.5px] font-semibold
                    transition-all duration-150
                    ${
                      active
                        ? "bg-[#1A5CC8] text-white shadow-sm font-bold"
                        : "text-white/75 hover:bg-white/10 hover:text-white"
                    }
                  `}
                  href={item.href}
                >
                  <Icon size={16} name={item.icon} className={active ? "text-white" : "text-white/75"} />
                  <span className="flex-1">{item.label}</span>
                  {/* Badge count bubble (blue circle matching design) */}
                  {(badgeCounts[item.href] ?? 0) > 0 && (
                    <span
                      className={`ml-auto flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${
                        active ? "bg-white/20 text-white" : "bg-[#1A5CC8] text-white"
                      }`}
                    >
                      {badgeCounts[item.href]}
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* ── Bottom Section (Settings & Logout) ── */}
      <div className="shrink-0 border-t border-white/10 p-3 flex flex-col gap-1">
        <Link
          className={`
            flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13.5px] font-semibold
            transition-all duration-150
            ${
              isActive("/dashboard/profile")
                ? "bg-[#1A5CC8] text-white shadow-sm font-bold"
                : "text-white/75 hover:bg-white/10 hover:text-white"
            }
          `}
          href="/dashboard/profile"
        >
          <Icon size={16} name="gear" className={isActive("/dashboard/profile") ? "text-white" : "text-white/75"} />
          Settings
        </Link>
        <button
          className="w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13.5px] font-semibold text-white/75 hover:bg-white/10 hover:text-white transition-all cursor-pointer text-left"
          onClick={handleLogout}
          type="button"
        >
          <Icon size={16} name="logout" className="text-white/75" />
          Logout
        </button>
      </div>
    </aside>
  );
}
