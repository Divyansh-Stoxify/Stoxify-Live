"use client";

import React, { useState, useEffect, useRef } from "react";
import { useSWRConfig } from "swr";
import { Icon } from "@/app/components/stoxify-icon";
import { addMockTrade } from "@/app/lib/mock-data";
import type { Trade, TradeDirection } from "@/app/lib/types";

interface CreateTradeModalProps {
  onClose: () => void;
  onSuccess: (title: string, message: string) => void;
}

// Typical Indian market symbols for autocomplete search
const POPULAR_SYMBOLS = [
  { symbol: "RELIANCE", segment: "EQUITY" },
  { symbol: "HDFCBANK", segment: "EQUITY" },
  { symbol: "TCS", segment: "EQUITY" },
  { symbol: "INFY", segment: "EQUITY" },
  { symbol: "ICICIBANK", segment: "EQUITY" },
  { symbol: "SBIN", segment: "EQUITY" },
  { symbol: "BHARTIARTL", segment: "EQUITY" },
  { symbol: "LTIM", segment: "EQUITY" },
  { symbol: "NIFTY 21MAR 22000 PE", segment: "FNO" },
  { symbol: "BANKNIFTY 48000 CE", segment: "FNO" },
  { symbol: "FINNIFTY 20600 CE", segment: "FNO" },
  { symbol: "NIFTY 22200 CE", segment: "FNO" },
];

