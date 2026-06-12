"use client";

import { useState } from "react";
import { Topbar } from "@/components/dashboard/topbar";
import { Icon } from "@/components/stoxify-icon";
import { useActiveTrades, usePendingTrades, useClosedTrades } from "@/lib/hooks/use-analyst-dashboard";
import { useLiveTradesStats } from "@/lib/hooks/use-analyst-dashboard";
import { useDashboard } from "@/components/dashboard/dashboard-context";
import type { Trade } from "@/lib/types/analyst";

// ─── Types ────────────────────────────────────────────────────────────────────

type TabId = "active" | "pending" | "closed";

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Formats a number in Indian locale: 2940.50 → "₹2,940.50" */
function inr(value: number | undefined, decimals = 2): string {
  if (value === undefined) return "—";
  return `₹${value.toLocaleString("en-IN", { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}`;
}

/** Formats a creation timestamp to a human-readable time e.g. "09:45 AM" or "Yesterday, 02:45 PM" */
function formatCreatedTime(isoDate: string): string {
  const d = new Date(isoDate);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  const timeStr = d.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
  return isToday ? timeStr : `Yesterday, ${timeStr}`;
}

/** Color class for direction/subtype badges */
function directionBadgeClass(dir: string): string {
  if (dir === "LONG" || dir === "BUY")
    return "bg-[var(--green-light)] text-[var(--green)] border border-[var(--green)]/20";
  if (dir === "SHORT" || dir === "SELL")
    return "bg-[var(--red-light)] text-[var(--red)] border border-[var(--red)]/20";
  return "bg-[var(--brand-light)] text-[var(--brand)] border border-[var(--brand)]/20";
}

function subtypeBadgeClass(sub: string): string {
  if (sub === "INTRADAY") return "bg-[#fff7e6] text-[#d97706] border border-[#d97706]/20";
  if (sub === "POSITIONAL") return "bg-[#f3f0ff] text-[#7c3aed] border border-[#7c3aed]/20";
  // SWING
  return "bg-[#e8f4ff] text-[#2563eb] border border-[#2563eb]/20";
}

// ─── Sub-components ───────────────────────────────────────────────────────────

/** Mini stat card in the 4-stat strip at top */
function StatStrip({
  label,
  value,
  sub,
  valueClass = "text-[var(--ink)]",
}: {
  label: string;
  value: string;
  sub?: string;
  valueClass?: string;
}) {
  return (
    <div className="flex-1 rounded-xl border border-[var(--line)] bg-white px-5 py-4 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
      <div className="mb-1 text-[11.5px] font-medium text-[var(--muted)]">{label}</div>
      <div className={`text-[22px] font-extrabold leading-tight tracking-[-0.5px] ${valueClass}`}>
        {value}
      </div>
      {sub && <div className="mt-1 text-[11px] font-semibold text-[var(--green)]">{sub}</div>}
    </div>
  );
}

/** Skeleton for a stat strip item */
function StatStripSkeleton() {
  return (
    <div className="flex-1 rounded-xl border border-[var(--line)] bg-white px-5 py-4">
      <div className="mb-2 h-2.5 w-28 animate-pulse rounded bg-[var(--line)]" />
      <div className="h-7 w-16 animate-pulse rounded bg-[var(--line)]" />
    </div>
  );
}

