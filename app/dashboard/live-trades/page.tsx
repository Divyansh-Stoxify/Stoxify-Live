"use client";

import { useState, useEffect, useRef } from "react";
import { Topbar } from "@/components/dashboard/topbar";
import { Icon } from "@/components/stoxify-icon";
import {
  useActiveTrades,
  usePendingTrades,
  useClosedTrades,
} from "@/hooks/use-analyst-dashboard";
import { useLiveTradesStats } from "@/hooks/use-analyst-dashboard";
import { useDashboard } from "@/components/dashboard/dashboard-context";
import { BroadcastModal } from "@/components/dashboard/broadcast-modal";
import { useWebSocket } from "@/hooks/use-websocket";
import type { Trade } from "@/lib/types/analyst";
import { TradeDetailsModal } from "@/components/trade-details-modal";

// ─── Types ────────────────────────────────────────────────────────────────────

type TabId = "active" | "pending" | "closed";

// ─── Sub-components ───────────────────────────────────────────────────────────

/** Mini stat card in the 4-stat strip at top */
function StatStrip({
  label,
  value,
  sub,
  valueClass = "text-[var(--ink)]",
  subClass = "text-[var(--green)]",
}: {
  label: string;
  value: string;
  sub?: string;
  valueClass?: string;
  subClass?: string;
}) {
  return (
    <div className="flex-1 rounded-xl border border-[var(--line)] bg-white px-5 py-4 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
      <div className="mb-1 text-[11.5px] font-medium text-[var(--muted)]">{label}</div>
      <div className={`text-[22px] font-extrabold leading-tight tracking-[-0.5px] ${valueClass}`}>
        {value}
      </div>
      {sub && <div className={`mt-1 text-[11px] font-semibold ${subClass}`}>{sub}</div>}
    </div>
  );
}

/** Skeleton for a stat strip item */
function StatStripSkeleton() {
  return (
    <div className="flex-1 rounded-xl border border-[var(--line)] bg-white px-5 py-4">
      <div className="mb-2 h-2.5 w-28 animate-pulse rounded bg-[var(--line)]" />
      <div className="h-7 w-16 animate-pulse rounded bg-[var(--line)]" />
    </div>
  );
}

function calculateRR(trade: Trade): string {
  if (!trade.exit_price || (!trade.stop_loss && !trade.stop_loss_price) || !trade.entry_price) return "—";
  const sl = trade.stop_loss ?? trade.stop_loss_price ?? 0;
  const isShort = trade.direction === "SHORT" || trade.direction === "SELL";
  const risk = isShort ? sl - trade.entry_price : trade.entry_price - sl;
  const reward = isShort ? trade.entry_price - trade.exit_price : trade.exit_price - trade.entry_price;
  
  if (risk <= 0) return "—"; // Avoid division by zero
  const rr = reward / risk;
  
  return `${rr > 0 ? '+' : ''}${rr.toFixed(2)}x`;
}

