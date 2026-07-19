"use client";

import React from "react";
import { useRAMetrics } from "@/hooks/useRAMetrics";
import { RadarPerformanceChart } from "./RadarPerformanceChart";
import { MetricCard } from "./MetricCard";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, RotateCcw, TrendingUp } from "lucide-react";

interface RAEvaluationDashboardProps {
  username: string;
}

// ─── Loading Skeleton Component ──────────────────────────────────────────────
export function RAEvaluationDashboardSkeleton() {
  return (
    <div className="space-y-8 animate-fade-in">
      {/* Chart Skeleton Container */}
      <div className="bg-white/60 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-6 shadow-sm flex flex-col items-center">
        <div className="w-full max-w-sm flex flex-col items-center gap-2 mb-6">
          <Skeleton className="h-6 w-48 rounded" />
          <Skeleton className="h-4 w-72 rounded" />
        </div>
        {/* Radar Map Circular Pulse */}
        <div className="relative h-64 w-64 rounded-full border border-dashed border-slate-200 dark:border-slate-800 flex items-center justify-center">
          <div className="h-48 w-48 rounded-full border border-dashed border-slate-200 dark:border-slate-800 flex items-center justify-center">
            <div className="h-32 w-32 rounded-full border border-dashed border-slate-200 dark:border-slate-800 flex items-center justify-center">
              <Skeleton className="h-12 w-12 rounded-full" />
            </div>
          </div>
          <Skeleton className="absolute top-4 left-1/2 -translate-x-1/2 h-4 w-12" />
          <Skeleton className="absolute bottom-4 left-1/2 -translate-x-1/2 h-4 w-12" />
          <Skeleton className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-12" />
          <Skeleton className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-12" />
        </div>
      </div>

      {/* KPI Cards Grid Skeletons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="bg-white/60 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 rounded-xl p-5 space-y-4"
          >
            <div className="flex justify-between items-center">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-8 w-24" />
              <Skeleton className="h-3.5 w-20" />
            </div>
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80">
              <Skeleton className="h-3 w-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main Evaluation Dashboard Component ──────────────────────────────────────
export function RAEvaluationDashboard({ username }: RAEvaluationDashboardProps) {
  const { metrics, isLoading, isError, refetch } = useRAMetrics(username);

  if (isLoading) {
    return <RAEvaluationDashboardSkeleton />;
  }

  if (isError || !metrics) {
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

  const { cagr, maxDrawdown, profitFactor, rrr, winRate } = metrics.metrics;

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
              Comprehensive evaluation of the analyst's risk-adjusted returns & hit rates against
              standard industry benchmarks.
            </p>
          </div>

          {/* Custom Legend */}
          <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 px-3 py-1.5 rounded-lg text-xs font-semibold self-start">
            <span className="h-3.5 w-3.5 rounded-full bg-[var(--brand)] inline-block ring-2 ring-blue-100 dark:ring-blue-900/50" />
            <span className="text-slate-700 dark:text-slate-300">Current RA: {metrics.name}</span>
          </div>
        </div>

        {/* Recharts Radar Chart */}
        <RadarPerformanceChart metrics={metrics.metrics} />
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
        <MetricCard
          name={cagr.name}
          value={cagr.formatted}
          benchmark={cagr.benchmark}
          explanation={cagr.explanation}
          status={cagr.status}
          history={cagr.history}
        />
        <MetricCard
          name={maxDrawdown.name}
          value={maxDrawdown.formatted}
          benchmark={maxDrawdown.benchmark}
          explanation={maxDrawdown.explanation}
          status={maxDrawdown.status}
          history={maxDrawdown.history}
        />
        <MetricCard
          name={profitFactor.name}
          value={profitFactor.formatted}
          benchmark={profitFactor.benchmark}
          explanation={profitFactor.explanation}
          status={profitFactor.status}
          history={profitFactor.history}
        />
        <MetricCard
          name={rrr.name}
          value={rrr.formatted}
          benchmark={rrr.benchmark}
          explanation={rrr.explanation}
          status={rrr.status}
          history={rrr.history}
        />
        <MetricCard
          name={winRate.name}
          value={winRate.formatted}
          benchmark={winRate.benchmark}
          explanation={winRate.explanation}
          status={winRate.status}
          history={winRate.history}
        />
      </div>
    </div>
  );
}
