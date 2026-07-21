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
import { MetricDetail, RAMetricsResponse } from "@/hooks/useRAMetrics";

interface RadarPerformanceChartProps {
  metrics: RAMetricsResponse["metrics"];
}

interface ChartDataItem {
  subject: string;
  value: number;
  actual: string;
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
          <span className={`text-[11px] font-bold ${statusColor} capitalize`}>
            {data.status}
          </span>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed font-medium">{data.explanation}</p>
      </div>
    );
  }
  return null;
}

export function RadarPerformanceChart({ metrics }: RadarPerformanceChartProps) {
  // Score Normalizations (0 to 100 scale, clamped min 20 for clean visualization)
  const getTotalTradesScore = (val: number) => Math.max(20, Math.min(100, Math.round((val / 50) * 100)));
  const getClosedTradesScore = (val: number) => Math.max(20, Math.min(100, Math.round((val / 40) * 100)));
  const getWinRateScore = (val: number) => Math.max(20, Math.min(100, Math.round(val * 1.25)));
  const getAvgReturnScore = (val: number) => Math.max(20, Math.min(100, Math.round(50 + val * 10)));
  const getAvgHoldingScore = (valInDays: number) => Math.max(20, Math.min(100, Math.round(50 + valInDays * 10)));

  const totalTrades = metrics.totalTrades ?? {
    name: "Total Trades",
    value: 0,
    formatted: "0",
    history: [],
    explanation: "Total trade ideas published.",
    status: "good",
  };

  const closedTrades = metrics.closedTrades ?? {
    name: "Closed Trades",
    value: 0,
    formatted: "0",
    history: [],
    explanation: "Total completed trade positions.",
    status: "good",
  };

  const winRate = metrics.winRate ?? {
    name: "Win Rate",
    value: 0,
    formatted: "0%",
    history: [],
    explanation: "Percentage of profitable closed trades.",
    status: "good",
  };

  const avgReturn = metrics.avgReturn ?? {
    name: "Avg Return",
    value: 0,
    formatted: "0%",
    history: [],
    explanation: "Average P&L per closed trade.",
    status: "good",
  };

  const avgHoldingPeriod = metrics.avgHoldingPeriod ?? {
    name: "Avg Holding Period",
    value: 1,
    formatted: "1 Day",
    history: [],
    explanation: "Sum of holding durations of all closed trades divided by number of closed trades.",
    status: "good",
  };

  const chartData: ChartDataItem[] = [
    {
      subject: "Total Trades",
      value: getTotalTradesScore(totalTrades.value),
      actual: totalTrades.formatted,
      explanation: totalTrades.explanation,
      status: totalTrades.status,
    },
    {
      subject: "Closed Trades",
      value: getClosedTradesScore(closedTrades.value),
      actual: closedTrades.formatted,
      explanation: closedTrades.explanation,
      status: closedTrades.status,
    },
    {
      subject: "Win Rate",
      value: getWinRateScore(winRate.value),
      actual: winRate.formatted,
      explanation: winRate.explanation,
      status: winRate.status,
    },
    {
      subject: "Avg Return",
      value: getAvgReturnScore(avgReturn.value),
      actual: avgReturn.formatted,
      explanation: avgReturn.explanation,
      status: avgReturn.status,
    },
    {
      subject: "Avg Holding Period",
      value: getAvgHoldingScore(avgHoldingPeriod.value),
      actual: avgHoldingPeriod.formatted,
      explanation: avgHoldingPeriod.explanation,
      status: avgHoldingPeriod.status,
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

          <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} axisLine={false} />

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
