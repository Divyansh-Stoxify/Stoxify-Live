"use client";

import React from "react";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { MetricDetail } from "@/hooks/useRAMetrics";

interface RadarPerformanceChartProps {
  metrics: {
    cagr: MetricDetail;
    maxDrawdown: MetricDetail;
    profitFactor: MetricDetail;
    rrr: MetricDetail;
    winRate: MetricDetail;
  };
}

interface ChartDataItem {
  subject: string;
  value: number;
  actual: string;
  benchmark: string;
  explanation: string;
  status: string;
}

// Custom Tooltip Component
function CustomTooltip({ active, payload }: any) {
  if (active && payload && payload.length) {
    const data: ChartDataItem = payload[0].payload;
    const statusColor =
      data.status === "excellent"
        ? "text-emerald-500"
        : data.status === "good"
        ? "text-green-500"
        : "text-red-500";

    return (
      <div className="bg-slate-900/95 dark:bg-slate-950/95 backdrop-blur-md border border-slate-700/80 p-4 rounded-xl shadow-xl max-w-xs text-white">
        <h4 className="text-xs uppercase tracking-wider font-bold text-slate-400 mb-1">
          {data.subject}
        </h4>
        <div className="flex items-baseline gap-2 mb-2">
          <span className="text-2xl font-black">{data.actual}</span>
          <span className={`text-[11px] font-bold ${statusColor}`}>
            Benchmark: {data.benchmark}
          </span>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed font-medium">
          {data.explanation}
        </p>
      </div>
    );
  }
  return null;
}

export function RadarPerformanceChart({ metrics }: RadarPerformanceChartProps) {
  // 1. Normalization math
  const getCagrScore = (val: number) => Math.max(0, Math.min(100, ((val - 10) / 40) * 100)); // 10% to 50%
  const getMaxDdScore = (val: number) => Math.max(0, Math.min(100, ((25 - val) / 20) * 100)); // 5% to 25% (Inverse)
  const getPfScore = (val: number) => Math.max(0, Math.min(100, ((val - 1.0) / 2.0) * 100)); // 1.0 to 3.0
  const getRrrScore = (val: number) => Math.max(0, Math.min(100, ((val - 1.0) / 3.0) * 100)); // 1.0 to 4.0
  const getWinRateScore = (val: number) => Math.max(0, Math.min(100, ((val - 35) / 50) * 100)); // 35% to 85%

  const chartData: ChartDataItem[] = [
    {
      subject: "CAGR",
      value: getCagrScore(metrics.cagr.value),
      actual: metrics.cagr.formatted,
      benchmark: metrics.cagr.benchmark,
      explanation: metrics.cagr.explanation,
      status: metrics.cagr.status,
    },
    {
      subject: "Max Drawdown",
      value: getMaxDdScore(metrics.maxDrawdown.value),
      actual: metrics.maxDrawdown.formatted,
      benchmark: metrics.maxDrawdown.benchmark,
      explanation: metrics.maxDrawdown.explanation,
      status: metrics.maxDrawdown.status,
    },
    {
      subject: "Profit Factor",
      value: getPfScore(metrics.profitFactor.value),
      actual: metrics.profitFactor.formatted,
      benchmark: metrics.profitFactor.benchmark,
      explanation: metrics.profitFactor.explanation,
      status: metrics.profitFactor.status,
    },
    {
      subject: "Risk-Reward",
      value: getRrrScore(metrics.rrr.value),
      actual: metrics.rrr.formatted,
      benchmark: metrics.rrr.benchmark,
      explanation: metrics.rrr.explanation,
      status: metrics.rrr.status,
    },
    {
      subject: "Win Rate",
      value: getWinRateScore(metrics.winRate.value),
      actual: metrics.winRate.formatted,
      benchmark: metrics.winRate.benchmark,
      explanation: metrics.winRate.explanation,
      status: metrics.winRate.status,
    },
  ];

  return (
    <div className="w-full h-80 md:h-[380px] flex items-center justify-center">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={chartData}>
          {/* Subtle Grid and Radar Styling */}
          <PolarGrid stroke="#94a3b8" strokeDasharray="3 3" opacity={0.3} />
          
          <PolarAngleAxis
            dataKey="subject"
            tick={{
              fill: "currentColor",
              fontSize: 12,
              fontWeight: 700,
              className: "text-slate-600 dark:text-slate-400 font-sans tracking-wide",
            }}
          />
          
          <PolarRadiusAxis
            angle={90}
            domain={[0, 100]}
            tick={false}
            axisLine={false}
          />

          <Radar
            name="Current RA"
            dataKey="value"
            stroke="#1f7ae0"
            fill="#1f7ae0"
            fillOpacity={0.25}
            strokeWidth={2.5}
            animationDuration={800}
            activeDot={{ r: 6, stroke: "#ffffff", strokeWidth: 1.5 }}
          />

          <Tooltip content={<CustomTooltip />} cursor={false} />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
