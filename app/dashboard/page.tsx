"use client";

import Image from "next/image";
import Link from "next/link";
import { Topbar } from "@/components/dashboard/topbar";
import { MetricCard, MetricCardSkeleton } from "@/components/dashboard/metric-card";
import { Icon } from "@/components/stoxify-icon";
import {
  useDashboardMetrics,
  useActiveTrades,
  useRecentSubscribers,
} from "@/lib/hooks/use-analyst-dashboard";
import { useWebSocket } from "@/lib/hooks/use-websocket";
import type { Trade, Subscriber } from "@/lib/types/analyst";

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Formats a number as Indian currency: 450000 → ₹4.5L */
function formatRevenue(value: number): string {
  if (value >= 10_00_000) return `₹${(value / 10_00_000).toFixed(1)}Cr`;
  if (value >= 1_00_000) return `₹${(value / 1_00_000).toFixed(1)}L`;
  if (value >= 1_000) return `₹${(value / 1_000).toFixed(1)}K`;
  return `₹${value}`;
}

/** Returns a relative time string: "2 mins ago", "1 hour ago" etc. */
function relativeTime(isoDate: string): string {
  const diff = Date.now() - new Date(isoDate).getTime();
  const mins = Math.floor(diff / 60_000);
  const hours = Math.floor(mins / 60);
  const days = Math.floor(hours / 24);
  if (mins < 60) return `${mins} min${mins !== 1 ? "s" : ""} ago`;
  if (hours < 24) return `${hours} hour${hours !== 1 ? "s" : ""} ago`;
  return `${days} day${days !== 1 ? "s" : ""} ago`;
}

/** Returns initials from a full name: "Priya Desai" → "PD" */
function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

/** Deterministic gradient for subscriber avatars based on name */
const AVATAR_GRADIENTS = [
  "linear-gradient(135deg, #3B82F6, #1D4ED8)",
  "linear-gradient(135deg, #10B981, #047857)",
  "linear-gradient(135deg, #F59E0B, #D97706)",
  "linear-gradient(135deg, #EF4444, #B91C1C)",
  "linear-gradient(135deg, #8B5CF6, #6D28D9)",
];
function avatarGradient(name: string) {
  const idx = name.charCodeAt(0) % AVATAR_GRADIENTS.length;
  return AVATAR_GRADIENTS[idx];
}

// ─── Sub-components ───────────────────────────────────────────────────────────