function CompactClosedCard({ trade, onClick }: { trade: Trade; onClick: () => void }) {
  const isProfit = trade.pnl_percent !== undefined && trade.pnl_percent >= 0;
  const statusColor = isProfit ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700";
  const borderColor = isProfit ? "border-green-200" : "border-red-200";
  const textColor = isProfit ? "text-green-600" : "text-red-600";
  const rr = calculateRR(trade);
  
  return (
    <div className="relative mt-5">
      <div className="absolute -top-3 flex w-full justify-between px-4 z-10">
        <div className="flex gap-1.5">
          <span className="bg-green-600 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-sm flex items-center">
            <Icon name="barChart" className="h-3 w-3 inline mr-1" />
            {trade.trade_subtype === "LONG_TERM" ? "Long-Term Picks" : "Analyst Signal"}
          </span>
        </div>
        <div className="flex gap-1.5">
          {trade.trade_subtype && (
            <span className="bg-[#ffcc00] text-black text-[10px] font-bold px-2 py-0.5 rounded shadow-sm">
              {trade.trade_subtype}
            </span>
          )}
          <span className="bg-[#0066ff] text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-sm">
            {trade.segment}
          </span>
        </div>
      </div>
      
      <div 
        className={`border-2 rounded-xl p-4 pt-5 bg-white cursor-pointer transition-shadow hover:shadow-md ${borderColor}`} 
        onClick={onClick}
      >
        <div className="flex justify-between items-start mt-1">
          <div className="flex gap-3 items-center">
            <div className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center bg-blue-50 text-blue-500 font-bold overflow-hidden shrink-0 text-lg shadow-inner">
              {trade.symbol.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-gray-900 text-[15px] leading-none">{trade.symbol}</span>
                <span className="text-[9px] font-bold border border-gray-200 rounded-full px-1.5 py-0.5 text-gray-500 flex items-center gap-1 leading-none shadow-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-500" /> NSE
                </span>
              </div>
              <div className="text-[11px] text-gray-500 mt-1.5 leading-none flex items-center gap-2">
                <span>{trade.segment_label ?? trade.segment}</span>
                {trade.batch && (
                  <span className="inline-flex items-center rounded bg-slate-50 px-1.5 py-0.5 text-[9px] font-bold uppercase text-slate-500 border border-slate-200">
                    {trade.batch}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="text-right flex flex-col items-end">
            <span className="text-[10px] text-gray-400">Exit Date & Time</span>
            <span className="text-[11px] font-semibold text-gray-800">
              {trade.exit_timestamp 
                ? new Date(trade.exit_timestamp).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true }) 
                : '—'}
            </span>
          </div>
        </div>

        <div className={`mt-3 py-1.5 rounded-md text-center text-sm font-bold ${statusColor}`}>
          Trade Status: {isProfit ? 'Closed In Profit' : 'Closed In Loss'}
        </div>

        <div className="mt-3 border border-gray-100 rounded-lg p-3">
          <div className="flex justify-between">
            <div className="flex flex-col">
              <span className="text-xs text-gray-500">Gain / Loss</span>
              <span className={`text-sm font-bold ${textColor}`}>
                {trade.pnl_percent !== undefined ? `${trade.pnl_percent >= 0 ? '+' : ''}${trade.pnl_percent.toFixed(2)}%` : '—'}
              </span>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-xs text-gray-500">R/R Ratio</span>
              <span className={`text-sm font-bold ${textColor}`}>
                {rr}
              </span>
            </div>
          </div>

          <div className="h-px w-full bg-gray-100 my-2" />

          <div className="flex justify-between text-[13px]">
            <div className="flex gap-1 text-gray-500">
              Entry: <span className="font-semibold text-gray-900">₹{trade.entry_price.toFixed(2)}</span>
            </div>
            <div className="w-px h-4 bg-gray-200 mx-2 mt-0.5" />
            <div className="flex gap-1 text-gray-500">
              Exit: <span className="font-semibold text-gray-900">₹{trade.exit_price?.toFixed(2) ?? '—'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function DetailedClosedCard({ trade, onClose }: { trade: Trade; onClose: () => void }) {
  const isProfit = trade.pnl_percent !== undefined && trade.pnl_percent >= 0;
  const rr = calculateRR(trade);
  
  // formatting dates
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "—";
    const d = new Date(dateStr);
    return `${d.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })} | ${d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}`;
  };
  
  const createdDate = formatDate(trade.nse_timestamp ?? trade.created_at);
  const exitDate = formatDate(trade.exit_timestamp);
  
  // duration calculation
  let durationStr = "—";
  if ((trade.nse_timestamp ?? trade.created_at) && trade.exit_timestamp) {
    const start = new Date(trade.nse_timestamp ?? trade.created_at!).getTime();
    const end = new Date(trade.exit_timestamp).getTime();
    const diff = Math.max(0, end - start);
    const d = Math.floor(diff / (1000 * 60 * 60 * 24));
    const h = Math.floor((diff / (1000 * 60 * 60)) % 24);
    durationStr = `${d}d ${h}h`;
  }
  
  const isShort = trade.direction === "SHORT" || trade.direction === "SELL";
  const targetVal = trade.targets && trade.targets.length > 0
    ? (isShort 
        ? Math.min(...trade.targets.map(t => t.target_price)) 
        : Math.max(...trade.targets.map(t => t.target_price)))
    : trade.target ?? trade.target_price;
    
  const slVal = trade.stop_loss ?? trade.stop_loss_price;
  
  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm mt-4 pb-6 overflow-hidden">
      {/* Top Header with Back button */}
      <div className="flex items-center gap-3 p-4 border-b border-gray-100">
        <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full transition-colors text-gray-700">
          <Icon name="arrowLeft" className="w-5 h-5" />
        </button>
        <span className="font-bold text-[15px] text-gray-900">Past trade details</span>
      </div>
      
      {/* Symbol Info */}
      <div className="flex gap-4 items-center p-5">
        <div className="w-12 h-12 rounded-full flex items-center justify-center bg-blue-50 text-blue-600 font-bold text-xl shrink-0">
          {trade.symbol.charAt(0)}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-lg text-gray-900">{trade.symbol}</span>
            <span className="text-[10px] font-bold border border-gray-200 rounded-md px-1.5 py-0.5 text-gray-500 flex items-center gap-1 shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-orange-500" /> NSE
            </span>
            <span className="text-[10px] font-bold border border-blue-200 bg-blue-50 rounded-md px-1.5 py-0.5 text-blue-600 flex items-center gap-1 shadow-sm">
              <Icon name="check" className="w-3 h-3" /> SEBI
            </span>
          </div>
          <div className="text-xs text-gray-500 mt-1">{trade.segment_label ?? trade.segment}</div>
        </div>
      </div>
      
      <div className="px-5 space-y-6">
        {/* Row 1 */}
        <div className="flex justify-between">
          <div>
            <div className="text-xs text-gray-500 font-medium mb-1">Trade return</div>
            <div className={`text-xl font-bold ${isProfit ? 'text-green-600' : 'text-red-600'}`}>
              {trade.pnl_percent !== undefined ? `${trade.pnl_percent >= 0 ? '+' : ''}${trade.pnl_percent.toFixed(2)}%` : '—'}
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-500 font-medium mb-1">R/R ratio</div>
            <div className={`text-xl font-bold ${isProfit ? 'text-green-600' : 'text-red-600'}`}>
              {rr}
            </div>
          </div>
        </div>
        
        {/* Row 2 */}
        <div className="flex justify-between border-b border-gray-100 pb-6">
          <div>
            <div className="text-xs text-gray-500 font-medium mb-1">Entry</div>
            <div className="text-lg font-bold text-gray-900">₹{trade.entry_price.toFixed(2)}</div>
            <div className="text-[11px] text-gray-500 mt-1">{createdDate}</div>
          </div>
          <div className="text-right">
            <div className="text-xs text-gray-500 font-medium mb-1">Exit</div>
            <div className={`text-lg font-bold ${isProfit ? 'text-green-600' : 'text-red-600'}`}>₹{trade.exit_price?.toFixed(2) ?? '—'}</div>
            <div className="text-[11px] text-gray-500 mt-1">{exitDate}</div>
          </div>
        </div>
        
        {/* Row 3 */}
        <div className="flex justify-between">
          <div>
            <div className="text-xs text-gray-500 font-medium mb-1">Trade duration</div>
            <div className="text-sm font-bold text-gray-900">{durationStr}</div>
          </div>
          <div>
            <div className="text-xs text-gray-500 font-medium mb-1">Trade direction</div>
            <div className="text-sm font-bold text-gray-900">{isShort ? 'Short' : 'Long'}</div>
          </div>
        </div>
        
        {/* Row 4 */}
        <div className="flex justify-between border-b border-gray-100 pb-6">
          <div>
            <div className="text-xs text-gray-500 font-medium mb-1">Trade segment</div>
            <div className="text-sm font-bold text-gray-900">{trade.segment}</div>
          </div>
          <div>
            <div className="text-xs text-gray-500 font-medium mb-1">Trade category</div>
            <div className="text-sm font-bold text-gray-900">{trade.trade_subtype ?? '—'}</div>
          </div>
        </div>
        
        {/* Properties List */}
        <div className="space-y-4 border-b border-gray-100 pb-6">
          <div className="flex justify-between items-center text-[13px]">
            <span className="text-gray-700">Status</span>
            <span className={`font-medium ${isProfit ? 'text-green-600' : 'text-red-600'}`}>{isProfit ? 'Profit booked' : 'Loss booked'}</span>
          </div>
          <div className="flex justify-between items-center text-[13px]">
            <span className="text-gray-700">Stop loss</span>
            <span className="font-medium text-gray-900">₹{slVal?.toFixed(2) ?? '—'}</span>
          </div>
          <div className="flex justify-between items-center text-[13px]">
            <span className="text-gray-700">Target {trade.targets && trade.targets.length > 0 && "(Max)"}</span>
            <span className="font-medium text-gray-900">₹{targetVal?.toFixed(2) ?? '—'}</span>
          </div>
          {trade.targets && trade.targets.length > 0 && trade.targets.map((t, idx) => (
            <div key={idx} className="flex justify-between items-center text-[13px]">
              <span className="text-gray-500 ml-4">T{idx + 1} Target ({t.book_percent}%)</span>
              <span className="font-medium text-gray-700">₹{t.target_price.toFixed(2)}</span>
            </div>
          ))}
          <div className="flex justify-between items-center text-[13px]">
            <span className="text-gray-700">Entry</span>
            <span className="font-medium text-gray-900">{createdDate}</span>
          </div>
          <div className="flex justify-between items-center text-[13px]">
            <span className="text-gray-700">Exit</span>
            <span className="font-medium text-gray-900">{exitDate}</span>
          </div>
        </div>
        
        {/* Modification History */}
        <div>
          <div className="text-[11px] font-bold text-gray-500 tracking-wider mb-4 uppercase">Actions / Modification History</div>
          <div className="space-y-5">
            {/* Action 1: Entry */}
            <div className="flex justify-between">
              <div>
                <div className="text-[13px] text-gray-700">Action</div>
                <div className="text-[14px] font-bold text-gray-900 mt-1">Trade published</div>
                <div className="text-[11px] text-gray-500 mt-2">Updated at</div>
              </div>
              <div className="text-right">
                <div className="text-[13px] text-gray-700">Price</div>
                <div className="text-[14px] font-bold text-gray-900 mt-1">₹{trade.entry_price.toFixed(2)}</div>
                <div className="text-[11px] text-gray-500 mt-2">{createdDate}</div>
              </div>
            </div>
            
            {/* Action 2: Exit */}
            {trade.exit_timestamp && (
              <div className="flex justify-between">
                <div>
                  <div className="text-[13px] text-gray-700">Action</div>
                  <div className="text-[14px] font-bold text-gray-900 mt-1">{isProfit ? 'Target hit' : 'Stop loss hit'}</div>
                  <div className="text-[11px] text-gray-500 mt-2">Updated at</div>
                </div>
                <div className="text-right">
                  <div className="text-[13px] text-gray-700">Price</div>
                  <div className="text-[14px] font-bold text-gray-900 mt-1">₹{trade.exit_price?.toFixed(2) ?? '—'}</div>
                  <div className="text-[11px] text-gray-500 mt-2">{exitDate}</div>
                </div>
              </div>
            )}
          </div>
        </div>
        
      </div>
    </div>
  );
}

/** Detailed active trade card — Signal Details view */
function DetailedActiveCard({ trade, onClose, onBroadcast, liveLtpProp }: { trade: Trade; onClose: () => void; onBroadcast: (trade: Trade) => void; liveLtpProp?: number }) {
  const { openCloseTrade, openModifyTrade } = useDashboard();
  const isShort = trade.direction === "SHORT" || trade.direction === "SELL";
  const stopLossVal = trade.stop_loss ?? trade.stop_loss_price;
  const targetVal = trade.targets && trade.targets.length > 0
    ? (isShort 
        ? Math.min(...trade.targets.map(t => t.target_price)) 
        : Math.max(...trade.targets.map(t => t.target_price)))
    : trade.target ?? trade.target_price;

  // Live price via WebSockets
  const [liveLtp, setLiveLtp] = useState(liveLtpProp ?? trade.ltp ?? trade.entry_price);
  const [priceDirection, setPriceDirection] = useState<"up" | "down" | null>(null);
  const [flashKey, setFlashKey] = useState(0);

  useEffect(() => {
    if (liveLtpProp !== undefined && liveLtpProp !== liveLtp) {
      setPriceDirection(liveLtpProp > liveLtp ? "up" : "down");
      setLiveLtp(liveLtpProp);
      setFlashKey((k) => k + 1);
    }
  }, [liveLtpProp, liveLtp]);

  useEffect(() => { 
    if (priceDirection) { 
      const t = setTimeout(() => setPriceDirection(null), 800); 
      return () => clearTimeout(t); 
    } 
  }, [priceDirection, flashKey]);

  const livePnlPerUnit = isShort ? trade.entry_price - liveLtp : liveLtp - trade.entry_price;
  const livePnlPct = (livePnlPerUnit / trade.entry_price) * 100;

  // Estimated gains (target to entry)
  const estimatedGains = targetVal ? (Math.abs(targetVal - trade.entry_price) / trade.entry_price * 100) : 0;
  // Estimated risk (entry to SL)
  const estimatedRisk = stopLossVal ? (Math.abs(trade.entry_price - stopLossVal) / trade.entry_price * 100) : 0;
  // Live R/R
  const risk = stopLossVal ? Math.abs(trade.entry_price - stopLossVal) : 0;
  const liveRR = risk > 0 ? livePnlPerUnit / risk : 0;

  const isProfit = livePnlPerUnit >= 0;
  const isInBuyingRange = Math.abs(liveLtp - trade.entry_price) / trade.entry_price < 0.005;
  const statusText = isInBuyingRange ? "In Buying Range" : isProfit ? "In Profit" : "In Loss";
  const statusColor = isInBuyingRange ? "text-green-600" : isProfit ? "text-green-600" : "text-red-600";

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "—";
    const d = new Date(dateStr);
    return `${d.getDate()}${["th","st","nd","rd"][(d.getDate()%100>10&&d.getDate()%100<14)?0:(d.getDate()%10<4?d.getDate()%10:0)] ?? "th"} ${d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })} ${d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}`;
  };

  // Compute exit zone (target range)
  let exitZoneStr = "—";
  if (trade.targets && trade.targets.length > 0) {
    const sorted = [...trade.targets].sort((a, b) => a.target_price - b.target_price);
    exitZoneStr = `₹${sorted[0].target_price.toFixed(2)} - ₹${sorted[sorted.length - 1].target_price.toFixed(2)}`;
  } else if (targetVal) {
    exitZoneStr = `₹${targetVal.toFixed(2)}`;
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm mt-4 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-gray-100">
        <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full transition-colors text-gray-700">
          <Icon name="arrowLeft" className="w-5 h-5" />
        </button>
        <span className="font-bold text-[15px] text-gray-900">Signal Details</span>
      </div>

      <div className="p-5 space-y-5">
        {/* Symbol Row */}
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full flex items-center justify-center bg-blue-50 text-blue-600 font-bold text-xl shrink-0">
              {trade.symbol.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg text-gray-900">{trade.symbol}</span>
                <span className="text-[10px] font-bold border border-gray-200 rounded-md px-1.5 py-0.5 text-gray-500 flex items-center gap-1 shadow-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-500" /> NSE
                </span>
              </div>
              <div className="text-xs text-gray-500 mt-1">{trade.segment_label ?? trade.segment}</div>
            </div>
          </div>
          <div className="text-right">
            <div className={`text-xl font-extrabold text-gray-900 transition-colors duration-300 ${priceDirection === 'up' ? 'text-green-600' : priceDirection === 'down' ? 'text-red-600' : ''}`}>
              ₹{liveLtp.toFixed(2)}
            </div>
            <div className={`text-sm font-bold mt-0.5 ${isProfit ? 'text-green-600' : 'text-red-500'}`}>
              {isProfit ? '+' : '-'}₹{Math.abs(livePnlPerUnit).toFixed(2)} ({isProfit ? '+' : ''}{livePnlPct.toFixed(2)}%)
            </div>
          </div>
        </div>

        {/* ── Trade Statistics ── */}
        <div className="text-[15px] font-bold text-gray-900">Trade Statistics</div>

        {/* Estimated Gains / Estimated Risk */}
        <div className="border border-gray-200 rounded-xl p-4 space-y-3">
          <div className="flex justify-between items-center">
            <div>
              <div className="text-xs text-gray-500 font-medium mb-0.5">Estimated Gains</div>
              <div className="text-lg font-bold text-green-600">+{estimatedGains.toFixed(2)}%</div>
            </div>
            <div className="text-right">
              <div className="text-xs text-gray-500 font-medium mb-0.5">Estimated Risk</div>
              <div className="text-lg font-bold text-red-600">-{estimatedRisk.toFixed(2)}%</div>
            </div>
          </div>
          <div className="h-px bg-gray-100" />
          <div className="flex justify-between items-center">
            <div>
              <div className="text-xs text-gray-500 font-medium mb-0.5">Live Return</div>
              <div className={`text-lg font-bold ${isProfit ? 'text-green-600' : 'text-red-600'}`}>
                {isProfit ? '+' : ''}{livePnlPct.toFixed(2)}%
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-gray-500 font-medium mb-0.5">Live R/R</div>
              <div className={`text-lg font-bold ${liveRR >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {liveRR >= 0 ? '+' : ''}{liveRR.toFixed(2)}x
              </div>
            </div>
          </div>
        </div>

        {/* Entry / SL / Target */}
        <div className="border border-gray-200 rounded-xl p-4 flex justify-between">
          <div className="text-center flex-1 flex flex-col justify-start">
            <div className="text-xs text-gray-500 font-medium mb-1">Entry</div>
            <div className="font-bold text-base text-gray-900">₹{trade.entry_price.toFixed(2)}</div>
          </div>
          <div className="w-px bg-gray-200 mx-2"></div>
          <div className="text-center flex-1 flex flex-col justify-start">
            <div className="text-[13px] font-medium text-gray-500 mb-1">Target{trade.targets && trade.targets.length > 1 ? 's' : ''}</div>
            {trade.targets && trade.targets.length > 1 ? (
              <div className="flex flex-col gap-1 items-center">
                {trade.targets.map((t, i) => (
                  <div key={i} className="font-bold text-[14px] text-green-600 leading-none">
                    T{i + 1} ₹{t.target_price.toFixed(2)}
                  </div>
                ))}
              </div>
            ) : (
              <div className="font-bold text-base text-green-600">{targetVal ? `₹${targetVal.toFixed(2)}` : '—'}</div>
            )}
          </div>
          <div className="w-px bg-gray-200 mx-2"></div>
          <div className="text-center flex-1 flex flex-col justify-start">
            <div className="text-[13px] font-medium text-gray-500 mb-1">SL</div>
            <div className="font-bold text-base text-red-600">{stopLossVal ? `₹${stopLossVal.toFixed(2)}` : '—'}</div>
          </div>
        </div>

        {/* Direction / Segment / Category */}
        <div className="border border-gray-200 rounded-xl p-4 flex justify-between">
          <div className="text-center flex-1">
            <div className="text-xs text-gray-500 font-medium mb-1">Trade Direction</div>
            <div className="font-bold text-base text-gray-900">{isShort ? 'Short' : 'Long'}</div>
          </div>
          <div className="w-px bg-gray-200 mx-2"></div>
          <div className="text-center flex-1">
            <div className="text-xs text-gray-500 font-medium mb-1">Trade Segment</div>
            <div className="font-bold text-base text-gray-900">{trade.segment}</div>
          </div>
          <div className="w-px bg-gray-200 mx-2"></div>
          <div className="text-center flex-1">
            <div className="text-xs text-gray-500 font-medium mb-1">Trade Category</div>
            <div className="font-bold text-base text-gray-900">{trade.trade_subtype ?? '—'}</div>
          </div>
        </div>

        {/* Properties list */}
        <div className="border border-gray-200 rounded-xl p-4 space-y-4">
          <div className="flex justify-between items-center text-[13px]">
            <span className="text-gray-600">Published At</span>
            <span className="font-semibold text-gray-900">{formatDate(trade.nse_timestamp ?? trade.created_at)}</span>
          </div>
          <div className="h-px bg-gray-100" />
          <div className="flex justify-between items-center text-[13px]">
            <span className="text-gray-600">Status</span>
            <span className={`font-semibold ${statusColor}`}>{statusText}</span>
          </div>
          <div className="h-px bg-gray-100" />
          <div className="flex justify-between items-center text-[13px]">
            <span className="text-gray-600">Entry Zone</span>
            <span className="font-semibold text-gray-900">₹{trade.entry_price.toFixed(2)}</span>
          </div>
          <div className="h-px bg-gray-100" />
          <div className="flex justify-between items-center text-[13px]">
            <span className="text-gray-600">Exit Zone</span>
            <span className="font-semibold text-gray-900">{exitZoneStr}</span>
          </div>
          {trade.targets && trade.targets.length > 1 && trade.targets.map((t, idx) => (
            <div key={idx}>
              <div className="h-px bg-gray-100" />
              <div className="flex justify-between items-center text-[13px] pt-4">
                <span className="text-gray-500 ml-3">T{idx + 1} ({t.book_percent}%)</span>
                <span className="font-semibold text-gray-700">₹{t.target_price.toFixed(2)}</span>
              </div>
            </div>
          ))}
          <div className="h-px bg-gray-100" />
          <div className="flex justify-between items-center text-[13px]">
            <span className="text-gray-600">Signal Category</span>
            <span className="font-semibold text-gray-900">{trade.trade_subtype ?? 'Trading'}</span>
          </div>
        </div>
      </div>

      {/* Modification History */}
      {trade.modification_history && trade.modification_history.length > 0 && (
        <div className="px-5 pb-5">
          <div className="text-[11px] font-bold text-gray-500 tracking-wider mb-4 uppercase">Modification History</div>
          <div className="space-y-4 relative before:absolute before:inset-0 before:ml-2 before:-translate-x-px before:h-full before:w-0.5 before:bg-gray-200">
            {trade.modification_history.map((mod, i) => (
              <div key={i} className="relative flex items-start gap-4">
                {/* Timeline dot */}
                <div className="relative z-10 flex items-center justify-center w-4 h-4 rounded-full bg-blue-500 mt-1 shrink-0" />
                {/* Card */}
                <div className="flex-1 bg-white p-3 rounded-xl border border-gray-200 shadow-sm">
                  <div className="flex justify-between mb-1.5">
                    <div className="text-[12px] font-bold text-gray-900">Modified</div>
                    <div className="text-[11px] text-gray-500">{formatDate(mod.modified_at)}</div>
                  </div>
                  <div className="text-[12px] text-gray-600 space-y-1">
                    {Object.entries(mod.fields_changed).map(([key, changes]) => {
                      if (key === 'targets' && Array.isArray(changes.new)) {
                        return (
                          <div key={key}>
                            <span className="font-semibold text-gray-700">Targets updated</span>
                          </div>
                        );
                      }
                      return (
                        <div key={key}>
                          <span className="font-semibold capitalize text-gray-700">{key.replace('_', ' ')}</span>: ₹{String(changes.old)} → <span className="font-bold text-gray-900">₹{String(changes.new)}</span>
                        </div>
                      );
                    })}
                  </div>
                  {mod.reason && (
                    <div className="mt-2 text-[11px] text-gray-500 bg-gray-50 p-2 rounded-lg italic border border-gray-100">
                      "{mod.reason}"
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer Actions */}
      <div className="flex items-center gap-3 border-t border-gray-100 bg-gray-50/50 px-5 py-4">
        <button
          className="flex-1 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-xs font-bold text-gray-700 shadow-sm transition-colors hover:border-gray-300 hover:bg-gray-50"
          type="button"
          onClick={() => openModifyTrade(trade)}
        >
          Modify
        </button>
        <button
          className="flex-1 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2.5 text-xs font-bold text-blue-600 shadow-sm transition-colors hover:bg-blue-100"
          type="button"
          onClick={() => onBroadcast(trade)}
        >
          Broadcast
        </button>
        <button
          className="flex-1 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-red-700"
          type="button"
          onClick={() => openCloseTrade(trade)}
        >
          Close
        </button>
      </div>
    </div>
  );
}

/** Full trade card matching the Figma exactly */
function TradeCard({ trade, onBroadcast, hideActions, liveLtpProp, onAutoClose, onOptimisticClose }: { trade: Trade; onBroadcast: (trade: Trade) => void; hideActions?: boolean; liveLtpProp?: number; onAutoClose?: () => void; onOptimisticClose?: (tradeId: string) => void }) {
  const { openCloseTrade, openModifyTrade, showSuccessToast } = useDashboard();
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  
  // Live price via WebSockets
  const [liveLtp, setLiveLtp] = useState(liveLtpProp ?? trade.ltp ?? trade.entry_price);
  const [priceDirection, setPriceDirection] = useState<"up" | "down" | null>(null);
  const [flashKey, setFlashKey] = useState(0);
  const [isNotePublic, setIsNotePublic] = useState(true);
  // Dead trade: once SL or final target is hit, freeze price + auto-close
  const isDeadRef = useRef(false);

  const isShort = trade.direction === "SHORT" || trade.direction === "SELL";
  const stopLossVal = trade.stop_loss ?? trade.stop_loss_price;
  const targetVal = trade.targets && trade.targets.length > 0
    ? (isShort 
        ? Math.min(...trade.targets.map(t => t.target_price)) 
        : Math.max(...trade.targets.map(t => t.target_price)))
    : trade.target ?? trade.target_price;

  useEffect(() => {
    // Freeze price updates once dead
    if (isDeadRef.current) return;
    if (liveLtpProp !== undefined && liveLtpProp !== liveLtp) {
      setPriceDirection(liveLtpProp > liveLtp ? "up" : "down");
      setLiveLtp(liveLtpProp);
      setFlashKey((k) => k + 1);
    }
  }, [liveLtpProp, liveLtp]);

  useEffect(() => {
    if (priceDirection) {
      const timer = setTimeout(() => {
        setPriceDirection(null);
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [priceDirection, flashKey]);

  // Live PNL calculations based on simulated price
  const livePnlPerUnit = isShort
    ? trade.entry_price - liveLtp
    : liveLtp - trade.entry_price;
  const livePnlPct = (livePnlPerUnit / trade.entry_price) * 100;

  // Near SL/Target conditions
  const isTargetHit = targetVal !== undefined && (!isShort ? liveLtp >= targetVal : liveLtp <= targetVal);
  const isSLHit = stopLossVal !== undefined && (!isShort ? liveLtp <= stopLossVal : liveLtp >= stopLossVal);

  // Auto-close: when target or SL is hit, freeze price and call close API once
  useEffect(() => {
    if (hideActions) return; // already closed trade cards don't need this
    if (isDeadRef.current) return;
    if (!isTargetHit && !isSLHit) return;

    isDeadRef.current = true;

    // Instantly remove from UI before network request
    onOptimisticClose?.(trade.trade_id);

    const exitPrice = liveLtp;
    const closingReason = isTargetHit ? 'Target hit — auto-closed' : 'Stop loss hit — auto-closed';

    fetch(`/api/analyst/trades/${trade.trade_id}/close`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({
        exit_price: exitPrice,
        manual_closing_note: closingReason,
      }),
    })
      .then((res) => {
        if (res.ok) {
          showSuccessToast(
            isTargetHit ? '🎯 Target Hit!' : '🛑 Stop Loss Hit',
            `${trade.symbol} has been automatically closed at ₹${exitPrice.toFixed(2)}.`,
          );
          onAutoClose?.();
        }
      })
      .catch(() => {
        // Silently fail — backend might already be closing via its own pipeline
        onAutoClose?.();
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isTargetHit, isSLHit]);

  // Timeline Progress Calculation
  const range = (targetVal && stopLossVal) ? Math.abs(targetVal - stopLossVal) : 0;
  const entryPct = (targetVal && stopLossVal && range !== 0) 
    ? Math.min(100, Math.max(0, (!isShort ? ((trade.entry_price - stopLossVal) / range) : ((stopLossVal - trade.entry_price) / range)) * 100)) 
    : 50;
  const livePct = (targetVal && stopLossVal && range !== 0) 
    ? Math.min(100, Math.max(0, (!isShort ? ((liveLtp - stopLossVal) / range) : ((stopLossVal - liveLtp) / range)) * 100)) 
    : 50;

  const handleToggleNote = () => {
    const nextState = !isNotePublic;
    setIsNotePublic(nextState);
    showSuccessToast(
      nextState ? "Note Public" : "Note Hidden",
      `Note visibility for ${trade.symbol} has been ${nextState ? "enabled" : "disabled"} for subscribers.`
    );
  };

  if (hideActions) {
    return (
      <>
        <CompactClosedCard trade={trade} onClick={() => setShowDetailsModal(true)} />
        {showDetailsModal && (
          <TradeDetailsModal
            trade={trade}
            onClose={() => setShowDetailsModal(false)}
            liveLtp={liveLtp}
          />
        )}
      </>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm relative mt-4 overflow-visible flex flex-col">
      {/* Top Badges */}
      <div className="flex justify-between items-start px-4">
        <div className="bg-[#cc9900] text-white px-3 py-1 rounded-b-md rounded-t-sm text-xs font-bold flex items-center gap-1.5 shadow-sm -mt-px">
          <div className="flex gap-0.5 items-end h-3">
            <div className="w-1 bg-white/90 h-full rounded-sm" />
            <div className="w-1 bg-white/90 h-2/3 rounded-sm" />
          </div>
          Analyst Signal
        </div>
        <div className="flex gap-2 -mt-px">
          {trade.trade_subtype && (
            <span className="bg-[#ffcc00] text-gray-900 px-3 py-1 rounded-b-md rounded-t-sm text-xs font-bold shadow-sm">
              {trade.trade_subtype}
            </span>
          )}
          <span className="bg-[#0066ff] text-white px-3 py-1 rounded-b-md rounded-t-sm text-xs font-bold shadow-sm">
            {trade.segment}
          </span>
        </div>
      </div>

      <div className="p-5 flex-1 cursor-pointer" onClick={() => setShowDetailsModal(true)}>
        {/* Symbol Row */}
        <div className="flex justify-between items-start mb-10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full border border-gray-200 flex items-center justify-center bg-blue-50 text-xl font-bold text-blue-500 overflow-hidden shrink-0 shadow-inner">
              {trade.symbol.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-gray-900 leading-none">{trade.symbol}</h3>
                <span className="text-[10px] font-bold border border-gray-200 rounded-full px-1.5 py-0.5 text-gray-500 flex items-center gap-1 leading-none shadow-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-500" /> NSE
                </span>
              </div>
              <div className="text-xs text-gray-500 mt-1.5 leading-none flex items-center gap-2">
                <span>{trade.segment_label ?? trade.segment}</span>
                {trade.batch && (
                  <span className="inline-flex items-center rounded bg-slate-50 px-1.5 py-0.5 text-[9px] font-bold uppercase text-slate-500 border border-slate-200">
                    {trade.batch}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="text-right">
            <div className={`text-xl font-extrabold text-gray-900 transition-colors duration-300 ${priceDirection === 'up' ? 'text-green-600' : priceDirection === 'down' ? 'text-red-600' : ''}`}>
              ₹{liveLtp.toFixed(2)}
            </div>
            <div className={`text-sm font-bold mt-1 ${livePnlPerUnit >= 0 ? 'text-green-600' : 'text-red-500'}`}>
              <span>
                {livePnlPerUnit >= 0 ? '+' : '-'}₹{Math.abs(livePnlPerUnit).toFixed(2)} ({livePnlPerUnit >= 0 ? '+' : ''}{livePnlPct.toFixed(2)}%)
              </span>
            </div>
          </div>
        </div>

        {/* Progress Slider / Timeline */}
        {/* Progress Slider / Timeline */}
        <div className="mb-10 mt-12 mx-4">
          <div className="text-[13px] font-bold text-gray-700 mb-6">Price progress</div>
          
          <div className="relative">
            {/* Above the bar: Entry and CMP */}
            <div className="absolute -top-7 -translate-x-1/2 whitespace-nowrap text-[11px] font-semibold text-gray-500" style={{ left: `${entryPct}%` }}>
              Entry ₹{trade.entry_price.toFixed(2)}
              <div className="absolute top-[18px] left-1/2 -translate-x-1/2 w-px h-[10px] bg-gray-400" />
            </div>
            
            <div className="absolute -top-12 -translate-x-1/2 whitespace-nowrap text-[12.5px] font-bold text-blue-600 z-10 bg-white/90 backdrop-blur-sm px-1.5 py-0.5 rounded-md shadow-sm border border-blue-100" style={{ left: `${livePct}%` }}>
              CMP ₹{liveLtp.toFixed(2)}
              <div className="absolute -bottom-[5px] left-1/2 -translate-x-1/2 w-0 h-0 border-l-[4px] border-r-[4px] border-t-[5px] border-l-transparent border-r-transparent border-t-blue-600" />
            </div>

            {/* The Bar */}
            <div className="relative h-2.5 rounded-full overflow-hidden bg-gray-100 flex shadow-inner">
              {stopLossVal && targetVal ? (
                <>
                  {/* Red section from SL to Entry */}
                  <div className="h-full bg-[#ef4444]" style={{ width: `${entryPct}%` }} />
                  {/* Green section from Entry to Max Target */}
                  <div className="h-full bg-[#22c55e]" style={{ width: `${100 - entryPct}%` }} />
                </>
              ) : (
                <div className="h-full w-full bg-gray-200" />
              )}
            </div>

            {/* Below the bar: SL and Targets */}
            <div className="relative h-10 text-[11px] font-bold">
              {stopLossVal && (
                <div className="absolute top-2 whitespace-nowrap text-red-500" style={{ left: '0%' }}>
                  <div className="absolute -top-[10px] left-0 w-px h-[8px] bg-red-400" />
                  SL ₹{stopLossVal.toFixed(2)}
                </div>
              )}
              
              {trade.targets && trade.targets.length > 1 ? (
                trade.targets.map((t, i) => {
                  const tPct = targetVal && stopLossVal && range !== 0 ? Math.min(100, Math.max(0, (!isShort ? ((t.target_price - stopLossVal) / range) : ((stopLossVal - t.target_price) / range)) * 100)) : 50;
                  return (
                    <div 
                      key={i} 
                      className={`absolute whitespace-nowrap text-[#5b982c] ${i === trade.targets!.length - 1 ? '-translate-x-full' : '-translate-x-1/2'}`} 
                      style={{ 
                        left: `${tPct}%`,
                        top: i % 2 === 0 ? '8px' : '24px'
                      }}
                    >
                      <div 
                        className="absolute w-px bg-[#5b982c]/40" 
                        style={{ 
                          height: i % 2 === 0 ? '8px' : '24px', 
                          top: i % 2 === 0 ? '-8px' : '-24px', 
                          left: i === trade.targets!.length - 1 ? '100%' : '50%' 
                        }} 
                      />
                      T{i + 1} ₹{t.target_price.toFixed(2)}
                    </div>
                  );
                })
              ) : targetVal && (
                <div className="absolute top-2 -translate-x-full whitespace-nowrap text-[#5b982c]" style={{ left: '100%' }}>
                  <div className="absolute -top-[10px] right-0 w-px h-[8px] bg-[#5b982c]/40" />
                  Target ₹{targetVal.toFixed(2)}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Stats Row 1: Potential Profit and Status */}
        <div className="bg-[#f8faf9] rounded-xl p-4 flex justify-between border border-gray-100 mb-4 shadow-sm">
          <div>
            <div className="text-[13px] font-medium text-gray-500 mb-1">Potential Profit</div>
            <div className="text-green-600 font-bold text-base">
              {targetVal ? `+${(Math.abs(targetVal - trade.entry_price) / trade.entry_price * 100).toFixed(2)}%` : "—"}
            </div>
          </div>
          <div className="text-right">
            <div className="text-[13px] font-medium text-gray-500 mb-1">Status</div>
            <div className={`font-bold text-base ${isTargetHit ? 'text-green-600' : isSLHit ? 'text-red-600' : Math.abs(liveLtp - trade.entry_price) / trade.entry_price < 0.005 ? 'text-green-600' : livePnlPerUnit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {isTargetHit ? "Target Hit" : isSLHit ? "SL Hit" : Math.abs(liveLtp - trade.entry_price) / trade.entry_price < 0.005 ? "In Buying Range" : livePnlPerUnit >= 0 ? "In Profit" : "In Loss"}
            </div>
          </div>
        </div>

        {/* Stats Row 2: Entry, SL, Target */}
        <div className="border border-gray-200 rounded-xl p-4 flex justify-between shadow-sm">
          <div className="text-center flex-1 flex flex-col justify-start">
            <div className="text-[13px] font-medium text-gray-500 mb-1">Entry</div>
            <div className="font-bold text-base text-gray-900">₹{trade.entry_price.toFixed(2)}</div>
          </div>
          <div className="w-px bg-gray-200 mx-2"></div>
          <div className="text-center flex-1 flex flex-col justify-start">
            <div className="text-[13px] font-medium text-gray-500 mb-1">Target{trade.targets && trade.targets.length > 1 ? 's' : ''}</div>
            {trade.targets && trade.targets.length > 1 ? (
              <div className="flex flex-col gap-1 items-center">
                {trade.targets.map((t, i) => (
                  <div key={i} className="font-bold text-[14px] text-green-600 leading-none">
                    T{i + 1} ₹{t.target_price.toFixed(2)}
                  </div>
                ))}
              </div>
            ) : (
              <div className="font-bold text-base text-green-600">{targetVal ? `₹${targetVal.toFixed(2)}` : '—'}</div>
            )}
          </div>
          <div className="w-px bg-gray-200 mx-2"></div>
          <div className="text-center flex-1 flex flex-col justify-start">
            <div className="text-[13px] font-medium text-gray-500 mb-1">SL</div>
            <div className="font-bold text-base text-red-600">{stopLossVal ? `₹${stopLossVal.toFixed(2)}` : '—'}</div>
          </div>
        </div>
      </div>

      {/* Card Footer: action buttons */}
      <div className="flex items-center gap-4 border-t border-gray-100 bg-gray-50/50 px-5 py-4 mt-auto max-[860px]:flex-col max-[860px]:items-stretch">
        <div className="flex flex-1 items-center gap-3 text-sm min-w-0">
          <button
            onClick={handleToggleNote}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
              isNotePublic
                ? "bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100"
                : "bg-gray-100 text-gray-500 border-gray-200 hover:bg-gray-200"
            }`}
            type="button"
            title={isNotePublic ? "Public note - visible to subscribers" : "Private note - hidden from subscribers"}
          >
            <Icon className="h-4 w-4" name={isNotePublic ? "eye" : "eyeOff"} />
            <span>{isNotePublic ? "Public Note" : "Private Note"}</span>
          </button>
        </div>

        {!hideActions && (
          <div className="flex shrink-0 items-center justify-end gap-2 max-[860px]:justify-between w-full sm:w-auto">
            <button
              className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-xs font-bold text-gray-700 shadow-sm transition-colors hover:border-gray-300 hover:bg-gray-50"
              type="button"
              onClick={() => openModifyTrade(trade)}
            >
              Modify
            </button>
            <button
              className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-2 text-xs font-bold text-blue-600 shadow-sm transition-colors hover:bg-blue-100"
              type="button"
              onClick={() => onBroadcast(trade)}
            >
              Broadcast
            </button>
            <button
              className="rounded-xl bg-red-600 px-6 py-2 text-sm font-bold text-white shadow-sm transition-colors hover:bg-red-700"
              type="button"
              onClick={() => openCloseTrade(trade)}
            >
              Close
            </button>
          </div>
        )}
      </div>

      {showDetailsModal && (
        <TradeDetailsModal
          trade={trade}
          onClose={() => setShowDetailsModal(false)}
          liveLtp={liveLtp}
        />
      )}
    </div>
  );
}

