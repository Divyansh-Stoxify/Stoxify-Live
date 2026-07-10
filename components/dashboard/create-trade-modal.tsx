"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useSWRConfig } from "swr";
import { Icon } from "@/components/stoxify-icon";
import type { TradeDirection } from "@/lib/types/analyst";
import { useSubscriptionPlans } from "@/hooks/use-analyst-dashboard";

// ─── Backend Error Mapping ────────────────────────────────────────────────────

interface BackendError {
  error?: string;
  code?: string;
  message?: string;
  details?: { reason?: string };
}

/**
 * Maps a backend error response to a { field, message } pair so the modal
 * can show the error inline next to the relevant input.
 *
 * field: 'submit' | 'batch' | 'symbol' | 'entry' | 'sl' | 'target' | 'expiry'
 */
function resolveTradeError(data: BackendError): { field: string; message: string } {
  const code = data.code ?? data.error ?? '';
  const rawReason = data.details?.reason ?? '';

  // ── RBAC / permissions ────────────────────────────────────────────────────
  if (code === 'INSUFFICIENT_POWER') {
    // Parse the live state from the RBAC reason string, e.g.
    // "User state is KYC_PENDING. Power PWR_TRADE_CREATE requires ACTIVE state."
    if (/KYC_PENDING/i.test(rawReason)) {
      return { field: 'submit', message: '⚠️ Your account KYC is pending verification. Complete KYC before publishing trades.' };
    }
    if (/PENDING_VERIFICATION/i.test(rawReason)) {
      return { field: 'submit', message: '⚠️ Your analyst account is awaiting admin verification. You cannot publish trades until approved.' };
    }
    if (/SUSPENDED/i.test(rawReason)) {
      return { field: 'submit', message: '🚫 Your account is suspended. Contact support to restore publishing access.' };
    }
    if (/BLOCKED/i.test(rawReason)) {
      return { field: 'submit', message: '🚫 Your account is blocked. Contact support for assistance.' };
    }
    if (/does not have power/i.test(rawReason)) {
      return { field: 'submit', message: '🚫 You do not have permission to create trades. Contact your administrator.' };
    }
    if (/does not own/i.test(rawReason)) {
      return { field: 'submit', message: '🚫 You do not have ownership of this resource.' };
    }
    // Fallback for any unrecognised RBAC reason
    return { field: 'submit', message: `🚫 Permission denied${rawReason ? ': ' + rawReason : ''}. Contact support if this is unexpected.` };
  }

  if (code === 'UNAUTHORIZED') {
    return { field: 'submit', message: '🔒 Your session has expired. Please sign in again.' };
  }

  // ── Account / analyst state ───────────────────────────────────────────────
  if (code === 'ANALYST_NOT_ACTIVE') {
    return { field: 'submit', message: '⚠️ Your analyst account is not yet active. Wait for admin approval before publishing trades.' };
  }

  // ── Market hours ─────────────────────────────────────────────────────────
  if (code === 'OUTSIDE_MARKET_HOURS') {
    return { field: 'submit', message: '🕐 Market is currently closed. Equity & F&O trades can only be published between 9:15 AM – 3:30 PM IST on weekdays.' };
  }

  // ── Batch / plan ─────────────────────────────────────────────────────────
  if (code === 'BATCH_REQUIRED') {
    return { field: 'batch', message: 'Please select a subscription batch to publish this trade to.' };
  }

  if (code === 'SEGMENT_MISMATCH') {
    return { field: 'batch', message: 'The selected batch does not support this market segment (e.g. Equity, F&O, MCX). Choose a compatible batch or change the instrument.' };
  }

  if (code === 'INVALID_BATCH') {
    return { field: 'batch', message: 'The selected batch was not found. It may have been deleted — please refresh and try again.' };
  }

  // ── Missing required fields ───────────────────────────────────────────────
  if (code === 'MISSING_FIELDS') {
    return { field: 'symbol', message: 'Required fields are missing. Please fill in the symbol, direction, entry price, stop loss and at least one target.' };
  }

  if (code === 'MISSING_TARGET') {
    return { field: 'target', message: 'At least one target price must be provided.' };
  }

  // ── Price level validation ────────────────────────────────────────────────
  if (code === 'INVALID_PRICE_LEVELS') {
    // Try to give direction-specific guidance
    const msg = data.message ?? '';
    if (/LONG|BUY/i.test(msg)) {
      return { field: 'stopLoss', message: 'Invalid price levels for a LONG trade. Required order: Stop Loss < Entry Price < Target(s).' };
    }
    if (/SHORT|SELL/i.test(msg)) {
      return { field: 'stopLoss', message: 'Invalid price levels for a SHORT trade. Required order: Stop Loss > Entry Price > Target(s).' };
    }
    return { field: 'stopLoss', message: 'Invalid price levels. Check that stop loss, entry and targets are in the correct order for your trade direction.' };
  }

  if (code === 'INVALID_DIRECTION') {
    return { field: 'submit', message: 'Invalid trade direction. Please select LONG or SHORT.' };
  }

  if (code === 'INVALID_BOOK_PERCENT') {
    return { field: 'targets', message: 'Target allocations must add up to exactly 100%. Adjust your partial-target percentages.' };
  }

  // ── F&O expiry ────────────────────────────────────────────────────────────
  if (code === 'MISSING_EXPIRY') {
    return { field: 'expiry', message: 'A contract expiry date is required for F&O trades.' };
  }

  if (code === 'INVALID_EXPIRY' || code === 'INVALID_EXPIRY_FORMAT') {
    return { field: 'expiry', message: 'Invalid or expired contract date. Please select a valid future expiry.' };
  }

  // ── Service / network errors ──────────────────────────────────────────────
  if (code === 'INTERNAL_ERROR') {
    return { field: 'submit', message: '⚙️ A server error occurred. Please try again in a moment.' };
  }

  // Fallback: surface the raw message from the backend if nothing matched
  const fallback = data.message || data.error || 'Failed to create trade. Please try again.';
  return { field: 'submit', message: fallback };
}

