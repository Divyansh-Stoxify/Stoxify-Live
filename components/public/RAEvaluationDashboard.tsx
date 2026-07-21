"use client";

import React from "react";
import { TrendingUp, AlertCircle, RotateCcw } from "lucide-react";
import { useRAMetrics, RAMetricsResponse } from "@/hooks/useRAMetrics";
import { MetricCard } from "./MetricCard";
import { RadarPerformanceChart } from "./RadarPerformanceChart";

interface RAEvaluationDashboardProps {
  username: string;
  customMetrics?: RAMetricsResponse["metrics"];
}

// ─── Loading Skeleton Component ──────────────────────────────────────────────
export function RAEvaluationDashboardSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      {/* Radar Map Container Skeleton */}
      <div className="bg-white/40 dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 min-h-[380px]">
        <div className="space-y-3 w-full md:w-1/3">
          <div className="h-6 w-3/4 bg-slate-200 dark:bg-slate-800 rounded-lg" />
          <div className="h-4 w-full bg-slate-200 dark:bg-slate-800 rounded-lg" />
          <div className="h-4 w-2/3 bg-slate-200 dark:bg-slate-800 rounded-lg" />
        </div>
        <div className="h-64 w-64 rounded-full bg-slate-200 dark:bg-slate-800/60" />
      </div>

      {/* Metric Cards Skeleton Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="h-44 bg-white/40 dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800/80 rounded-xl p-5"
          />
        ))}
      </div>
    </div>
  );
}

// ─── Main Evaluation Dashboard Component ──────────────────────────────────────
export function RAEvaluationDashboard({ username, customMetrics }: RAEvaluationDashboardProps) {
  const { metrics: apiMetrics, isLoading, isError, refetch } = useRAMetrics(
    customMetrics ? "" : username
  );

  if (!customMetrics && isLoading) {
    return <RAEvaluationDashboardSkeleton />;
  }

  if (!customMetrics && (isError || !apiMetrics)) {
    return (
      <div className="bg-red-50/50 dark:bg-red-950/10 border border-red-200/60 dark:border-red-900/40 rounded-2xl p-8 text-center max-w-xl mx-auto flex flex-col items-center gap-4">
        <AlertCircle className="h-10 w-10 text-red-600 dark:text-red-400" />
        <h3 className="text-lg font-bold text-slate-900 dark:text-white">
          Failed to load evaluation metrics
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm leading-relaxed">
          There was an error retrieving performance records for this research analyst. Please check
          your connection or try again.
        </p>
        <button
          onClick={() => void refetch()}
          className="flex items-center gap-2 px-4.5 py-2 text-xs font-bold text-white bg-slate-900 dark:bg-slate-100 dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-200 transition-colors rounded-lg shadow-sm"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Retry Fetch
        </button>
      </div>
    );
  }

  const activeMetrics = customMetrics ?? apiMetrics?.metrics;
  const name = apiMetrics?.name ?? "Analyst";

  if (!activeMetrics) return null;

  // Extract new metrics with safe fallbacks
  const totalTrades = activeMetrics.totalTrades ?? {
    name: "Total Trades",
    value: 0,
    formatted: "0",
    history: [],
    explanation: "Total trade ideas published.",
    status: "good",
  };

  const closedTrades = activeMetrics.closedTrades ?? {
    name: "Closed Trades",
    value: 0,
    formatted: "0",
    history: [],
    explanation: "Total completed trade positions.",
    status: "good",
  };

  const winRate = activeMetrics.winRate ?? {
    name: "Win Rate",
    value: 0,
    formatted: "0%",
    history: [],
    explanation: "Percentage of profitable closed trades.",
    status: "good",
  };

  const avgReturn = activeMetrics.avgReturn ?? {
    name: "Avg Return",
    value: 0,
    formatted: "0%",
    history: [],
    explanation: "Average P&L per closed trade.",
    status: "good",
  };

  const avgHoldingPeriod = activeMetrics.avgHoldingPeriod ?? {
    name: "Avg Holding Period",
    value: 1,
    formatted: "1 Day",
    history: [],
    explanation: "Sum of holding durations of all closed trades divided by number of closed trades.",
    status: "good",
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Radar Map & Chart Container */}
      <div className="bg-white dark:bg-slate-900/50 border border-slate-200/85 dark:border-slate-800/80 rounded-2xl shadow-sm overflow-hidden p-6 md:p-8">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-6">
          <div className="space-y-1">
            <h3 className="text-lg md:text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-[var(--brand)]" />
              Performance evaluation metrics
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
              Comprehensive evaluation of the analyst's total trades, closed trades, win rate, average return & holding period.
            </p>
          </div>

          {/* Custom Legend */}
          <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 px-3 py-1.5 rounded-lg text-xs font-semibold self-start">
            <span className="h-3.5 w-3.5 rounded-full bg-[var(--brand)] inline-block ring-2 ring-blue-100 dark:ring-blue-900/50" />
            <span className="text-slate-700 dark:text-slate-300">Current RA: {name}</span>
          </div>
        </div>

        {/* Recharts Radar Chart */}
        <RadarPerformanceChart metrics={activeMetrics} />
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
        <MetricCard
          name={totalTrades.name}
          value={totalTrades.formatted}
          explanation={totalTrades.explanation}
          status={totalTrades.status as any}
          history={totalTrades.history}
        />
        <MetricCard
          name={closedTrades.name}
          value={closedTrades.formatted}
          explanation={closedTrades.explanation}
          status={closedTrades.status as any}
          history={closedTrades.history}
        />
        <MetricCard
          name={winRate.name}
          value={winRate.formatted}
          explanation={winRate.explanation}
          status={winRate.status as any}
          history={winRate.history}
        />
        <MetricCard
          name={avgReturn.name}
          value={avgReturn.formatted}
          explanation={avgReturn.explanation}
          status={avgReturn.status as any}
          history={avgReturn.history}
        />
        <MetricCard
          name={avgHoldingPeriod.name}
          value={avgHoldingPeriod.formatted}
          explanation={avgHoldingPeriod.explanation}
          status={avgHoldingPeriod.status as any}
          history={avgHoldingPeriod.history}
        />
      </div>
    </div>
  );
}
