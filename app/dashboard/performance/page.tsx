"use client";

import { useEffect, useMemo, useState } from "react";
import { Topbar } from "@/components/dashboard/topbar";
import { Icon, type IconName } from "@/components/stoxify-icon";
import type { Trade } from "@/lib/types/analyst";
import { useAnalystProfile } from "@/hooks/use-analyst-dashboard";
import {
  RAEvaluationDashboard,
  RAEvaluationDashboardSkeleton,
} from "@/components/public/RAEvaluationDashboard";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Backend trade statuses that represent a closed position. */
const CLOSED_STATUSES = ["MANUALLY_CLOSED", "CLOSED_BY_SL", "CLOSED_BY_TARGET"];

function isClosed(t: Trade): boolean {
  return CLOSED_STATUSES.includes(t.status as string);
}

function isLive(t: Trade): boolean {
  return (t.status as string) === "LIVE" || t.status === "ACTIVE";
}

/** Realised P&L percentage for a closed trade. */
function pnl(t: Trade): number {
  return (
    (t as { combined_pnl_percent?: number }).combined_pnl_percent ?? t.pnl_percent ?? t.pnl_pct ?? 0
  );
}

/** A win is a target hit or any positive realised P&L. */
function isWin(t: Trade): boolean {
  return t.status === ("CLOSED_BY_TARGET" as Trade["status"]) || pnl(t) > 0;
}

function fmtPct(n: number): string {
  return `${n >= 0 ? "+" : ""}${n.toFixed(2)}%`;
}

const MONTH_LABELS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

// ─── Data hook ────────────────────────────────────────────────────────────────

function useAllTrades() {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/analyst/trades?limit=1000", {
          credentials: "same-origin",
          cache: "no-store",
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        const list: Trade[] = Array.isArray(json.trades)
          ? json.trades
          : Array.isArray(json.data)
            ? json.data
            : Array.isArray(json)
              ? json
              : [];
        if (!cancelled) {
          setTrades(list);
          setIsError(false);
        }
      } catch {
        if (!cancelled) {
          setTrades([]);
          setIsError(true);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return { trades, isLoading, isError };
}

// ─── Analytics ────────────────────────────────────────────────────────────────

interface Analytics {
  totalTrades: number;
  liveCount: number;
  closedCount: number;
  wins: number;
  losses: number;
  winRate: number;
  avgReturn: number;
  totalReturn: number;
  best: Trade | null;
  worst: Trade | null;
  bySegment: { label: string; total: number; wins: number; winRate: number; avgPnl: number }[];
  byCategory: { label: string; total: number; wins: number; winRate: number; avgPnl: number }[];
  monthly: { label: string; total: number; wins: number; avgPnl: number }[];
}

function buildAnalytics(trades: Trade[]): Analytics {
  const closed = trades.filter(isClosed);
  const live = trades.filter(isLive);
  const wins = closed.filter(isWin);
  const losses = closed.filter((t) => !isWin(t));

  const totalReturn = closed.reduce((s, t) => s + pnl(t), 0);
  const avgReturn = closed.length ? totalReturn / closed.length : 0;

  const sorted = [...closed].sort((a, b) => pnl(b) - pnl(a));
  const best = sorted[0] ?? null;
  const worst = sorted.length ? sorted[sorted.length - 1] : null;

  // Group helper
  const group = (keyOf: (t: Trade) => string | undefined) => {
    const map = new Map<string, Trade[]>();
    for (const t of closed) {
      const key = keyOf(t) || "OTHER";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(t);
    }
    return Array.from(map.entries())
      .map(([label, list]) => {
        const w = list.filter(isWin).length;
        return {
          label,
          total: list.length,
          wins: w,
          winRate: list.length ? (w / list.length) * 100 : 0,
          avgPnl: list.length ? list.reduce((s, t) => s + pnl(t), 0) / list.length : 0,
        };
      })
      .sort((a, b) => b.total - a.total);
  };

  // Monthly trend over the last 6 months based on exit timestamp
  const now = new Date();
  const monthly: Analytics["monthly"] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthTrades = closed.filter((t) => {
      const ts = (t as { exit_timestamp?: string }).exit_timestamp ?? t.updated_at;
      if (!ts) return false;
      const td = new Date(ts);
      return td.getFullYear() === d.getFullYear() && td.getMonth() === d.getMonth();
    });
    const w = monthTrades.filter(isWin).length;
    monthly.push({
      label: `${MONTH_LABELS[d.getMonth()]} '${String(d.getFullYear()).slice(2)}`,
      total: monthTrades.length,
      wins: w,
      avgPnl: monthTrades.length
        ? monthTrades.reduce((s, t) => s + pnl(t), 0) / monthTrades.length
        : 0,
    });
  }

  return {
    totalTrades: trades.length,
    liveCount: live.length,
    closedCount: closed.length,
    wins: wins.length,
    losses: losses.length,
    winRate: closed.length ? (wins.length / closed.length) * 100 : 0,
    avgReturn,
    totalReturn,
    best,
    worst,
    bySegment: group((t) => t.segment),
    byCategory: group((t) => (t as { category?: string }).category),
    monthly,
  };
}

