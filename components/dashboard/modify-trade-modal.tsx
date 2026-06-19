"use client";

import { useState } from "react";
import { Icon } from "@/components/stoxify-icon";
import type { Trade } from "@/lib/types/analyst";

interface ModifyTradeModalProps {
  trade: Trade;
  onClose: () => void;
  onSuccess: (title: string, message: string) => void;
}

export function ModifyTradeModal({ trade, onClose, onSuccess }: ModifyTradeModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pre-fill existing targets and stop loss
  const [stopLoss, setStopLoss] = useState<string>((trade.stop_loss ?? trade.stop_loss_price ?? "").toString());
  const [target, setTarget] = useState<string>((trade.target ?? trade.target_price ?? "").toString());
  const [reason, setReason] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      if (!reason.trim()) {
        throw new Error("Modification reason is required.");
      }

      const slValue = parseFloat(stopLoss);
      const targetValue = parseFloat(target);

      const payload: any = { modification_reason: reason.trim() };
      if (!isNaN(slValue) && slValue > 0) payload.stop_loss = slValue;
      if (!isNaN(targetValue) && targetValue > 0) payload.target = targetValue;

      if (!payload.stop_loss && !payload.target) {
        throw new Error("Please provide at least a stop loss or a target.");
      }

      const res = await fetch(`/api/analyst/trades/${trade.trade_id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || `Failed to modify trade: ${res.statusText}`);
      }

      onSuccess("Trade Modified", `Successfully updated ${trade.symbol}.`);
      
      // Delay briefly to allow toast to render, then reload to refresh all data seamlessly
      setTimeout(() => {
        window.location.reload();
      }, 800);
      
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
                <div className="text-[15px] font-extrabold text-[var(--ink)]">{trade.symbol}</div>
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

              {/* Target */}
              <div className="flex-1">
                <label className="mb-1.5 block text-[13px] font-bold text-[var(--ink)]">
                  Target <span className="text-[var(--muted-2)] font-medium">(Opt)</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[15px] font-bold text-[var(--muted)]">
                    ₹
                  </span>
                  <input
                    type="number"
                    step="0.05"
                    value={target}
                    onChange={(e) => setTarget(e.target.value)}
                    className="w-full rounded-xl border border-[var(--line)] bg-white py-2.5 pl-8 pr-4 text-[14px] font-semibold text-[var(--ink)] shadow-sm outline-none transition-all placeholder:text-[var(--muted-2)] focus:border-[var(--brand)] focus:ring-4 focus:ring-[var(--brand)]/10"
                    placeholder="0.00"
                  />
                </div>
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
