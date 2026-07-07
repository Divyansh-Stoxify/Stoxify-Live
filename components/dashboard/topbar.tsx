"use client";

import Image from "next/image";
import Link from "next/link";
import { Icon } from "@/components/stoxify-icon";
import { useAnalystProfile } from "@/hooks/use-analyst-dashboard";
import { useDashboard } from "@/components/dashboard/dashboard-context";

interface TopbarProps {
  /** Page title shown on the left e.g. "Dashboard" */
  title: string;
  /** Whether to show the SEBI Verified badge next to the title */
  showSebiVerified?: boolean;
  /** Whether to show the analyst avatar + name on the right (default: false) */
  showUserProfile?: boolean;
  /** Optional extra content to render on the right (overrides default Create Trade button) */
  actions?: React.ReactNode;
}

/**
 * DASHBOARD TOPBAR
 *
 * Sticky header rendered above all dashboard page content.
 * ─ Left: page title + optional SEBI Verified green badge
 * ─ Right: optional analyst profile + notification bell
 *          OR custom `actions` slot
 *
 * Sits 200px from the left to clear the fixed sidebar.
 */
export function Topbar({
  title,
  showSebiVerified = false,
  showUserProfile = false,
  actions,
}: TopbarProps) {
  const { profile } = useAnalystProfile();
  const { openCreateTrade, hasUnreadNotifications } = useDashboard();

  /** Returns initials from a full name: "Rohan Mehta" → "RM" */
  const initials = profile?.name
    ? profile.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "?";

  return (
    <header className="sticky top-0 z-[90] flex h-[60px] items-center border-b border-[var(--line)] bg-white/95 px-7 backdrop-blur-md">
      {/* ── Left: Title + Badge ── */}
      <div className="flex items-center gap-3">
        <h1 className="text-[20px] font-bold tracking-[-0.3px] text-[var(--ink)]">{title}</h1>

        {/* SEBI Verified badge — only show if requested AND analyst actually has a SEBI registration in DB */}
        {showSebiVerified && !!(profile?.sebi_license_number || profile?.sebi_registration_number) && (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--green)]/20 bg-[var(--green-light)] px-2.5 py-0.5 text-[11px] font-bold text-[var(--green)]">
            <Icon className="h-[10px] w-[10px]" name="circleCheck" />
            SEBI Verified
          </span>
        )}
      </div>

      {/* ── Spacer ── */}
      <div className="flex-1" />

      {/* ── Right: Actions + bell + optional user profile ── */}
      <div className="flex items-center gap-3">
        {/* Custom actions (e.g. "+ Create Trade" button on main dashboard) */}
        {actions}

        {/* When no custom actions and no user profile, show default Create Trade */}
        {!actions && !showUserProfile && (
          <>
            {profile?.username && (
              <button
                className="inline-flex items-center gap-2 rounded-lg border border-[var(--line)] bg-white px-3 py-2 text-[12.5px] font-bold text-[var(--ink)] transition-all hover:bg-[var(--surface)] hover:text-[var(--brand)] active:scale-[0.98]"
                onClick={() => {
                  navigator.clipboard.writeText(`stoxify.in/profiles/${profile.username}`);
                  alert("Landing page link copied to clipboard!");
                }}
                type="button"
                title="Copy Landing Page Link"
              >
                <Icon className="h-3.5 w-3.5" name="link" />
                <span className="hidden sm:inline">Profile Link</span>
              </button>
            )}
            <button
              className="inline-flex items-center gap-2 rounded-lg bg-[var(--brand)] px-4 py-2 text-[13px] font-bold text-white transition-all hover:bg-[var(--brand-dark)] hover:shadow-md active:scale-[0.98]"
              onClick={openCreateTrade}
              type="button"
            >
              <Icon className="h-3.5 w-3.5" name="plus" />
              Create Trade
            </button>
          </>
        )}

        {/* Notification bell */}
        <Link
          href="/dashboard/notifications"
          aria-label="Notifications"
          className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--line)] bg-white text-[var(--muted)] transition-colors hover:bg-[var(--surface)] hover:text-[var(--ink)]"
        >
          <Icon className="h-4 w-4" name="bell" />
          {/* Unread indicator dot */}
          {hasUnreadNotifications && (
            <span className="absolute right-[9px] top-[9px] h-2 w-2 rounded-full bg-[var(--brand)] shadow-[0_0_0_2px_white]"></span>
          )}
        </Link>

        {/* Analyst avatar + name — shown on pages like Live Trades */}
        {showUserProfile && (
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--brand)] text-[11px] font-extrabold text-white overflow-hidden">
              {profile?.profile_pic_url ? (
                <Image
                  src={profile.profile_pic_url}
                  alt={profile.name}
                  width={36}
                  height={36}
                  className="h-full w-full object-cover"
                />
              ) : (
                initials
              )}
            </div>
            <div className="hidden sm:block">
              <div className="text-[12.5px] font-bold text-[var(--ink)] leading-tight">
                {profile?.name ?? "Loading…"}
              </div>
              <div className="text-[11px] text-[var(--muted-2)] leading-tight">
                SEBI Reg. Analyst
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
