import useSWR from "swr";
import { swrFetcher } from "../api";
import type { TradesResponse } from "../types";

/**
 * Fetches the analyst's active trades from the trade-service.
 *
 * Backend endpoint: GET /trades/?status=ACTIVE&limit=10
 * Returns: paginated list of Trade objects
 *
 * SWR refreshes on window focus — useful for live trade updates.
 */
export function useActiveTrades(limit = 10) {
  const { data, error, isLoading, mutate } = useSWR<TradesResponse>(
    `/trades/?status=ACTIVE&limit=${limit}`,
    swrFetcher,
    {
      refreshInterval: 30_000, // Poll every 30s for live price updates
      revalidateOnFocus: true,
    }
  );

  return {
    trades: data?.trades ?? [],
    total: data?.total ?? 0,
    isLoading,
    isError: !!error,
    error,
    mutate,
  };
}

/**
 * Fetches all trades (active + closed) for the analyst.
 * Used on the Live Trades page.
 */
export function useAllTrades(page = 1, limit = 20) {
  const { data, error, isLoading, mutate } = useSWR<TradesResponse>(
    `/trades/?page=${page}&limit=${limit}`,
    swrFetcher
  );

  return {
    trades: data?.trades ?? [],
    total: data?.total ?? 0,
    isLoading,
    isError: !!error,
    error,
    mutate,
  };
}

/**
 * Fetches pending (not yet published) trades.
 */
export function usePendingTrades() {
  const { data, error, isLoading, mutate } = useSWR<TradesResponse>(
    `/trades/?status=PENDING`,
    swrFetcher
  );

  return {
    trades: data?.trades ?? [],
    total: data?.total ?? 0,
    isLoading,
    isError: !!error,
    error,
    mutate,
  };
}

/**
 * Fetches closed/historical trades.
 */
export function useClosedTrades(page = 1, limit = 20) {
  const { data, error, isLoading, mutate } = useSWR<TradesResponse>(
    `/trades/?status=CLOSED&page=${page}&limit=${limit}`,
    swrFetcher
  );

  return {
    trades: data?.trades ?? [],
    total: data?.total ?? 0,
    isLoading,
    isError: !!error,
    error,
    mutate,
  };
}