interface CreateTradeModalProps {
  onClose: () => void;
  onSuccess: (title: string, message: string) => void;
}

// Fallback popular symbols shown when the search input is empty
const POPULAR_SYMBOLS = [
  { symbol: "RELIANCE-EQ", exchange: "NSE" },
  { symbol: "HDFCBANK-EQ", exchange: "NSE" },
  { symbol: "TCS-EQ", exchange: "NSE" },
  { symbol: "INFY-EQ", exchange: "NSE" },
  { symbol: "ICICIBANK-EQ", exchange: "NSE" },
  { symbol: "SBIN-EQ", exchange: "NSE" },
  { symbol: "BHARTIARTL-EQ", exchange: "NSE" },
  { symbol: "LTIM-EQ", exchange: "NSE" },
];

/** Map exchange segment to a user-facing badge label */
function exchangeToSegment(exchange: string): string {
  switch (exchange) {
    case "NFO":
    case "MCX":
    case "CDS":
    case "NCDEX":
      return "FNO";
    case "NSE":
    case "BSE":
    default:
      return "EQUITY";
  }
}

interface SearchResult {
  symbol: string;
  token: string;
  exchange: string;
}

export function CreateTradeModal({ onClose, onSuccess }: CreateTradeModalProps) {
  const { mutate } = useSWRConfig();

  // Form states
  const [symbolQuery, setSymbolQuery] = useState("");
  const [isSymbolSelected, setIsSymbolSelected] = useState(false);
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [tradeStructure, setTradeStructure] = useState<"SIMPLE" | "PAIR">("SIMPLE");
  const [segment, setSegment] = useState<"EQUITY" | "FNO">("EQUITY");
  const [position, setPosition] = useState<"LONG" | "SHORT">("LONG");
  const [category, setCategory] = useState<"INTRADAY" | "SWING" | "POSITIONAL" | "SHORT_TERM" | "MEDIUM_TERM" | "LONG_TERM">("INTRADAY");
  const [entryPrice, setEntryPrice] = useState("");
  const [isEntryLocked, setIsEntryLocked] = useState(false);
  const [targets, setTargets] = useState<{ price: string; percent: string }[]>([
    { price: "", percent: "100" }
  ]);
  const [stopLoss, setStopLoss] = useState("");
  const [notes, setNotes] = useState("");
  const [selectedBatch, setSelectedBatch] = useState<string>("");
  const [selectedPlanId, setSelectedPlanId] = useState("");
  const [expiry, setExpiry] = useState("");
  const [strikePrice, setStrikePrice] = useState("");
  const [optionType, setOptionType] = useState<"CE" | "PE" | "">("");
  const { plans } = useSubscriptionPlans();

  // Auto-detect FNO details from symbol string
  useEffect(() => {
    const query = symbolQuery.toUpperCase().replace(/\s+/g, "");
    if (!query) return;

    // Regex for Options (e.g. BANKNIFTY24MAY48000CE, NIFTYMAY22000PE)
    // Group 1: Base Symbol, Group 2: Expiry, Group 3: Strike, Group 4: CE/PE
    const optionMatch = query.match(/^([A-Z]+?)([\d]*[A-Z]{3}\d{0,2})(\d+)(CE|PE)$/);
    if (optionMatch) {
      setSegment("FNO");
      setExpiry(optionMatch[2]);
      setStrikePrice(optionMatch[3]);
      setOptionType(optionMatch[4] as "CE" | "PE");
      return;
    }

    // Regex for Futures (e.g. ICICIBANK26JUNFUT, RELIANCEMAYFUT)
    const futMatch = query.match(/^([A-Z]+?)([\d]*[A-Z]{3}\d{0,2})FUT$/);
    if (futMatch) {
      setSegment("FNO");
      setExpiry(futMatch[2]);
      setStrikePrice("");
      setOptionType("");
      return;
    }
  }, [symbolQuery]);

  // Search states
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [recentSearches, setRecentSearches] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchAbortRef = useRef<AbortController | null>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load recent searches from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("stoxify_recent_searches");
        if (stored) {
          /* eslint-disable-next-line react-hooks/set-state-in-effect */
          setRecentSearches(JSON.parse(stored));
        }
      } catch (e) {
        console.error("Failed to load recent searches", e);
      }
    }
  }, []);

  // Validation / Loading states
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFetchingPrice, setIsFetchingPrice] = useState(false);

  const autocompleteRef = useRef<HTMLDivElement>(null);
  const batchDropdownRef = useRef<HTMLDivElement>(null);

  // Close autocomplete & batch dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (autocompleteRef.current && !autocompleteRef.current.contains(event.target as Node)) {
        setShowAutocomplete(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      if (searchAbortRef.current) searchAbortRef.current.abort();
    };
  }, []);

  const handleClearRecentSearches = (e: React.MouseEvent) => {
    e.stopPropagation();
    setRecentSearches([]);
    try {
      localStorage.removeItem("stoxify_recent_searches");
    } catch (err) {
      console.error("Failed to clear recent searches", err);
    }
  };

  // Debounced search function
  const performSearch = useCallback((query: string) => {
    // Cancel any in-flight request
    if (searchAbortRef.current) searchAbortRef.current.abort();
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);

    if (!query.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);

    debounceTimerRef.current = setTimeout(async () => {
      const controller = new AbortController();
      searchAbortRef.current = controller;

      try {
        const res = await fetch(
          `/api/market-data/search?q=${encodeURIComponent(query.trim())}&limit=20`,
          {
            credentials: "same-origin",
            signal: controller.signal,
          }
        );
        if (res.ok) {
          const data = await res.json();
          if (!controller.signal.aborted) {
            setSearchResults(data.results ?? []);
          }
        }
      } catch (err: unknown) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        // Non-critical: fall back to no results
      } finally {
        if (!controller.signal.aborted) {
          setIsSearching(false);
        }
      }
    }, 300);
  }, []);

  const handleSelectSymbol = async (item: SearchResult) => {
    setSymbolQuery(item.symbol);
    const derivedSegment = exchangeToSegment(item.exchange) as "EQUITY" | "FNO";
    setSegment(derivedSegment);
    setIsSymbolSelected(true);
    setShowAutocomplete(false);
    // Clear symbol error if it was set
    if (errors.symbol) {
      setErrors((prev) => ({ ...prev, symbol: "" }));
    }

    // Prepend to recent searches, capping at 5
    setRecentSearches((prev) => {
      const filtered = prev.filter((r) => r.symbol !== item.symbol || r.exchange !== item.exchange);
      const updated = [
        { symbol: item.symbol, token: item.token || "", exchange: item.exchange },
        ...filtered,
      ].slice(0, 5);
      try {
        localStorage.setItem("stoxify_recent_searches", JSON.stringify(updated));
      } catch (e) {
        console.error("Failed to save recent searches", e);
      }
      return updated;
    });

    // Auto-fetch the latest price for this symbol
    setIsFetchingPrice(true);
    try {
      const res = await fetch(`/api/market-data/price/${encodeURIComponent(item.symbol)}`, {
        credentials: "same-origin",
        cache: "no-store",
      });
      if (res.ok) {
        const data = await res.json();
        const price = data?.price ?? data?.ltp;
        if (price !== null && price !== undefined) {
          setEntryPrice(String(price));
          setIsEntryLocked(true);
        }
      }
    } catch {
      // Non-critical — analyst can still type manually
    } finally {
      setIsFetchingPrice(false);
    }
  };

  const validate = () => {
    const nextErrors: { [key: string]: string } = {};

    if (!symbolQuery.trim()) {
      nextErrors.symbol = "Instrument Symbol is required";
    }

    const entry = parseFloat(entryPrice);
    const sl = parseFloat(stopLoss);

    if (!selectedPlanId) {
      nextErrors.planId = "Please select a Batch/Plan";
    }

    if (isNaN(entry) || entry <= 0) {
      nextErrors.entry = "Enter a valid entry price (> 0)";
    }

    let totalPercent = 0;
    targets.forEach((t, i) => {
      const tp = parseFloat(t.price);
      const pct = parseFloat(t.percent);
      if (isNaN(tp) || tp <= 0) {
        nextErrors[`target_${i}_price`] = "Enter a valid target price (> 0)";
      }
      if (isNaN(pct) || pct <= 0 || pct > 100) {
        nextErrors[`target_${i}_percent`] = "Enter a valid percentage (1-100)";
      }
      totalPercent += isNaN(pct) ? 0 : pct;
    });

    if (Math.abs(totalPercent - 100) > 0.01) {
      nextErrors.targets = `Total book percentage must equal 100% (Current: ${totalPercent}%)`;
    }

    if (isNaN(sl) || sl <= 0) {
      nextErrors.stopLoss = "Enter a valid stop loss (> 0)";
    }

    // Batch is required (min 1)
    if (!selectedPlanId) {
      nextErrors.batch = "Select at least one batch";
    }

    // F&O contract expiry is required
    if (segment === "FNO" && !expiry.trim()) {
      nextErrors.expiry = "Expiry is required for F&O";
    }

    // Stop Loss and Target placement validation
    if (!isNaN(entry) && entry > 0) {
      if (position === "LONG") {
        if (!isNaN(sl) && sl >= entry) {
          nextErrors.stopLoss = "For Long position, Stop Loss must be less than Entry";
        }
        targets.forEach((t, i) => {
          const tp = parseFloat(t.price);
          if (!isNaN(tp)) {
            if (tp <= entry) {
              nextErrors[`target_${i}_price`] = "For Long position, Target must be greater than Entry";
            }
            if (i > 0) {
              const prevTp = parseFloat(targets[i - 1].price);
              if (!isNaN(prevTp) && tp <= prevTp) {
                nextErrors[`target_${i}_price`] = `Target ${i + 1} must be strictly greater than Target ${i}`;
              }
            }
          }
        });
      } else {
        // SHORT
        if (!isNaN(sl) && sl <= entry) {
          nextErrors.stopLoss = "For Short position, Stop Loss must be greater than Entry";
        }
        targets.forEach((t, i) => {
          const tp = parseFloat(t.price);
          if (!isNaN(tp)) {
            if (tp >= entry) {
              nextErrors[`target_${i}_price`] = "For Short position, Target must be less than Entry";
            }
            if (i > 0) {
              const prevTp = parseFloat(targets[i - 1].price);
              if (!isNaN(prevTp) && tp >= prevTp) {
                nextErrors[`target_${i}_price`] = `Target ${i + 1} must be strictly less than Target ${i}`;
              }
            }
          }
        });
      }
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);

    const entry = parseFloat(entryPrice);
    const sl = parseFloat(stopLoss);
    
    const parsedTargets = targets.map((t) => ({
      target_price: parseFloat(t.price),
      book_percent: parseFloat(t.percent)
    }));

    // Map position toggle to standard direction string
    let direction: TradeDirection = "LONG";
    if (segment === "EQUITY") {
      direction = position === "LONG" ? "LONG" : "SHORT";
    } else {
      direction = position === "LONG" ? "BUY" : "SELL";
    }

    const tradePayload = {
      trade_type: tradeStructure,
      segment: segment,
      category: category,
      symbol: symbolQuery.toUpperCase(),
      name: symbolQuery.toUpperCase(),
      direction: direction,
      entry_price: entry,
      stop_loss: sl,
      targets: parsedTargets,
      target_note: notes.trim() || undefined,
      rationale: notes.trim() || undefined,
      batch: selectedBatch || undefined,
      plan_id: selectedPlanId || undefined,
      expiry: expiry || undefined,
      strike_price: strikePrice ? parseFloat(strikePrice) : undefined,
      option_type: optionType || undefined,
    };

    try {
      const res = await fetch("/api/analyst/trades", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify(tradePayload),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        const { field, message } = resolveTradeError(data);
        setErrors({ [field]: message });
        setIsSubmitting(false);
        return;
      }

      // Mutate SWR keys to revalidate and update UI
      mutate((key: string) => typeof key === "string" && key.startsWith("/trades/"));
      mutate((key: string) => typeof key === "string" && key.startsWith("/analytics/"));

      // Trigger success confirmation toast notification
      const dirText = position === "LONG" ? "LONG" : "SHORT";
      onSuccess(
        "Trade Created Successfully",
        `${symbolQuery.toUpperCase()} ${dirText} trade has been created and broadcasted to your active subscribers.`
      );

      // Close the modal
      onClose();
    } catch {
      setErrors({ submit: "Network error — please try again" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9990] flex items-center justify-center bg-black/45 backdrop-blur-[2px] p-4 animate-[fadeIn_0.2s_ease-out]">
      <div className="relative w-[520px] max-w-full max-h-[90vh] flex flex-col rounded-2xl bg-white shadow-[0_24px_64px_rgba(0,0,0,0.15)] border border-[var(--line)] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 flex items-center justify-between border-b border-dashed border-[#1f7ae0]/25">
          <h2 className="text-[16.5px] font-bold text-[var(--ink)] tracking-[-0.2px]">
            Create Trade
          </h2>
          <button
            aria-label="Close modal"
            className="flex h-7 w-7 items-center justify-center rounded-lg text-[var(--muted-2)] transition-colors hover:bg-[var(--surface)] hover:text-[var(--ink)]"
            onClick={onClose}
            type="button"
          >
            <Icon className="h-5 w-5" name="x" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
          <div className="p-6 flex flex-col gap-4 overflow-y-auto flex-1">
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
                    setIsSymbolSelected(false);
                    setShowAutocomplete(true);
                    performSearch(e.target.value);
                  }}
                  placeholder="Search stocks, futures, options..."
                  type="text"
                  value={symbolQuery}
                />
                {isSearching && (
                  <Icon
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 animate-spin h-3.5 w-3.5 text-[var(--brand)]"
                    name="timer"
                  />
                )}
              </div>
              {errors.symbol && (
                <div className="text-[11px] text-[var(--red)] font-semibold mt-1 flex items-center gap-1">
                  <Icon name="x" className="h-2.5 w-2.5" />
                  {errors.symbol}
                </div>
              )}

              {/* Autocomplete Dropdown */}
              {showAutocomplete && (
                <div className="absolute top-[calc(100%+4px)] left-0 right-0 z-[100] max-h-60 overflow-y-auto rounded-lg border border-[var(--line)] bg-white py-1 shadow-lg">
                  {isSearching && symbolQuery.trim().length > 0 && (
                    <div className="px-4 py-3 text-center text-[12px] text-[var(--muted-2)] flex items-center justify-center gap-2">
                      <Icon className="animate-spin h-3.5 w-3.5" name="timer" />
                      Searching instruments...
                    </div>
                  )}
                  {!isSearching && symbolQuery.trim().length > 0 && searchResults.length === 0 && (
                    <div className="px-4 py-3 text-center text-[12px] text-[var(--muted-2)]">
                      No instruments found for &ldquo;{symbolQuery}&rdquo;
                    </div>
                  )}
                  {symbolQuery.trim().length > 0 ? (
                    searchResults.map((item) => (
                      <button
                        className="w-full px-4 py-2 text-left text-[12.5px] text-[var(--ink)] hover:bg-[var(--surface)] transition-colors flex items-center justify-between"
                        key={`search-${item.exchange}-${item.symbol}`}
                        onClick={() => handleSelectSymbol(item)}
                        type="button"
                      >
                        <span className="font-bold">{item.symbol}</span>
                        <span className="text-[10px] font-bold bg-[var(--line)] px-1.5 py-0.5 rounded text-[var(--muted)] uppercase">
                          {exchangeToSegment(item.exchange)}
                        </span>
                      </button>
                    ))
                  ) : (
                    <>
                      {/* Recent Searches Section */}
                      {recentSearches.length > 0 && (
                        <div className="mb-2">
                          <div className="px-4 py-1.5 text-[10px] font-bold text-[var(--muted)] uppercase tracking-wider flex items-center justify-between">
                            <span className="flex items-center gap-1.5">
                              <Icon className="h-3 w-3 text-[var(--muted-2)]" name="timer" />
                              Recent Searches
                            </span>
                            <button
                              onClick={handleClearRecentSearches}
                              className="text-[9px] font-semibold text-[var(--muted-2)] hover:text-[var(--brand)] transition-colors lowercase"
                              type="button"
                            >
                              Clear All
                            </button>
                          </div>
                          {recentSearches.map((item) => (
                            <button
                              className="w-full px-4 py-2 text-left text-[12.5px] text-[var(--ink)] hover:bg-[var(--surface)] transition-colors flex items-center justify-between"
                              key={`recent-${item.exchange}-${item.symbol}`}
                              onClick={() => handleSelectSymbol(item)}
                              type="button"
                            >
                              <span className="flex items-center gap-2">
                                <Icon className="h-3.5 w-3.5 text-[var(--muted-2)]" name="timer" />
                                <span className="font-semibold">{item.symbol}</span>
                              </span>
                              <span className="text-[10px] font-bold bg-[var(--line)] px-1.5 py-0.5 rounded text-[var(--muted)] uppercase">
                                {exchangeToSegment(item.exchange)}
                              </span>
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Popular Stocks Section */}
                      <div>
                        <div className="px-4 py-1.5 text-[10px] font-bold text-[var(--muted)] uppercase tracking-wider flex items-center gap-1.5">
                          <Icon className="h-3 w-3 text-[var(--muted-2)]" name="trendingUp" />
                          Popular Stocks
                        </div>
                        {POPULAR_SYMBOLS.map((s) => {
                          const item = { symbol: s.symbol, token: "", exchange: s.exchange };
                          return (
                            <button
                              className="w-full px-4 py-2 text-left text-[12.5px] text-[var(--ink)] hover:bg-[var(--surface)] transition-colors flex items-center justify-between"
                              key={`popular-${s.exchange}-${s.symbol}`}
                              onClick={() => handleSelectSymbol(item)}
                              type="button"
                            >
                              <span className="flex items-center gap-2">
                                <Icon
                                  className="h-3.5 w-3.5 text-[var(--muted-2)]"
                                  name="trendingUp"
                                />
                                <span className="font-semibold">{s.symbol}</span>
                              </span>
                              <span className="text-[10px] font-bold bg-[var(--line)] px-1.5 py-0.5 rounded text-[var(--muted)] uppercase">
                                {exchangeToSegment(s.exchange)}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </>
                  )}
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
                <div className={`flex bg-[var(--surface)] p-1 rounded-lg border border-[var(--line)] ${isSymbolSelected ? "opacity-75 cursor-not-allowed" : ""}`}>
                  <button
                    className={`flex-1 py-1.5 text-center text-[12px] font-bold rounded-md transition-all ${
                      segment === "EQUITY"
                        ? "bg-white text-[var(--ink)] shadow-sm border border-[var(--line)]/50"
                        : "text-[var(--muted)] hover:text-[var(--ink)]"
                    }`}
                    onClick={() => setSegment("EQUITY")}
                    type="button"
                    disabled={isSymbolSelected}
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
                    disabled={isSymbolSelected}
                  >
                    FnO
                  </button>
                </div>
              </div>
            </div>

            {/* FNO Specific Fields */}
            {segment === "FNO" && (() => {
              const queryRaw = symbolQuery.toUpperCase().replace(/\s+/g, "");
              const isOptionAutoDetected = /^([A-Z]+?)([\d]*[A-Z]{3}\d{0,2})(\d+)(CE|PE)$/.test(queryRaw);
              const isFutAutoDetected = /^([A-Z]+?)([\d]*[A-Z]{3}\d{0,2})FUT$/.test(queryRaw);
              const isAutoDetected = isOptionAutoDetected || isFutAutoDetected;

              return (
                <div className="grid grid-cols-3 gap-3 animate-[fadeIn_0.2s_ease-out]">
                  {/* Expiry */}
                  <div>
                    <label className="block text-[11.5px] font-bold text-[var(--muted)] uppercase tracking-[0.05em] mb-1.5">
                      Expiry <span className="text-[var(--red)]">*</span>
                    </label>
                    <input
                      className={`w-full rounded-lg border py-2 px-3 text-[13px] font-medium text-[var(--ink)] transition-colors focus:outline-none focus:ring-1 focus:ring-[var(--brand)] ${
                        errors.expiry ? "border-[var(--red)]" : "border-[var(--line)]"
                      } ${isAutoDetected ? "bg-[var(--surface)] opacity-70 cursor-not-allowed" : "bg-white"}`}
                      onChange={(e) => setExpiry(e.target.value)}
                      placeholder="e.g. 26JUN"
                      type="text"
                      value={expiry}
                      disabled={isAutoDetected}
                    />
                    {errors.expiry && (
                      <div className="text-[10px] text-[var(--red)] font-semibold mt-1 leading-snug">
                        {errors.expiry}
                      </div>
                    )}
                  </div>

                  {/* Strike Price */}
                  <div>
                    <label className="block text-[11.5px] font-bold text-[var(--muted)] uppercase tracking-[0.05em] mb-1.5">
                      Strike Price
                    </label>
                    <input
                      className={`w-full rounded-lg border border-[var(--line)] py-2 px-3 text-[13px] font-medium text-[var(--ink)] transition-colors focus:outline-none focus:ring-1 focus:ring-[var(--brand)] ${
                        isAutoDetected ? "bg-[var(--surface)] opacity-70 cursor-not-allowed" : "bg-white"
                      }`}
                      onChange={(e) => setStrikePrice(e.target.value)}
                      placeholder="e.g. 1350"
                      type="number"
                      step="0.05"
                      value={strikePrice}
                      disabled={isAutoDetected}
                    />
                  </div>

                  {/* Option Type */}
                  <div>
                    <label className="block text-[11.5px] font-bold text-[var(--muted)] uppercase tracking-[0.05em] mb-1.5">
                      Option Type
                    </label>
                    <div className="relative">
                      <select
                        className={`w-full appearance-none rounded-lg border border-[var(--line)] py-2 px-3.5 text-[12.5px] font-medium text-[var(--ink)] transition-colors focus:outline-none focus:ring-1 focus:ring-[var(--brand)] ${
                          isOptionAutoDetected ? "bg-[var(--surface)] opacity-70 cursor-not-allowed" : "bg-white"
                        }`}
                        onChange={(e) => setOptionType(e.target.value as "CE" | "PE" | "")}
                        value={optionType}
                        disabled={isOptionAutoDetected}
                      >
                        <option value="">Select</option>
                        <option value="CE">CE (Call)</option>
                        <option value="PE">PE (Put)</option>
                      </select>
                      <Icon
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--muted-2)] pointer-events-none h-3 w-3"
                        name="chevronDown"
                      />
                    </div>
                  </div>
                </div>
              );
            })()}

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
                    onChange={(e) => setCategory(e.target.value as any)}
                    value={category}
                  >
                    <option value="INTRADAY">Intraday</option>
                    <option value="SWING">Swing</option>
                    <option value="POSITIONAL">Positional</option>
                    <option value="SHORT_TERM">Short-Term</option>
                    <option value="MEDIUM_TERM">Medium Term</option>
                    <option value="LONG_TERM">Long-Term</option>
                  </select>
                  <Icon
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--muted-2)] pointer-events-none h-3 w-3"
                    name="chevronDown"
                  />
                </div>
              </div>
            </div>

            {/* Batch Selection */}
            <div>
              <label className="block text-[11.5px] font-bold text-[var(--muted)] uppercase tracking-[0.05em] mb-1.5">
                Batch <span className="text-[var(--red)]">*</span>
              </label>
              <div className="relative">
                <select
                  className={`w-full appearance-none rounded-lg border bg-white py-2 px-3.5 text-[12.5px] font-medium text-[var(--ink)] transition-colors focus:outline-none focus:ring-1 focus:ring-[var(--brand)] ${
                    (errors.batch || errors.planId) ? "border-[var(--red)]" : "border-[var(--line)]"
                  }`}
                  value={selectedPlanId}
                  onChange={(e) => {
                    const pId = e.target.value;
                    setSelectedPlanId(pId);
                    if (pId) {
                      const selectedPlan = plans.find((p) => p.plan_id === pId);
                      setSelectedBatch(selectedPlan?.name || "");
                      if (errors.batch) setErrors((prev) => ({ ...prev, batch: "" }));
                    } else {
                      setSelectedBatch("");
                    }
                  }}
                >
                  <option value="">Select a batch...</option>
                  {plans.map((p) => (
                    <option key={p.plan_id} value={p.plan_id}>
                      {p.name}
                    </option>
                  ))}
                </select>
                <Icon
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--muted-2)] pointer-events-none h-3 w-3"
                  name="chevronDown"
                />
              </div>
              {(errors.batch || errors.planId) && (
                <div className="text-[10px] text-[var(--red)] font-semibold mt-1 leading-snug">
                  {errors.batch || errors.planId}
                </div>
              )}
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
                    className={`w-full rounded-lg border bg-white py-2 pl-6 pr-8 text-[13px] font-medium text-[var(--ink)] transition-colors focus:outline-none focus:ring-1 focus:ring-[var(--brand)] ${
                      errors.entry ? "border-[var(--red)]" : "border-[var(--line)]"
                    } ${isFetchingPrice ? "animate-pulse bg-[var(--surface)]" : ""} ${isEntryLocked ? "bg-[var(--surface)] text-[var(--muted-2)] cursor-not-allowed border-dashed" : ""}`}
                    onChange={(e) => setEntryPrice(e.target.value)}
                    placeholder={isFetchingPrice ? "Fetching…" : "0.00"}
                    type="number"
                    step="0.05"
                    value={entryPrice}
                    disabled={isFetchingPrice}
                    readOnly={isEntryLocked}
                  />
                  {isFetchingPrice && (
                    <Icon
                      className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin h-3.5 w-3.5 text-[var(--brand)]"
                      name="timer"
                    />
                  )}
                  {isEntryLocked && !isFetchingPrice && (
                    <button
                      type="button"
                      onClick={() => setIsEntryLocked(false)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--brand)] hover:text-[var(--brand-dark)] transition-colors"
                      title="Unlock entry price"
                    >
                      <Icon name="lock" className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
                {isEntryLocked && !errors.entry && (
                  <div className="text-[10.5px] text-[var(--muted-2)] mt-1 font-medium italic">
                    Fetched from market
                  </div>
                )}
                {errors.entry && (
                  <div className="text-[10px] text-[var(--red)] font-semibold mt-1 leading-snug">
                    {errors.entry}
                  </div>
                )}
              </div>

              {/* Targets */}
              <div className="col-span-3 flex flex-col gap-3 border border-[var(--line)] rounded-xl p-3 bg-[var(--surface)]/50 mt-1">
                <div className="flex items-center justify-between">
                  <label className="text-[11.5px] font-bold text-[var(--muted)] uppercase tracking-[0.05em]">
                    Target Prices
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      if (targets.length >= 5) return;
                      const remainingPct = 100 - targets.reduce((acc, t) => acc + (parseFloat(t.percent) || 0), 0);
                      setTargets([...targets, { price: "", percent: remainingPct > 0 ? String(remainingPct) : "0" }]);
                    }}
                    disabled={targets.length >= 5}
                    className="text-[11px] font-bold text-[var(--brand)] hover:text-[var(--brand-dark)] transition-colors flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Icon name="plus" className="h-3 w-3" /> Add Target
                  </button>
                </div>
                {errors.targets && (
                  <div className="text-[10px] text-[var(--red)] font-semibold leading-snug">
                    {errors.targets}
                  </div>
                )}
                
                {targets.map((t, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    <div className="flex-1">
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[12.5px] font-medium text-[var(--muted-2)]">
                          ₹
                        </span>
                        <input
                          className={`w-full rounded-lg border bg-white py-2 pl-6 pr-3.5 text-[13px] font-medium text-[var(--ink)] transition-colors focus:outline-none focus:ring-1 focus:ring-[var(--brand)] ${
                            errors[`target_${idx}_price`] ? "border-[var(--red)]" : "border-[var(--line)]"
                          }`}
                          onChange={(e) => {
                            const newTargets = [...targets];
                            newTargets[idx].price = e.target.value;
                            setTargets(newTargets);
                          }}
                          placeholder={`Target ${idx + 1}`}
                          type="number"
                          step="0.05"
                          value={t.price}
                        />
                      </div>
                      {errors[`target_${idx}_price`] && (
                        <div className="text-[10px] text-[var(--red)] font-semibold mt-1 leading-snug">
                          {errors[`target_${idx}_price`]}
                        </div>
                      )}
                    </div>
                    
                    <div className="w-[100px]">
                      <div className="relative">
                        <input
                          className={`w-full rounded-lg border bg-white py-2 pl-3 pr-6 text-[13px] font-medium text-[var(--ink)] transition-colors focus:outline-none focus:ring-1 focus:ring-[var(--brand)] ${
                            errors[`target_${idx}_percent`] ? "border-[var(--red)]" : "border-[var(--line)]"
                          }`}
                          onChange={(e) => {
                            const newTargets = [...targets];
                            newTargets[idx].percent = e.target.value;
                            setTargets(newTargets);
                          }}
                          placeholder="%"
                          type="number"
                          step="1"
                          min="1"
                          max="100"
                          value={t.percent}
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[12.5px] font-medium text-[var(--muted-2)]">
                          %
                        </span>
                      </div>
                      {errors[`target_${idx}_percent`] && (
                        <div className="text-[10px] text-[var(--red)] font-semibold mt-1 leading-snug">
                          {errors[`target_${idx}_percent`]}
                        </div>
                      )}
                    </div>

                    {targets.length > 1 && (
                      <button
                        type="button"
                        onClick={() => {
                          const newTargets = targets.filter((_, i) => i !== idx);
                          setTargets(newTargets);
                        }}
                        className="p-2 text-[var(--muted-2)] hover:text-[var(--red)] transition-colors rounded-lg hover:bg-[var(--red)]/10 mt-[2px]"
                      >
                        <Icon name="trash" className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))}
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

            {/* Risk : Reward Ratio */}
            {(() => {
              const e = parseFloat(entryPrice);
              const totalPercent = targets.reduce((acc, t) => acc + (parseFloat(t.percent) || 0), 0);
              const t = totalPercent > 0 ? targets.reduce((acc, t) => acc + ((parseFloat(t.price) || 0) * (parseFloat(t.percent) || 0)), 0) / totalPercent : 0;
              const s = parseFloat(stopLoss);
              const valid = !isNaN(e) && !isNaN(t) && !isNaN(s) && e > 0 && t > 0 && s > 0;
              if (!valid) return null;

              const risk = Math.abs(e - s);
              const reward = Math.abs(t - e);
              if (risk === 0) return null;

              const ratio = reward / risk;
              const riskPct = (risk / (risk + reward)) * 100;
              const rewardPct = (reward / (risk + reward)) * 100;

              const label =
                ratio >= 3 ? "Excellent" : ratio >= 2 ? "Good" : ratio >= 1 ? "Moderate" : "Poor";
              const labelColor =
                ratio >= 3
                  ? "text-[var(--green)]"
                  : ratio >= 2
                    ? "text-[var(--green)]"
                    : ratio >= 1
                      ? "text-[var(--brand)]"
                      : "text-[var(--red)]";

              return (
                <div className="rounded-lg border border-[var(--line)] bg-[var(--surface)] p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold text-[var(--muted)] uppercase tracking-[0.05em]">
                      Risk : Reward Ratio
                    </span>
                    <span className={`text-[11.5px] font-bold ${labelColor}`}>{label}</span>
                  </div>

                  {/* Visual bar */}
                  <div className="flex h-2 w-full overflow-hidden rounded-full">
                    <div
                      className="bg-[var(--red)] transition-all duration-300"
                      style={{ width: `${riskPct}%` }}
                    />
                    <div
                      className="bg-[var(--green)] transition-all duration-300"
                      style={{ width: `${rewardPct}%` }}
                    />
                  </div>

                  {/* Labels */}
                  <div className="flex items-center justify-between mt-1.5">
                    <span className="text-[10.5px] font-semibold text-[var(--red)]">
                      Risk ₹{risk.toFixed(2)}
                    </span>
                    <span className="text-[13px] font-extrabold text-[var(--ink)] tracking-tight">
                      1 : {ratio.toFixed(1)}
                    </span>
                    <span className="text-[10.5px] font-semibold text-[var(--green)]">
                      Reward ₹{reward.toFixed(2)}
                    </span>
                  </div>
                </div>
              );
            })()}

            {/* Analyst Notes / Rationale */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-[11.5px] font-bold text-[var(--muted)] uppercase tracking-[0.05em]">
                  Analyst Notes (Optional)
                </label>
                <span className={`text-[10px] font-semibold ${notes.length > 500 ? "text-[var(--red)]" : "text-[var(--muted-2)]"}`}>
                  {notes.length}/500
                </span>
              </div>
              <textarea
                className="w-full rounded-lg border border-[var(--line)] bg-white p-3 text-[12.5px] text-[var(--ink)] transition-colors placeholder:text-[var(--muted-2)] focus:outline-none focus:ring-1 focus:ring-[var(--brand)]"
                rows={3}
                maxLength={500}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add your reasoning, chart patterns, or specific instructions for subscribers..."
                value={notes}
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="px-6 py-4 bg-[var(--surface)] flex flex-col gap-3 border-t border-dashed border-[#1f7ae0]/25">
            {/* Submit-level error banner (permissions, account state, server errors) */}
            {errors.submit && (
              <div className="flex items-start gap-2.5 rounded-lg border border-[var(--red)]/25 bg-[var(--red)]/8 px-3.5 py-2.5 text-[12px] text-[var(--red)] font-medium leading-snug">
                <svg className="mt-[1px] h-3.5 w-3.5 shrink-0 fill-current" viewBox="0 0 16 16">
                  <path d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1Zm-.75 4a.75.75 0 0 1 1.5 0v3.5a.75.75 0 0 1-1.5 0V5Zm.75 7a1 1 0 1 1 0-2 1 1 0 0 1 0 2Z"/>
                </svg>
                <span>{errors.submit}</span>
              </div>
            )}
            <div className="flex items-center justify-end gap-3">
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
          </div>
        </form>
      </div>
    </div>
  );
}
