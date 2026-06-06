import useSWR from "swr";
import { swrFetcher } from "../api";
import type { AnalystProfile, DashboardMetrics, LiveTradesStats } from "../types";

/**
 * Fetches the KPI metrics displayed on the dashboard overview cards.
 *
 * Backend endpoint: GET /analytics/dashboard/metrics
 * Returns: DashboardMetrics object with active_trades, total_subscribers,
 *          win_rate, and monthly_revenue.
 */
export function useDashboardMetrics() {
  const { data, error, isLoading, mutate } = useSWR<DashboardMetrics>(
    "/analytics/dashboard/metrics",
    swrFetcher,
    {
      refreshInterval: 60_000, // Refresh every minute
      revalidateOnFocus: true,
    }
  );

  return {
    metrics: data ?? null,
    isLoading,
    isError: !!error,
    error,
    mutate,
  };
}

/**
 * Fetches the currently authenticated analyst's profile.
 * Used in the sidebar (name, avatar, SEBI badge) and settings page.
 *
 * Backend endpoint: GET /users/me
 */
export function useAnalystProfile() {
  const { data, error, isLoading, mutate } = useSWR<AnalystProfile>("/users/me", swrFetcher, {
    // Profile rarely changes — don't revalidate on every focus
    revalidateOnFocus: false,
  });

  return {
    profile: data ?? null,
    isLoading,
    isError: !!error,
    error,
    mutate,
  };
}

/**
 * Fetches the aggregated stats shown in the Live Trades page stat strip.
 *
 * Backend endpoint: GET /analytics/live-trades/stats
 * Returns: LiveTradesStats with total_active, avg_win_rate_monthly,
 *          active_subscribers, and live_viewers counts.
 */
export function useLiveTradesStats() {
  const { data, error, isLoading } = useSWR<LiveTradesStats>(
    "/analytics/live-trades/stats",
    swrFetcher,
    {
      refreshInterval: 30_000,
      revalidateOnFocus: true,
    }
  );

  return {
    stats: data ?? null,
    isLoading,
    isError: !!error,
    error,
  };
}
