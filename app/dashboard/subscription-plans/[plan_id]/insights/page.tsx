"use client";

import React, { use, useState, useEffect, useMemo } from "react";
import { Icon } from "@/components/stoxify-icon";
import type { Trade } from "@/lib/types/analyst";

// Formatting helpers
function formatPercentage(value: number): string {
  return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

export default function BatchInsightsPage({ params }: { params: Promise<{ plan_id: string }> }) {
  const { plan_id } = use(params);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchTrades() {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/analyst/trades?plan_id=${plan_id}&limit=1000`, {
          credentials: "same-origin",
          cache: "no-store",
        });
        if (res.ok) {
          const json = await res.json();
          const list = json.trades ?? json.data ?? json ?? [];
          setTrades(Array.isArray(list) ? list : []);
        }
      } catch (err) {
        console.error("Failed to fetch trades for insights", err);
      } finally {
        setIsLoading(false);
      }
    }
    void fetchTrades();
  }, [plan_id]);

  // Compute Insights Metrics
  const insights = useMemo(() => {
    const totalTrades = trades.length;
    
    // Status breakdown
    const activeTrades = trades.filter((t) => t.status === "ACTIVE" || t.status === "PENDING").length;
    const closedTrades = trades.filter((t) => t.status === "CLOSED" || t.status === "TARGET_HIT" || t.status === "SL_HIT");
    
    // Win Rate (Target Hit vs SL Hit). If status is explicitly TARGET_HIT / SL_HIT, use that.
    // Otherwise, we might guess from PnL. For simplicity, we assume TARGET_HIT and SL_HIT are used.
    let wins = 0;
    let losses = 0;
    
    closedTrades.forEach(t => {
      if (t.status === "TARGET_HIT" || (t.pnl_pct && t.pnl_pct > 0)) wins++;
      else if (t.status === "SL_HIT" || (t.pnl_pct && t.pnl_pct <= 0)) losses++;
    });

    const winRate = wins + losses > 0 ? (wins / (wins + losses)) * 100 : 0;
    
    // Segment breakdown
    const segmentCounts: Record<string, number> = {};
    trades.forEach((t) => {
      const seg = t.segment || "EQUITY";
      segmentCounts[seg] = (segmentCounts[seg] || 0) + 1;
    });

    // Best trade (highest pnl_pct)
    let bestTrade: Trade | null = null;
    trades.forEach((t) => {
      if (t.pnl_pct) {
        if (!bestTrade || t.pnl_pct > (bestTrade.pnl_pct || 0)) {
          bestTrade = t;
        }
      }
    });

    return {
      totalTrades,
      activeTrades,
      winRate,
      wins,
      losses,
      segmentCounts,
      bestTrade: bestTrade as Trade | null,
    };
  }, [trades]);

  return (
    <div className="flex-1 overflow-y-auto p-6 animate-[fadeIn_0.3s_ease-out]">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-[20px] font-black text-[var(--ink)] tracking-tight mb-1">
            Batch Insights
          </h1>
          <p className="text-[13px] text-[var(--muted-2)] font-medium">
            Performance metrics and analytics for trades published in this batch.
          </p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-28 rounded-xl bg-[var(--surface)] animate-pulse border border-[var(--line)]"></div>
            ))}
          </div>
        ) : (
          <>
            {/* Top KPI Cards */}
            <div className="grid grid-cols-4 gap-4">
              <div className="bg-white border border-[var(--line)] rounded-xl p-5 shadow-[0_2px_10px_rgba(0,0,0,0.02)] flex flex-col justify-center">
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-8 w-8 rounded-full bg-blue-50 flex items-center justify-center">
                    <Icon className="h-4 w-4 text-blue-500" name="barChart" />
                  </div>
                  <h3 className="text-[12px] font-bold text-[var(--muted)] uppercase tracking-wider">
                    Total Trades
                  </h3>
                </div>
                <div className="text-[24px] font-black text-[var(--ink)]">
                  {insights.totalTrades}
                </div>
              </div>

              <div className="bg-white border border-[var(--line)] rounded-xl p-5 shadow-[0_2px_10px_rgba(0,0,0,0.02)] flex flex-col justify-center">
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-8 w-8 rounded-full bg-emerald-50 flex items-center justify-center">
                    <Icon className="h-4 w-4 text-emerald-500" name="trendingUp" />
                  </div>
                  <h3 className="text-[12px] font-bold text-[var(--muted)] uppercase tracking-wider">
                    Win Rate
                  </h3>
                </div>
                <div className="text-[24px] font-black text-[var(--ink)]">
                  {insights.totalTrades > 0 ? `${insights.winRate.toFixed(1)}%` : "--"}
                </div>
              </div>

              <div className="bg-white border border-[var(--line)] rounded-xl p-5 shadow-[0_2px_10px_rgba(0,0,0,0.02)] flex flex-col justify-center">
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-8 w-8 rounded-full bg-amber-50 flex items-center justify-center">
                    <Icon className="h-4 w-4 text-amber-500" name="timer" />
                  </div>
                  <h3 className="text-[12px] font-bold text-[var(--muted)] uppercase tracking-wider">
                    Active Trades
                  </h3>
                </div>
                <div className="text-[24px] font-black text-[var(--ink)]">
                  {insights.activeTrades}
                </div>
              </div>

              <div className="bg-white border border-[var(--line)] rounded-xl p-5 shadow-[0_2px_10px_rgba(0,0,0,0.02)] flex flex-col justify-center">
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-8 w-8 rounded-full bg-purple-50 flex items-center justify-center">
                    <Icon className="h-4 w-4 text-purple-500" name="activity" />
                  </div>
                  <h3 className="text-[12px] font-bold text-[var(--muted)] uppercase tracking-wider">
                    Segments Used
                  </h3>
                </div>
                <div className="text-[24px] font-black text-[var(--ink)]">
                  {Object.keys(insights.segmentCounts).length}
                </div>
              </div>
            </div>

            {/* Detailed Insights Row */}
            <div className="grid grid-cols-2 gap-6 mt-6">
              {/* Best Performing Trade */}
              <div className="bg-white border border-[var(--line)] rounded-xl p-6 shadow-sm min-h-[200px] flex flex-col">
                <div className="flex items-center gap-2 mb-6">
                  <Icon className="h-4 w-4 text-amber-500" name="star" />
                  <h3 className="text-[14px] font-bold text-[var(--ink)]">Best Performing Trade</h3>
                </div>
                
                {insights.bestTrade !== null ? (
                  <div className="flex-1 flex flex-col justify-center">
                    <div className="flex items-center justify-between mb-4 pb-4 border-b border-[var(--line)]/50">
                      <div>
                        <div className="text-[18px] font-black text-[var(--ink)] tracking-tight">
                          {insights.bestTrade.symbol}
                        </div>
                        <div className="text-[12px] font-bold text-[var(--muted-2)] mt-0.5">
                          {insights.bestTrade.direction} • {insights.bestTrade.segment}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-[20px] font-black text-emerald-500">
                          +{(insights.bestTrade.pnl_pct || 0).toFixed(2)}%
                        </div>
                        <div className="text-[11px] font-bold text-[var(--muted)] uppercase tracking-wider mt-0.5">
                          Return
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-[13px] text-[var(--muted)] font-medium">
                      <div className="flex flex-col">
                        <span className="text-[11px] uppercase tracking-wider font-bold mb-1">Entry</span>
                        <span className="text-[var(--ink)] font-bold">{formatCurrency(insights.bestTrade.entry_price || 0)}</span>
                      </div>
                      <Icon className="h-4 w-4 text-[var(--line)]" name="arrowRight" />
                      <div className="flex flex-col text-right">
                        <span className="text-[11px] uppercase tracking-wider font-bold mb-1">High / LTP</span>
                        <span className="text-[var(--ink)] font-bold">{formatCurrency(insights.bestTrade.ltp || insights.bestTrade.target_price || 0)}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-center">
                    <div className="h-12 w-12 rounded-full bg-slate-50 flex items-center justify-center mb-3">
                      <Icon className="h-5 w-5 text-slate-300" name="star" />
                    </div>
                    <h4 className="text-[13px] font-bold text-[var(--ink)]">No profitable trades yet</h4>
                    <p className="text-[12px] text-[var(--muted-2)] mt-1">
                      Publish a trade and hit a target to see it here.
                    </p>
                  </div>
                )}
              </div>

              {/* Trade Distribution */}
              <div className="bg-white border border-[var(--line)] rounded-xl p-6 shadow-sm min-h-[200px] flex flex-col">
                <div className="flex items-center gap-2 mb-6">
                  <Icon className="h-4 w-4 text-[var(--brand)]" name="activity" />
                  <h3 className="text-[14px] font-bold text-[var(--ink)]">Trade Distribution</h3>
                </div>
                
                {insights.totalTrades > 0 ? (
                  <div className="flex-1 flex flex-col justify-center">
                    <div className="space-y-4">
                      {Object.entries(insights.segmentCounts).map(([segment, count]) => {
                        const pct = ((count / insights.totalTrades) * 100).toFixed(0);
                        return (
                          <div key={segment}>
                            <div className="flex justify-between text-[12px] font-bold mb-1.5">
                              <span className="text-[var(--ink)]">{segment}</span>
                              <span className="text-[var(--muted)]">{count} Trades ({pct}%)</span>
                            </div>
                            <div className="h-2 w-full bg-[var(--surface)] rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-[var(--brand)] rounded-full" 
                                style={{ width: `${pct}%` }}
                              ></div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-center">
                    <div className="h-12 w-12 rounded-full bg-slate-50 flex items-center justify-center mb-3">
                      <Icon className="h-5 w-5 text-slate-300" name="activity" />
                    </div>
                    <h4 className="text-[13px] font-bold text-[var(--ink)]">No distribution data</h4>
                    <p className="text-[12px] text-[var(--muted-2)] mt-1">
                      Start publishing trades to see breakdown.
                    </p>
                  </div>
                )}
              </div>
            </div>
            
            {/* Win/Loss Summary */}
            <div className="mt-6 bg-white border border-[var(--line)] rounded-xl p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-[14px] font-bold text-[var(--ink)] mb-1">Performance Overview</h3>
                  <p className="text-[12px] text-[var(--muted-2)]">Overall win and loss records for completed trades.</p>
                </div>
                <div className="flex items-center gap-6">
                  <div className="flex flex-col items-end">
                    <div className="text-[11px] font-bold text-[var(--muted)] uppercase tracking-wider mb-1">Wins</div>
                    <div className="text-[20px] font-black text-emerald-500">{insights.wins}</div>
                  </div>
                  <div className="w-[1px] h-10 bg-[var(--line)]"></div>
                  <div className="flex flex-col items-start">
                    <div className="text-[11px] font-bold text-[var(--muted)] uppercase tracking-wider mb-1">Losses</div>
                    <div className="text-[20px] font-black text-[var(--red)]">{insights.losses}</div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
