"use client";

import { useEffect, useState, useCallback } from "react";
import type {
  DashboardMetrics,
  Trade,
  Subscriber,
  AnalystProfile,
  SubscriptionPlan,
} from "@/lib/types/analyst";

// ─── Mock / Fallback Data ───────────────────────────────────────────────────
// Used as fallback when the real API is unavailable or returns errors.

const MOCK_METRICS: DashboardMetrics = {
  active_trades: { value: 12, change_pct: 8.5, new_today: 1 },
  total_subscribers: { value: 1450, change_pct: 12.3 },
  win_rate: { value: 68.5, change_pct: 2.1 },
  monthly_revenue: { value: 450000, change_pct: 15.2 },
};

const MOCK_SUBSCRIBERS: Subscriber[] = [
  {
    subscription_id: "sub_1",
    user_name: "Rahul Sharma",
    plan_name: "Premium",
    billing_cycle: "MONTH",
    subscribed_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
  },
  {
    subscription_id: "sub_2",
    user_name: "Priya Desai",
    plan_name: "Pro",
    billing_cycle: "YEAR",
    subscribed_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
  },
];

let MOCK_PROFILE: AnalystProfile = {
  name: "Arjun Singh",
  sebi_reg_no: "INH000000001",
};

let MOCK_PLANS: SubscriptionPlan[] = [
  {
    plan_id: "plan_1",
    name: "Premium",
    price: 2500,
    billing_cycle: "MONTH",
    status: "ACTIVE",
    subscribers_count: 1200,
  },
  {
    plan_id: "plan_2",
    name: "Pro",
    price: 25000,
    billing_cycle: "YEAR",
    status: "ACTIVE",
    subscribers_count: 250,
  },
];

// ─── Helpers ────────────────────────────────────────────────────────────────

async function fetchJSON<T>(url: string, fallback: T): Promise<{ data: T; fromApi: boolean }> {
  try {
    const res = await fetch(url, {
      credentials: "same-origin",
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    return { data: json as T, fromApi: true };
  } catch {
    return { data: fallback, fromApi: false };
  }
}

// ─── Hooks ──────────────────────────────────────────────────────────────────

export function useDashboardMetrics() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isError] = useState(false);

  useEffect(() => {
    // Metrics are computed from trades — for now use mock.
    // Will be replaced with a dedicated analytics endpoint.
    const timer = setTimeout(() => {
      setMetrics(MOCK_METRICS);
      setIsLoading(false);
    }, 600);
    return () => clearTimeout(timer);
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
      // The backend returns { trades: [...], total, page, limit }
      const tradeList = json.trades ?? json.data ?? json;
      setTrades(Array.isArray(tradeList) ? tradeList.slice(0, limit) : []);
      setIsError(false);
    } catch {
      // Fallback: empty (no mock trades — real data should come from API)
      setTrades([]);
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
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
    // Will be replaced with a real analytics endpoint
    const timer = setTimeout(() => {
      setStats({
        total_active: 12,
        avg_win_rate_monthly: 68.5,
        win_rate_change_pct: 2.1,
        active_subscribers: 1450,
        live_viewers: 342,
      });
      setIsLoading(false);
    }, 400);
    return () => clearTimeout(timer);
  }, []);

  return { stats, isLoading };
}

export function useRecentSubscribers(limit: number = 5) {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isError] = useState(false);

  useEffect(() => {
    // Will be replaced with real subscriber API
    const timer = setTimeout(() => {
      setSubscribers(MOCK_SUBSCRIBERS.slice(0, limit));
      setIsLoading(false);
    }, 700);
    return () => clearTimeout(timer);
  }, [limit]);

  return { subscribers, isLoading, isError };
}

export function useAnalystProfile() {
  const [profile, setProfile] = useState<AnalystProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    const { data } = await fetchJSON<AnalystProfile>("/api/analyst/profile", MOCK_PROFILE);
    setProfile(data);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  return { profile, isLoading, mutate: load };
}

export function updateMockProfile(profileData: Partial<AnalystProfile>) {
  MOCK_PROFILE = { ...MOCK_PROFILE, ...profileData };
}

export function useSubscriptionPlans() {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await fetchJSON<SubscriptionPlan[]>("/api/analyst/plans", MOCK_PLANS);
      setPlans(Array.isArray(data) ? data : MOCK_PLANS);
      setIsLoading(false);
    })();
  }, []);

  return { plans, isLoading };
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

  useEffect(() => {
    // Will be replaced with a real analytics endpoint
    const timer = setTimeout(() => {
      setStats({
        total_subscribers: 1450,
        monthly_recurring_revenue: 450000,
        total_plans_count: MOCK_PLANS.length,
        active_plans_count: MOCK_PLANS.filter((p) => p.status === "ACTIVE").length,
      });
      setIsLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  return { stats, isLoading };
}

export function updateMockPlanStatus(planId: string, status: "ACTIVE" | "INACTIVE") {
  MOCK_PLANS = MOCK_PLANS.map((p) => (p.plan_id === planId ? { ...p, status } : p));
}
