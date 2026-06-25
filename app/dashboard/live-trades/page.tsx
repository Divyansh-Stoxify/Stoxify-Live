"use client";

import { useState, useEffect } from "react";
import { Topbar } from "@/components/dashboard/topbar";
import { Icon } from "@/components/stoxify-icon";
import {
  useActiveTrades,
  usePendingTrades,
  useClosedTrades,
} from "@/hooks/use-analyst-dashboard";
import { useLiveTradesStats } from "@/hooks/use-analyst-dashboard";
import { useDashboard } from "@/components/dashboard/dashboard-context";
import { BroadcastModal } from "@/components/dashboard/broadcast-modal";
import type { Trade } from "@/lib/types/analyst";

// ─── Types ────────────────────────────────────────────────────────────────────

type TabId = "active" | "pending" | "closed";

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Formats a number in Indian locale: 2940.50 → "₹2,940.50" */
function inr(value: number | undefined | null, decimals = 2): string {
  if (value == null) return "—";
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
function TradeCard({ trade, onBroadcast }: { trade: Trade; onBroadcast: (trade: Trade) => void }) {
  const { openCloseTrade, openModifyTrade, showSuccessToast } = useDashboard();
  
  // Simulated real-time price states
  const [liveLtp, setLiveLtp] = useState(trade.ltp ?? trade.entry_price);
  const [priceDirection, setPriceDirection] = useState<"up" | "down" | null>(null);
  const [flashKey, setFlashKey] = useState(0);
  const [isNotePublic, setIsNotePublic] = useState(true);

  // Fluctuating LTP logic
  useEffect(() => {
    if (trade.status !== "ACTIVE" && trade.is_live_streaming !== true) {
      return;
    }
    const interval = setInterval(() => {
      setLiveLtp((prevLtp) => {
        const changePct = (Math.random() * 0.12 - 0.06) / 100; // ±0.06% change
        const diff = prevLtp * changePct;
        const nextLtp = Math.round((prevLtp + diff) * 100) / 100;
        if (nextLtp > prevLtp) {
          setPriceDirection("up");
        } else if (nextLtp < prevLtp) {
          setPriceDirection("down");
        }
        setFlashKey((k) => k + 1);
        return nextLtp;
      });
    }, 3500 + Math.random() * 2500);
    return () => clearInterval(interval);
  }, [trade.status, trade.is_live_streaming]);

  useEffect(() => {
    if (priceDirection) {
      const timer = setTimeout(() => {
        setPriceDirection(null);
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [priceDirection, flashKey]);

  const isShort = trade.direction === "SHORT" || trade.direction === "SELL";
  const stopLossVal = trade.stop_loss ?? trade.stop_loss_price;
  const targetVal = trade.target ?? trade.target_price;

  // Live PNL calculations based on simulated price
  const livePnlPerUnit = isShort
    ? trade.entry_price - liveLtp
    : liveLtp - trade.entry_price;
  const livePnlPct = (livePnlPerUnit / trade.entry_price) * 100;
  const pnlUp = livePnlPerUnit >= 0;

  // Near SL/Target conditions
  const isTargetHit = targetVal !== undefined && (!isShort ? liveLtp >= targetVal : liveLtp <= targetVal);
  const isSLHit = stopLossVal !== undefined && (!isShort ? liveLtp <= stopLossVal : liveLtp >= stopLossVal);
  const isNearSL = !isSLHit && !isTargetHit && stopLossVal !== undefined && (
    !isShort
      ? (liveLtp > stopLossVal && liveLtp <= stopLossVal * 1.015)
      : (liveLtp < stopLossVal && liveLtp >= stopLossVal * 0.985)
  );

  // R:R calculation
  let rrRatioStr = "—";
  if (trade.entry_price && stopLossVal !== undefined && targetVal !== undefined) {
    const risk = Math.abs(trade.entry_price - stopLossVal);
    const reward = Math.abs(targetVal - trade.entry_price);
    if (risk > 0) {
      rrRatioStr = `1 : ${(reward / risk).toFixed(1)}`;
    }
  }

  const handleToggleNote = () => {
    const nextState = !isNotePublic;
    setIsNotePublic(nextState);
    showSuccessToast(
      nextState ? "Note Public" : "Note Hidden",
      `Note visibility for ${trade.symbol} has been ${nextState ? "enabled" : "disabled"} for subscribers.`
    );
  };

  return (
    <div className={`rounded-xl border bg-white shadow-[0_1px_4px_rgba(0,0,0,0.04)] overflow-hidden transition-all duration-300 ${isNearSL ? "border-amber-500/40 ring-4 ring-amber-500/5 shadow-[0_4px_16px_rgba(217,119,6,0.08)]" : "border-[var(--line)]"}`}>
      {/* ── Card Header: symbol + badges + live indicator ── */}
      <div className="flex items-center gap-3 px-5 py-3.5 border-b border-[var(--line)] flex-wrap">
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

        {/* Batch badge */}
        {trade.batch && (
          <span
            className="inline-flex items-center rounded px-2 py-0.5 text-[10.5px] font-bold uppercase bg-[#f8fafc] text-[#475569] border border-[#cbd5e1]/50"
          >
            {trade.batch}
          </span>
        )}

        {/* R:R Ratio Badge */}
        {rrRatioStr !== "—" && (
          <span className="inline-flex items-center rounded px-2 py-0.5 text-[10.5px] font-bold bg-[#f0f9ff] text-[#0369a1] border border-[#0369a1]/20">
            R:R {rrRatioStr}
          </span>
        )}

        {/* Live warnings & Target badges */}
        {isTargetHit && (
          <span className="inline-flex items-center gap-1 rounded bg-[var(--green-light)] text-[var(--green)] px-2 py-0.5 text-[10.5px] font-bold border border-[var(--green)]/20 animate-pulse">
            Target Hit! 🎉
          </span>
        )}
        {isSLHit && (
          <span className="inline-flex items-center gap-1 rounded bg-[var(--red-light)] text-[var(--red)] px-2 py-0.5 text-[10.5px] font-bold border border-[var(--red)]/20 animate-pulse">
            SL Hit! 🚨
          </span>
        )}
        {!isTargetHit && !isSLHit && isNearSL && (
          <span className="inline-flex items-center gap-1 rounded bg-amber-50 text-amber-700 px-2 py-0.5 text-[10.5px] font-bold border border-amber-500/20 animate-pulse">
            Near SL ⚠️
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
            className={`inline-block px-1.5 py-0.5 rounded text-[15px] font-extrabold transition-all duration-700 ${
              priceDirection === "up"
                ? "bg-emerald-50 text-[var(--green)]"
                : priceDirection === "down"
                  ? "bg-rose-50 text-[var(--red)]"
                  : liveLtp >= trade.entry_price
                    ? "text-[var(--green)]"
                    : "text-[var(--red)]"
            }`}
          >
            {inr(liveLtp)}
          </div>
          <div
            className={`mt-0.5 text-[11px] font-semibold transition-colors duration-500 ${
              livePnlPct >= 0 ? "text-[var(--green)]" : "text-[var(--red)]"
            }`}
          >
            {livePnlPct >= 0 ? "+" : ""}
            {livePnlPct.toFixed(2)}%
          </div>
        </div>

        {/* Col 3: Stop Loss */}
        <div>
          <div className="mb-1 text-[10px] font-bold uppercase tracking-[0.07em] text-[var(--muted-2)]">
            Stop Loss
          </div>
          <div
            className={`inline-block px-1.5 py-0.5 rounded text-[15px] font-bold transition-all duration-300 ${
              isNearSL
                ? "bg-amber-50 text-amber-700 border border-amber-500/20"
                : "text-[var(--ink)]"
            }`}
          >
            {inr(stopLossVal)}
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
            {inr(targetVal, 0)}
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
          {livePnlPerUnit !== undefined ? (
            <>
              <div
                className={`text-[15px] font-bold ${pnlUp ? "text-[var(--green)]" : "text-[var(--red)]"}`}
              >
                {pnlUp ? "+" : "-"}₹{Math.abs(livePnlPerUnit).toFixed(2)} /{" "}
                {trade.pnl_unit ?? "share"}
              </div>
              {/* Bidirectional progress bar centered at 50% */}
              <div className="relative mt-2.5 h-1.5 w-full rounded-full bg-[var(--line)] overflow-hidden">
                {/* Midpoint divider */}
                <div className="absolute left-1/2 top-0 z-10 h-full w-[1.5px] bg-[var(--ink)]/20" />
                {pnlUp ? (
                  <div
                    className="absolute left-1/2 h-full bg-[var(--green)] rounded-r-full transition-all duration-500"
                    style={{ width: `${Math.min(livePnlPct * 4, 50)}%` }}
                  />
                ) : (
                  <div
                    className="absolute right-1/2 h-full bg-[var(--red)] rounded-l-full transition-all duration-500"
                    style={{ width: `${Math.min(Math.abs(livePnlPct) * 4, 50)}%` }}
                  />
                )}
              </div>
            </>
          ) : (
            <div className="text-[13px] text-[var(--muted-2)]">Pending</div>
          )}
        </div>
      </div>

      {/* ── Card Footer: analyst note + action buttons ── */}
      <div className="flex items-center gap-4 border-t border-[var(--line)] px-5 py-3 max-[860px]:flex-col max-[860px]:items-start">
        {/* Analyst note with eye/visibility switch */}
        <div className="flex flex-1 items-center gap-3 text-[12.5px] min-w-0">
          <button
            onClick={handleToggleNote}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold border transition-all ${
              isNotePublic
                ? "bg-[var(--brand-light)] text-[var(--brand)] border-[var(--brand)]/20 hover:bg-[var(--brand-light)]/80"
                : "bg-[var(--surface)] text-[var(--muted-2)] border-[var(--line)] hover:bg-[var(--line)]"
            }`}
            type="button"
            title={isNotePublic ? "Public note - visible to subscribers" : "Private note - hidden from subscribers"}
          >
            <Icon className="h-3.5 w-3.5" name={isNotePublic ? "eye" : "eyeOff"} />
            <span>{isNotePublic ? "Public" : "Private"}</span>
          </button>
          
          <span className="truncate text-[var(--muted)]">
            {trade.note ? (
              <span className="font-semibold text-[var(--ink)]">Note: <span className="font-medium text-[var(--muted)]">{trade.note}</span></span>
            ) : (
              <span className="italic text-[var(--muted-2)]">No note added</span>
            )}
          </span>
        </div>

        {/* Action buttons */}
        <div className="flex shrink-0 items-center gap-2">
          <button
            className="rounded-lg border border-[var(--line)] px-3.5 py-1.5 text-[12px] font-semibold text-[var(--ink)] transition-colors hover:border-[var(--brand)]/40 hover:bg-[var(--brand-light)] hover:text-[var(--brand)]"
            type="button"
            onClick={() => openModifyTrade(trade)}
          >
            Modify Trade
          </button>
          <button
            className="rounded-lg border border-[var(--brand)]/30 bg-[var(--brand-light)] px-3.5 py-1.5 text-[12px] font-semibold text-[var(--brand)] transition-colors hover:bg-[var(--brand)] hover:text-white"
            type="button"
            onClick={() => onBroadcast(trade)}
          >
            Broadcast Message
          </button>
          <button
            className="rounded-lg border border-[var(--red)]/30 bg-[var(--red-light)] px-3.5 py-1.5 text-[12px] font-semibold text-[var(--red)] transition-colors hover:bg-[var(--red)] hover:text-white"
            type="button"
            onClick={() => openCloseTrade(trade)}
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
  const [broadcastTrade, setBroadcastTrade] = useState<Trade | null>(null);
  const { openCreateTrade, showSuccessToast } = useDashboard();

  const { stats, isLoading: statsLoading } = useLiveTradesStats();
  const {
    trades: activeTrades,
    isLoading: activeLoading,
    isError: activeError,
  } = useActiveTrades(20);
  const activeTotal = activeTrades.length;
  const { trades: pendingTrades, isLoading: pendingLoading } = usePendingTrades();
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
              activeTrades.map((trade) => (
                <TradeCard key={trade.trade_id} trade={trade} onBroadcast={setBroadcastTrade} />
              ))
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
              pendingTrades.map((trade) => (
                <TradeCard key={trade.trade_id} trade={trade} onBroadcast={setBroadcastTrade} />
              ))
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

      {broadcastTrade && (
        <BroadcastModal
          trade={broadcastTrade}
          onClose={() => setBroadcastTrade(null)}
          onSuccess={showSuccessToast}
        />
      )}
    </>
  );
}
