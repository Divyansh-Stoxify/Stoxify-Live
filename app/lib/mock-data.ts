import type {
  AnalystProfile,
  DashboardMetrics,
  LiveTradesStats,
  Trade,
  Subscriber,
  SubscriptionPlan,
  SubscriptionPlansStats,
} from "./types";

// ─── Mock Profile ─────────────────────────────────────────────────────────────

export let MOCK_PROFILE: AnalystProfile = {
  user_id: "analyst_rohan_mehta",
  name: "Rohan Mehta",
  email: "rohan.mehta@stoxify.in",
  phone: "+91 98765 43210",
  avatar_url:
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200", // Smiling man with glasses headshot
  sebi_registration_number: "INH000008123",
  sebi_verified: true,
  user_type: "ANALYST",
  created_at: new Date().toISOString(),
  bio: "SEBI Registered Research Analyst with 10+ years of experience in Indian Equity and Derivatives markets. Specializing in price action trading, macro-economic analysis, and risk management.",
  twitter_url: "https://twitter.com/rohanmehtatrading",
  linkedin_url: "https://linkedin.com/in/rohanmehta",
};

export function updateMockProfile(data: Partial<AnalystProfile>): void {
  MOCK_PROFILE = { ...MOCK_PROFILE, ...data };
}

// ─── Mock Dashboard Metrics ───────────────────────────────────────────────────

export const MOCK_METRICS: DashboardMetrics = {
  active_trades: {
    value: 4,
    change_pct: 12.5,
    new_today: 1,
  },
  total_subscribers: {
    value: 1248,
    change_pct: 2.4,
  },
  win_rate: {
    value: 78.5,
    change_pct: 0.8,
  },
  monthly_revenue: {
    value: 142800,
    change_pct: 5.2,
  },
};

// ─── Mock Live Trades Stats ───────────────────────────────────────────────────

export const MOCK_LIVE_STATS: LiveTradesStats = {
  total_active: 4,
  avg_win_rate_monthly: 78.5,
  win_rate_change_pct: 2.4,
  active_subscribers: 1248,
  live_viewers: 342,
};

// ─── Mock Subscribers ─────────────────────────────────────────────────────────

export const MOCK_SUBSCRIBERS: Subscriber[] = [
  {
    subscription_id: "sub_1",
    user_id: "u_1",
    user_name: "Arjun Sharma",
    plan_name: "Premium",
    billing_cycle: "Monthly",
    status: "ACTIVE",
    subscribed_at: new Date(Date.now() - 3600_000 * 2).toISOString(),
  },
  {
    subscription_id: "sub_2",
    user_id: "u_2",
    user_name: "Priya Patel",
    plan_name: "Pro",
    billing_cycle: "Monthly",
    status: "ACTIVE",
    subscribed_at: new Date(Date.now() - 3600_000 * 5).toISOString(),
  },
  {
    subscription_id: "sub_3",
    user_id: "u_3",
    user_name: "Vikram Singh",
    plan_name: "Basic",
    billing_cycle: "Monthly",
    status: "ACTIVE",
    subscribed_at: new Date(Date.now() - 3600_000 * 24).toISOString(),
  },
  {
    subscription_id: "sub_4",
    user_id: "u_4",
    user_name: "Ananya Iyer",
    plan_name: "Premium",
    billing_cycle: "Monthly",
    status: "ACTIVE",
    subscribed_at: new Date(Date.now() - 3600_000 * 48).toISOString(),
  },
  {
    subscription_id: "sub_5",
    user_id: "u_5",
    user_name: "Kabir Mehta",
    plan_name: "Pro",
    billing_cycle: "Monthly",
    status: "ACTIVE",
    subscribed_at: new Date(Date.now() - 3600_000 * 72).toISOString(),
  },
];

// ─── Mock Trades ──────────────────────────────────────────────────────────────

