"use client";

import React, { useState, useEffect, useRef } from "react";
import { Icon } from "@/components/stoxify-icon";
import type { Trade } from "@/lib/types/analyst";

interface TradeDetailsModalProps {
  trade: Trade | null;
  onClose: () => void;
  liveLtp?: number;
}

export function TradeDetailsModal({ trade, onClose, liveLtp }: TradeDetailsModalProps) {
  if (!trade) return null;

  const isShort = trade.direction === "SHORT" || trade.direction === "SELL";
  const slVal = trade.stop_loss ?? trade.stop_loss_price;
  const targetVal =
    trade.targets && trade.targets.length > 0
      ? isShort
        ? Math.min(...trade.targets.map((t) => t.target_price))
        : Math.max(...trade.targets.map((t) => t.target_price))
      : trade.target ?? trade.target_price;

  const entry = trade.entry_price || 0;

  // Live price via WebSockets
  const [liveLtpState, setLiveLtpState] = useState(liveLtp ?? trade.ltp ?? entry);
  const [priceDirection, setPriceDirection] = useState<"up" | "down" | null>(null);
  const [flashKey, setFlashKey] = useState(0);

  useEffect(() => {
    if (liveLtp !== undefined && liveLtp !== liveLtpState) {
      setPriceDirection(liveLtp > liveLtpState ? "up" : "down");
      setLiveLtpState(liveLtp);
      setFlashKey((k) => k + 1);
    }
  }, [liveLtp, liveLtpState]);

  useEffect(() => {
    if (priceDirection) {
      const t = setTimeout(() => setPriceDirection(null), 800);
      return () => clearTimeout(t);
    }
  }, [priceDirection, flashKey]);

  // Closed vs Live PNL
  const isClosed =
    trade.status === "CLOSED" || trade.status === "TARGET_HIT" || trade.status === "SL_HIT";
  const pnlPercent = isClosed
    ? trade.pnl_percent ?? trade.pnl_pct ?? 0
    : entry > 0
    ? ((isShort ? entry - liveLtpState : liveLtpState - entry) / entry) * 100
    : 0;

  const pnlPerUnit = isClosed
    ? (trade.exit_price ?? entry) - entry
    : isShort
    ? entry - liveLtpState
    : liveLtpState - entry;

  const pnlPositive = pnlPercent >= 0;

  // Planned Risk Reward Ratio — from the setup alone, so it never moves with price.
  const risk = slVal ? Math.abs(entry - slVal) : 0;
  const reward = targetVal ? Math.abs(targetVal - entry) : 0;
  const rrRatio = risk > 0 ? `${(reward / risk).toFixed(2)}x` : "—";

  // Live R-multiple: how far price has travelled from entry, as a multiple of the
  // per-unit risk. 0x at entry, -1.0x at the stop, `rrRatio` once the target lands.
  const liveRMultiple = risk > 0 ? pnlPerUnit / risk : null;
  const liveRr =
    liveRMultiple === null
      ? "—"
      : `${liveRMultiple >= 0 ? "+" : ""}${liveRMultiple.toFixed(2)}x`;

  // Estimated stats
  const estimatedGains = targetVal && entry > 0 ? (Math.abs(targetVal - entry) / entry) * 100 : 0;
  const estimatedRisk = slVal && entry > 0 ? (Math.abs(entry - slVal) / entry) * 100 : 0;

  // Formatting dates
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "—";
    try {
      const d = new Date(dateStr);
      return d.toLocaleString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
    } catch {
      return dateStr;
    }
  };

  const createdDate = formatDate(trade.nse_timestamp ?? trade.created_at ?? (trade as any).entry_timestamp);
  const exitDate = formatDate(trade.exit_timestamp);

  // Duration
  let durationStr = "—";
  const entryTime = trade.nse_timestamp ?? trade.created_at ?? (trade as any).entry_timestamp;
  if (entryTime && trade.exit_timestamp) {
    const start = new Date(entryTime).getTime();
    const end = new Date(trade.exit_timestamp).getTime();
    const diff = Math.max(0, end - start);
    const d = Math.floor(diff / (1000 * 60 * 60 * 24));
    const h = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const m = Math.floor((diff / (1000 * 60)) % 60);
    durationStr = d > 0 ? `${d}d ${h}h` : h > 0 ? `${h}h ${m}m` : `${m}m`;
  }

  // Segment display
  const segmentDisplay = trade.segment_label ?? trade.segment;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop overlay */}
      <div
        className="absolute inset-0 bg-[var(--ink)]/40 backdrop-blur-sm transition-opacity cursor-pointer"
        onClick={onClose}
      />

      {/* Modal card wrapper */}
      <div className="relative w-full max-w-[760px] max-h-[85vh] bg-white rounded-2xl shadow-2xl border border-[var(--line)] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--line)] px-5 py-4 bg-[var(--surface)]">
          <div className="flex items-center gap-2">
            <span className={`h-2 w-2 rounded-full ${isClosed ? "bg-slate-400" : "bg-emerald-500 animate-pulse"}`} />
            <h2 className="text-[16px] font-extrabold text-[var(--ink)]">
              {isClosed ? "Past Trade Details" : "Live Trade Details"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-[var(--muted)] border border-[var(--line)] hover:bg-[var(--surface)] hover:text-[var(--ink)] transition-colors active:scale-95 shadow-sm"
            type="button"
          >
            <Icon name="x" className="h-4 w-4" />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1 text-slate-800">
          {/* Symbol & Direction summary */}
          <div className="flex justify-between items-start border-b border-[var(--line)] pb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full border border-[var(--line)] bg-[var(--surface)] flex items-center justify-center font-bold text-xl text-[var(--brand)] shadow-inner select-none">
                {trade.symbol.charAt(0)}
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-extrabold text-lg text-[var(--ink)]">{trade.symbol}</span>
                  <span className="text-[9px] font-bold border border-slate-200 rounded-full px-2 py-0.5 text-slate-500 bg-slate-50 flex items-center gap-1 leading-none select-none">
                    <span className="w-1.5 h-1.5 rounded-full bg-orange-500" /> NSE
                  </span>
                </div>
                <div className="text-[11px] text-[var(--muted-2)] font-semibold uppercase tracking-wider mt-1">{segmentDisplay}</div>
              </div>
            </div>

            {/* Right side: LTP directly above the badges */}
            <div className="text-right flex flex-col items-end">
              {/* LTP value */}
              <div className={`text-[19px] font-extrabold leading-none text-slate-800 transition-colors duration-300 ${priceDirection === 'up' ? 'text-emerald-600' : priceDirection === 'down' ? 'text-rose-600' : ''}`}>
                ₹{(isClosed ? trade.exit_price ?? liveLtpState : liveLtpState).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </div>
              {/* Return (P&L %) and unit profit */}
              <div className={`text-[11.5px] font-bold mt-1 ${pnlPositive ? "text-emerald-600" : "text-rose-600"}`}>
                {pnlPositive ? "+" : ""}{pnlPercent.toFixed(2)}%
                <span className="text-[10px] ml-1 font-semibold opacity-75">
                  ({pnlPositive ? "+" : ""}₹{Math.abs(pnlPerUnit).toLocaleString("en-IN", { minimumFractionDigits: 2 })})
                </span>
              </div>

              {/* Badges container */}
              <div className="flex items-center gap-1.5 justify-end mt-3 flex-wrap">
                {trade.batch && (
                  <span className="inline-flex rounded-md px-2.5 py-1 text-[10px] font-bold bg-teal-50 border border-teal-200/60 text-teal-600 shadow-xs uppercase tracking-[0.05em] select-none">
                    {trade.batch}
                  </span>
                )}
                <span
                  className={`inline-flex rounded-md px-2.5 py-1 text-[10px] font-bold tracking-[0.05em] uppercase border shadow-sm ${
                    isShort
                      ? "bg-[var(--red-light)] border-[var(--red)]/20 text-[var(--red)]"
                      : "bg-[var(--green-light)] border-[var(--green)]/20 text-[var(--green)]"
                  }`}
                >
                  {trade.direction}
                </span>
              </div>
              <div className="text-[9.5px] text-[var(--muted-2)] mt-1 font-semibold">Category: {trade.trade_subtype ?? "—"}</div>
            </div>
          </div>

          {/* Grid container to divide content horizontally */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-start">
            {/* LEFT COLUMN: Trade Statistics + Targets */}
            <div className="space-y-4">
              {/* Trade Statistics Card */}
              <div className="space-y-2">
                <h3 className="text-[11px] font-bold text-[var(--muted)] uppercase tracking-wider">Trade statistics</h3>
                <div className="border border-[var(--line)] bg-white rounded-xl p-4 shadow-sm space-y-2.5">
                  {!isClosed ? (
                    <>
                      <div className="flex justify-between items-center text-[12.5px] py-0.5 border-b border-[var(--line)] last:border-0">
                        <span className="text-[var(--muted)] font-semibold">Estimated Gains</span>
                        <span className="font-extrabold text-[13.5px] text-[var(--green)]">
                          +{estimatedGains.toFixed(2)}%
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-[12.5px] py-0.5 border-b border-[var(--line)] last:border-0">
                        <span className="text-[var(--muted)] font-semibold">Estimated Risk</span>
                        <span className="font-extrabold text-[13.5px] text-[var(--red)]">
                          -{estimatedRisk.toFixed(2)}%
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-[12.5px] py-0.5 border-b border-[var(--line)] last:border-0">
                        <span className="text-[var(--muted)] font-semibold">Live Return</span>
                        <span className={`font-extrabold text-[13.5px] ${pnlPositive ? "text-[var(--green)]" : "text-[var(--red)]"}`}>
                          {pnlPositive ? "+" : ""}{pnlPercent.toFixed(2)}%
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-[12.5px] py-0.5 last:border-0">
                        <span className="text-[var(--muted)] font-semibold">Live R/R</span>
                        <span className={`font-extrabold text-[13.5px] ${pnlPositive ? "text-[var(--green)]" : "text-[var(--red)]"}`}>
                          {liveRr}
                        </span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex justify-between items-center text-[12.5px] py-0.5 border-b border-[var(--line)] last:border-0">
                        <span className="text-[var(--muted)] font-semibold">Net P&L (realised)</span>
                        <span className={`font-extrabold text-[13.5px] ${pnlPositive ? "text-[var(--green)]" : "text-[var(--red)]"}`}>
                          {pnlPositive ? "+" : ""}{pnlPercent.toFixed(2)}%
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-[12.5px] py-0.5 last:border-0">
                        <span className="text-[var(--muted)] font-semibold">R/R Ratio</span>
                        <span className="font-extrabold text-[13.5px] text-[var(--ink)]">
                          {rrRatio}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Targets & SL Section */}
              <div className="space-y-2">
                <h3 className="text-[11px] font-bold text-[var(--muted)] uppercase tracking-wider">Targets & Stop Loss</h3>
                <div className="border border-[var(--line)] bg-white rounded-xl p-3.5 grid grid-cols-3 gap-2 text-center shadow-sm">
                  <div className="flex flex-col justify-start">
                    <span className="text-[9.5px] text-[var(--muted-2)] font-bold uppercase tracking-wider mb-1">Entry</span>
                    <span className="font-extrabold text-[14px] text-[var(--ink)]">₹{entry.toLocaleString("en-IN")}</span>
                  </div>
                  <div className="w-px bg-[var(--line)] mx-auto h-9" />
                  <div className="flex flex-col justify-start">
                    <span className="text-[9.5px] text-[var(--muted-2)] font-bold uppercase tracking-wider mb-1">Stop Loss</span>
                    <span className="font-extrabold text-[14px] text-[var(--red)]">{slVal ? `₹${slVal.toLocaleString("en-IN")}` : "—"}</span>
                  </div>
                </div>

                {/* Individual Targets List */}
                {trade.targets && trade.targets.length > 0 ? (
                  <div className="bg-[var(--surface)] border border-[var(--line)] rounded-xl p-3.5 space-y-2">
                    <div className="text-[11px] font-extrabold text-[var(--muted)] flex justify-between">
                      <span>Target Levels</span>
                      <span className="text-[var(--green)] font-bold">Risk Reward: {rrRatio}</span>
                    </div>
                    <div className="space-y-1.5">
                      {trade.targets.map((t, idx) => (
                        <div key={idx} className="flex justify-between items-center text-[12px] bg-white px-3 py-2.5 rounded-lg border border-[var(--line)] shadow-sm">
                          <div className="flex items-center gap-2">
                            <span className="h-5 w-5 bg-[var(--green-light)] rounded-full flex items-center justify-center text-[9px] font-black text-[var(--green)] border border-[var(--green)]/20">
                              T{idx + 1}
                            </span>
                            <span className="font-semibold text-[var(--ink)]">₹{t.target_price.toLocaleString("en-IN")}</span>
                          </div>
                          <span className="text-[10px] font-bold text-[var(--muted-2)] bg-[var(--surface)] px-1.5 py-0.5 rounded">
                            Book {t.book_percent}%
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : targetVal ? (
                  <div className="bg-[var(--surface)] border border-[var(--line)] rounded-xl p-3 flex justify-between items-center text-[12px]">
                    <span className="text-[var(--muted)] font-bold">Target Price</span>
                    <span className="font-extrabold text-[var(--green)] text-sm">₹{targetVal.toLocaleString("en-IN")}</span>
                  </div>
                ) : null}
              </div>
            </div>

            {/* RIGHT COLUMN: Metadata & History + Rationale Note */}
            <div className="space-y-4">
              {/* Trade Metadata & Stats */}
              <div className="space-y-2">
                <h3 className="text-[11px] font-bold text-[var(--muted)] uppercase tracking-wider">Metadata & History</h3>
                <div className="border border-[var(--line)] bg-white rounded-xl p-4 shadow-sm space-y-2.5">
                  <div className="flex justify-between items-center text-[12.5px] py-1 border-b border-[var(--line)] last:border-0 last:pb-0">
                    <span className="text-[var(--muted)] font-semibold">Status</span>
                    <span className={`font-extrabold text-[11px] uppercase ${isClosed ? (pnlPositive ? "text-[var(--green)]" : "text-[var(--red)]") : "text-emerald-500 animate-pulse"}`}>
                      {trade.status}
                    </span>
                  </div>

                  {trade.batch && (
                    <div className="flex justify-between items-center text-[12.5px] py-1 border-b border-[var(--line)] last:border-0 last:pb-0">
                      <span className="text-[var(--muted)] font-semibold">Associated Batch</span>
                      <span className="font-bold text-[var(--muted)] bg-[var(--surface)] px-2 py-0.5 rounded border border-[var(--line)] text-[10px]">
                        {trade.batch}
                      </span>
                    </div>
                  )}

                  {trade.analyst_name && (
                    <div className="flex justify-between items-center text-[12.5px] py-1 border-b border-[var(--line)] last:border-0 last:pb-0">
                      <span className="text-[var(--muted)] font-semibold">Analyst</span>
                      <span className="font-bold text-[var(--ink)]">{trade.analyst_name}</span>
                    </div>
                  )}

                  <div className="flex justify-between items-center text-[12.5px] py-1 border-b border-[var(--line)] last:border-0 last:pb-0">
                    <span className="text-[var(--muted)] font-semibold">Published At</span>
                    <span className="font-bold text-[var(--ink)]">{createdDate}</span>
                  </div>

                  {isClosed && (
                    <>
                      <div className="flex justify-between items-center text-[12.5px] py-1 border-b border-[var(--line)] last:border-0 last:pb-0">
                        <span className="text-[var(--muted)] font-semibold">Closed At</span>
                        <span className="font-bold text-[var(--ink)]">{exitDate}</span>
                      </div>
                      <div className="flex justify-between items-center text-[12.5px] py-1 border-b border-[var(--line)] last:border-0 last:pb-0">
                        <span className="text-[var(--muted)] font-semibold">Trade Duration</span>
                        <span className="font-bold text-[var(--ink)]">{durationStr}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Trade Rationale / Notes */}
              {trade.note && (
                <div className="space-y-2">
                  <h3 className="text-[11px] font-bold text-[var(--muted)] uppercase tracking-wider">Analyst Rationale</h3>
                  <div className="border border-[var(--line)] bg-[var(--surface)] rounded-xl p-4 text-[12.5px] text-[var(--muted)] leading-relaxed italic whitespace-pre-line font-medium shadow-inner">
                    &ldquo;{trade.note}&rdquo;
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
