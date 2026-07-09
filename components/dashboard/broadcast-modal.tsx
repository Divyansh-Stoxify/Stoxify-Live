"use client";

import { useState } from "react";
import { Icon } from "@/components/stoxify-icon";
import type { Trade } from "@/lib/types/analyst";
import { cleanErrorMessage } from "@/lib/utils";

interface BroadcastModalProps {
  trade: Trade;
  onClose: () => void;
  onSuccess: (title: string, message: string) => void;
}

export function BroadcastModal({ trade, onClose, onSuccess }: BroadcastModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [channels, setChannels] = useState({
    push: true,
    sms: false,
    telegram: true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) {
      setError("Please enter a message to broadcast.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`/api/analyst/trades/${trade.trade_id}/broadcast`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: message.trim(),
          channels: Object.keys(channels).filter((k) => channels[k as keyof typeof channels]),
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const cleaned = cleanErrorMessage(data, data.message || "Failed to send broadcast");
        throw new Error(cleaned);
      }

      onSuccess(
        "Broadcast Sent",
        `Successfully broadcasted update for ${trade.symbol} to active subscribers.`
      );
      onClose();
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : "An unexpected error occurred.";
      setError(errMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-[var(--ink)]/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-[460px] rounded-2xl bg-white shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 border border-[var(--line)]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--line)] px-5 py-4">
          <h2 className="text-[16px] font-extrabold text-[var(--ink)] flex items-center gap-2">
            <Icon name="send" className="h-4 w-4 text-[var(--brand)]" />
            Broadcast Message
          </h2>
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
            {/* Trade Details Context */}
            <div className="rounded-xl border border-[var(--line)] bg-[#f8fafc] p-4 flex justify-between items-center">
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-[var(--muted)]">
                  Instrument
                </div>
                <div className="text-[15px] font-extrabold text-[var(--ink)]">{trade.symbol}</div>
              </div>
              <div className="text-right">
                <div className="text-[11px] font-bold uppercase tracking-wider text-[var(--muted)]">
                  Current Segment
                </div>
                <span className="inline-flex rounded bg-[var(--brand-light)] text-[var(--brand)] px-2 py-0.5 text-[10.5px] font-bold uppercase border border-[var(--brand)]/15">
                  {trade.segment_label ?? trade.segment}
                </span>
              </div>
            </div>

            {error && (
              <div className="rounded-lg bg-[var(--red-light)] p-3 text-[12.5px] font-semibold text-[var(--red)] border border-[var(--red)]/20">
                {error}
              </div>
            )}

            {/* Message Text area */}
            <div className="space-y-1.5">
              <label className="block text-[13px] font-bold text-[var(--ink)]">
                Broadcast Update <span className="text-[var(--red)]">*</span>
              </label>
              <textarea
                rows={4}
                required
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full resize-none rounded-xl border border-[var(--line)] bg-white p-3.5 text-[13.5px] font-medium text-[var(--ink)] shadow-sm outline-none transition-all placeholder:text-[var(--muted-2)] focus:border-[var(--brand)] focus:ring-4 focus:ring-[var(--brand)]/10"
                placeholder="e.g. Booking 50% profits at target 1. Trailing stop loss to entry price."
              />
            </div>

            {/* Distribution Channels */}
            <div className="space-y-2">
              <label className="block text-[13px] font-bold text-[var(--ink)]">
                Delivery Channels
              </label>
              <div className="grid grid-cols-3 gap-2.5">
                {/* Push Notification */}
                <button
                  type="button"
                  onClick={() => setChannels((c) => ({ ...c, push: !c.push }))}
                  className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all ${
                    channels.push
                      ? "border-[var(--brand)] bg-[var(--brand-light)] text-[var(--brand)] font-bold"
                      : "border-[var(--line)] bg-white text-[var(--muted)] hover:border-[var(--muted-2)]"
                  }`}
                >
                  <Icon name="bell" className="h-5 w-5 mb-1" />
                  <span className="text-[11.5px]">App Push</span>
                </button>

                {/* Telegram */}
                <button
                  type="button"
                  onClick={() => setChannels((c) => ({ ...c, telegram: !c.telegram }))}
                  className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all ${
                    channels.telegram
                      ? "border-[#0088cc] bg-[#eef8ff] text-[#0088cc] font-bold"
                      : "border-[var(--line)] bg-white text-[var(--muted)] hover:border-[var(--muted-2)]"
                  }`}
                >
                  <Icon name="sparkle" className="h-5 w-5 mb-1" />
                  <span className="text-[11.5px]">Telegram</span>
                </button>

                {/* SMS */}
                <button
                  type="button"
                  onClick={() => setChannels((c) => ({ ...c, sms: !c.sms }))}
                  className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all ${
                    channels.sms
                      ? "border-emerald-600 bg-emerald-50 text-emerald-700 font-bold"
                      : "border-[var(--line)] bg-white text-[var(--muted)] hover:border-[var(--muted-2)]"
                  }`}
                >
                  <Icon name="mail" className="h-5 w-5 mb-1" />
                  <span className="text-[11.5px]">SMS Alert</span>
                </button>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex gap-3 border-t border-[var(--line)] bg-[var(--surface)] px-5 py-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 rounded-xl border border-[var(--line)] bg-white py-2.5 text-[13.5px] font-bold text-[var(--ink)] shadow-sm transition-all hover:bg-[var(--line)] disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-[var(--brand)] py-2.5 text-[13.5px] font-bold text-white shadow-sm transition-all hover:bg-[var(--brand-dark)] disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Icon name="loader" className="h-4 w-4 animate-spin" />
                  Broadcasting...
                </>
              ) : (
                <>
                  <Icon name="send" className="h-3.5 w-3.5" />
                  Send Broadcast
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
