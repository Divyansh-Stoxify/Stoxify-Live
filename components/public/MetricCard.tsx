"use client";

import React from "react";
import { ResponsiveContainer, LineChart, Line, YAxis } from "recharts";
import { Info } from "lucide-react";

interface MetricCardProps {
  name: string;
  value: string;
  explanation: string;
  status: "good" | "excellent" | "poor";
  history?: number[];
}

export function MetricCard({
  name,
  value,
  explanation,
  status,
  history = [],
}: MetricCardProps) {
  // Determine color theme based on status
  const isPositive = status === "good" || status === "excellent";
  const statusColor =
    status === "excellent"
      ? "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/50"
      : status === "good"
        ? "text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800/50"
        : "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800/50";

  const chartColor = status === "excellent" ? "#059669" : status === "good" ? "#16a34a" : "#dc2626";

  // Prepare chart data format
  const chartData = history.map((val, idx) => ({ id: idx, value: val }));

  return (
    <div className="relative group overflow-hidden bg-white/60 dark:bg-slate-900/60 backdrop-blur-md border border-slate-200 dark:border-slate-800/80 shadow-sm hover:shadow-md transition-all duration-300 rounded-xl p-5 flex flex-col justify-between">
      {/* Glow Effect on Hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-[var(--brand-mid)] to-transparent opacity-0 group-hover:opacity-5 transition-opacity duration-500 pointer-events-none" />

      <div>
        {/* Header (Metric Name & Badge) */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <span className="text-[13px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            {name}
          </span>
          <span
            className={`text-xs font-bold px-2 py-0.5 rounded-full border ${statusColor} capitalize tracking-wide`}
          >
            {status === "excellent" ? "Excellent" : isPositive ? "Healthy" : "Needs Attention"}
          </span>
        </div>

        {/* Value and Sparkline Row */}
        <div className="flex items-center justify-between gap-4 mb-4">
          <div className="flex flex-col">
            <span className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {value}
            </span>
          </div>

          {/* Sparkline Chart */}
          {chartData.length > 0 && (
            <div className="h-10 w-24 flex-shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 2, right: 2, left: 2, bottom: 2 }}>
                  <YAxis domain={["dataMin - 1", "dataMax + 1"]} hide />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke={chartColor}
                    strokeWidth={2}
                    dot={false}
                    animationDuration={600}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* Footer (Info & Explanation) */}
      <div className="mt-2 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex gap-2 items-start">
        <Info className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
          {explanation}
        </p>
      </div>
    </div>
  );
}
