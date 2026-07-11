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
        className="absolute inset-0 bg-[var(--ink)]/40 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-[440px] rounded-2xl bg-white shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--line)] px-5 py-4">
          <h2 className="text-[16px] font-extrabold text-[var(--ink)]">Modify Trade</h2>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--surface)] text-[var(--muted)] transition-colors hover:bg-[var(--line)] hover:text-[var(--ink)]"
          >
            <Icon name="x" className="h-4 w-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit}>
          <div className="p-5 space-y-5">
            
            {/* Trade Context Info */}
            <div className="rounded-xl border border-[var(--line)] bg-[#f8fafc] p-4 flex justify-between items-center">
              <div>
                <div className="text-[12px] font-semibold text-[var(--muted)]">Symbol</div>
                <div className="text-[15px] font-extrabold text-[var(--ink)] flex items-center gap-2">
                  {trade.symbol}
                  {ltp !== null && (
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-[var(--brand)]/10 text-[var(--brand)]">
                      LTP: ₹{ltp}
                    </span>
                  )}
                </div>
              </div>
              <div className="text-center border-x border-[var(--line)] px-4">
                <div className="text-[12px] font-semibold text-[var(--muted)] flex items-center justify-center gap-1">
                  <Icon name="lock" className="h-3 w-3" /> Entry
                </div>
                <div className="text-[13px] font-bold text-[var(--ink)]">₹{trade.entry_price}</div>
              </div>
              <div className="text-right">
                <div className="text-[12px] font-semibold text-[var(--muted)]">Direction</div>
                <div className={`text-[12.5px] font-bold ${trade.direction === "LONG" || trade.direction === "BUY" ? "text-[var(--green)]" : "text-[var(--red)]"}`}>
                  {trade.direction}
                </div>
              </div>
            </div>

            {error && (
              <div className="rounded-lg bg-[var(--red-light)] p-3 text-[12.5px] font-semibold text-[var(--red)]">
                {error}
              </div>
            )}

            <div className="flex gap-4">
              {/* Stop Loss */}
              <div className="flex-1">
                <label className="mb-1.5 block text-[13px] font-bold text-[var(--ink)]">
                  Stop Loss <span className="text-[var(--muted-2)] font-medium">(Opt)</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[15px] font-bold text-[var(--muted)]">
                    ₹
                  </span>
                  <input
                    type="number"
                    step="0.05"
                    value={stopLoss}
                    onChange={(e) => setStopLoss(e.target.value)}
                    className="w-full rounded-xl border border-[var(--line)] bg-white py-2.5 pl-8 pr-4 text-[14px] font-semibold text-[var(--ink)] shadow-sm outline-none transition-all placeholder:text-[var(--muted-2)] focus:border-[var(--brand)] focus:ring-4 focus:ring-[var(--brand)]/10"
                    placeholder="0.00"
                  />
                </div>
              </div>

              {/* Targets */}
              <div className="flex-1 flex flex-col gap-2">
                <div className="flex items-center justify-between mb-0.5">
                  <label className="block text-[13px] font-bold text-[var(--ink)]">
                    Target Prices <span className="text-[var(--muted-2)] font-medium">(Opt)</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      if (targets.length >= 5) return;
                      const remainingPct = 100 - targets.reduce((acc, t) => acc + (parseFloat(t.percent) || 0), 0);
                      setTargets([...targets, { price: "", percent: remainingPct > 0 ? String(remainingPct) : "0" }]);
                    }}
                    disabled={targets.length >= 5}
                    className="text-[11px] font-bold text-[var(--brand)] hover:text-[var(--brand-dark)] transition-colors flex items-center gap-1 disabled:opacity-50"
                  >
                    <Icon name="plus" className="h-3 w-3" /> Add
                  </button>
                </div>
                {targets.map((t, index) => (
                  <div key={index} className="flex gap-2 items-center">
                    <div className="relative flex-1">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[15px] font-bold text-[var(--muted)]">₹</span>
                      <input
                        className="w-full rounded-xl border border-[var(--line)] bg-white py-2.5 pl-8 pr-3 text-[14px] font-semibold text-[var(--ink)] shadow-sm outline-none transition-all placeholder:text-[var(--muted-2)] focus:border-[var(--brand)] focus:ring-4 focus:ring-[var(--brand)]/10"
                        placeholder={`T${index + 1}`}
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
                    <div className="relative w-[85px]">
                      <input
                        className="w-full rounded-xl border border-[var(--line)] bg-white py-2.5 pl-3 pr-6 text-[14px] font-semibold text-[var(--ink)] shadow-sm outline-none transition-all focus:border-[var(--brand)] focus:ring-4 focus:ring-[var(--brand)]/10"
                        placeholder="%"
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
                      <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[13px] font-bold text-[var(--muted)]">%</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const newTargets = targets.filter((_, i) => i !== index);
                        setTargets(newTargets);
                      }}
                      className="text-[var(--muted)] hover:text-[var(--red)] transition-colors"
                      disabled={targets.length === 1}
                    >
                      <Icon name="trash" className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Modification Reason */}
            <div>
              <label className="mb-1.5 block text-[13px] font-bold text-[var(--ink)]">
                Reason for Modification <span className="text-[var(--red)]">*</span>
              </label>
              <textarea
                rows={2}
                required
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full resize-none rounded-xl border border-[var(--line)] bg-white p-3 text-[14px] font-semibold text-[var(--ink)] shadow-sm outline-none transition-all placeholder:text-[var(--muted-2)] focus:border-[var(--brand)] focus:ring-4 focus:ring-[var(--brand)]/10"
                placeholder="e.g. Trailing SL due to market volatility"
              />
            </div>
            
          </div>

          {/* Footer Actions */}
          <div className="flex gap-3 border-t border-[var(--line)] bg-[var(--surface)] px-5 py-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 rounded-xl border border-[var(--line)] bg-white py-2.5 text-[14px] font-bold text-[var(--ink)] shadow-sm transition-all hover:bg-[var(--line)] disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-[var(--brand)] py-2.5 text-[14px] font-bold text-white shadow-sm transition-all hover:bg-[var(--brand-dark)] disabled:opacity-50"
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