export function CreateTradeModal({ onClose, onSuccess }: CreateTradeModalProps) {
  const { mutate } = useSWRConfig();

  // Form states
  const [symbolQuery, setSymbolQuery] = useState("");
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [tradeStructure, setTradeStructure] = useState<"SIMPLE" | "PAIR">("SIMPLE");
  const [segment, setSegment] = useState<"EQUITY" | "FNO">("EQUITY");
  const [position, setPosition] = useState<"LONG" | "SHORT">("LONG");
  const [category, setCategory] = useState<"INTRADAY" | "SWING">("INTRADAY");
  const [entryPrice, setEntryPrice] = useState("");
  const [targetPrice, setTargetPrice] = useState("");
  const [stopLoss, setStopLoss] = useState("");
  const [notes, setNotes] = useState("");

  // Validation / Loading states
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const autocompleteRef = useRef<HTMLDivElement>(null);

  // Close autocomplete on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (autocompleteRef.current && !autocompleteRef.current.contains(event.target as Node)) {
        setShowAutocomplete(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filter symbols for search query
  const filteredSymbols = POPULAR_SYMBOLS.filter((s) =>
    s.symbol.toLowerCase().includes(symbolQuery.toLowerCase())
  );

  const handleSelectSymbol = (item: (typeof POPULAR_SYMBOLS)[0]) => {
    setSymbolQuery(item.symbol);
    setSegment(item.segment as "EQUITY" | "FNO");
    setShowAutocomplete(false);
    // Clear symbol error if it was set
    if (errors.symbol) {
      setErrors((prev) => ({ ...prev, symbol: "" }));
    }
  };

  const validate = () => {
    const nextErrors: { [key: string]: string } = {};

    if (!symbolQuery.trim()) {
      nextErrors.symbol = "Instrument Symbol is required";
    }

    const entry = parseFloat(entryPrice);
    const target = parseFloat(targetPrice);
    const sl = parseFloat(stopLoss);

    if (isNaN(entry) || entry <= 0) {
      nextErrors.entry = "Enter a valid entry price (> 0)";
    }

    if (isNaN(target) || target <= 0) {
      nextErrors.target = "Enter a valid target price (> 0)";
    }

    if (isNaN(sl) || sl <= 0) {
      nextErrors.stopLoss = "Enter a valid stop loss (> 0)";
    }

    // Stop Loss and Target placement validation
    if (!isNaN(entry) && entry > 0) {
      if (position === "LONG") {
        if (!isNaN(sl) && sl >= entry) {
          nextErrors.stopLoss = "For Long position, Stop Loss must be less than Entry";
        }
        if (!isNaN(target) && target <= entry) {
          nextErrors.target = "For Long position, Target must be greater than Entry";
        }
      } else {
        // SHORT
        if (!isNaN(sl) && sl <= entry) {
          nextErrors.stopLoss = "For Short position, Stop Loss must be greater than Entry";
        }
        if (!isNaN(target) && target >= entry) {
          nextErrors.target = "For Short position, Target must be less than Entry";
        }
      }
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);

    // Simulate API network latency
    setTimeout(() => {
      setIsSubmitting(false);

      const entry = parseFloat(entryPrice);
      const target = parseFloat(targetPrice);
      const sl = parseFloat(stopLoss);

      // Map position toggle to standard direction direction string
      let direction: TradeDirection = "LONG";
      if (segment === "EQUITY") {
        direction = position === "LONG" ? "LONG" : "SHORT";
      } else {
        direction = position === "LONG" ? "BUY" : "SELL";
      }

      const riskVal = Math.abs(entry - sl) / entry;
      const rewardVal = Math.abs(target - entry) / entry;

      const newTrade: Trade = {
        trade_id: `trade_${Date.now()}`,
        symbol: symbolQuery.toUpperCase(),
        segment: segment,
        segment_label: segment === "FNO" ? "FNO - OPTIONS" : "EQUITY",
        trade_type: tradeStructure,
        trade_subtype: category,
        direction: direction,
        entry_price: entry,
        target_price: target,
        stop_loss_price: sl,
        ltp: entry,
        ltp_change_pct: 0.0,
        risk_pct: Math.round(riskVal * 1000) / 10,
        reward_pct: Math.round(rewardVal * 1000) / 10,
        pnl_pct: 0.0,
        pnl_per_unit: 0.0,
        pnl_unit: segment === "EQUITY" ? "share" : "lot",
        status: "ACTIVE",
        note: notes.trim() || undefined,
        is_live_streaming: false,
        live_viewers: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Add to local mock database array
      addMockTrade(newTrade);

      // Mutate all SWR keys matching "/trades/" to revalidate and update UI
      mutate((key) => typeof key === "string" && key.startsWith("/trades/"));
      mutate((key) => typeof key === "string" && key.startsWith("/analytics/"));

      // Trigger success confirmation toast notification
      const dirText = position === "LONG" ? "LONG" : "SHORT";
      onSuccess(
        "Trade Created Successfully",
        `${newTrade.symbol} ${dirText} trade has been created and broadcasted to 1,248 active subscribers.`
      );

      // Close the modal
      onClose();
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-[9990] flex items-center justify-center bg-black/45 backdrop-blur-[2px] p-4 animate-[fadeIn_0.2s_ease-out]">
      <div className="relative w-[520px] max-w-full rounded-2xl bg-white shadow-[0_24px_64px_rgba(0,0,0,0.15)] border border-[var(--line)] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4.5 flex items-center justify-between border-b border-dashed border-[#1f7ae0]/25">
          <h2 className="text-[16.5px] font-bold text-[var(--ink)] tracking-[-0.2px]">
            Create Trade
          </h2>
          <button
            aria-label="Close modal"
            className="flex h-7 w-7 items-center justify-center rounded-lg text-[var(--muted-2)] transition-colors hover:bg-[var(--surface)] hover:text-[var(--ink)]"
            onClick={onClose}
            type="button"
          >
            <Icon className="h-4.5 w-4.5" name="x" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="p-6 flex flex-col gap-4">
            {/* Instrument Symbol Search */}
            <div className="relative" ref={autocompleteRef}>
              <label className="block text-[11.5px] font-bold text-[var(--muted)] uppercase tracking-[0.05em] mb-1.5">
                Instrument Symbol
              </label>
              <div className="relative">
                <Icon
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--muted-2)] h-4 w-4"
                  name="search"
                />
                <input
                  className={`w-full rounded-lg border bg-white py-2.5 pl-10 pr-4 text-[13px] text-[var(--ink)] transition-all placeholder:text-[var(--muted-2)] focus:outline-none focus:ring-1 focus:ring-[var(--brand)] ${
                    errors.symbol
                      ? "border-[var(--red)] ring-[var(--red)]/20"
                      : "border-[var(--line)]"
                  }`}
                  onFocus={() => setShowAutocomplete(true)}
                  onChange={(e) => {
                    setSymbolQuery(e.target.value);
                    setShowAutocomplete(true);
                  }}
                  placeholder="Search stocks, futures, options..."
                  type="text"
                  value={symbolQuery}
                />
              </div>
              {errors.symbol && (
                <div className="text-[11px] text-[var(--red)] font-semibold mt-1 flex items-center gap-1">
                  <Icon name="x" className="h-2.5 w-2.5" />
                  {errors.symbol}
                </div>
              )}

              {/* Autocomplete Dropdown */}
              {showAutocomplete && filteredSymbols.length > 0 && (
                <div className="absolute top-[calc(100%+4px)] left-0 right-0 z-[100] max-h-48 overflow-y-auto rounded-lg border border-[var(--line)] bg-white py-1 shadow-lg">
                  {filteredSymbols.map((item) => (
                    <button
                      className="w-full px-4 py-2 text-left text-[12.5px] text-[var(--ink)] hover:bg-[var(--surface)] transition-colors flex items-center justify-between"
                      key={item.symbol}
                      onClick={() => handleSelectSymbol(item)}
                      type="button"
                    >
                      <span className="font-bold">{item.symbol}</span>
                      <span className="text-[10px] font-bold bg-[var(--line)] px-1.5 py-0.5 rounded text-[var(--muted)] uppercase">
                        {item.segment}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Toggle Row 1: Trade Structure & Segment */}
            <div className="grid grid-cols-2 gap-4">
              {/* Structure */}
              <div>
                <label className="block text-[11.5px] font-bold text-[var(--muted)] uppercase tracking-[0.05em] mb-1.5">
                  Trade Structure
                </label>
                <div className="flex bg-[var(--surface)] p-1 rounded-lg border border-[var(--line)]">
                  <button
                    className={`flex-1 py-1.5 text-center text-[12px] font-bold rounded-md transition-all ${
                      tradeStructure === "SIMPLE"
                        ? "bg-white text-[var(--ink)] shadow-sm border border-[var(--line)]/50"
                        : "text-[var(--muted)] hover:text-[var(--ink)]"
                    }`}
                    onClick={() => setTradeStructure("SIMPLE")}
                    type="button"
                  >
                    Simple
                  </button>
                  <button
                    className={`flex-1 py-1.5 text-center text-[12px] font-bold rounded-md transition-all ${
                      tradeStructure === "PAIR"
                        ? "bg-white text-[var(--ink)] shadow-sm border border-[var(--line)]/50"
                        : "text-[var(--muted)] hover:text-[var(--ink)]"
                    }`}
                    onClick={() => setTradeStructure("PAIR")}
                    type="button"
                  >
                    Pair
                  </button>
                </div>
              </div>

              {/* Segment */}
              <div>
                <label className="block text-[11.5px] font-bold text-[var(--muted)] uppercase tracking-[0.05em] mb-1.5">
                  Segment
                </label>
                <div className="flex bg-[var(--surface)] p-1 rounded-lg border border-[var(--line)]">
                  <button
                    className={`flex-1 py-1.5 text-center text-[12px] font-bold rounded-md transition-all ${
                      segment === "EQUITY"
                        ? "bg-white text-[var(--ink)] shadow-sm border border-[var(--line)]/50"
                        : "text-[var(--muted)] hover:text-[var(--ink)]"
                    }`}
                    onClick={() => setSegment("EQUITY")}
                    type="button"
                  >
                    Equity
                  </button>
                  <button
                    className={`flex-1 py-1.5 text-center text-[12px] font-bold rounded-md transition-all ${
                      segment === "FNO"
                        ? "bg-white text-[var(--ink)] shadow-sm border border-[var(--line)]/50"
                        : "text-[var(--muted)] hover:text-[var(--ink)]"
                    }`}
                    onClick={() => setSegment("FNO")}
                    type="button"
                  >
                    FnO
                  </button>
                </div>
              </div>
            </div>

            {/* Toggle Row 2: Position & Category */}
            <div className="grid grid-cols-2 gap-4">
              {/* Position */}
              <div>
                <label className="block text-[11.5px] font-bold text-[var(--muted)] uppercase tracking-[0.05em] mb-1.5">
                  Position
                </label>
                <div className="flex bg-[var(--surface)] p-1 rounded-lg border border-[var(--line)]">
                  <button
                    className={`flex-1 py-1.5 text-center text-[12px] font-bold rounded-md transition-all ${
                      position === "LONG"
                        ? "bg-white text-[var(--green)] shadow-sm border border-[var(--line)]/50"
                        : "text-[var(--muted)] hover:text-[var(--ink)]"
                    }`}
                    onClick={() => setPosition("LONG")}
                    type="button"
                  >
                    Long
                  </button>
                  <button
                    className={`flex-1 py-1.5 text-center text-[12px] font-bold rounded-md transition-all ${
                      position === "SHORT"
                        ? "bg-white text-[var(--red)] shadow-sm border border-[var(--line)]/50"
                        : "text-[var(--muted)] hover:text-[var(--ink)]"
                    }`}
                    onClick={() => setPosition("SHORT")}
                    type="button"
                  >
                    Short
                  </button>
                </div>
              </div>

              {/* Category */}
              <div>
                <label className="block text-[11.5px] font-bold text-[var(--muted)] uppercase tracking-[0.05em] mb-1.5">
                  Category
                </label>
                <div className="relative">
                  <select
                    className="w-full appearance-none rounded-lg border border-[var(--line)] bg-white py-2 px-3.5 text-[12.5px] font-medium text-[var(--ink)] transition-colors focus:outline-none focus:ring-1 focus:ring-[var(--brand)]"
                    onChange={(e) => setCategory(e.target.value as "INTRADAY" | "SWING")}
                    value={category}
                  >
                    <option value="INTRADAY">Intraday</option>
                    <option value="SWING">Swing</option>
                  </select>
                  <Icon
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--muted-2)] pointer-events-none h-3 w-3"
                    name="chevronDown"
                  />
                </div>
              </div>
            </div>

            {/* Price Row: Entry Price, Target Price, Stop Loss */}
            <div className="grid grid-cols-3 gap-3">
              {/* Entry */}
              <div>
                <label className="block text-[11.5px] font-bold text-[var(--muted)] uppercase tracking-[0.05em] mb-1.5">
                  Entry Price
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[12.5px] font-medium text-[var(--muted-2)]">
                    ₹
                  </span>
                  <input
                    className={`w-full rounded-lg border bg-white py-2 pl-6 pr-3.5 text-[13px] font-medium text-[var(--ink)] transition-colors focus:outline-none focus:ring-1 focus:ring-[var(--brand)] ${
                      errors.entry ? "border-[var(--red)]" : "border-[var(--line)]"
                    }`}
                    onChange={(e) => setEntryPrice(e.target.value)}
                    placeholder="0.00"
                    type="number"
                    step="0.05"
                    value={entryPrice}
                  />
                </div>
                {errors.entry && (
                  <div className="text-[10px] text-[var(--red)] font-semibold mt-1 leading-snug">
                    {errors.entry}
                  </div>
                )}
              </div>

              {/* Target */}
              <div>
                <label className="block text-[11.5px] font-bold text-[var(--muted)] uppercase tracking-[0.05em] mb-1.5">
                  Target Price
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[12.5px] font-medium text-[var(--muted-2)]">
                    ₹
                  </span>
                  <input
                    className={`w-full rounded-lg border bg-white py-2 pl-6 pr-3.5 text-[13px] font-medium text-[var(--ink)] transition-colors focus:outline-none focus:ring-1 focus:ring-[var(--brand)] ${
                      errors.target ? "border-[var(--red)]" : "border-[var(--line)]"
                    }`}
                    onChange={(e) => setTargetPrice(e.target.value)}
                    placeholder="0.00"
                    type="number"
                    step="0.05"
                    value={targetPrice}
                  />
                </div>
                {errors.target && (
                  <div className="text-[10px] text-[var(--red)] font-semibold mt-1 leading-snug">
                    {errors.target}
                  </div>
                )}
              </div>

              {/* Stop Loss */}
              <div>
                <label className="block text-[11.5px] font-bold text-[var(--muted)] uppercase tracking-[0.05em] mb-1.5">
                  Stop Loss
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[12.5px] font-medium text-[var(--muted-2)]">
                    ₹
                  </span>
                  <input
                    className={`w-full rounded-lg border bg-white py-2 pl-6 pr-3.5 text-[13px] font-medium text-[var(--ink)] transition-colors focus:outline-none focus:ring-1 focus:ring-[var(--brand)] ${
                      errors.stopLoss ? "border-[var(--red)]" : "border-[var(--line)]"
                    }`}
                    onChange={(e) => setStopLoss(e.target.value)}
                    placeholder="0.00"
                    type="number"
                    step="0.05"
                    value={stopLoss}
                  />
                </div>
                {errors.stopLoss && (
                  <div className="text-[10px] text-[var(--red)] font-semibold mt-1 leading-snug font-medium">
                    {errors.stopLoss}
                  </div>
                )}
              </div>
            </div>

            {/* Analyst Notes */}
            <div>
              <label className="block text-[11.5px] font-bold text-[var(--muted)] uppercase tracking-[0.05em] mb-1.5">
                Analyst Notes (Optional)
              </label>
              <textarea
                className="w-full rounded-lg border border-[var(--line)] bg-white p-3 text-[12.5px] text-[var(--ink)] transition-colors placeholder:text-[var(--muted-2)] focus:outline-none focus:ring-1 focus:ring-[var(--brand)]"
                rows={3}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add your reasoning, chart patterns, or specific instructions for subscribers..."
                value={notes}
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="px-6 py-4.5 bg-[var(--surface)] flex items-center justify-end gap-3 border-t border-dashed border-[#1f7ae0]/25">
            <button
              className="rounded-lg border border-[var(--line)] bg-white px-5 py-2 text-[12.5px] font-bold text-[var(--muted)] transition-colors hover:bg-[var(--surface)] hover:text-[var(--ink)]"
              onClick={onClose}
              type="button"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              className="rounded-lg bg-[var(--brand)] px-5 py-2 text-[12.5px] font-bold text-white transition-all hover:bg-[var(--brand-dark)] hover:shadow-md active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none flex items-center gap-2"
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Icon className="animate-spin h-3.5 w-3.5" name="timer" />
                  Creating...
                </>
              ) : (
                "Create Trade"
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Local animation keyframe defined inside style */}
      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