// ─── UI pieces ────────────────────────────────────────────────────────────────

function KpiCard({
  label,
  value,
  sub,
  icon,
  tone = "ink",
}: {
  label: string;
  value: string;
  sub?: string;
  icon: IconName;
  tone?: "ink" | "green" | "red" | "brand";
}) {
  const toneClass =
    tone === "green"
      ? "text-[var(--green)]"
      : tone === "red"
        ? "text-[var(--red)]"
        : tone === "brand"
          ? "text-[var(--brand)]"
          : "text-[var(--ink)]";
  return (
    <div className="rounded-xl border border-[var(--line)] bg-white px-5 py-4 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[11.5px] font-medium text-[var(--muted)]">{label}</span>
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--surface)]">
          <Icon className="h-3.5 w-3.5 text-[var(--muted-2)]" name={icon} />
        </span>
      </div>
      <div className={`text-[24px] font-extrabold leading-tight tracking-[-0.5px] ${toneClass}`}>
        {value}
      </div>
      {sub && <div className="mt-1 text-[11.5px] text-[var(--muted-2)]">{sub}</div>}
    </div>
  );
}

function KpiSkeleton() {
  return (
    <div className="rounded-xl border border-[var(--line)] bg-white px-5 py-4">
      <div className="mb-3 h-2.5 w-24 animate-pulse rounded bg-[var(--line)]" />
      <div className="h-7 w-20 animate-pulse rounded bg-[var(--line)]" />
    </div>
  );
}