/** Full trade card matching the Figma exactly */
function TradeCard({ trade }: { trade: Trade }) {
  const ltpUp = (trade.ltp ?? trade.entry_price) >= trade.entry_price;
  const pnlUp = (trade.pnl_per_unit ?? 0) >= 0;

  return (
    <div className="rounded-xl border border-[var(--line)] bg-white shadow-[0_1px_4px_rgba(0,0,0,0.04)] overflow-hidden">
      {/* ── Card Header: symbol + badges + live indicator ── */}
      <div className="flex items-center gap-3 px-5 py-3.5 border-b border-[var(--line)]">
        {/* Symbol */}
        <span className="text-[14px] font-extrabold tracking-tight text-[var(--ink)]">
          {trade.symbol}
        </span>

        {/* Segment label */}
        <span className="text-[11px] font-semibold text-[var(--muted-2)]">
          {trade.segment_label ?? trade.segment}
        </span>

        {/* Direction badge: LONG / SHORT / BUY / SELL */}
        <span
          className={`inline-flex items-center rounded px-2 py-0.5 text-[10.5px] font-bold uppercase ${directionBadgeClass(trade.direction)}`}
        >
          {trade.direction}
        </span>

        {/* Subtype badge: SWING / INTRADAY / POSITIONAL */}
        {trade.trade_subtype && (
          <span
            className={`inline-flex items-center rounded px-2 py-0.5 text-[10.5px] font-bold uppercase ${subtypeBadgeClass(trade.trade_subtype)}`}
          >
            {trade.trade_subtype}
          </span>
        )}

        <div className="flex-1" />

        {/* Created time */}
        <span className="text-[11px] text-[var(--muted-2)]">
          Created: {trade.created_at ? formatCreatedTime(trade.created_at) : "—"}
        </span>

        {/* Live streaming indicator */}
        {trade.is_live_streaming === true && (
          <span className="flex items-center gap-1.5 text-[11px] font-semibold text-[var(--green)]">
            {/* Pulsing dot */}
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--green)] opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-[var(--green)]" />
            </span>
            Live Streaming
          </span>
        )}
      </div>

      {/* ── Card Body: 5-column price grid ── */}
      <div className="grid grid-cols-5 gap-0 px-5 py-4 max-[900px]:grid-cols-2 max-[900px]:gap-4">
        {/* Col 1: Entry Price */}
        <div>
          <div className="mb-1 text-[10px] font-bold uppercase tracking-[0.07em] text-[var(--muted-2)]">
            Entry Price
          </div>
          <div className="text-[15px] font-bold text-[var(--ink)]">{inr(trade.entry_price)}</div>
          {trade.zone && (
            <div className="mt-0.5 text-[11px] text-[var(--muted-2)]">Zone: {trade.zone}</div>
          )}
          {!trade.zone && (
            <div className="mt-0.5 text-[11px] text-[var(--muted-2)]">Fixed Entry</div>
          )}
        </div>

        {/* Col 2: Live CMP */}
        <div>
          <div className="mb-1 text-[10px] font-bold uppercase tracking-[0.07em] text-[var(--muted-2)]">
            Live CMP
          </div>
          <div
            className={`text-[15px] font-bold ${ltpUp ? "text-[var(--green)]" : "text-[var(--red)]"}`}
          >
            {inr(trade.ltp)}
          </div>
          {trade.ltp_change_pct !== undefined && (
            <div
              className={`mt-0.5 text-[11px] font-semibold ${trade.ltp_change_pct >= 0 ? "text-[var(--green)]" : "text-[var(--red)]"}`}
            >
              {trade.ltp_change_pct >= 0 ? "+" : ""}
              {trade.ltp_change_pct.toFixed(2)}%
            </div>
          )}
        </div>

        {/* Col 3: Stop Loss */}
        <div>
          <div className="mb-1 text-[10px] font-bold uppercase tracking-[0.07em] text-[var(--muted-2)]">
            Stop Loss
          </div>
          <div className="text-[15px] font-bold text-[var(--ink)]">
            {inr(trade.stop_loss_price)}
          </div>
          {trade.risk_pct !== undefined && (
            <div className="mt-0.5 text-[11px] text-[var(--muted-2)]">
              Risk: {trade.risk_pct.toFixed(1)}%
            </div>
          )}
        </div>

        {/* Col 4: Targets */}
        <div>
          <div className="mb-1 text-[10px] font-bold uppercase tracking-[0.07em] text-[var(--muted-2)]">
            Targets
          </div>
          <div className="text-[15px] font-bold text-[var(--ink)]">
            {inr(trade.target_price, 0)}
            {trade.target_2_price && <> / {inr(trade.target_2_price, 0)}</>}
          </div>
          {(trade.reward_pct !== undefined || trade.reward_2_pct !== undefined) && (
            <div className="mt-0.5 text-[11px] text-[var(--muted-2)]">
              Reward: {trade.reward_pct?.toFixed(1)}%
              {trade.reward_2_pct !== undefined && ` / ${trade.reward_2_pct.toFixed(1)}%`}
            </div>
          )}
        </div>

        {/* Col 5: PNL Status */}
        <div className="border-l border-[var(--line)] pl-5 max-[900px]:border-0 max-[900px]:pl-0">
          <div className="mb-1 text-[10px] font-bold uppercase tracking-[0.07em] text-[var(--muted-2)]">
            PNL Status
          </div>
          {trade.pnl_per_unit !== undefined ? (
            <>
              <div
                className={`text-[15px] font-bold ${pnlUp ? "text-[var(--green)]" : "text-[var(--red)]"}`}
              >
                {pnlUp ? "+" : ""}₹{Math.abs(trade.pnl_per_unit).toFixed(2)} /{" "}
                {trade.pnl_unit ?? "share"}
              </div>
              {/* Thin progress bar */}
              <div className="mt-2 h-1 w-full rounded-full bg-[var(--line)]">
                <div
                  className={`h-1 rounded-full ${pnlUp ? "bg-[var(--green)]" : "bg-[var(--red)]"}`}
                  style={{ width: `${Math.min(Math.abs(trade.pnl_pct ?? 0) * 5, 100)}%` }}
                />
              </div>
            </>
          ) : (
            <div className="text-[13px] text-[var(--muted-2)]">Pending</div>
          )}
        </div>
      </div>

      {/* ── Card Footer: analyst note + action buttons ── */}
      <div className="flex items-center gap-4 border-t border-[var(--line)] px-5 py-3 max-[860px]:flex-col max-[860px]:items-start">
        {/* Analyst note with checkbox */}
        <label className="flex flex-1 cursor-pointer items-start gap-2.5 text-[12px] text-[var(--muted)] min-w-0">
          <input
            className="mt-0.5 h-3.5 w-3.5 shrink-0 rounded border-[var(--line)] accent-[var(--brand)]"
            defaultChecked
            type="checkbox"
          />
          <span className="truncate">
            {trade.note ? (
              `Note: ${trade.note}`
            ) : (
              <span className="italic text-[var(--muted-2)]">No note added</span>
            )}
          </span>
        </label>

        {/* Action buttons */}
        <div className="flex shrink-0 items-center gap-2">
          <button
            className="rounded-lg border border-[var(--line)] px-3.5 py-1.5 text-[12px] font-semibold text-[var(--ink)] transition-colors hover:border-[var(--brand)]/40 hover:bg-[var(--brand-light)] hover:text-[var(--brand)]"
            type="button"
          >
            Update Stop Loss
          </button>
          <button
            className="rounded-lg border border-[var(--brand)]/30 bg-[var(--brand-light)] px-3.5 py-1.5 text-[12px] font-semibold text-[var(--brand)] transition-colors hover:bg-[var(--brand)] hover:text-white"
            type="button"
          >
            Broadcast Message
          </button>
          <button
            className="rounded-lg border border-[var(--red)]/30 bg-[var(--red-light)] px-3.5 py-1.5 text-[12px] font-semibold text-[var(--red)] transition-colors hover:bg-[var(--red)] hover:text-white"
            type="button"
          >
            Close Trade
          </button>
        </div>
      </div>
    </div>
  );
}

