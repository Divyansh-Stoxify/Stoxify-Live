/**
 * Shared TypeScript interfaces for all Stoxify API responses.
 * Shaped to match the backend models documented in the backend walkthrough.
 * These interfaces are used by SWR hooks and page components throughout the dashboard.
 */

// ─── Auth ────────────────────────────────────────────────────────────────────

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  token_type: "Bearer";
  expires_in: number;
}

// ─── User / Analyst Profile ───────────────────────────────────────────────────

export interface AnalystProfile {
  user_id: string;
  name: string;
  email: string;
  phone: string;
  avatar_url?: string;
  sebi_registration_number: string;
  sebi_verified: boolean;
  user_type: "ANALYST";
  created_at: string;
  bio?: string;
  twitter_url?: string;
  linkedin_url?: string;
}

// ─── Trades ───────────────────────────────────────────────────────────────────

export type TradeDirection = "LONG" | "SHORT" | "BUY" | "SELL";
export type TradeSegment = "EQUITY" | "FNO" | "COMMODITY" | "CURRENCY";
export type TradeStatus = "ACTIVE" | "CLOSED" | "PENDING" | "TARGET_HIT" | "SL_HIT";
export type TradeType = "SIMPLE" | "PAIR";
export type TradeSubtype = "SWING" | "INTRADAY" | "POSITIONAL";

export interface Trade {
  trade_id: string;
  symbol: string;
  /** Short descriptive segment label e.g. "EQUITY" or "FNO - OPTIONS" */
  segment: TradeSegment;
  segment_label?: string; // e.g. "FNO - OPTIONS"
  expiry?: string; // For FNO trades e.g. "EXP 24 NOV"
  trade_type: TradeType;
  trade_subtype?: TradeSubtype; // SWING | INTRADAY | POSITIONAL
  direction: TradeDirection;
  entry_price: number;
  /** Optional support/resistance zone e.g. "2935 - 2945" */
  zone?: string;
  target_price: number; // First (primary) target
  target_2_price?: number; // Second target
  stop_loss_price: number;
  /** Current live market price */
  ltp?: number;
  /** LTP change from entry as percentage e.g. +1.52 */
  ltp_change_pct?: number;
  /** Risk % = (entry - SL) / entry */
  risk_pct?: number;
  /** Reward % to first target */
  reward_pct?: number;
  /** Reward % to second target */
  reward_2_pct?: number;
  /** Profit & loss as a percentage vs entry */
  pnl_pct?: number;
  /** Absolute PNL per unit (share or lot) */
  pnl_per_unit?: number;
  /** Unit label for PNL — "share" for equity, "lot" for F&O */
  pnl_unit?: "share" | "lot";
  status: TradeStatus;
  /** Analyst note/commentary on this trade */
  note?: string;
  /** Whether this trade is currently being streamed live */
  is_live_streaming?: boolean;
  /** Number of subscribers watching this live */
  live_viewers?: number;
  created_at: string;
  updated_at: string;
}

export interface TradesResponse {
  trades: Trade[];
  total: number;
  page: number;
  limit: number;
}

/** Aggregated stats shown at the top of the Live Trades page */
export interface LiveTradesStats {
  total_active: number;
  avg_win_rate_monthly: number;
  win_rate_change_pct: number;
  active_subscribers: number;
  live_viewers: number;
}

// ─── Subscribers ──────────────────────────────────────────────────────────────

export type PlanTier = "Basic" | "Pro" | "Premium";
export type BillingCycle = "Monthly" | "Yearly";
export type SubscriptionStatus = "ACTIVE" | "EXPIRED" | "CANCELLED";

export interface Subscriber {
  subscription_id: string;
  user_id: string;
  user_name: string;
  user_avatar?: string;
  plan_name: PlanTier;
  billing_cycle: BillingCycle;
  status: SubscriptionStatus;
  subscribed_at: string;
}

export interface SubscribersResponse {
  subscribers: Subscriber[];
  total: number;
  page: number;
  limit: number;
}

// ─── Subscription Plans ───────────────────────────────────────────────────────

export type PlanStatus = "ACTIVE" | "INACTIVE";
export type PlanBillingCycle = "WEEK" | "MONTH" | "QUARTER" | "YEAR";

export interface SubscriptionPlan {
  plan_id: string;
  name: string;
  billing_cycle: PlanBillingCycle;
  price: number;
  subscribers_count: number;
  status: PlanStatus;
  created_at: string;
}

export interface SubscriptionPlansStats {
  total_subscribers: number;
  monthly_recurring_revenue: number;
  active_plans_count: number;
  total_plans_count: number;
}

// ─── Dashboard Metrics (Overview KPI cards) ───────────────────────────────────

export interface DashboardMetrics {
  active_trades: {
    value: number;
    change_pct: number;
    new_today: number;
  };
  total_subscribers: {
    value: number;
    change_pct: number;
  };
  win_rate: {
    value: number; // Percentage e.g. 78.5
    change_pct: number;
  };
  monthly_revenue: {
    value: number; // In INR
    change_pct: number;
  };
}

// ─── API Error ────────────────────────────────────────────────────────────────

export interface ApiError {
  error: string;
  code: string;
  details?: Record<string, unknown>;
}