export let MOCK_TRADES: Trade[] = [
  {
    trade_id: "trade_1",
    symbol: "RELIANCE",
    segment: "EQUITY",
    segment_label: "EQUITY",
    trade_type: "SIMPLE",
    trade_subtype: "SWING",
    direction: "LONG",
    entry_price: 2940.5,
    zone: "2935 - 2945",
    target_price: 3050.0,
    target_2_price: 3120.0,
    stop_loss_price: 2890.0,
    ltp: 2985.2,
    ltp_change_pct: 1.52,
    risk_pct: 1.7,
    reward_pct: 3.7,
    reward_2_pct: 6.1,
    pnl_pct: 1.52,
    pnl_per_unit: 44.7,
    pnl_unit: "share",
    status: "ACTIVE",
    note: "Breaking above major resistance. Keep holding with trailing SL.",
    is_live_streaming: true,
    live_viewers: 145,
    created_at: new Date(Date.now() - 3600_000 * 7).toISOString(), // 7 hours ago (approx 09:45 AM today)
    updated_at: new Date().toISOString(),
  },
  {
    trade_id: "trade_2",
    symbol: "BANKNIFTY 48000 CE",
    segment: "FNO",
    segment_label: "FNO - OPTIONS",
    trade_type: "SIMPLE",
    trade_subtype: "INTRADAY",
    direction: "BUY",
    entry_price: 320.0,
    target_price: 420.0,
    target_2_price: 500.0,
    stop_loss_price: 260.0,
    ltp: 295.5,
    ltp_change_pct: -7.65,
    risk_pct: 18.7, // (320 - 260) / 320 = 18.75%
    reward_pct: 31.25,
    reward_2_pct: 56.25,
    pnl_pct: -7.65,
    pnl_per_unit: -24.5,
    pnl_unit: "lot",
    status: "ACTIVE",
    note: "Market reacting to RBI commentary. Volatility expected, maintain strict SL.",
    is_live_streaming: true,
    live_viewers: 98,
    created_at: new Date(Date.now() - 3600_000 * 6.5).toISOString(), // 6.5 hours ago
    updated_at: new Date().toISOString(),
  },
  {
    trade_id: "trade_3",
    symbol: "HDFCBANK",
    segment: "EQUITY",
    segment_label: "EQUITY",
    trade_type: "SIMPLE",
    trade_subtype: "INTRADAY",
    direction: "SHORT",
    entry_price: 1425.0,
    zone: "1422 - 1428",
    target_price: 1390.0,
    target_2_price: 1375.0,
    stop_loss_price: 1440.0,
    ltp: 1412.3,
    ltp_change_pct: 0.89, // Short entry -> positive return as LTP drops
    risk_pct: 1.05,
    reward_pct: 2.4,
    reward_2_pct: 3.5,
    pnl_pct: 0.89,
    pnl_per_unit: 12.7,
    pnl_unit: "share",
    status: "ACTIVE",
    note: "Weak structure on 15m timeframe. Volume confirming the downward move.",
    is_live_streaming: true,
    live_viewers: 67,
    created_at: new Date(Date.now() - 3600_000 * 5.25).toISOString(), // 5.25 hours ago
    updated_at: new Date().toISOString(),
  },
  {
    trade_id: "trade_4",
    symbol: "INFY",
    segment: "EQUITY",
    segment_label: "EQUITY",
    trade_type: "SIMPLE",
    trade_subtype: "SWING",
    direction: "LONG",
    entry_price: 1650.0,
    target_price: 1750.0,
    target_2_price: 1820.0,
    stop_loss_price: 1590.0,
    ltp: 1652.1,
    ltp_change_pct: 0.12,
    risk_pct: 3.63,
    reward_pct: 6.06,
    reward_2_pct: 10.3,
    pnl_pct: 0.12,
    pnl_per_unit: 2.1,
    pnl_unit: "share",
    status: "ACTIVE",
    note: "Consolidating near entry point. IT sector looks strong overall.",
    is_live_streaming: true,
    live_viewers: 32,
    created_at: new Date(Date.now() - 86400_000 - 3600_000 * 2).toISOString(), // Yesterday 02:45 PM
    updated_at: new Date().toISOString(),
  },
];

export const MOCK_CLOSED_TRADES: Trade[] = [
  {
    trade_id: "trade_c1",
    symbol: "TCS",
    segment: "EQUITY",
    trade_type: "SIMPLE",
    direction: "LONG",
    entry_price: 3850.0,
    target_price: 4000.0,
    stop_loss_price: 3780.0,
    ltp: 4015.0,
    pnl_pct: 3.9,
    pnl_per_unit: 165.0,
    pnl_unit: "share",
    status: "TARGET_HIT",
    created_at: new Date(Date.now() - 86400_000 * 5).toISOString(),
    updated_at: new Date(Date.now() - 86400_000 * 3).toISOString(),
  },
  {
    trade_id: "trade_c2",
    symbol: "NIFTY 22000 PE",
    segment: "FNO",
    segment_label: "FNO - OPTIONS",
    trade_type: "SIMPLE",
    direction: "BUY",
    entry_price: 120.0,
    target_price: 200.0,
    stop_loss_price: 80.0,
    ltp: 80.0,
    pnl_pct: -33.33,
    pnl_per_unit: -40.0,
    pnl_unit: "lot",
    status: "SL_HIT",
    created_at: new Date(Date.now() - 86400_000 * 2).toISOString(),
    updated_at: new Date(Date.now() - 86400_000 * 1).toISOString(),
  },
];