/** Skeleton for a single trade card while loading */
function TradeCardSkeleton() {
  return (
    <div className="rounded-xl border border-[var(--line)] bg-white shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
      <div className="flex items-center gap-3 px-5 py-3.5 border-b border-[var(--line)]">
        <div className="h-4 w-24 animate-pulse rounded bg-[var(--line)]" />
        <div className="h-4 w-12 animate-pulse rounded bg-[var(--line)]" />
        <div className="h-4 w-10 animate-pulse rounded bg-[var(--line)]" />
      </div>
      <div className="grid grid-cols-5 gap-0 px-5 py-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="space-y-1.5">
            <div className="h-2.5 w-16 animate-pulse rounded bg-[var(--line)]" />
            <div className="h-5 w-20 animate-pulse rounded bg-[var(--line)]" />
            <div className="h-2.5 w-14 animate-pulse rounded bg-[var(--line)]" />
          </div>
        ))}
      </div>
      <div className="flex items-center gap-4 border-t border-[var(--line)] px-5 py-3">
        <div className="h-3 w-64 animate-pulse rounded bg-[var(--line)]" />
        <div className="ml-auto flex gap-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-7 w-24 animate-pulse rounded-lg bg-[var(--line)]" />
          ))}
        </div>
      </div>
    </div>
  );
}

