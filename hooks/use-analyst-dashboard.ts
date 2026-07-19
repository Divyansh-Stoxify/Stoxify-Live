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

  const fetchMetrics = useCallback(async () => {
    setIsLoading(true);
    try {
      // Fetch active trades count, batches, and active subscribers in parallel
      const [tradesRes, plansRes, subscribersRes] = await Promise.all([
        fetch("/api/analyst/trades?status=LIVE&limit=100", {
          credentials: "same-origin",
          cache: "no-store",
        }),
        fetch("/api/analyst/plans", {
          credentials: "same-origin",
          cache: "no-store",
        }),
        fetch("/api/analyst/subscribers?status=ACTIVE&limit=1000", {
          credentials: "same-origin",
          cache: "no-store",
        }),
      ]);

      const tradesJson = tradesRes.ok ? await tradesRes.json().catch(() => ({})) : {};
      const plansJson = plansRes.ok ? await plansRes.json().catch(() => ({})) : {};
      const subsJson = subscribersRes.ok ? await subscribersRes.json().catch(() => ({})) : {};

      // Normalise trade list
      const tradeList: Trade[] = Array.isArray(tradesJson.trades)
        ? tradesJson.trades
        : Array.isArray(tradesJson.data)
          ? tradesJson.data
          : Array.isArray(tradesJson)
            ? tradesJson
            : [];

      // Normalise active subscriptions
      const activeSubscriptions = Array.isArray(subsJson.subscriptions)
        ? subsJson.subscriptions
        : Array.isArray(subsJson.data)
          ? subsJson.data
          : Array.isArray(subsJson)
            ? subsJson
            : [];

      // Normalise plans list and enrich with status & subscribers_count
      const planList: SubscriptionPlan[] = (
        Array.isArray(plansJson.plans)
          ? plansJson.plans
          : Array.isArray(plansJson.data)
            ? plansJson.data
            : Array.isArray(plansJson)
              ? plansJson
              : []
      ).map((p: any) => {
        const planSubscribers = activeSubscriptions.filter((s: any) => s.plan_id === p.plan_id);
        return {
          ...p,
          status: p.status || (p.is_active ? "ACTIVE" : "INACTIVE"),
          subscribers_count: planSubscribers.length,
        };
      });

      // Derive total subscriber count from plan subscriber counts
      const totalSubscribers = planList.reduce((sum, p) => sum + (p.subscribers_count ?? 0), 0);

      // Derive revenue: sum of actual amounts paid by active subscribers on active plans
      const collectedRevenue = activeSubscriptions.reduce((sum: number, sub: any) => {
        const plan = planList.find((p) => p.plan_id === sub.plan_id);
        if (plan && plan.status !== "ACTIVE") return sum;

        return sum + (sub.amount || 0);
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

      setMetrics({
        active_trades: { value: tradeList.length, change_pct: 0, new_today: 0 },
        total_subscribers: { value: totalSubscribers, change_pct: 0 },
        total_batches: { value: planList.length, change_pct: 0 },
        monthly_revenue: { value: Math.round(collectedRevenue), change_pct: 0 },
      });
      setIsError(false);
    } catch {
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchMetrics();
  }, [fetchMetrics]);

  return { metrics, isLoading, isError, refetch: fetchMetrics };
}

export function useActiveTrades(limit: number = 5) {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);

  const fetchTrades = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/analyst/trades?status=LIVE&limit=${limit}`, {
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

  const removeTradeLocally = useCallback((tradeId: string) => {
    setTrades((prev) => prev.filter((t) => t.trade_id !== tradeId));
  }, []);

  return { trades, isLoading, isError, refetch: fetchTrades, removeTradeLocally };
}

export function useClosedTrades() {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchTrades = useCallback(async () => {
    setIsLoading(true);
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
  }, []);

  useEffect(() => {
    /* eslint-disable-next-line react-hooks/set-state-in-effect */
    void fetchTrades();
  }, [fetchTrades]);

  return { trades, isLoading, refetch: fetchTrades };
}

interface LiveTradesStats {
  total_active: number;
  win_rate_monthly: number;
  win_rate_change_pct: number;
  /** True only when the previous month had closed trades to compare against. */
  has_win_rate_comparison: boolean;
  active_subscribers: number;
}

export function useLiveTradesStats() {
  const [stats, setStats] = useState<LiveTradesStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const [tradesRes, closedRes, subscribersRes] = await Promise.all([
          fetch("/api/analyst/trades?status=LIVE&limit=100", {
            credentials: "same-origin",
            cache: "no-store",
          }),
          fetch("/api/analyst/trades?status=CLOSED&limit=100", {
            credentials: "same-origin",
            cache: "no-store",
          }),
          fetch("/api/analyst/subscribers?status=ACTIVE&limit=1000", {
            credentials: "same-origin",
            cache: "no-store",
          }),
        ]);

        if (cancelled) return;

        const tradesJson = tradesRes.ok ? await tradesRes.json().catch(() => ({})) : {};
        const closedJson = closedRes.ok ? await closedRes.json().catch(() => ({})) : {};
        const subsJson = subscribersRes.ok ? await subscribersRes.json().catch(() => ({})) : {};

        const tradeList: Trade[] = Array.isArray(tradesJson.trades)
          ? tradesJson.trades
          : Array.isArray(tradesJson.data)
            ? tradesJson.data
            : Array.isArray(tradesJson)
              ? tradesJson
              : [];

        const activeSubscriptions = Array.isArray(subsJson.subscriptions)
          ? subsJson.subscriptions
          : Array.isArray(subsJson.data)
            ? subsJson.data
            : Array.isArray(subsJson)
              ? subsJson
              : [];

        const closedList: Trade[] = Array.isArray(closedJson.trades)
          ? closedJson.trades
          : Array.isArray(closedJson.data)
            ? closedJson.data
            : Array.isArray(closedJson)
              ? closedJson
              : [];

        // Active Subscribers = unique people. A subscriber on multiple batches
        // must count once, so dedupe on user_id (falling back to subscription_id
        // for legacy rows that don't carry a user_id).
        const uniqueSubscribers = new Set(
          activeSubscriptions.map((s: any) => s.user_id ?? s.subscription_id).filter(Boolean)
        ).size;

        // Win rate for the *current calendar month*, with a real month-over-month
        // delta. A closed trade counts as a win if it hit target or booked a
        // positive P&L; trades are bucketed by when they closed (exit_timestamp,
        // falling back to updated_at/created_at).
        const isWin = (t: Trade) =>
          t.status === "TARGET_HIT" || (t.pnl_pct !== undefined && t.pnl_pct > 0);
        const closedMonth = (t: Trade): number | null => {
          const iso = t.exit_timestamp ?? t.updated_at ?? t.created_at;
          if (!iso) return null;
          const d = new Date(iso);
          return isNaN(d.getTime()) ? null : d.getFullYear() * 12 + d.getMonth();
        };
        const winRateOf = (list: Trade[]) =>
          list.length > 0 ? Math.round((list.filter(isWin).length / list.length) * 1000) / 10 : 0;

        const nowMonth = new Date().getFullYear() * 12 + new Date().getMonth();
        const thisMonthClosed = closedList.filter((t) => closedMonth(t) === nowMonth);
        const lastMonthClosed = closedList.filter((t) => closedMonth(t) === nowMonth - 1);
        const thisRate = winRateOf(thisMonthClosed);
        const lastRate = winRateOf(lastMonthClosed);

        if (!cancelled) {
          setStats({
            total_active: tradeList.length,
            win_rate_monthly: thisRate,
            win_rate_change_pct: Math.round((thisRate - lastRate) * 10) / 10,
            has_win_rate_comparison: lastMonthClosed.length > 0,
            active_subscribers: uniqueSubscribers,
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

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const [plansRes, subscribersRes] = await Promise.all([
        fetch("/api/analyst/plans", {
          credentials: "same-origin",
          cache: "no-store",
        }),
        fetch("/api/analyst/subscribers?status=ACTIVE&limit=1000", {
          credentials: "same-origin",
          cache: "no-store",
        }),
      ]);

      if (!plansRes.ok) throw new Error(`HTTP ${plansRes.status}`);

      const plansJson = await plansRes.json();
      const subsJson = subscribersRes.ok ? await subscribersRes.json().catch(() => ({})) : {};

      const activeSubscriptions = Array.isArray(subsJson.subscriptions)
        ? subsJson.subscriptions
        : Array.isArray(subsJson.data)
          ? subsJson.data
          : Array.isArray(subsJson)
            ? subsJson
            : [];

      const list: SubscriptionPlan[] = (
        Array.isArray(plansJson.plans)
          ? plansJson.plans
          : Array.isArray(plansJson.data)
            ? plansJson.data
            : Array.isArray(plansJson)
              ? plansJson
              : []
      ).map((p: any) => {
        const planSubscribers = activeSubscriptions.filter((s: any) => s.plan_id === p.plan_id);

        const collectedRevenue = planSubscribers.reduce(
          (sum: number, sub: any) => sum + (sub.amount || 0),
          0
        );

        return {
          ...p,
          status: p.status || (p.is_active ? "ACTIVE" : "INACTIVE"),
          subscribers_count: planSubscribers.length,
          est_monthly_revenue: Math.round(collectedRevenue),
        };
      });

      setPlans(list);
      setIsError(false);
    } catch {
      setPlans([]);
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    /* eslint-disable-next-line react-hooks/set-state-in-effect */
    void load();
  }, [load]);

  return { plans, isLoading, isError, refetch: load };
}

interface SubscriptionPlansStats {
  total_subscribers: number;
  monthly_recurring_revenue: number;
  total_plans_count: number;
  active_plans_count: number;
}

interface DashboardSubscription {
  plan_id: string;
  amount?: number;
}

interface RawPlan {
  plan_id: string;
  is_active?: boolean;
  status?: PlanStatus;
}

export function useSubscriptionPlansStats() {
  const [stats, setStats] = useState<SubscriptionPlansStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const [plansRes, subscribersRes] = await Promise.all([
        fetch("/api/analyst/plans", {
          credentials: "same-origin",
          cache: "no-store",
        }),
        fetch("/api/analyst/subscribers?status=ACTIVE&limit=1000", {
          credentials: "same-origin",
          cache: "no-store",
        }),
      ]);

      if (!plansRes.ok) throw new Error(`HTTP ${plansRes.status}`);

      const plansJson = await plansRes.json();
      const subsJson = subscribersRes.ok ? await subscribersRes.json().catch(() => ({})) : {};

      const activeSubscriptions = (
        Array.isArray(subsJson.subscriptions)
          ? subsJson.subscriptions
          : Array.isArray(subsJson.data)
            ? subsJson.data
            : Array.isArray(subsJson)
              ? subsJson
              : []
      ) as DashboardSubscription[];

      const list: SubscriptionPlan[] = (
        Array.isArray(plansJson.plans)
          ? plansJson.plans
          : Array.isArray(plansJson.data)
            ? plansJson.data
            : Array.isArray(plansJson)
              ? plansJson
              : []
      ).map((p: RawPlan) => {
        const planSubscribers = activeSubscriptions.filter((s) => s.plan_id === p.plan_id);
        return {
          ...(p as unknown as SubscriptionPlan),
          status: p.status || (p.is_active ? "ACTIVE" : "INACTIVE"),
          subscribers_count: planSubscribers.length,
        };
      });

      const totalSubscribers = list.reduce((sum, p) => sum + (p.subscribers_count ?? 0), 0);

      const collectedRevenue = activeSubscriptions.reduce((sum: number, sub) => {
        // Only count revenue from subscriptions belonging to ACTIVE plans (kept consistent with original)
        const plan = list.find((p) => p.plan_id === sub.plan_id);
        if (plan && plan.status !== "ACTIVE") return sum;

        return sum + (sub.amount || 0);
      }, 0);

      setStats({
        total_subscribers: totalSubscribers,
        monthly_recurring_revenue: Math.round(collectedRevenue),
        total_plans_count: list.length,
        active_plans_count: list.filter((p) => p.status === "ACTIVE").length,
      });
      setIsError(false);
    } catch {
      setStats(null);
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    /* eslint-disable-next-line react-hooks/set-state-in-effect */
    void load();
  }, [load]);

  return { stats, isLoading, isError, refetch: load };
}

export interface Coupon {
  coupon_id: string;
  analyst_id: string;
  code: string;
  type: "PERCENTAGE" | "FLAT";
  discount_value: number;
  plan_ids: string[];
  user_ids?: string[];
  availability: "EVERYONE" | "NEW_USER" | "EXISTING_USER" | "SPECIFIC";
  quantity_total: number | null;
  quantity_used: number;
  valid_from?: string;
  valid_to?: string;
  is_case_insensitive: boolean;
  is_active: boolean;
  created_at: string;
}

export function useAnalystCoupons(planId?: string) {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const url = planId
        ? `/api/analyst/plans/coupons?plan_id=${planId}`
        : "/api/analyst/plans/coupons";
      const res = await fetch(url, {
        credentials: "same-origin",
        cache: "no-store",
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setCoupons(Array.isArray(json) ? json : (json.data ?? []));
      setIsError(false);
    } catch {
      setCoupons([]);
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  }, [planId]);

  useEffect(() => {
    /* eslint-disable-next-line react-hooks/set-state-in-effect */
    void load();
  }, [load]);

  return { coupons, isLoading, isError, refetch: load };
}