/** Skeleton for a single trade card while loading */
function TradeCardSkeleton() {
  return (
    <div className="rounded-xl border border-[var(--line)] bg-white shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
      <div className="flex items-center gap-3 px-5 py-3.5 border-b border-[var(--line)]">
        <div className="h-4 w-24 animate-pulse rounded bg-[var(--line)]" />
        <div className="h-4 w-12 animate-pulse rounded bg-[var(--line)]" />
        <div className="h-4 w-10 animate-pulse rounded bg-[var(--line)]" />
      </div>
      <div className="grid grid-cols-5 gap-0 px-5 py-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="space-y-1.5">
            <div className="h-2.5 w-16 animate-pulse rounded bg-[var(--line)]" />
            <div className="h-5 w-20 animate-pulse rounded bg-[var(--line)]" />
            <div className="h-2.5 w-14 animate-pulse rounded bg-[var(--line)]" />
          </div>
        ))}
      </div>
      <div className="flex items-center gap-4 border-t border-[var(--line)] px-5 py-3">
        <div className="h-3 w-64 animate-pulse rounded bg-[var(--line)]" />
        <div className="ml-auto flex gap-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-7 w-24 animate-pulse rounded-lg bg-[var(--line)]" />
          ))}
        </div>
      </div>
    </div>
  );
}



// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LiveTradesPage() {
  const [activeTab, setActiveTab] = useState<TabId>("active");
  const [broadcastTrade, setBroadcastTrade] = useState<Trade | null>(null);
  const { openCreateTrade, showSuccessToast, setOnTradeClosedCallback, setOnTradeModifiedCallback, setOnTradeCreatedCallback } = useDashboard();
  const { prices: livePrices, tradeClosedEvent, tradeModifiedEvent } = useWebSocket();

  const { stats, isLoading: statsLoading } = useLiveTradesStats();
  const {
    trades: activeTrades,
    isLoading: activeLoading,
    isError: activeError,
    refetch: refetchActive,
    removeTradeLocally,
  } = useActiveTrades(20);
  const activeTotal = activeTrades.length;
  const { trades: pendingTrades, isLoading: pendingLoading, refetch: refetchPending } = usePendingTrades();
  const pendingTotal = pendingTrades.length;
  const { trades: closedTrades, isLoading: closedLoading, refetch: refetchClosed } = useClosedTrades();

  // Register callbacks so manual close/modify/create from modals trigger a refetch
  useEffect(() => {
    setOnTradeClosedCallback(() => { void refetchActive(); void refetchClosed(); });
    setOnTradeModifiedCallback(() => { void refetchActive(); void refetchPending(); });
    setOnTradeCreatedCallback(() => { void refetchActive(); void refetchPending(); });
    return () => {
      setOnTradeClosedCallback(null);
      setOnTradeModifiedCallback(null);
      setOnTradeCreatedCallback(null);
    };
  }, [setOnTradeClosedCallback, setOnTradeModifiedCallback, setOnTradeCreatedCallback, refetchActive, refetchClosed, refetchPending]);

  // WS-driven refetch (backend-triggered closures)
  useEffect(() => {
    if (tradeClosedEvent) {
      void refetchActive();
      void refetchClosed();
    }
  }, [tradeClosedEvent, refetchActive, refetchClosed]);

  useEffect(() => {
    if (tradeModifiedEvent) {
      void refetchActive();
      void refetchPending();
    }
  }, [tradeModifiedEvent, refetchActive, refetchPending]);

  const TAB_OPTIONS: { id: TabId; label: string; count?: number }[] = [
    { id: "active", label: "Active", count: activeTotal },
    { id: "pending", label: "Pending", count: pendingTotal },
    { id: "closed", label: "Closed Trades" },
  ];

  return (
    <>
      {/* ── Topbar: shows analyst profile avatar on right ── */}
      <Topbar showUserProfile title="Live Trades" />

      {/* ── Page body ── */}
      <div className="flex-1 p-6">
        {/* ── Page header: title + subtitle + Create Trade button ── */}
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-[22px] font-extrabold tracking-[-0.5px] text-[var(--ink)]">
              Active Trades
            </h2>
            <p className="mt-0.5 text-[13px] text-[var(--muted)]">
              Monitor your open positions and broadcast live updates to subscribers.
            </p>
          </div>
          <button
            className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-[var(--brand)] px-4 py-2.5 text-[13px] font-bold text-white shadow-sm transition-all hover:bg-[var(--brand-dark)] hover:shadow-md active:scale-[0.98]"
            onClick={openCreateTrade}
            type="button"
          >
            <Icon className="h-3.5 w-3.5" name="plus" />
            Create Trade
          </button>
        </div>

        {/* ── Stat strip: mini stats ── */}
        <div className="mb-5 flex gap-3 max-[860px]:grid max-[860px]:grid-cols-2">
          {statsLoading || !stats ? (
            <>
              <StatStripSkeleton />
              <StatStripSkeleton />
              <StatStripSkeleton />
            </>
          ) : (
            <>
              <StatStrip label="Total Active Trades" value={String(stats.total_active)} />
              <StatStrip
                label="Win Rate (This Month)"
                value={`${stats.win_rate_monthly}%`}
                sub={
                  stats.has_win_rate_comparison
                    ? `${stats.win_rate_change_pct >= 0 ? "+" : ""}${stats.win_rate_change_pct}% from last month`
                    : undefined
                }
                subClass={
                  stats.win_rate_change_pct >= 0 ? "text-[var(--green)]" : "text-[var(--red)]"
                }
              />
              <StatStrip
                label="Active Subscribers"
                value={stats.active_subscribers.toLocaleString("en-IN")}
              />
            </>
          )}
        </div>

        {/* ── Tab bar ── */}
        <div className="mb-5 flex gap-0 border-b border-[var(--line)]">
          {TAB_OPTIONS.map((tab) => (
            <button
              className={`flex items-center gap-1.5 border-b-2 px-4 pb-3 pt-0.5 text-[13.5px] font-semibold transition-colors ${
                activeTab === tab.id
                  ? "border-[var(--brand)] text-[var(--brand)]"
                  : "border-transparent text-[var(--muted)] hover:text-[var(--ink)]"
              }`}
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              type="button"
            >
              {tab.label}
              {tab.count !== undefined && (
                <span
                  className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                    activeTab === tab.id
                      ? "bg-[var(--brand-light)] text-[var(--brand)]"
                      : "bg-[var(--line)] text-[var(--muted)]"
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ── Tab content ── */}

        {/* ACTIVE TAB */}
        {activeTab === "active" && (
          <div className="space-y-4">
            {activeLoading ? (
              <>
                <TradeCardSkeleton />
                <TradeCardSkeleton />
                <TradeCardSkeleton />
              </>
            ) : activeError ? (
              <div className="rounded-xl border border-[var(--red)]/20 bg-[var(--red-light)] p-5 text-[13px] text-[var(--red)]">
                <Icon className="mr-2 h-4 w-4" name="x" />
                Unable to load trades. Make sure the trade service is running at{" "}
                <code className="rounded bg-[var(--red)]/10 px-1">/trades/</code>.
              </div>
            ) : activeTrades.length === 0 ? (
              <div className="rounded-xl border border-[var(--line)] bg-white p-12 text-center">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--surface)]">
                  <Icon className="h-6 w-6 text-[var(--muted-2)]" name="trendingUp" />
                </div>
                <div className="text-[14px] font-semibold text-[var(--ink)]">No active trades</div>
                <p className="mt-1 text-[12.5px] text-[var(--muted-2)]">
                  Create your first trade to start broadcasting to subscribers.
                </p>
              </div>
            ) : (
              activeTrades.map((trade) => (
                <TradeCard
                  key={trade.trade_id}
                  trade={trade}
                  onBroadcast={setBroadcastTrade}
                  liveLtpProp={livePrices[trade.symbol]}
                  onOptimisticClose={removeTradeLocally}
                  onAutoClose={() => { void refetchActive(); void refetchClosed(); }}
                />
              ))
            )}
          </div>
        )}

        {/* PENDING TAB */}
        {activeTab === "pending" && (
          <div className="space-y-4">
            {pendingLoading ? (
              <TradeCardSkeleton />
            ) : pendingTrades.length === 0 ? (
              <div className="rounded-xl border border-[var(--line)] bg-white p-12 text-center">
                <div className="text-[14px] font-semibold text-[var(--ink)]">No pending trades</div>
                <p className="mt-1 text-[12.5px] text-[var(--muted-2)]">
                  Draft trades awaiting publication will appear here.
                </p>
              </div>
            ) : (
              pendingTrades.map((trade) => (
                <TradeCard key={trade.trade_id} trade={trade} onBroadcast={setBroadcastTrade} liveLtpProp={livePrices[trade.symbol]} />
              ))
            )}
          </div>
        )}

        {/* CLOSED TRADES TAB */}
        {activeTab === "closed" && (
          <div className="space-y-4">
            {closedLoading ? (
              <>
                <TradeCardSkeleton />
                <TradeCardSkeleton />
                <TradeCardSkeleton />
              </>
            ) : closedTrades.length === 0 ? (
              <div className="rounded-xl border border-[var(--line)] bg-white p-12 text-center">
                <div className="text-[14px] font-semibold text-[var(--ink)]">
                  No closed trades yet
                </div>
                <p className="mt-1 text-[12.5px] text-[var(--muted-2)]">
                  Trades you close will appear here with their outcome.
                </p>
              </div>
            ) : (
              closedTrades.map((trade) => (
                <TradeCard key={trade.trade_id} trade={trade} onBroadcast={setBroadcastTrade} hideActions liveLtpProp={livePrices[trade.symbol]} />
              ))
            )}
          </div>
        )}
      </div>

      {broadcastTrade && (
        <BroadcastModal
          trade={broadcastTrade}
          onClose={() => setBroadcastTrade(null)}
          onSuccess={showSuccessToast}
        />
      )}
    </>
  );
}
