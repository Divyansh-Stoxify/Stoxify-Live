"use client";

import { useEffect, useState, useCallback } from "react";
import type {
  DashboardMetrics,
  Trade,
  Subscriber,
  AnalystProfile,
  SubscriptionPlan,
} from "@/lib/types/analyst";

// ─── Helpers ────────────────────────────────────────────────────────────────

async function fetchJSON<T>(url: string): Promise<{ data: T | null; ok: boolean; status: number }> {
  try {
    const res = await fetch(url, {
      credentials: "same-origin",
      cache: "no-store",
    });
    if (!res.ok) return { data: null, ok: false, status: res.status };
    const json = await res.json();
    return { data: json as T, ok: true, status: res.status };
  } catch {
    return { data: null, ok: false, status: 0 };
  }
}

// ─── Hooks ──────────────────────────────────────────────────────────────────

/**
 * useDashboardMetrics
 * Aggregates metrics from the trades and subscriptions APIs.
 * active_trades count comes from trades list; subscriber/revenue come from plans stats.
 */
export function useDashboardMetrics() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setIsLoading(true);
      try {
        // Fetch active trades count and subscription plans in parallel
        const [tradesRes, plansRes] = await Promise.all([
          fetch("/api/analyst/trades?status=ACTIVE&limit=100", {
            credentials: "same-origin",
            cache: "no-store",
          }),
          fetch("/api/analyst/plans", {
            credentials: "same-origin",
            cache: "no-store",
          }),
        ]);

        if (cancelled) return;

        const tradesJson = tradesRes.ok ? await tradesRes.json().catch(() => ({})) : {};
        const plansJson = plansRes.ok ? await plansRes.json().catch(() => ({})) : {};

        // Normalise trade list
        const tradeList: Trade[] = Array.isArray(tradesJson.trades)
          ? tradesJson.trades
          : Array.isArray(tradesJson.data)
            ? tradesJson.data
            : Array.isArray(tradesJson)
              ? tradesJson
              : [];

        // Normalise plans list
        const planList: SubscriptionPlan[] = Array.isArray(plansJson.plans)
          ? plansJson.plans
          : Array.isArray(plansJson.data)
            ? plansJson.data
            : Array.isArray(plansJson)
              ? plansJson
              : [];

        // Subscriber normalization skipped (unused)

        // Derive total subscriber count from plan subscriber counts
        const totalSubscribers = planList.reduce((sum, p) => sum + (p.subscribers_count ?? 0), 0);

        // Derive MRR: sum of active plans × price (normalise YEAR to monthly)
        const mrr = planList
          .filter((p) => p.status === "ACTIVE")
          .reduce((sum, p) => {
            const monthlyPrice =
              p.billing_cycle === "YEAR"
                ? p.price / 12
                : p.billing_cycle === "QUARTER"
                  ? p.price / 3
                  : p.billing_cycle === "WEEK"
                    ? p.price * 4
                    : p.price;
            return sum + monthlyPrice * (p.subscribers_count ?? 0);
          }, 0);

        // Win rate: fraction of CLOSED trades that hit target (pnl_pct > 0)
        const closedRes = await fetch("/api/analyst/trades?status=CLOSED&limit=100", {
          credentials: "same-origin",
          cache: "no-store",
        });
        const closedJson = closedRes.ok ? await closedRes.json().catch(() => ({})) : {};
        const closedList: Trade[] = Array.isArray(closedJson.trades)
          ? closedJson.trades
          : Array.isArray(closedJson.data)
            ? closedJson.data
            : Array.isArray(closedJson)
              ? closedJson
              : [];

        const wins = closedList.filter(
          (t) => t.status === "TARGET_HIT" || (t.pnl_pct !== undefined && t.pnl_pct > 0)
        ).length;
        const winRate = closedList.length > 0 ? (wins / closedList.length) * 100 : 0;

        if (!cancelled) {
          setMetrics({
            active_trades: { value: tradeList.length, change_pct: 0, new_today: 0 },
            total_subscribers: { value: totalSubscribers, change_pct: 0 },
            win_rate: { value: Math.round(winRate * 10) / 10, change_pct: 0 },
            monthly_revenue: { value: Math.round(mrr), change_pct: 0 },
          });
          setIsError(false);
        }
      } catch {
        if (!cancelled) {
          setIsError(true);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  return { metrics, isLoading, isError };
}

export function useActiveTrades(limit: number = 5) {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);

  const fetchTrades = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/analyst/trades?status=ACTIVE&limit=${limit}`, {
        credentials: "same-origin",
        cache: "no-store",
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      const tradeList = json.trades ?? json.data ?? json;
      setTrades(Array.isArray(tradeList) ? tradeList.slice(0, limit) : []);
      setIsError(false);
    } catch {
      setTrades([]);
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    /* eslint-disable-next-line react-hooks/set-state-in-effect */
    void fetchTrades();
  }, [fetchTrades]);

  return { trades, isLoading, isError, refetch: fetchTrades };
}

export function usePendingTrades() {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/analyst/trades?status=PENDING&limit=50", {
          credentials: "same-origin",
          cache: "no-store",
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        const tradeList = json.trades ?? json.data ?? json;
        setTrades(Array.isArray(tradeList) ? tradeList : []);
      } catch {
        setTrades([]);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  return { trades, isLoading };
}

export function useClosedTrades() {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/analyst/trades?status=CLOSED&limit=50", {
          credentials: "same-origin",
          cache: "no-store",
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        const tradeList = json.trades ?? json.data ?? json;
        setTrades(Array.isArray(tradeList) ? tradeList : []);
      } catch {
        setTrades([]);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  return { trades, isLoading };
}

interface LiveTradesStats {
  total_active: number;
  avg_win_rate_monthly: number;
  win_rate_change_pct: number;
  active_subscribers: number;
  live_viewers: number;
}

export function useLiveTradesStats() {
  const [stats, setStats] = useState<LiveTradesStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const [tradesRes, plansRes, closedRes] = await Promise.all([
          fetch("/api/analyst/trades?status=ACTIVE&limit=100", {
            credentials: "same-origin",
            cache: "no-store",
          }),
          fetch("/api/analyst/plans", {
            credentials: "same-origin",
            cache: "no-store",
          }),
          fetch("/api/analyst/trades?status=CLOSED&limit=100", {
            credentials: "same-origin",
            cache: "no-store",
          }),
        ]);

        if (cancelled) return;

        const tradesJson = tradesRes.ok ? await tradesRes.json().catch(() => ({})) : {};
        const plansJson = plansRes.ok ? await plansRes.json().catch(() => ({})) : {};
        const closedJson = closedRes.ok ? await closedRes.json().catch(() => ({})) : {};

        const tradeList: Trade[] = Array.isArray(tradesJson.trades)
          ? tradesJson.trades
          : Array.isArray(tradesJson.data)
            ? tradesJson.data
            : Array.isArray(tradesJson)
              ? tradesJson
              : [];

        const planList: SubscriptionPlan[] = Array.isArray(plansJson.plans)
          ? plansJson.plans
          : Array.isArray(plansJson.data)
            ? plansJson.data
            : Array.isArray(plansJson)
              ? plansJson
              : [];

        const closedList: Trade[] = Array.isArray(closedJson.trades)
          ? closedJson.trades
          : Array.isArray(closedJson.data)
            ? closedJson.data
            : Array.isArray(closedJson)
              ? closedJson
              : [];

        const totalSubscribers = planList.reduce((sum, p) => sum + (p.subscribers_count ?? 0), 0);

        const wins = closedList.filter(
          (t) => t.status === "TARGET_HIT" || (t.pnl_pct !== undefined && t.pnl_pct > 0)
        ).length;
        const winRate = closedList.length > 0 ? (wins / closedList.length) * 100 : 0;

        // live_viewers: sum of live_viewers across active live-streaming trades
        const liveViewers = tradeList
          .filter((t) => t.is_live_streaming)
          .reduce((sum, t) => sum + (t.live_viewers ?? 0), 0);

        if (!cancelled) {
          setStats({
            total_active: tradeList.length,
            avg_win_rate_monthly: Math.round(winRate * 10) / 10,
            win_rate_change_pct: 0,
            active_subscribers: totalSubscribers,
            live_viewers: liveViewers,
          });
        }
      } catch {
        // leave stats null — UI should handle gracefully
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  return { stats, isLoading };
}

export function useRecentSubscribers(limit: number = 5) {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch(`/api/analyst/subscribers?limit=${limit}`, {
          credentials: "same-origin",
          cache: "no-store",
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        // subscription-service may return { subscriptions: [...] } or plain array
        const list: Subscriber[] = Array.isArray(json.subscriptions)
          ? json.subscriptions
          : Array.isArray(json.data)
            ? json.data
            : Array.isArray(json)
              ? json
              : [];

        if (!cancelled) {
          setSubscribers(list.slice(0, limit));
          setIsError(false);
        }
      } catch {
        if (!cancelled) {
          setSubscribers([]);
          setIsError(true);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [limit]);

  return { subscribers, isLoading, isError };
}

export function useAnalystProfile() {
  const [profile, setProfile] = useState<AnalystProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);

  const load = useCallback(async () => {
    setIsLoading(true);
    const { data, ok } = await fetchJSON<AnalystProfile>("/api/analyst/profile");
    setProfile(ok && data ? data : null);
    setIsError(!ok);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    /* eslint-disable-next-line react-hooks/set-state-in-effect */
    void load();
  }, [load]);

  return { profile, isLoading, isError, mutate: load };
}

export function useSubscriptionPlans() {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch("/api/analyst/plans", {
          credentials: "same-origin",
          cache: "no-store",
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        const list: SubscriptionPlan[] = Array.isArray(json.plans)
          ? json.plans
          : Array.isArray(json.data)
            ? json.data
            : Array.isArray(json)
              ? json
              : [];

        if (!cancelled) {
          setPlans(list);
          setIsError(false);
        }
      } catch {
        if (!cancelled) {
          setPlans([]);
          setIsError(true);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  return { plans, isLoading, isError };
}

interface SubscriptionPlansStats {
  total_subscribers: number;
  monthly_recurring_revenue: number;
  total_plans_count: number;
  active_plans_count: number;
}

export function useSubscriptionPlansStats() {
  const [stats, setStats] = useState<SubscriptionPlansStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch("/api/analyst/plans", {
          credentials: "same-origin",
          cache: "no-store",
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        const list: SubscriptionPlan[] = Array.isArray(json.plans)
          ? json.plans
          : Array.isArray(json.data)
            ? json.data
            : Array.isArray(json)
              ? json
              : [];

        const totalSubscribers = list.reduce((sum, p) => sum + (p.subscribers_count ?? 0), 0);

        const mrr = list
          .filter((p) => p.status === "ACTIVE")
          .reduce((sum, p) => {
            const monthlyPrice =
              p.billing_cycle === "YEAR"
                ? p.price / 12
                : p.billing_cycle === "QUARTER"
                  ? p.price / 3
                  : p.billing_cycle === "WEEK"
                    ? p.price * 4
                    : p.price;
            return sum + monthlyPrice * (p.subscribers_count ?? 0);
          }, 0);

        if (!cancelled) {
          setStats({
            total_subscribers: totalSubscribers,
            monthly_recurring_revenue: Math.round(mrr),
            total_plans_count: list.length,
            active_plans_count: list.filter((p) => p.status === "ACTIVE").length,
          });
          setIsError(false);
        }
      } catch {
        if (!cancelled) {
          setStats(null);
          setIsError(true);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  return { stats, isLoading, isError };
}