/** Single row in the Active Live Trades table */
function TradeRow({ trade, liveLtp }: { trade: Trade; liveLtp?: number }) {
  const isLong = trade.direction === "LONG";
  const ltp = liveLtp ?? trade.ltp;
  // Compute live P&L from LTP if available
  const pnl =
    ltp !== undefined
      ? ((isLong ? ltp - trade.entry_price : trade.entry_price - ltp) / trade.entry_price) * 100
      : (trade.pnl_pct ?? 0);
  const pnlPositive = pnl >= 0;

  return (
    <tr className="border-b border-[var(--line)] last:border-0 hover:bg-[var(--surface)] transition-colors">
      {/* Symbol + segment */}
      <td className="py-4 pl-5">
        <div className="text-[13px] font-bold text-[var(--ink)]">{trade.symbol}</div>
        <div className="text-[11px] text-[var(--muted-2)] leading-tight mt-0.5">
          {trade.segment}
          {trade.expiry ? ` • ${trade.expiry}` : ""}
        </div>
      </td>

      {/* Direction badge */}
      <td className="py-4 px-4">
        <span
          className={`inline-flex rounded px-2 py-0.5 text-[11px] font-bold ${
            isLong
              ? "bg-[var(--green-light)] text-[var(--green)]"
              : "bg-[var(--red-light)] text-[var(--red)]"
          }`}
        >
          {trade.direction}
        </span>
      </td>

      {/* Entry */}
      <td className="py-4 px-4 text-[13px] font-medium text-[var(--ink)]">
        {trade.entry_price.toLocaleString("en-IN")}
      </td>

      {/* LTP (live) with colored dot */}
      <td className="py-4 px-4">
        <div className="flex items-center gap-1.5">
          {/* Live indicator dot */}
          <span
            className={`h-1.5 w-1.5 shrink-0 rounded-full ${
              ltp !== undefined
                ? ltp >= trade.entry_price
                  ? "bg-[var(--green)]"
                  : "bg-[var(--red)]"
                : "bg-[var(--muted-2)]"
            }`}
          />
          <span className="text-[13px] font-semibold text-[var(--ink)]">
            {ltp !== undefined ? ltp.toLocaleString("en-IN") : "—"}
          </span>
        </div>
      </td>

      {/* Target / SL stacked */}
      <td className="py-4 px-4 text-[13px] text-[var(--ink)]">
        <div className="font-medium">{trade.target_price.toLocaleString("en-IN")}</div>
        <div className="text-[11px] text-[var(--muted-2)]">
          {trade.stop_loss_price.toLocaleString("en-IN")}
        </div>
      </td>

      {/* PNL pill */}
      <td className="py-4 px-4">
        <span
          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11.5px] font-bold ${
            pnlPositive
              ? "bg-[var(--green-light)] text-[var(--green)]"
              : "bg-[var(--red-light)] text-[var(--red)]"
          }`}
        >
          {pnlPositive ? "+" : ""}
          {pnl.toFixed(2)}%
        </span>
      </td>

      {/* Actions */}
      <td className="py-4 pl-4 pr-5">
        <div className="flex items-center gap-2">
          <button
            className="rounded-md border border-[var(--line)] px-3 py-1.5 text-[12px] font-semibold text-[var(--ink)] transition-colors hover:border-[var(--muted-2)] hover:bg-[var(--surface)]"
            type="button"
          >
            Modify
          </button>
          <button
            className="rounded-md border border-[var(--red)]/30 px-3 py-1.5 text-[12px] font-semibold text-[var(--red)] transition-colors hover:bg-[var(--red-light)]"
            type="button"
          >
            Close
          </button>
        </div>
      </td>
    </tr>
  );
}

/** Skeleton for a single trade table row */
function TradeRowSkeleton() {
  return (
    <tr className="border-b border-[var(--line)]">
      {[5, 4, 3, 4, 3, 4, 5].map((w, i) => (
        <td className="py-4 px-4" key={i}>
          <div
            className="h-4 animate-pulse rounded bg-[var(--line)]"
            style={{ width: `${w}rem` }}
          />
        </td>
      ))}
    </tr>
  );
}

/** Single subscriber in the "Recent Subscribers" panel */
function SubscriberRow({ subscriber }: { subscriber: Subscriber }) {
  const planColor =
    subscriber.plan_name === "Premium"
      ? "bg-[#8B5CF6]"
      : subscriber.plan_name === "Pro"
        ? "bg-[var(--brand)]"
        : "bg-[var(--muted-2)]";

  return (
    <div className="flex items-center gap-3 py-3 border-b border-[var(--line)] last:border-0">
      {/* Avatar */}
      {subscriber.user_avatar ? (
        <Image
          alt={subscriber.user_name}
          className="h-9 w-9 shrink-0 rounded-full object-cover"
          src={subscriber.user_avatar}
          width={36}
          height={36}
        />
      ) : (
        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[11px] font-extrabold text-white"
          style={{ background: avatarGradient(subscriber.user_name) }}
        >
          {getInitials(subscriber.user_name)}
        </div>
      )}

      {/* Name + plan */}
      <div className="flex-1 min-w-0">
        <div className="text-[13px] font-semibold text-[var(--ink)] truncate leading-tight">
          {subscriber.user_name}
        </div>
        <div className="flex items-center gap-1.5 mt-0.5">
          <span className={`h-1.5 w-1.5 rounded-full ${planColor}`} />
          <span className="text-[11px] text-[var(--muted-2)]">
            {subscriber.plan_name} ·{" "}
            {subscriber.billing_cycle === "WEEK"
              ? "Weekly"
              : subscriber.billing_cycle === "MONTH"
                ? "Monthly"
                : subscriber.billing_cycle === "QUARTER"
                  ? "Quarterly"
                  : subscriber.billing_cycle === "YEAR"
                    ? "Yearly"
                    : subscriber.billing_cycle}
          </span>
        </div>
      </div>

      {/* Time ago */}
      <div className="shrink-0 text-[11px] text-[var(--muted-2)] text-right leading-snug whitespace-pre-line">
        {relativeTime(subscriber.subscribed_at).split(" ").slice(0, 2).join("\n")}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { metrics, isLoading: metricsLoading, isError: metricsError } = useDashboardMetrics();
  const { trades, isLoading: tradesLoading, isError: tradesError } = useActiveTrades(5);
  const { subscribers, isLoading: subsLoading } = useRecentSubscribers(5);
  const { prices: livePrices } = useWebSocket();

  return (
    <>
      {/* ── Topbar (sticky, inside main column) ── */}
      <Topbar title="Dashboard" showSebiVerified />

      {/* ── Page body ── */}
      <div className="flex-1 p-6">
        {/* ── KPI Cards Row ── */}
        <div className="mb-6 grid grid-cols-4 gap-4 max-[1100px]:grid-cols-2 max-[640px]:grid-cols-1">
          {metricsLoading || !metrics ? (
            // Skeleton placeholders while loading
            <>
              <MetricCardSkeleton />
              <MetricCardSkeleton />
              <MetricCardSkeleton />
              <MetricCardSkeleton />
            </>
          ) : metricsError ? (
            <div className="col-span-4 rounded-xl border border-[var(--red)]/20 bg-[var(--red-light)] p-4 text-[13px] text-[var(--red)]">
              <Icon className="mr-2 h-4 w-4" name="x" />
              Failed to load dashboard metrics. Make sure the analytics service is running.
            </div>
          ) : (
            <>
              <MetricCard
                changePct={metrics.active_trades.change_pct}
                changeLabel="+1 Today"
                icon="trendingUp"
                label="Active Trades"
                subNote={`+${metrics.active_trades.new_today} Today`}
                value={String(metrics.active_trades.value)}
              />
              <MetricCard
                changePct={metrics.total_subscribers.change_pct}
                changeLabel="from last month"
                icon="users"
                label="Total Subscribers"
                value={metrics.total_subscribers.value.toLocaleString("en-IN")}
              />
              <MetricCard
                changePct={metrics.win_rate.change_pct}
                changeLabel="improvement"
                icon="target"
                label="Win Rate"
                value={`${metrics.win_rate.value}%`}
              />
              <MetricCard
                changePct={metrics.monthly_revenue.change_pct}
                changeLabel="from last month"
                icon="wallet"
                label="Monthly Revenue"
                value={formatRevenue(metrics.monthly_revenue.value)}
              />
            </>
          )}
        </div>

        {/* ── Bottom row: Trades table + Recent Subscribers ── */}
        <div className="flex gap-4 max-[960px]:flex-col">
          {/* ── Left: Active Live Trades table ── */}
          <div className="flex-1 overflow-hidden rounded-xl border border-[var(--line)] bg-white shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
            {/* Table header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--line)]">
              <h2 className="text-[15px] font-bold text-[var(--ink)]">Active Live Trades</h2>
              <Link
                className="text-[12.5px] font-semibold text-[var(--brand)] hover:underline"
                href="/dashboard/live-trades"
              >
                View All
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                {/* Column headers */}
                <thead>
                  <tr className="border-b border-[var(--line)]">
                    {["SYMBOL", "TYPE", "ENTRY", "LTP (LIVE)", "TARGET / SL", "PNL", "ACTIONS"].map(
                      (col) => (
                        <th
                          className="py-3 pl-5 pr-4 text-left text-[10.5px] font-bold uppercase tracking-[0.06em] text-[var(--muted-2)] first:pl-5 last:pr-5"
                          key={col}
                        >
                          {col}
                        </th>
                      )
                    )}
                  </tr>
                </thead>

                <tbody>
                  {tradesLoading ? (
                    <>
                      <TradeRowSkeleton />
                      <TradeRowSkeleton />
                      <TradeRowSkeleton />
                    </>
                  ) : tradesError ? (
                    <tr>
                      <td className="px-5 py-6 text-[13px] text-[var(--muted)]" colSpan={7}>
                        <div className="flex items-center gap-2 text-[var(--red)]">
                          <Icon className="h-4 w-4" name="x" />
                          Unable to load trades. Check that the trade service is running.
                        </div>
                      </td>
                    </tr>
                  ) : trades.length === 0 ? (
                    <tr>
                      <td className="px-5 py-10 text-center" colSpan={7}>
                        <div className="text-[13px] text-[var(--muted-2)]">No active trades</div>
                        <Link
                          className="mt-2 inline-flex items-center gap-1.5 text-[12px] font-semibold text-[var(--brand)] hover:underline"
                          href="/dashboard/live-trades/new"
                        >
                          <Icon className="h-3 w-3" name="plus" />
                          Create your first trade
                        </Link>
                      </td>
                    </tr>
                  ) : (
                    trades.map((trade) => (
                      <TradeRow
                        key={trade.trade_id}
                        trade={trade}
                        liveLtp={livePrices[trade.symbol]}
                      />
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* ── Right: Recent Subscribers panel ── */}
          <div className="w-[280px] shrink-0 rounded-xl border border-[var(--line)] bg-white shadow-[0_1px_4px_rgba(0,0,0,0.04)] max-[960px]:w-full">
            {/* Panel header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--line)]">
              <h2 className="text-[15px] font-bold text-[var(--ink)]">Recent Subscribers</h2>
              <Link
                className="text-[12.5px] font-semibold text-[var(--brand)] hover:underline"
                href="/dashboard/subscribers"
              >
                View All
              </Link>
            </div>

            {/* Subscriber list */}
            <div className="px-5">
              {subsLoading ? (
                // Skeleton rows
                Array.from({ length: 4 }).map((_, i) => (
                  <div
                    className="flex items-center gap-3 py-3 border-b border-[var(--line)] last:border-0"
                    key={i}
                  >
                    <div className="h-9 w-9 shrink-0 animate-pulse rounded-full bg-[var(--line)]" />
                    <div className="flex-1 space-y-1.5">
                      <div className="h-3 w-24 animate-pulse rounded bg-[var(--line)]" />
                      <div className="h-2.5 w-16 animate-pulse rounded bg-[var(--line)]" />
                    </div>
                  </div>
                ))
              ) : subscribers.length === 0 ? (
                <div className="py-8 text-center text-[13px] text-[var(--muted-2)]">
                  No subscribers yet
                </div>
              ) : (
                subscribers.map((sub) => (
                  <SubscriberRow key={sub.subscription_id} subscriber={sub} />
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