/** "Closed History" table row */
function ClosedTradeRow({ trade }: { trade: Trade }) {
  const pnlUp = (trade.pnl_per_unit ?? 0) >= 0;
  return (
    <tr className="border-b border-[var(--line)] last:border-0 hover:bg-[var(--surface)] transition-colors">
      <td className="py-3.5 pl-5 text-[13px] font-bold text-[var(--ink)]">{trade.symbol}</td>
      <td className="py-3.5 px-4">
        <span
          className={`inline-flex rounded px-2 py-0.5 text-[10.5px] font-bold ${directionBadgeClass(trade.direction)}`}
        >
          {trade.direction}
        </span>
      </td>
      <td className="py-3.5 px-4 text-[13px] text-[var(--ink)]">{inr(trade.entry_price)}</td>
      <td className="py-3.5 px-4 text-[13px] text-[var(--ink)]">{inr(trade.ltp)}</td>
      <td className="py-3.5 px-4">
        <span
          className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold ${pnlUp ? "bg-[var(--green-light)] text-[var(--green)]" : "bg-[var(--red-light)] text-[var(--red)]"}`}
        >
          {pnlUp ? "+" : ""}
          {trade.pnl_pct?.toFixed(2) ?? "0.00"}%
        </span>
      </td>
      <td className="py-3.5 px-4 text-[11px] text-[var(--muted-2)]">
        {trade.updated_at ? new Date(trade.updated_at).toLocaleDateString("en-IN") : "—"}
      </td>
      <td className="py-3.5 pr-5">
        <span
          className={`text-[11px] font-semibold ${
            trade.status === "TARGET_HIT"
              ? "text-[var(--green)]"
              : trade.status === "SL_HIT"
                ? "text-[var(--red)]"
                : "text-[var(--muted)]"
          }`}
        >
          {trade.status === "TARGET_HIT"
            ? "Target Hit"
            : trade.status === "SL_HIT"
              ? "SL Hit"
              : "Manually Closed"}
        </span>
      </td>
    </tr>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LiveTradesPage() {
  const [activeTab, setActiveTab] = useState<TabId>("active");
  const { openCreateTrade } = useDashboard();

  const { stats, isLoading: statsLoading } = useLiveTradesStats();
  const {
    trades: activeTrades,
    isLoading: activeLoading,
    isError: activeError,
  } = useActiveTrades(20);
  const activeTotal = activeTrades.length;
  const {
    trades: pendingTrades,
    isLoading: pendingLoading,
  } = usePendingTrades();
  const pendingTotal = pendingTrades.length;
  const { trades: closedTrades, isLoading: closedLoading } = useClosedTrades();

  const TAB_OPTIONS: { id: TabId; label: string; count?: number }[] = [
    { id: "active", label: "Active", count: activeTotal },
    { id: "pending", label: "Pending", count: pendingTotal },
    { id: "closed", label: "Closed History" },
  ];

  return (
    <>
      {/* ── Topbar: shows analyst profile avatar on right ── */}
      <Topbar showUserProfile title="Live Trades" />

      {/* ── Page body ── */}
      <div className="flex-1 p-6">
        {/* ── Page header: title + subtitle + Create Trade button ── */}
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-[22px] font-extrabold tracking-[-0.5px] text-[var(--ink)]">
              Active Trades
            </h2>
            <p className="mt-0.5 text-[13px] text-[var(--muted)]">
              Monitor your open positions and broadcast live updates to subscribers.
            </p>
          </div>
          <button
            className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-[var(--brand)] px-4 py-2.5 text-[13px] font-bold text-white shadow-sm transition-all hover:bg-[var(--brand-dark)] hover:shadow-md active:scale-[0.98]"
            onClick={openCreateTrade}
            type="button"
          >
            <Icon className="h-3.5 w-3.5" name="plus" />
            Create Trade
          </button>
        </div>

        {/* ── Stat strip: 4 mini stats ── */}
        <div className="mb-5 flex gap-3 max-[860px]:grid max-[860px]:grid-cols-2">
          {statsLoading || !stats ? (
            <>
              <StatStripSkeleton />
              <StatStripSkeleton />
              <StatStripSkeleton />
              <StatStripSkeleton />
            </>
          ) : (
            <>
              <StatStrip label="Total Active Trades" value={String(stats.total_active)} />
              <StatStrip
                label="Avg. Win Rate (Monthly)"
                value={`${stats.avg_win_rate_monthly}%`}
                sub={`+${stats.win_rate_change_pct}% from last month`}
              />
              <StatStrip
                label="Active Subscribers"
                value={stats.active_subscribers.toLocaleString("en-IN")}
              />
              <StatStrip
                label="Live Viewers"
                value={String(stats.live_viewers)}
                sub="Watching your trades"
                valueClass="text-[var(--green)]"
              />
            </>
          )}
        </div>

        {/* ── Tab bar ── */}
        <div className="mb-5 flex gap-0 border-b border-[var(--line)]">
          {TAB_OPTIONS.map((tab) => (
            <button
              className={`flex items-center gap-1.5 border-b-2 px-4 pb-3 pt-0.5 text-[13.5px] font-semibold transition-colors ${
                activeTab === tab.id
                  ? "border-[var(--brand)] text-[var(--brand)]"
                  : "border-transparent text-[var(--muted)] hover:text-[var(--ink)]"
              }`}
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              type="button"
            >
              {tab.label}
              {tab.count !== undefined && (
                <span
                  className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                    activeTab === tab.id
                      ? "bg-[var(--brand-light)] text-[var(--brand)]"
                      : "bg-[var(--line)] text-[var(--muted)]"
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ── Tab content ── */}

        {/* ACTIVE TAB */}
        {activeTab === "active" && (
          <div className="space-y-4">
            {activeLoading ? (
              <>
                <TradeCardSkeleton />
                <TradeCardSkeleton />
                <TradeCardSkeleton />
              </>
            ) : activeError ? (
              <div className="rounded-xl border border-[var(--red)]/20 bg-[var(--red-light)] p-5 text-[13px] text-[var(--red)]">
                <Icon className="mr-2 h-4 w-4" name="x" />
                Unable to load trades. Make sure the trade service is running at{" "}
                <code className="rounded bg-[var(--red)]/10 px-1">/trades/</code>.
              </div>
            ) : activeTrades.length === 0 ? (
              <div className="rounded-xl border border-[var(--line)] bg-white p-12 text-center">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--surface)]">
                  <Icon className="h-6 w-6 text-[var(--muted-2)]" name="trendingUp" />
                </div>
                <div className="text-[14px] font-semibold text-[var(--ink)]">No active trades</div>
                <p className="mt-1 text-[12.5px] text-[var(--muted-2)]">
                  Create your first trade to start broadcasting to subscribers.
                </p>
              </div>
            ) : (
              activeTrades.map((trade) => <TradeCard key={trade.trade_id} trade={trade} />)
            )}
          </div>
        )}

        {/* PENDING TAB */}
        {activeTab === "pending" && (
          <div className="space-y-4">
            {pendingLoading ? (
              <TradeCardSkeleton />
            ) : pendingTrades.length === 0 ? (
              <div className="rounded-xl border border-[var(--line)] bg-white p-12 text-center">
                <div className="text-[14px] font-semibold text-[var(--ink)]">No pending trades</div>
                <p className="mt-1 text-[12.5px] text-[var(--muted-2)]">
                  Draft trades awaiting publication will appear here.
                </p>
              </div>
            ) : (
              pendingTrades.map((trade) => <TradeCard key={trade.trade_id} trade={trade} />)
            )}
          </div>
        )}

        {/* CLOSED HISTORY TAB */}
        {activeTab === "closed" && (
          <div className="overflow-hidden rounded-xl border border-[var(--line)] bg-white shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[var(--line)]">
                  {["Symbol", "Direction", "Entry", "Exit CMP", "PNL", "Date", "Outcome"].map(
                    (col) => (
                      <th
                        className="py-3 pl-5 pr-4 text-left text-[10.5px] font-bold uppercase tracking-[0.06em] text-[var(--muted-2)]"
                        key={col}
                      >
                        {col}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody>
                {closedLoading ? (
                  <tr>
                    <td
                      className="px-5 py-8 text-center text-[13px] text-[var(--muted-2)]"
                      colSpan={7}
                    >
                      Loading history…
                    </td>
                  </tr>
                ) : closedTrades.length === 0 ? (
                  <tr>
                    <td className="px-5 py-12 text-center" colSpan={7}>
                      <div className="text-[14px] font-semibold text-[var(--ink)]">
                        No closed trades yet
                      </div>
                      <p className="mt-1 text-[12.5px] text-[var(--muted-2)]">
                        Trades you close will appear here with their outcome.
                      </p>
                    </td>
                  </tr>
                ) : (
                  closedTrades.map((trade) => <ClosedTradeRow key={trade.trade_id} trade={trade} />)
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
