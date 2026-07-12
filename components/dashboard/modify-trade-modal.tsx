"use client";

import { useState } from "react";
import { Icon } from "@/components/stoxify-icon";
import type { Trade } from "@/lib/types/analyst";
import { cleanErrorMessage } from "@/lib/utils";

interface ModifyTradeModalProps {
  trade: Trade;
  onClose: () => void;
  onSuccess: (title: string, message: string) => void;
  /** Live symbol → LTP map from the shared dashboard WebSocket */
  livePrices?: Record<string, number>;
}

export function ModifyTradeModal({ trade, onClose, onSuccess, livePrices }: ModifyTradeModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pre-fill existing targets and stop loss
  const [stopLoss, setStopLoss] = useState<string>((trade.stop_loss ?? trade.stop_loss_price ?? "").toString());
  const initialTargets = trade.targets && trade.targets.length > 0
    ? trade.targets.map((t: any) => ({ price: String(t.target_price), percent: String(t.book_percent) }))
    : [{ price: String(trade.target ?? trade.target_price ?? ""), percent: "100" }];
  const [targets, setTargets] = useState<{ price: string; percent: string }[]>(initialTargets);
  const [reason, setReason] = useState("");

  // Live LTP comes from the shared dashboard WebSocket feed (no per-symbol
  // polling). Fall back to the last-known LTP carried on the trade.
  const ltp = livePrices?.[trade.symbol] ?? trade.ltp ?? null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      if (!reason.trim()) {
        throw new Error("Modification reason is required.");
      }

      const payload: any = { modification_reason: reason.trim() };
      
      const slValue = parseFloat(stopLoss);
      if (ltp !== null) {
        if (!isNaN(slValue) && slValue > 0) {
          if ((trade.direction === "LONG" || trade.direction === "BUY") && slValue >= ltp) {
            throw new Error(`SL (₹${slValue}) must be less than current market price (₹${ltp})`);
          }
          if ((trade.direction === "SHORT" || trade.direction === "SELL") && slValue <= ltp) {
            throw new Error(`SL (₹${slValue}) must be greater than current market price (₹${ltp})`);
          }
        }
        for (const t of targets) {
          const tp = parseFloat(t.price);
          if (!isNaN(tp) && tp > 0) {
            if ((trade.direction === "LONG" || trade.direction === "BUY") && tp <= ltp) {
              throw new Error(`Target (₹${tp}) must be greater than current market price (₹${ltp})`);
            }
            if ((trade.direction === "SHORT" || trade.direction === "SELL") && tp >= ltp) {
              throw new Error(`Target (₹${tp}) must be less than current market price (₹${ltp})`);
            }
          }
        }
      }
      // Only send the stop loss when the analyst actually changed it. The field is
      // pre-filled, so re-sending an unchanged value would log a phantom "Stop Loss
      // Updated" action and could trip buffer validation on a target-only edit.
      const originalSl = trade.stop_loss ?? trade.stop_loss_price;
      if (!isNaN(slValue) && slValue > 0 && slValue !== originalSl) {
        payload.stop_loss = slValue;
      }

      const validTargets = targets.filter(t => parseFloat(t.price) > 0 && parseFloat(t.percent) > 0);
      if (validTargets.length > 0) {
        let totalPercent = 0;
        const parsedTargets = validTargets.map(t => {
          const bp = parseFloat(t.percent);
          if (isNaN(bp) || bp <= 0 || bp > 100) {
            throw new Error("Target allocation percentage must be between 1% and 100%.");
          }
          totalPercent += bp;
          return { target_price: parseFloat(t.price), book_percent: bp };
        });

        if (Math.abs(totalPercent - 100) > 0.01) {
          throw new Error("Total book percentage must equal exactly 100%.");
        }

        // Only send targets when they differ from what's already on the trade.
        const originalTargets = initialTargets
          .filter(t => parseFloat(t.price) > 0 && parseFloat(t.percent) > 0)
          .map(t => ({ target_price: parseFloat(t.price), book_percent: parseFloat(t.percent) }));
        const targetsChanged =
          originalTargets.length !== parsedTargets.length ||
          parsedTargets.some((t, i) =>
            t.target_price !== originalTargets[i].target_price ||
            t.book_percent !== originalTargets[i].book_percent);
        if (targetsChanged) {
          payload.targets = parsedTargets;
        }
      }

      if (payload.stop_loss === undefined && payload.targets === undefined) {
        throw new Error("No changes detected. Update the stop loss or a target before submitting.");
      }

      const res = await fetch(`/api/analyst/trades/${trade.trade_id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const cleaned = cleanErrorMessage(data, data.message || `Failed to modify trade: ${res.statusText}`);
        throw new Error(cleaned);
      }

      onSuccess("Trade Modified", `Successfully updated ${trade.symbol}.`);
      onClose();
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-[6px] transition-opacity duration-300" 
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-[440px] rounded-[24px] bg-gradient-to-b from-white to-slate-50 border border-slate-100 shadow-[0_20px_50px_rgba(15,23,42,0.08),0_1px_3px_rgba(0,0,0,0.02)] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Decorative Top Accent */}
        <div className="h-1.5 w-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500" />
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4.5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
              <Icon name="edit" className="h-4 w-4" />
            </div>
            <h2 className="text-[16px] font-bold text-slate-800 tracking-tight">Modify Trade</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-50 text-slate-400 transition-all duration-200 hover:bg-slate-100 hover:text-slate-700 hover:rotate-90"
          >
            <Icon name="x" className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-5">
            
            {/* Trade Context Info */}
            <div className="rounded-2xl border border-slate-100 bg-gradient-to-r from-slate-50 via-slate-100/50 to-slate-50 p-4 flex justify-between items-center shadow-inner">
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Symbol</div>
                <div className="text-[15px] font-extrabold text-slate-800 flex items-center gap-1.5 mt-0.5">
                  {trade.symbol}
                  {ltp !== null && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      ₹{ltp}
                    </span>
                  )}
                </div>
              </div>
              <div className="text-center border-x border-slate-200/80 px-5">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-center gap-1">
                  <Icon name="lock" className="h-3 w-3 text-slate-400" /> Entry
                </div>
                <div className="text-[14px] font-extrabold text-slate-700 mt-0.5">₹{trade.entry_price}</div>
              </div>
              <div className="text-right">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Direction</div>
                <div className="mt-0.5">
                  {trade.direction === "LONG" || trade.direction === "BUY" ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/40 shadow-[0_2px_8px_rgba(16,185,129,0.04)]">
                      <Icon name="trendingUp" className="h-3.5 w-3.5" />
                      {trade.direction}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200/40 shadow-[0_2px_8px_rgba(244,63,94,0.04)]">
                      <Icon name="trendingDown" className="h-3.5 w-3.5" />
                      {trade.direction}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {error && (
              <div className="rounded-xl bg-rose-50 border border-rose-100 p-3.5 text-[12.5px] font-semibold text-rose-600 flex items-center gap-2 animate-in fade-in slide-in-from-top-1 duration-200">
                <span className="flex h-1.5 w-1.5 rounded-full bg-rose-500 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Stop Loss & Targets Stack */}
            <div className="space-y-4">
              {/* Stop Loss */}
              <div>
                <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Stop Loss <span className="text-slate-400 font-medium lowercase italic">(optional)</span>
                </label>
                <div className="relative group">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[14px] font-extrabold text-slate-400 transition-colors group-focus-within:text-blue-500">
                    ₹
                  </span>
                  <input
                    type="number"
                    step="0.05"
                    value={stopLoss}
                    onChange={(e) => setStopLoss(e.target.value)}
                    className="w-full rounded-xl border border-slate-200/80 bg-white py-2.5 pl-8 pr-4 text-[14px] font-semibold text-slate-700 shadow-sm outline-none transition-all placeholder:text-slate-300 hover:border-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-100/50"
                    placeholder="0.00"
                  />
                </div>
              </div>

              {/* Targets */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Target Prices <span className="text-slate-400 font-medium lowercase italic">(optional)</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      if (targets.length >= 5) return;
                      const remainingPct = 100 - targets.reduce((acc, t) => acc + (parseFloat(t.percent) || 0), 0);
                      setTargets([...targets, { price: "", percent: remainingPct > 0 ? String(remainingPct) : "0" }]);
                    }}
                    disabled={targets.length >= 5}
                    className="text-[12px] font-bold text-blue-600 hover:text-blue-700 transition-all flex items-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed hover:scale-105 active:scale-95"
                  >
                    <Icon name="plus" className="h-3 w-3" /> Add Target
                  </button>
                </div>
                
                <div className="space-y-2 max-h-[190px] overflow-y-auto pr-1 no-scrollbar">
                  {targets.map((t, index) => (
                    <div 
                      key={index} 
                      className="flex gap-2 items-center animate-in slide-in-from-top-1 duration-200"
                    >
                      {/* Target Indicator Badge */}
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-[11px] font-bold text-slate-500 border border-slate-200/40">
                        T{index + 1}
                      </span>
                      
                      {/* Price Input */}
                      <div className="relative flex-1 group">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[14px] font-extrabold text-slate-400 transition-colors group-focus-within:text-blue-500">₹</span>
                        <input
                          className="w-full rounded-xl border border-slate-200/80 bg-white py-2.5 pl-8 pr-3 text-[14px] font-semibold text-slate-700 shadow-sm outline-none transition-all placeholder:text-slate-300 hover:border-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-100/50"
                          placeholder="Price"
                          type="number"
                          step="0.05"
                          value={t.price}
                          onChange={(e) => {
                            const newTargets = [...targets];
                            newTargets[index].price = e.target.value;
                            setTargets(newTargets);
                          }}
                        />
                      </div>

                      {/* Percentage Input */}
                      <div className="relative w-[95px] group">
                        <input
                          className="w-full rounded-xl border border-slate-200/80 bg-white py-2.5 pl-3.5 pr-8 text-[14px] font-semibold text-slate-700 shadow-sm outline-none transition-all placeholder:text-slate-300 hover:border-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-100/50"
                          placeholder="Alloc"
                          type="number"
                          min="1"
                          max="100"
                          value={t.percent}
                          onChange={(e) => {
                            const newTargets = [...targets];
                            newTargets[index].percent = e.target.value;
                            setTargets(newTargets);
                          }}
                        />
                        <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[12px] font-bold text-slate-400 transition-colors group-focus-within:text-blue-500">%</span>
                      </div>

                      {/* Delete Action */}
                      <button
                        type="button"
                        onClick={() => {
                          const newTargets = targets.filter((_, i) => i !== index);
                          setTargets(newTargets);
                        }}
                        className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 hover:bg-rose-50 hover:text-rose-600 border border-transparent hover:border-rose-100 transition-all"
                        disabled={targets.length === 1}
                      >
                        <Icon name="trash" className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Modification Reason */}
            <div>
              <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Reason for Modification <span className="text-rose-500 font-extrabold">*</span>
              </label>
              <textarea
                rows={2}
                required
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full resize-none rounded-xl border border-slate-200/80 bg-white p-3 text-[14px] font-semibold text-slate-700 shadow-sm outline-none transition-all placeholder:text-slate-300 hover:border-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-100/50"
                placeholder="e.g. Trailing SL due to market volatility"
              />
            </div>
            
          </div>

          {/* Footer Actions */}
          <div className="flex gap-3 border-t border-slate-100 bg-slate-50/50 px-6 py-4.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 rounded-xl border border-slate-200 bg-white py-2.5 text-[14px] font-bold text-slate-600 shadow-sm transition-all hover:bg-slate-50 hover:border-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:scale-[1.01] active:scale-[0.99]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 py-2.5 text-[14px] font-bold text-white shadow-md shadow-blue-500/10 hover:shadow-lg hover:shadow-blue-500/15 transition-all hover:scale-[1.01] active:scale-[0.99] hover:from-blue-700 hover:to-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Icon name="loader" className="h-4 w-4 animate-spin" />
                  Modifying...
                </>
              ) : (
                "Confirm Modification"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