function BreakdownTable({
  title,
  rows,
}: {
  title: string;
  rows: { label: string; total: number; wins: number; winRate: number; avgPnl: number }[];
}) {
  return (
    <div className="flex-1 overflow-hidden rounded-xl border border-[var(--line)] bg-white shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
      <div className="border-b border-[var(--line)] px-5 py-4">
        <h2 className="text-[15px] font-bold text-[var(--ink)]">{title}</h2>
      </div>
      {rows.length === 0 ? (
        <div className="px-5 py-8 text-center text-[13px] text-[var(--muted-2)]">
          No closed trades yet
        </div>
      ) : (
        <table className="w-full">
          <thead>
            <tr className="border-b border-[var(--line)]">
              {["", "TRADES", "WIN RATE", "AVG P&L"].map((c) => (
                <th
                  key={c}
                  className="py-2.5 pl-5 pr-4 text-left text-[10.5px] font-bold uppercase tracking-[0.06em] text-[var(--muted-2)] last:pr-5"
                >
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.label} className="border-b border-[var(--line)] last:border-0">
                <td className="py-3 pl-5 pr-4 text-[13px] font-semibold text-[var(--ink)]">
                  {r.label}
                </td>
                <td className="py-3 px-4 text-[13px] text-[var(--ink)]">{r.total}</td>
                <td className="py-3 px-4 text-[13px] font-medium text-[var(--ink)]">
                  {r.winRate.toFixed(0)}%
                </td>
                <td
                  className={`py-3 px-4 pr-5 text-[13px] font-bold ${
                    r.avgPnl >= 0 ? "text-[var(--green)]" : "text-[var(--red)]"
                  }`}
                >
                  {fmtPct(r.avgPnl)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

// Custom Tooltip for the Monthly Closed Trades Bar Chart
const CustomBarTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-slate-900/95 dark:bg-slate-950/95 backdrop-blur-md border border-slate-700/80 p-3 rounded-lg shadow-xl text-white text-xs">
        <p className="font-bold mb-1">{data.label}</p>
        <div className="space-y-1">
          <p className="text-slate-300">
            Closed Trades: <span className="font-semibold text-white">{data.total}</span>
          </p>
          <p className="text-slate-300">
            Avg Return:{" "}
            <span className={`font-bold ${data.avgPnl >= 0 ? "text-green-400" : "text-red-400"}`}>
              {data.total > 0
                ? `${data.avgPnl >= 0 ? "+" : ""}${data.avgPnl.toFixed(2)}%`
                : "0.00%"}
            </span>
          </p>
        </div>
      </div>
    );
  }
  return null;
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PerformancePage() {
  const { trades, isLoading, isError } = useAllTrades();
  const { profile, isLoading: isProfileLoading } = useAnalystProfile();
  const a = useMemo(() => buildAnalytics(trades), [trades]);

  const maxMonthly = Math.max(1, ...a.monthly.map((m) => m.total));

  return (
    <>
      <Topbar title="Performance" />

      <div className="flex-1 p-6">
        <div className="mb-5">
          <h2 className="text-[22px] font-extrabold tracking-[-0.5px] text-[var(--ink)]">
            Performance Analytics
          </h2>
          <p className="mt-0.5 text-[13px] text-[var(--muted)]">
            Win rate, returns and trade outcomes computed from your closed positions.
          </p>
        </div>

        {isProfileLoading ? (
          <div className="mb-8">
            <RAEvaluationDashboardSkeleton />
          </div>
        ) : profile?.username ? (
          <div className="mb-8">
            <RAEvaluationDashboard username={profile.username} />
          </div>
        ) : null}

        {isError ? (
          <div className="rounded-xl border border-[var(--red)]/20 bg-[var(--red-light)] p-5 text-[13px] text-[var(--red)]">
            <Icon className="mr-2 h-4 w-4" name="x" />
            Unable to load performance data. Make sure the trade service is running.
          </div>
        ) : (
          <>
            {/* ── KPI cards ── */}
            <div className="mb-5 grid grid-cols-1 sm:grid-cols-3 gap-4">
              {isLoading ? (
                <>
                  <KpiSkeleton />
                  <KpiSkeleton />
                  <KpiSkeleton />
                </>
              ) : (
                <>
                  <KpiCard
                    label="Total Trades"
                    value={String(a.totalTrades)}
                    sub={`${a.liveCount} live · ${a.closedCount} closed`}
                    icon="folder"
                  />
                  <KpiCard
                    label="Avg Return / Trade"
                    value={fmtPct(a.avgReturn)}
                    sub="Across closed trades"
                    icon="wallet"
                    tone={a.avgReturn >= 0 ? "green" : "red"}
                  />
                  <KpiCard
                    label="Cumulative Return"
                    value={fmtPct(a.totalReturn)}
                    sub="Sum of realised P&L"
                    icon="trendingUp"
                    tone={a.totalReturn >= 0 ? "green" : "red"}
                  />
                </>
              )}
            </div>

            {/* ── Best / Worst ── */}
            {!isLoading && a.closedCount > 0 && (
              <div className="mb-5 grid grid-cols-2 gap-4 max-[640px]:grid-cols-1">
                {a.best && (
                  <div className="rounded-xl border border-[var(--line)] bg-white px-5 py-4 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
                    <div className="mb-1 text-[11.5px] font-medium text-[var(--muted)]">
                      Best Trade
                    </div>
                    <div className="flex items-baseline justify-between">
                      <span className="text-[15px] font-bold text-[var(--ink)]">
                        {a.best.symbol}
                      </span>
                      <span className="text-[18px] font-extrabold text-[var(--green)]">
                        {fmtPct(pnl(a.best))}
                      </span>
                    </div>
                  </div>
                )}
                {a.worst && (
                  <div className="rounded-xl border border-[var(--line)] bg-white px-5 py-4 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
                    <div className="mb-1 text-[11.5px] font-medium text-[var(--muted)]">
                      Worst Trade
                    </div>
                    <div className="flex items-baseline justify-between">
                      <span className="text-[15px] font-bold text-[var(--ink)]">
                        {a.worst.symbol}
                      </span>
                      <span className="text-[18px] font-extrabold text-[var(--red)]">
                        {fmtPct(pnl(a.worst))}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── Monthly trend ── */}
            <div className="mb-5 rounded-xl border border-[var(--line)] bg-white p-5 shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
              <h2 className="mb-4 text-[15px] font-bold text-[var(--ink)]">
                Closed Trades — Last 6 Months
              </h2>
              {isLoading ? (
                <div className="h-44 w-full animate-pulse rounded bg-[var(--line)]" />
              ) : (
                <div className="h-44 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={a.monthly}
                      margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                    >
                      <XAxis
                        dataKey="label"
                        tickLine={false}
                        axisLine={false}
                        tick={{ fill: "#64748b", fontSize: 11, fontWeight: 500 }}
                      />
                      <YAxis
                        tickLine={false}
                        axisLine={false}
                        tick={{ fill: "#64748b", fontSize: 11 }}
                        allowDecimals={false}
                      />
                      <RechartsTooltip
                        content={<CustomBarTooltip />}
                        cursor={{ fill: "rgba(148, 163, 184, 0.1)" }}
                      />
                      <Bar dataKey="total" radius={[4, 4, 0, 0]} maxBarSize={45}>
                        {a.monthly.map((entry, index) => {
                          const isNegative = entry.avgPnl < 0;
                          return (
                            <Cell
                              key={`cell-${index}`}
                              fill={
                                entry.total === 0
                                  ? "rgba(148, 163, 184, 0.15)"
                                  : isNegative
                                    ? "#d93025"
                                    : "#1f7ae0"
                              }
                            />
                          );
                        })}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {/* ── Breakdown tables ── */}
            {!isLoading && (
              <div className="flex gap-4 max-[860px]:flex-col">
                <BreakdownTable title="By Segment" rows={a.bySegment} />
                <BreakdownTable title="By Category" rows={a.byCategory} />
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}
