"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useActiveTrades } from "@/lib/hooks/use-analyst-dashboard";
import { Icon } from "@/components/stoxify-icon";

// ─── Nav Config ───────────────────────────────────────────────────────────────

const MAIN_NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: "layoutDashboard" as const },
  { href: "/dashboard/live-trades", label: "Live Trades", icon: "activity" as const },
  { href: "/dashboard/subscribers", label: "Subscribers", icon: "users" as const },
  {
    href: "/dashboard/subscription-plans",
    label: "Subscription Plans",
    icon: "creditCard" as const,
  },
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

  const handleLogout = () => {
    document.cookie = "userInfo=; path=/; max-age=0";
    window.location.href = "/login";
  };

  // Badge count for Live Trades
  const badgeCounts: Record<string, number> = {
    "/dashboard/live-trades": activeTradesCount,
  };

  return (
    <aside className="fixed inset-y-0 left-0 z-[100] flex w-[200px] flex-col bg-[var(--footer-bg)] text-white select-none">
      {/* ── Logo ── */}
      <div className="flex h-[60px] shrink-0 items-center px-5 border-b border-white/5">
        <Link
          className="flex items-center gap-2 font-sans text-[20px] font-extrabold tracking-[-0.5px] text-white"
          href="/dashboard"
        >
          Stoxify
        </Link>
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
                    flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13.5px] font-semibold
                    transition-colors duration-150
                    ${
                      active
                        ? "bg-[var(--brand)] text-white"
                        : "text-white/60 hover:bg-white/5 hover:text-white"
                    }
                  `}
                  href={item.href}
                >
                  <Icon className="h-[14px] w-[14px] shrink-0 opacity-90" name={item.icon} />
                  <span className="flex-1">{item.label}</span>
                  {/* Badge count bubble (blue circle matching design) */}
                  {(badgeCounts[item.href] ?? 0) > 0 && (
                    <span
                      className={`ml-auto flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${
                        active ? "bg-white/20 text-white" : "bg-[var(--brand)] text-white"
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
            flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13.5px] font-semibold
            transition-colors duration-150
            ${
              isActive("/dashboard/profile")
                ? "bg-[#1a2c42] text-white" // Highlighted dark navy active item background
                : "text-white/60 hover:bg-white/5 hover:text-white"
            }
          `}
          href="/dashboard/profile"
        >
          <Icon className="h-[14px] w-[14px] shrink-0 opacity-90" name="gear" />
          Settings
        </Link>
        <button
          className="w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13.5px] font-semibold text-white/60 hover:bg-white/5 hover:text-white transition-colors cursor-pointer text-left"
          onClick={handleLogout}
          type="button"
        >
          <Icon className="h-[14px] w-[14px] shrink-0 opacity-90" name="logout" />
          Logout
        </button>
      </div>
    </aside>
  );
}
