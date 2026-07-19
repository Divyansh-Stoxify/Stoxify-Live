"use client";

import useSWR from "swr";

export interface MetricDetail {
  name: string;
  value: number;
  formatted: string;
  history: number[];
  benchmark: string;
  explanation: string;
  status: "good" | "excellent" | "poor";
}

export interface RAMetricsResponse {
  username: string;
  name: string;
  lastUpdated: string;
  metrics: {
    cagr: MetricDetail;
    maxDrawdown: MetricDetail;
    profitFactor: MetricDetail;
    rrr: MetricDetail;
    winRate: MetricDetail;
  };
}

const fetcher = async (url: string) => {
  const res = await fetch(url, {
    credentials: "same-origin",
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || "Failed to fetch metrics");
  }
  return res.json() as Promise<RAMetricsResponse>;
};

export function useRAMetrics(username: string) {
  const { data, error, isLoading, mutate } = useSWR<RAMetricsResponse>(
    username ? `/api/public/analysts/${username}/metrics` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 10000, // 10 seconds deduplication
    }
  );

  return {
    metrics: data,
    isLoading,
    isError: !!error,
    refetch: mutate,
  };
}
