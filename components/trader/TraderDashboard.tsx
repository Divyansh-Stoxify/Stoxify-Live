"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { Icon } from "@/components/stoxify-icon";
import { TradeDetailsModal } from "@/components/trade-details-modal";

type DashboardUser = {
  user_id: string;
  name: string;
  email: string;
  phone: string;
  state: string;
};

type Subscription = {
  subscription_id: string;
  plan_id: string;
  plan_name?: string;
  analyst_name?: string;
  analyst_id?: string;
  status: string;
  start_date: string;
  end_date: string;
  days_remaining?: number;
};

type Trade = {
  trade_id: string;
  trade_type: string;
  analyst_id: string;
  analyst_name: string;
  symbol: string;
  name?: string;
  segment: string;
  category: string;
  direction: string;
  entry_price: number;
  stop_loss: number;
  target?: number;
  targets?: { target_price: number; book_percent: number }[];
  exit_price?: number;
  status: string;
  pnl_percent?: number;
  entry_timestamp: string;
  exit_timestamp?: string;
  batch?: string;
  plan_id?: string;
};

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

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
  return `${days}d ago`;
}

function StatCard({
  icon,
  iconWrap,
  iconColor,
  label,
  value,
  sub,
}: {
  icon: Parameters<typeof Icon>[0]["name"];
  iconWrap: string;
  iconColor: string;
  label: string;
  value: string | number;
  sub?: string;
}) {
  return (
    <div className="rounded-xl border border-[var(--line)] bg-white p-5 transition-all hover:shadow-[0_4px_16px_rgba(0,0,0,0.06)]">
      <div className="flex items-center gap-3 mb-3">
        <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${iconWrap}`}>
          <Icon name={icon} className={`h-4.5 w-4.5 ${iconColor}`} />
        </div>
        <span className="text-[12px] font-semibold uppercase tracking-[0.06em] text-[var(--muted)]">
          {label}
        </span>
      </div>
      <div className="text-[28px] font-extrabold tracking-[-1px] text-[var(--ink)]">{value}</div>
      {sub && <div className="mt-0.5 text-[12px] text-[var(--muted-2)]">{sub}</div>}
    </div>
  );
}

function TradeCard({ trade }: { trade: Trade }) {
  const isLong = trade.direction === "LONG";
  const isLive = trade.status === "LIVE";
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  return (
    <>
      <div
        onClick={() => setShowDetailsModal(true)}
        className={[
          "relative overflow-hidden rounded-xl border-[1.5px] border-[var(--line)] bg-white p-4 transition-all hover:shadow-[0_4px_16px_rgba(0,0,0,0.06)] cursor-pointer",
          "before:absolute before:inset-y-0 before:left-0 before:w-1 before:content-['']",
          isLong ? "before:bg-[var(--green)]" : "before:bg-[var(--red)]",
        ].join(" ")}
      >
        {/* Header */}
        <div className="mb-3 flex items-start justify-between">
          <div className="flex items-center gap-2.5">
            <div
              className={[
                "flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] text-[10px] font-extrabold text-white",
                isLong
                  ? "bg-[linear-gradient(135deg,#10B981,#059669)]"
                  : "bg-[linear-gradient(135deg,#EF4444,#DC2626)]",
              ].join(" ")}
            >
              {isLong ? "L" : "S"}
            </div>
            <div>
              <div className="text-[13px] font-bold text-[var(--ink)]">{trade.analyst_name}</div>
              <div className="text-[11px] text-[var(--muted-2)]">
                {timeAgo(trade.entry_timestamp)} · {trade.category}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {trade.batch && (
              <span className="inline-flex items-center rounded bg-[#f8fafc] px-2 py-[2px] text-[10.5px] font-bold uppercase text-[#475569] border border-[#cbd5e1]/50">
                {trade.batch}
              </span>
            )}
            <span
              className={[
                "rounded-md px-2.5 py-[3px] text-[11px] font-extrabold tracking-[0.05em]",
                isLong
                  ? "bg-[var(--green-light)] text-[var(--green)]"
                  : "bg-[var(--red-light)] text-[var(--red)]",
              ].join(" ")}
            >
              {isLong ? "BUY" : "SELL"}
            </span>
            {isLive && (
              <span className="flex items-center gap-1 rounded-full border border-[rgba(5,150,105,0.2)] bg-[rgba(5,150,105,0.08)] px-2 py-[2px] text-[10px] font-bold text-[var(--green)]">
                <span className="h-[5px] w-[5px] animate-[blink_1.5s_infinite] rounded-full bg-[var(--green)]" />
                LIVE
              </span>
            )}
          </div>
        </div>

        {/* Symbol + Prices */}
        <div className="flex items-end justify-between gap-3">
          <div>
            <div className="font-sans text-xl font-extrabold leading-none tracking-[-0.5px] text-[var(--ink)]">
              {trade.symbol}
            </div>
            <div className="mt-0.5 text-[11px] text-[var(--muted-2)]">{trade.segment} · NSE</div>
          </div>
          <div className="flex gap-4">
            <div className="text-center">
              <div className="mb-0.5 text-[10px] text-[var(--muted-2)]">Entry</div>
              <div className="text-[13px] font-bold text-[var(--ink)]">
                {formatCurrency(trade.entry_price)}
              </div>
            </div>
            <div className="text-center">
              <div className="mb-0.5 text-[10px] text-[var(--muted-2)]">Target</div>
              <div className="text-[13px] font-bold text-[var(--green)]">
                {formatCurrency(trade.targets && trade.targets.length > 0 ? ((trade.direction === "SHORT" || trade.direction === "SELL") ? Math.min(...trade.targets.map(t => t.target_price)) : Math.max(...trade.targets.map(t => t.target_price))) : (trade.target ?? 0))}
              </div>
            </div>
            <div className="text-center">
              <div className="mb-0.5 text-[10px] text-[var(--muted-2)]">SL</div>
              <div className="text-[13px] font-bold text-[var(--red)]">
                {formatCurrency(trade.stop_loss)}
              </div>
            </div>
          </div>
        </div>

        {/* P&L if closed */}
        {trade.pnl_percent !== undefined && trade.pnl_percent !== null && !isLive && (
          <div className="mt-3 flex items-center gap-2 rounded-lg bg-[var(--surface)] px-3 py-2">
            <Icon
              name={trade.pnl_percent >= 0 ? "trendingUp" : "trendingDown"}
              className={`h-3.5 w-3.5 ${
                trade.pnl_percent >= 0 ? "text-[var(--green)]" : "text-[var(--red)]"
              }`}
            />
            <span
              className={`text-[13px] font-bold ${
                trade.pnl_percent >= 0 ? "text-[var(--green)]" : "text-[var(--red)]"
              }`}
            >
              {trade.pnl_percent >= 0 ? "+" : ""}
              {trade.pnl_percent.toFixed(2)}%
            </span>
            <span className="text-[11px] text-[var(--muted-2)]">
              Exit at {formatCurrency(trade.exit_price ?? 0)}
            </span>
          </div>
        )}
      </div>

      {showDetailsModal && (
        <TradeDetailsModal
          trade={trade as any}
          onClose={() => setShowDetailsModal(false)}
        />
      )}
    </>
  );
}

function SkeletonCard() {
  return (
    <div className="rounded-xl border border-[var(--line)] bg-white p-5 animate-pulse">
      <div className="flex items-center gap-3 mb-3">
        <div className="h-10 w-10 rounded-lg bg-[var(--line)]" />
        <div className="h-3 w-20 rounded bg-[var(--line)]" />
      </div>
      <div className="h-7 w-16 rounded bg-[var(--line)] mb-1" />
      <div className="h-3 w-24 rounded bg-[var(--line)]" />
    </div>
  );
}

function SkeletonTradeCard() {
  return (
    <div className="rounded-xl border border-[var(--line)] bg-white p-4 animate-pulse">
      <div className="flex items-center gap-2.5 mb-3">
        <div className="h-8 w-8 rounded-[10px] bg-[var(--line)]" />
        <div className="flex-1">
          <div className="h-3 w-24 rounded bg-[var(--line)] mb-1.5" />
          <div className="h-2.5 w-16 rounded bg-[var(--line)]" />
        </div>
        <div className="h-5 w-12 rounded bg-[var(--line)]" />
      </div>
      <div className="flex items-end justify-between">
        <div>
          <div className="h-5 w-24 rounded bg-[var(--line)] mb-1" />
          <div className="h-2.5 w-16 rounded bg-[var(--line)]" />
        </div>
        <div className="flex gap-4">
          <div className="h-8 w-14 rounded bg-[var(--line)]" />
          <div className="h-8 w-14 rounded bg-[var(--line)]" />
          <div className="h-8 w-14 rounded bg-[var(--line)]" />
        </div>
      </div>
    </div>
  );
}

export function TraderDashboard({ user }: { user: DashboardUser }) {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loadingSubs, setLoadingSubs] = useState(true);
  const [loadingTrades, setLoadingTrades] = useState(true);
  const [tradeTab, setTradeTab] = useState<"LIVE" | "CLOSED">("LIVE");
  const [showReactivationAlert, setShowReactivationAlert] = useState(false);

  const fetchSubscriptions = useCallback(async () => {
    try {
      const res = await fetch("/api/trader/subscriptions?status=ACTIVE", {
        credentials: "same-origin",
        cache: "no-store",
      });
      const data = await res.json().catch(() => ({}));
      setSubscriptions(data.subscriptions ?? data.data ?? []);
    } catch {
      setSubscriptions([]);
    } finally {
      setLoadingSubs(false);
    }
  }, []);

  const fetchTrades = useCallback(async (status: string, activeSubs: Subscription[]) => {
    setLoadingTrades(true);
    try {
      if (activeSubs.length === 0) {
        setTrades([]);
        setLoadingTrades(false);
        return;
      }

      // Fan out one request per subscription (analyst + plan)
      const results = await Promise.allSettled(
        activeSubs.map(async (sub) => {
          if (!sub.analyst_id || !sub.plan_id) return [];
          const res = await fetch(
            `/api/trader/trades?analyst_id=${sub.analyst_id}&plan_id=${sub.plan_id}&status=${status}&limit=10`,
            { credentials: "same-origin", cache: "no-store" }
          );
          const data = await res.json().catch(() => ({}));
          return (data.trades ?? data.data ?? []) as Trade[];
        })
      );

      const allTrades = results
        .filter((r): r is PromiseFulfilledResult<Trade[]> => r.status === "fulfilled")
        .flatMap((r) => r.value)
        .sort(
          (a, b) => new Date(b.entry_timestamp).getTime() - new Date(a.entry_timestamp).getTime()
        );

      setTrades(allTrades);
    } catch {
      setTrades([]);
    } finally {
      setLoadingTrades(false);
    }
  }, []);

  useEffect(() => {
    Promise.resolve().then(() => {
      fetchSubscriptions();
    });
  }, [fetchSubscriptions]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("reactivated") === "true") {
        setShowReactivationAlert(true);
        const newUrl = window.location.pathname;
        window.history.replaceState({}, "", newUrl);
      }
    }
  }, []);

  // Once subscriptions are loaded, extract analyst IDs and fetch trades
  const analystIds = Array.from(
    new Set(subscriptions.map((s) => s.analyst_id).filter(Boolean) as string[])
  );

  useEffect(() => {
    if (loadingSubs) return; // wait for subscriptions
    Promise.resolve().then(() => {
      fetchTrades(tradeTab, subscriptions);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tradeTab, loadingSubs, subscriptions]);

  const firstName = user.name?.split(" ")[0] || "Trader";

  return (
    <div className="px-6 py-6 lg:px-8 lg:py-8 max-w-[1100px] mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-[24px] font-extrabold tracking-[-0.5px] text-[var(--ink)]">
          Good{" "}
          {new Date().getHours() < 12
            ? "morning"
            : new Date().getHours() < 17
              ? "afternoon"
              : "evening"}
          , {firstName}
        </h1>
        <p className="mt-1 text-[13px] text-[var(--muted)]">
          Here&apos;s your trading overview for today.
        </p>
      </div>

      {/* Stats Row */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {loadingSubs ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : (
          <>
            <StatCard
              icon="listChecks"
              iconWrap="bg-[var(--brand-light)]"
              iconColor="text-[var(--brand)]"
              label="Active Batches"
              value={subscriptions.length}
              sub={subscriptions.length === 1 ? "subscription" : "subscriptions"}
            />
            <StatCard
              icon="lineChart"
              iconWrap="bg-[var(--green-light)]"
              iconColor="text-[var(--green)]"
              label="Live Trades"
              value={trades.filter((t) => t.status === "LIVE").length}
              sub="from your analysts"
            />
            <StatCard
              icon="trendingUp"
              iconWrap="bg-[var(--orange-light)]"
              iconColor="text-[var(--orange)]"
              label="Analysts"
              value={new Set(subscriptions.map((s) => s.analyst_id).filter(Boolean)).size}
              sub="you follow"
            />
            <StatCard
              icon="bell"
              iconWrap="bg-[rgba(139,92,246,0.08)]"
              iconColor="text-[#6D28D9]"
              label="Alerts Today"
              value="—"
              sub="trade notifications"
            />
          </>
        )}
      </div>

      {/* Quick Actions */}
      <div className="mb-6 flex flex-wrap gap-2">
        <Link
          href="/trader/discover"
          className="inline-flex items-center gap-2 rounded-lg border border-[var(--line)] bg-white px-4 py-2.5 text-[13px] font-semibold text-[var(--muted)] transition-all hover:border-[var(--brand-mid)] hover:text-[var(--brand)]"
        >
          <Icon name="search" className="h-3.5 w-3.5" />
          Discover Analysts
        </Link>
        <Link
          href="/trader/subscriptions"
          className="inline-flex items-center gap-2 rounded-lg border border-[var(--line)] bg-white px-4 py-2.5 text-[13px] font-semibold text-[var(--muted)] transition-all hover:border-[var(--brand-mid)] hover:text-[var(--brand)]"
        >
          <Icon name="wallet" className="h-3.5 w-3.5" />
          My Subscriptions
        </Link>
        <Link
          href="/trader/notifications"
          className="inline-flex items-center gap-2 rounded-lg border border-[var(--line)] bg-white px-4 py-2.5 text-[13px] font-semibold text-[var(--muted)] transition-all hover:border-[var(--brand-mid)] hover:text-[var(--brand)]"
        >
          <Icon name="bell" className="h-3.5 w-3.5" />
          Notifications
        </Link>
      </div>

      {/* Trades Section */}
      <div className="rounded-xl border border-[var(--line)] bg-white">
        <div className="flex items-center justify-between border-b border-[var(--line)] px-5 py-4">
          <div className="flex items-center gap-2">
            <Icon name="lineChart" className="h-4 w-4 text-[var(--brand)]" />
            <h2 className="text-[15px] font-bold text-[var(--ink)]">Trade Feed</h2>
          </div>
          <div className="flex rounded-lg border border-[var(--line)] bg-[var(--surface)] p-0.5">
            <button
              type="button"
              onClick={() => setTradeTab("LIVE")}
              className={[
                "rounded-md px-3.5 py-1.5 text-[12px] font-bold transition-all",
                tradeTab === "LIVE"
                  ? "bg-white text-[var(--brand)] shadow-sm"
                  : "text-[var(--muted)] hover:text-[var(--ink)]",
              ].join(" ")}
            >
              Live
            </button>
            <button
              type="button"
              onClick={() => setTradeTab("CLOSED")}
              className={[
                "rounded-md px-3.5 py-1.5 text-[12px] font-bold transition-all",
                tradeTab === "CLOSED"
                  ? "bg-white text-[var(--brand)] shadow-sm"
                  : "text-[var(--muted)] hover:text-[var(--ink)]",
              ].join(" ")}
            >
              Closed
            </button>
          </div>
        </div>

        <div className="p-4">
          {loadingTrades ? (
            <div className="flex flex-col gap-3">
              <SkeletonTradeCard />
              <SkeletonTradeCard />
              <SkeletonTradeCard />
            </div>
          ) : trades.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--brand-light)] text-[var(--brand)]">
                <Icon name="lineChart" className="h-6 w-6" />
              </div>
              <h3 className="text-[15px] font-bold text-[var(--ink)] mb-1.5">
                {tradeTab === "LIVE" ? "No live trades" : "No closed trades yet"}
              </h3>
              <p className="text-[13px] text-[var(--muted)] max-w-[300px] mb-4">
                {tradeTab === "LIVE"
                  ? "Subscribe to analysts to start receiving live trade alerts in real time."
                  : "Once your subscribed analysts close trades, they'll appear here with P&L details."}
              </p>
              {tradeTab === "LIVE" && (
                <Link
                  href="/trader/discover"
                  className="inline-flex items-center gap-2 rounded-lg bg-[var(--brand)] px-5 py-2.5 text-[13px] font-bold text-white transition-all hover:bg-[var(--brand-dark)] hover:shadow-md"
                >
                  <Icon name="search" className="h-3.5 w-3.5" />
                  Discover Analysts
                </Link>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {trades.map((trade) => (
                <TradeCard key={trade.trade_id} trade={trade} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ─── REACTIVATION ALERT MODAL ─── */}
      {showReactivationAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-[460px] rounded-2xl bg-white p-7 shadow-2xl relative">
            <button
              onClick={() => setShowReactivationAlert(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <Icon name="x" className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-3 mb-5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
                <Icon name="shieldCheck" className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-[17px] font-extrabold text-[var(--ink)] select-none">
                  Account Reactivated
                </h3>
                <p className="text-[12px] text-[var(--muted)]">Welcome back!</p>
              </div>
            </div>
            <div className="text-[13.5px] text-[var(--ink)] leading-relaxed mb-6">
              You deleted your account and it was under deactivation phase for 30 days. After login, you need to delete again in order to go under deactivation phase of 30 days.
            </div>
            <button
              type="button"
              onClick={() => setShowReactivationAlert(false)}
              className="w-full rounded-full bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-[13.5px] py-2.5 transition-all shadow-sm active:scale-[0.98]"
            >
              I Understand
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
