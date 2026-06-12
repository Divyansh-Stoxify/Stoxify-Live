"use client";

import { useEffect, useState } from "react";
import type { DashboardMetrics, Trade, Subscriber, AnalystProfile, SubscriptionPlan } from "@/lib/types/analyst";

// ─── Mock Data ──────────────────────────────────────────────────────────────

const MOCK_METRICS: DashboardMetrics = {
  active_trades: { value: 12, change_pct: 8.5, new_today: 1 },
  total_subscribers: { value: 1450, change_pct: 12.3 },
  win_rate: { value: 68.5, change_pct: 2.1 },
  monthly_revenue: { value: 450000, change_pct: 15.2 },
};

const MOCK_TRADES: Trade[] = [
  {
    trade_id: "tr_1",
    symbol: "NIFTY",
    segment: "Options",
    expiry: "25 May 2026",
    direction: "LONG",
    entry_price: 22450,
    ltp: 22500,
    target_price: 22600,
    stop_loss_price: 22400,
    pnl_pct: 0.22,
    status: "ACTIVE",
  },
  {
    trade_id: "tr_2",
    symbol: "RELIANCE",
    segment: "Equity",
    direction: "SHORT",
    entry_price: 2950,
    ltp: 2930,
    target_price: 2800,
    stop_loss_price: 3000,
    pnl_pct: 0.68,
    status: "ACTIVE",
  },
];

const MOCK_SUBSCRIBERS: Subscriber[] = [
  {
    subscription_id: "sub_1",
    user_name: "Rahul Sharma",
    plan_name: "Premium",
    billing_cycle: "MONTH",
    subscribed_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 mins ago
  },
  {
    subscription_id: "sub_2",
    user_name: "Priya Desai",
    plan_name: "Pro",
    billing_cycle: "YEAR",
    subscribed_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
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

// ─── Hooks ──────────────────────────────────────────────────────────────────

export function useDashboardMetrics() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    // Simulate API fetch
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

  useEffect(() => {
    const timer = setTimeout(() => {
      setTrades(MOCK_TRADES.slice(0, limit));
      setIsLoading(false);
    }, 800);
    return () => clearTimeout(timer);
  }, [limit]);

  return { trades, isLoading, isError };
}

export function usePendingTrades() {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setTrades([]);
      setIsLoading(false);
    }, 400);
    return () => clearTimeout(timer);
  }, []);

  return { trades, isLoading };
}

export function useClosedTrades() {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setTrades([]);
      setIsLoading(false);
    }, 400);
    return () => clearTimeout(timer);
  }, []);

  return { trades, isLoading };
}

export function useLiveTradesStats() {
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
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
  const [isError, setIsError] = useState(false);

  useEffect(() => {
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

  useEffect(() => {
    const timer = setTimeout(() => {
      setProfile(MOCK_PROFILE);
      setIsLoading(false);
    }, 400);
    return () => clearTimeout(timer);
  }, []);

  return { profile, isLoading, mutate: () => {} };
}

export function updateMockProfile(profileData: Partial<AnalystProfile>) {
  MOCK_PROFILE = { ...MOCK_PROFILE, ...profileData };
}

export function useSubscriptionPlans() {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setPlans(MOCK_PLANS);
      setIsLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  return { plans, isLoading };
}

export function useSubscriptionPlansStats() {
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
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