// Helper to match API paths to mock data returns
export function getMockResponse(path: string): unknown {
  const cleanPath = path.split("?")[0];

  if (cleanPath === "/users/me") {
    return MOCK_PROFILE;
  }
  if (cleanPath === "/analytics/dashboard/metrics") {
    return MOCK_METRICS;
  }
  if (cleanPath === "/analytics/live-trades/stats") {
    return MOCK_LIVE_STATS;
  }
  if (cleanPath === "/subscriptions/analyst/subscribers") {
    return MOCK_SUBSCRIBERS;
  }
  if (cleanPath === "/subscriptions/analyst/plans") {
    return MOCK_PLANS;
  }
  if (cleanPath === "/subscriptions/analyst/plans/stats") {
    return getMockPlansStats();
  }
  if (cleanPath === "/trades/") {
    const params = new URLSearchParams(path.split("?")[1] || "");
    const status = params.get("status");
    if (status === "PENDING") {
      return { trades: [], total: 0 };
    }
    if (status === "CLOSED") {
      return { trades: MOCK_CLOSED_TRADES, total: MOCK_CLOSED_TRADES.length };
    }
    // Default Active/All
    return { trades: MOCK_TRADES, total: MOCK_TRADES.length };
  }

  throw new Error(`Mock endpoint not found: ${path}`);
}

export function addMockTrade(trade: Trade): void {
  MOCK_TRADES = [trade, ...MOCK_TRADES];
}

// ─── Mock Subscription Plans ───────────────────────────────────────────────────

export let MOCK_PLANS: SubscriptionPlan[] = [
  {
    plan_id: "plan_1",
    name: "Basic Monthly",
    billing_cycle: "MONTH",
    price: 2500,
    subscribers_count: 215,
    status: "ACTIVE",
    created_at: new Date(Date.now() - 86400_000 * 90).toISOString(),
  },
  {
    plan_id: "plan_2",
    name: "Quarterly Pro",
    billing_cycle: "QUARTER",
    price: 6500,
    subscribers_count: 85,
    status: "ACTIVE",
    created_at: new Date(Date.now() - 86400_000 * 90).toISOString(),
  },
  {
    plan_id: "plan_3",
    name: "Annual Premium",
    billing_cycle: "YEAR",
    price: 22000,
    subscribers_count: 42,
    status: "ACTIVE",
    created_at: new Date(Date.now() - 86400_000 * 90).toISOString(),
  },
  {
    plan_id: "plan_4",
    name: "Trial Weekly",
    billing_cycle: "WEEK",
    price: 999,
    subscribers_count: 0,
    status: "INACTIVE",
    created_at: new Date(Date.now() - 86400_000 * 90).toISOString(),
  },
];

export function getMockPlansStats(): SubscriptionPlansStats {
  const activePlans = MOCK_PLANS.filter((p) => p.status === "ACTIVE");
  const totalSubscribers = MOCK_PLANS.reduce((acc, p) => acc + p.subscribers_count, 0);

  // Calculate MRR
  let mrr = 0;

  // Check if default plans are active
  const isBasicActive = MOCK_PLANS.find((p) => p.name === "Basic Monthly")?.status === "ACTIVE";
  const isQuarterlyActive = MOCK_PLANS.find((p) => p.name === "Quarterly Pro")?.status === "ACTIVE";
  const isAnnualActive = MOCK_PLANS.find((p) => p.name === "Annual Premium")?.status === "ACTIVE";

  activePlans.forEach((plan) => {
    let monthlyPrice = plan.price;
    if (plan.billing_cycle === "QUARTER") {
      monthlyPrice = plan.price / 3;
    } else if (plan.billing_cycle === "YEAR") {
      monthlyPrice = plan.price / 12;
    } else if (plan.billing_cycle === "WEEK") {
      monthlyPrice = plan.price * 4;
    }
    mrr += Math.round(monthlyPrice * plan.subscribers_count);
  });

  return {
    total_subscribers: totalSubscribers,
    monthly_recurring_revenue: mrr,
    active_plans_count: activePlans.length,
    total_plans_count: MOCK_PLANS.length,
  };
}

export function updateMockPlanStatus(planId: string, status: "ACTIVE" | "INACTIVE"): void {
  MOCK_PLANS = MOCK_PLANS.map((plan) => (plan.plan_id === planId ? { ...plan, status } : plan));
}

export function createMockPlan(plan: Omit<SubscriptionPlan, "plan_id" | "created_at">): void {
  const newPlan: SubscriptionPlan = {
    ...plan,
    plan_id: `plan_${Date.now()}`,
    created_at: new Date().toISOString(),
  };
  MOCK_PLANS = [...MOCK_PLANS, newPlan];
}

export function updateMockPlan(
  planId: string,
  planData: Partial<Omit<SubscriptionPlan, "plan_id">>
): void {
  MOCK_PLANS = MOCK_PLANS.map((plan) =>
    plan.plan_id === planId ? { ...plan, ...planData } : plan
  );
}
