export type TradeDirection = "LONG" | "SHORT" | "BUY" | "SELL";
export type PlanBillingCycle = "WEEK" | "MONTH" | "QUARTER" | "YEAR";
export type PlanStatus = "ACTIVE" | "INACTIVE";

export interface SubscriptionPlan {
  plan_id: string;
  name: string;
  price: number;
  billing_cycle: PlanBillingCycle;
  status: PlanStatus;
  subscribers_count: number;
}

export interface Trade {
  trade_id: string;
  symbol: string;
  segment: string;
  segment_label?: string;
  trade_type?: "SIMPLE" | "PAIR";
  trade_subtype?: "INTRADAY" | "SWING";
  batch?: string;
  expiry?: string;
  direction: TradeDirection;
  entry_price: number;
  zone?: string;
  ltp?: number;
  ltp_change_pct?: number;
  target_price: number;
  target_2_price?: number;
  stop_loss_price: number;
  risk_pct?: number;
  reward_pct?: number;
  reward_2_pct?: number;
  pnl_pct?: number;
  pnl_per_unit?: number;
  pnl_unit?: string;
  note?: string;
  is_live_streaming?: boolean;
  live_viewers?: number;
  created_at?: string;
  updated_at?: string;
  status: "ACTIVE" | "CLOSED" | "PENDING" | "TARGET_HIT" | "SL_HIT";
}

export interface Subscriber {
  subscription_id: string;
  user_name: string;
  user_avatar?: string;
  plan_name: string;
  billing_cycle: "WEEK" | "MONTH" | "QUARTER" | "YEAR";
  subscribed_at: string;
}

export interface DashboardMetric {
  value: number;
  change_pct?: number;
  new_today?: number;
}

export interface DashboardMetrics {
  active_trades: DashboardMetric;
  total_subscribers: DashboardMetric;
  win_rate: DashboardMetric;
  monthly_revenue: DashboardMetric;
}

export interface AnalystProfile {
  name: string;
  avatar_url?: string;
  sebi_reg_no?: string;
  bio?: string;
  twitter_url?: string;
  linkedin_url?: string;
  email?: string;
  sebi_registration_number?: string;
}
