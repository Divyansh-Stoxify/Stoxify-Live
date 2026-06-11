"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { Icon } from "@/components/stoxify-icon";

type Plan = {
  plan_id: string;
  analyst_id: string;
  analyst_name: string;
  name: string;
  description?: string;
  days: number;
  price: number;
  segment: string;
  features?: string[];
  subscriber_count?: number;
};

type Trade = {
  trade_id: string;
  trade_type: string;
  symbol: string;
  segment: string;
  category: string;
  direction: string;
  entry_price: number;
  stop_loss: number;
  target: number;
  exit_price?: number;
  status: string;
  pnl_percent?: number;
  entry_timestamp: string;
};

const gradients = [
  "linear-gradient(135deg,#3B82F6,#2D5BE3)",
  "linear-gradient(135deg,#8B5CF6,#6D28D9)",
  "linear-gradient(135deg,#F59E0B,#D97706)",
  "linear-gradient(135deg,#10B981,#059669)",
  "linear-gradient(135deg,#EF4444,#DC2626)",
];

function getGradient(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  return gradients[Math.abs(hash) % gradients.length];
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "A";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return parts
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export default function AnalystDetailPage() {
  const params = useParams();
  const analystId = params.id as string;
  const [plans, setPlans] = useState<Plan[]>([]);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);

  const analystName = plans[0]?.analyst_name || "Analyst";

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [plansRes, tradesRes] = await Promise.all([
        fetch(`/api/trader/plans?analyst_id=${analystId}`, {
          credentials: "same-origin",
          cache: "no-store",
        }),
        fetch(`/api/trader/trades?analyst_id=${analystId}&limit=10`, {
          credentials: "same-origin",
          cache: "no-store",
        }),
      ]);

      const plansData = await plansRes.json().catch(() => ({}));
      const tradesData = await tradesRes.json().catch(() => ({}));

      setPlans(plansData.plans ?? plansData.data ?? []);
      setTrades(tradesData.trades ?? tradesData.data ?? []);
    } catch {
      setPlans([]);
      setTrades([]);
    } finally {
      setLoading(false);
    }
  }, [analystId]);

  useEffect(() => {
    Promise.resolve().then(() => {
      fetchData();
    });
  }, [fetchData]);

  // Compute performance stats from trades
  const closedTrades = trades.filter((t) => t.status !== "LIVE" && t.pnl_percent !== undefined);
  const totalClosed = closedTrades.length;
  const winningTrades = closedTrades.filter((t) => (t.pnl_percent ?? 0) > 0).length;
  const winRate = totalClosed > 0 ? Math.round((winningTrades / totalClosed) * 100) : 0;
  const avgPnl =
    totalClosed > 0
      ? closedTrades.reduce((sum, t) => sum + (t.pnl_percent ?? 0), 0) / totalClosed
      : 0;

  if (loading) {
    return (
      <div className="px-6 py-6 lg:px-8 lg:py-8 max-w-[900px] mx-auto animate-pulse">
        <div className="flex items-start gap-5 mb-8">
          <div className="h-16 w-16 rounded-2xl bg-[var(--line)]" />
          <div>
            <div className="h-6 w-40 rounded bg-[var(--line)] mb-2" />
            <div className="h-4 w-28 rounded bg-[var(--line)]" />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="h-24 rounded-xl bg-[var(--line)]" />
          <div className="h-24 rounded-xl bg-[var(--line)]" />
          <div className="h-24 rounded-xl bg-[var(--line)]" />
        </div>
      </div>
    );
  }

  return (
    <div className="px-6 py-6 lg:px-8 lg:py-8 max-w-[900px] mx-auto">
      {/* Back Link */}
      <Link
        href="/trader/discover"
        className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[var(--muted)] hover:text-[var(--brand)] transition-colors mb-6"
      >
        <span className="text-[11px]">←</span>
        Back to Discover
      </Link>

      {/* Analyst Header */}
      <div className="flex items-start gap-5 mb-8">
        <div
          className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl text-[22px] font-extrabold text-white"
          style={{ background: getGradient(analystId) }}
        >
          {getInitials(analystName)}
        </div>
        <div>
          <h1 className="text-[22px] font-extrabold tracking-[-0.5px] text-[var(--ink)]">
            {analystName}
          </h1>
          <div className="mt-1 flex items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-[var(--green-light)] px-2.5 py-0.5 text-[11px] font-bold text-[var(--green)]">
              <Icon name="shieldCheck" className="h-3 w-3" />
              SEBI Verified
            </span>
            <span className="text-[12px] text-[var(--muted)]">ID: {analystId}</span>
          </div>
        </div>
      </div>

      {/* Performance Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 mb-8">
        <div className="rounded-xl border border-[var(--line)] bg-white p-4 text-center">
          <div className="text-[22px] font-extrabold text-[var(--ink)]">{totalClosed}</div>
          <div className="text-[11px] text-[var(--muted)]">Total Trades</div>
        </div>
        <div className="rounded-xl border border-[var(--line)] bg-white p-4 text-center">
          <div className="text-[22px] font-extrabold text-[var(--green)]">{winRate}%</div>
          <div className="text-[11px] text-[var(--muted)]">Win Rate</div>
        </div>
        <div className="rounded-xl border border-[var(--line)] bg-white p-4 text-center">
          <div
            className={`text-[22px] font-extrabold ${avgPnl >= 0 ? "text-[var(--green)]" : "text-[var(--red)]"}`}
          >
            {avgPnl >= 0 ? "+" : ""}
            {avgPnl.toFixed(1)}%
          </div>
          <div className="text-[11px] text-[var(--muted)]">Avg P&L</div>
        </div>
        <div className="rounded-xl border border-[var(--line)] bg-white p-4 text-center">
          <div className="text-[22px] font-extrabold text-[var(--brand)]">{plans.length}</div>
          <div className="text-[11px] text-[var(--muted)]">Active Plans</div>
        </div>
      </div>

      {/* Plans */}
      {plans.length > 0 && (
        <section className="mb-8">
          <h2 className="text-[16px] font-bold text-[var(--ink)] mb-4 flex items-center gap-2">
            <Icon name="listChecks" className="h-4 w-4 text-[var(--brand)]" />
            Subscription Plans
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {plans.map((plan) => (
              <div
                key={plan.plan_id}
                className="rounded-xl border-[1.5px] border-[var(--line)] bg-white p-5 transition-all hover:border-[var(--brand-mid)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.06)]"
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-[14px] font-bold text-[var(--ink)]">{plan.name}</h3>
                  <span className="rounded-full bg-[var(--brand-light)] px-2.5 py-0.5 text-[11px] font-semibold text-[var(--brand)]">
                    {plan.segment}
                  </span>
                </div>
                {plan.description && (
                  <p className="text-[12px] text-[var(--muted)] leading-relaxed mb-3">
                    {plan.description}
                  </p>
                )}
                {plan.features && plan.features.length > 0 && (
                  <ul className="mb-4 flex flex-col gap-1">
                    {plan.features.map((f) => (
                      <li
                        key={f}
                        className="flex items-center gap-2 text-[12px] text-[var(--muted)]"
                      >
                        <Icon name="check" className="h-3 w-3 text-[var(--green)]" />
                        {f}
                      </li>
                    ))}
                  </ul>
                )}
                <div className="flex items-center justify-between pt-3 border-t border-[var(--line)]">
                  <div>
                    <span className="text-[18px] font-extrabold text-[var(--ink)]">
                      {formatCurrency(plan.price)}
                    </span>
                    <span className="text-[12px] text-[var(--muted)]"> / {plan.days} days</span>
                  </div>
                  <button
                    type="button"
                    className="rounded-lg bg-[var(--brand)] px-4 py-2 text-[13px] font-bold text-white transition-colors hover:bg-[var(--brand-dark)]"
                  >
                    Subscribe
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Recent Trades */}
      {trades.length > 0 && (
        <section>
          <h2 className="text-[16px] font-bold text-[var(--ink)] mb-4 flex items-center gap-2">
            <Icon name="lineChart" className="h-4 w-4 text-[var(--brand)]" />
            Recent Trades
          </h2>
          <div className="rounded-xl border border-[var(--line)] bg-white overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-[13px]">
                <thead>
                  <tr className="border-b border-[var(--line)] bg-[var(--surface)]">
                    <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-[0.06em] text-[var(--muted)]">
                      Symbol
                    </th>
                    <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-[0.06em] text-[var(--muted)]">
                      Direction
                    </th>
                    <th className="px-4 py-3 text-right text-[11px] font-bold uppercase tracking-[0.06em] text-[var(--muted)]">
                      Entry
                    </th>
                    <th className="px-4 py-3 text-right text-[11px] font-bold uppercase tracking-[0.06em] text-[var(--muted)]">
                      Target
                    </th>
                    <th className="px-4 py-3 text-right text-[11px] font-bold uppercase tracking-[0.06em] text-[var(--muted)]">
                      SL
                    </th>
                    <th className="px-4 py-3 text-right text-[11px] font-bold uppercase tracking-[0.06em] text-[var(--muted)]">
                      Status
                    </th>
                    <th className="px-4 py-3 text-right text-[11px] font-bold uppercase tracking-[0.06em] text-[var(--muted)]">
                      P&L
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {trades.map((trade) => {
                    const isLong = trade.direction === "LONG";
                    const isLive = trade.status === "LIVE";
                    return (
                      <tr
                        key={trade.trade_id}
                        className="border-b border-[var(--line)] last:border-0 hover:bg-[var(--surface)] transition-colors"
                      >
                        <td className="px-4 py-3 font-bold text-[var(--ink)]">{trade.symbol}</td>
                        <td className="px-4 py-3">
                          <span
                            className={[
                              "rounded-md px-2 py-[2px] text-[11px] font-extrabold",
                              isLong
                                ? "bg-[var(--green-light)] text-[var(--green)]"
                                : "bg-[var(--red-light)] text-[var(--red)]",
                            ].join(" ")}
                          >
                            {trade.direction}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-[var(--ink)]">
                          {formatCurrency(trade.entry_price)}
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-[var(--green)]">
                          {formatCurrency(trade.target)}
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-[var(--red)]">
                          {formatCurrency(trade.stop_loss)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {isLive ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[var(--green)]">
                              <span className="h-[5px] w-[5px] animate-[blink_1.5s_infinite] rounded-full bg-[var(--green)]" />
                              LIVE
                            </span>
                          ) : (
                            <span className="text-[11px] font-semibold text-[var(--muted)]">
                              {trade.status.replace(/_/g, " ")}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {trade.pnl_percent !== undefined && trade.pnl_percent !== null ? (
                            <span
                              className={`font-bold ${
                                trade.pnl_percent >= 0 ? "text-[var(--green)]" : "text-[var(--red)]"
                              }`}
                            >
                              {trade.pnl_percent >= 0 ? "+" : ""}
                              {trade.pnl_percent.toFixed(2)}%
                            </span>
                          ) : (
                            <span className="text-[var(--muted-2)]">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      {/* Empty State */}
      {plans.length === 0 && trades.length === 0 && !loading && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--brand-light)] text-[var(--brand)]">
            <Icon name="users" className="h-6 w-6" />
          </div>
          <h3 className="text-[15px] font-bold text-[var(--ink)] mb-1.5">Analyst not found</h3>
          <p className="text-[13px] text-[var(--muted)] max-w-[300px] mb-4">
            This analyst may not have active plans yet, or the ID is incorrect.
          </p>
          <Link
            href="/trader/discover"
            className="inline-flex items-center gap-2 rounded-lg bg-[var(--brand)] px-5 py-2.5 text-[13px] font-bold text-white hover:bg-[var(--brand-dark)]"
          >
            Browse Analysts
          </Link>
        </div>
      )}
    </div>
  );
}
