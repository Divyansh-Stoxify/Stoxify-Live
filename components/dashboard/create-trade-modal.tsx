"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useSWRConfig } from "swr";
import { Icon } from "@/components/stoxify-icon";
import type { TradeDirection } from "@/lib/types/analyst";
import { useSubscriptionPlans, useAnalystProfile } from "@/hooks/use-analyst-dashboard";
import { cleanErrorMessage } from "@/lib/utils";

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
  const code = data.code ?? data.error ?? "";

  // Determine which field this error belongs to
  let field = "submit";
  if (
    code === "BATCH_REQUIRED" ||
    code === "SEGMENT_MISMATCH" ||
    code === "INVALID_BATCH" ||
    code === "BATCH_PLAN_MISMATCH"
  ) {
    field = "batch";
  } else if (code === "MISSING_FIELDS") {
    field = "symbol";
  } else if (code === "MISSING_TARGET") {
    field = "target";
  } else if (code === "INVALID_PRICE_LEVELS") {
    field = "stopLoss";
  } else if (code === "INVALID_BOOK_PERCENT") {
    field = "targets";
  } else if (
    code === "MISSING_EXPIRY" ||
    code === "INVALID_EXPIRY" ||
    code === "INVALID_EXPIRY_FORMAT"
  ) {
    field = "expiry";
  }

  // Get the cleaned user-friendly error message
  const fallback = data.message || data.error || "Failed to create trade. Please try again.";
  const message = cleanErrorMessage(data, fallback);

  return { field, message };
}

interface CreateTradeModalProps {
  onClose: () => void;
  onSuccess: (title: string, message: string) => void;
  /** Live symbol → LTP map from the shared dashboard WebSocket */
  livePrices?: Record<string, number>;
  /** Send a message over the shared dashboard WebSocket connection */
  sendMessage?: (msg: Record<string, unknown>) => void;
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

/** Check if a subscription plan supports the specified trade segment */
function isPlanSegmentCompatible(plan: { segments?: string[] }, currentSegment: string): boolean {
  if (!plan || !plan.segments || !Array.isArray(plan.segments) || plan.segments.length === 0) {
    return true; // No segment restriction specified on plan
  }
  const curSeg = currentSegment.toUpperCase();
  return plan.segments.some((s) => {
    const segUpper = s.toUpperCase();
    if (segUpper === curSeg) return true;
    if (curSeg === "FNO" && (segUpper === "F&O" || segUpper === "FUTURES" || segUpper === "OPTIONS")) return true;
    if ((curSeg === "F&O" || curSeg === "FUTURES" || curSeg === "OPTIONS") && segUpper === "FNO") return true;
    return false;
  });
}

interface SearchResult {
  symbol: string;
  token: string;
  exchange: string;
}

export function CreateTradeModal({
  onClose,
  onSuccess,
  livePrices,
  sendMessage,
}: CreateTradeModalProps) {
  const { mutate } = useSWRConfig();

  // Form states
  const [symbolQuery, setSymbolQuery] = useState("");
  const [isSymbolSelected, setIsSymbolSelected] = useState(false);
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [tradeStructure, setTradeStructure] = useState<"SIMPLE" | "PAIR">("SIMPLE");
  const [segment, setSegment] = useState<"EQUITY" | "FNO">("EQUITY");
  const [position, setPosition] = useState<"LONG" | "SHORT">("LONG");
  const [category, setCategory] = useState<
    "INTRADAY" | "SWING" | "POSITIONAL" | "SHORT_TERM" | "MEDIUM_TERM" | "LONG_TERM"
  >("INTRADAY");
  const [entryPrice, setEntryPrice] = useState("");
  const [targets, setTargets] = useState<{ price: string; percent: string }[]>([
    { price: "", percent: "100" },
  ]);
  const [stopLoss, setStopLoss] = useState("");
  const [notes, setNotes] = useState("");
  const [selectedPlanIds, setSelectedPlanIds] = useState<string[]>([]);
  const [showBatchDropdown, setShowBatchDropdown] = useState(false);
  const [expiry, setExpiry] = useState("");
  const [strikePrice, setStrikePrice] = useState("");
  const [optionType, setOptionType] = useState<"CE" | "PE" | "">("");
  const { plans } = useSubscriptionPlans();
  const { profile } = useAnalystProfile();
  const [publishToTelegram, setPublishToTelegram] = useState(false);

  // Auto-deselect batches that are incompatible with the current trade segment
  useEffect(() => {
    if (!plans || plans.length === 0) return;
    setSelectedPlanIds((prev) =>
      prev.filter((id) => {
        const plan = plans.find((p) => p.plan_id === id);
        return !plan || isPlanSegmentCompatible(plan, segment);
      })
    );
  }, [segment, plans]);

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

  // Real-time Validation States
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isSubmittedOnce, setIsSubmittedOnce] = useState(false);

  const markTouched = useCallback((field: string) => {
    setTouched((prev) => (prev[field] ? prev : { ...prev, [field]: true }));
  }, []);

  const validationErrors = useMemo(() => {
    const nextErrors: { [key: string]: string } = {};

    if (!symbolQuery.trim()) {
      nextErrors.symbol = "Instrument Symbol is required";
    }

    const entry = parseFloat(entryPrice);
    const sl = parseFloat(stopLoss);

    if (isNaN(entry) || entry <= 0) {
      nextErrors.entry = "Select an instrument from the search to fetch its live price";
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

    // Batch is required (min 1) & must support trade segment
    if (selectedPlanIds.length === 0) {
      nextErrors.batch = "Select at least one batch";
    } else {
      const incompatiblePlan = plans
        .filter((p) => selectedPlanIds.includes(p.plan_id))
        .find((p) => !isPlanSegmentCompatible(p, segment));
      if (incompatiblePlan) {
        nextErrors.batch = `Batch "${incompatiblePlan.name}" does not support ${segment} trades. Choose a compatible batch.`;
      }
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
              nextErrors[`target_${i}_price`] =
                "For Long position, Target must be greater than Entry";
            }
            if (i > 0) {
              const prevTp = parseFloat(targets[i - 1].price);
              if (!isNaN(prevTp) && tp <= prevTp) {
                nextErrors[`target_${i}_price`] =
                  `Target ${i + 1} must be strictly greater than Target ${i}`;
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
              nextErrors[`target_${i}_price`] =
                "For Short position, Target must be less than Entry";
            }
            if (i > 0) {
              const prevTp = parseFloat(targets[i - 1].price);
              if (!isNaN(prevTp) && tp >= prevTp) {
                nextErrors[`target_${i}_price`] =
                  `Target ${i + 1} must be strictly less than Target ${i}`;
              }
            }
          }
        });
      }
    }



    return nextErrors;
  }, [symbolQuery, entryPrice, targets, stopLoss, selectedPlanIds, expiry, segment, position, publishToTelegram, profile]);

  const getFieldError = useCallback(
    (field: string) => {
      if (touched[field] || isSubmittedOnce) {
        if (validationErrors[field]) return validationErrors[field];
      }
      return errors[field];
    },
    [touched, isSubmittedOnce, validationErrors, errors]
  );

  const autocompleteRef = useRef<HTMLDivElement>(null);
  const batchDropdownRef = useRef<HTMLDivElement>(null);

  // Close autocomplete & batch dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (autocompleteRef.current && !autocompleteRef.current.contains(event.target as Node)) {
        setShowAutocomplete(false);
      }
      if (batchDropdownRef.current && !batchDropdownRef.current.contains(event.target as Node)) {
        setShowBatchDropdown(false);
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
    markTouched("symbol");
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
    fetchLivePrice(item.symbol);
  };

  // Entry price is always the live LTP — the analyst cannot type it manually.
  // Watching a symbol subscribes it to the Angel One feed on the backend for a
  // short TTL, so subsequent ticks arrive over the shared WebSocket for free.
  // The response carries the current LTP as a seed. Silent mode (TTL renewal)
  // never flashes a loading state and keeps the last good price on failure.
  const fetchLivePrice = useCallback(async (symbol: string, silent = false) => {
    if (!silent) setIsFetchingPrice(true);
    try {
      const res = await fetch("/api/market-data/watch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        cache: "no-store",
        body: JSON.stringify({ symbol }),
      });
      if (res.ok) {
        const data = await res.json();
        const price = data?.price ?? data?.ltp;
        if (price !== null && price !== undefined) {
          setEntryPrice(String(price));
          setErrors((prev) => ({ ...prev, entry: "" }));
          return;
        }
      }
      if (silent) return;
      setEntryPrice("");
      setErrors((prev) => ({
        ...prev,
        entry: "Live price unavailable for this instrument — try refreshing",
      }));
    } catch {
      if (silent) return;
      setEntryPrice("");
      setErrors((prev) => ({
        ...prev,
        entry: "Could not fetch live price — try refreshing",
      }));
    } finally {
      if (!silent) setIsFetchingPrice(false);
    }
  }, []);

  // Keep the backend watch TTL alive while an instrument is selected.
  // Preferred path: send a 'watch' message over the already-open WebSocket
  // (zero extra HTTP connections, and the heartbeat stops automatically if
  // the WebSocket itself drops — no resource leaks on the server).
  // Fallback: if sendMessage is unavailable (e.g. WS not yet connected),
  // silently call the HTTP endpoint to ensure the first 60 s window is covered.
  useEffect(() => {
    if (!isSymbolSelected || !symbolQuery.trim()) return;
    const symbol = symbolQuery;
    const interval = setInterval(() => {
      if (sendMessage) {
        sendMessage({ type: "watch", symbol });
      } else {
        fetchLivePrice(symbol, true);
      }
    }, 60_000);
    return () => clearInterval(interval);
  }, [isSymbolSelected, symbolQuery, fetchLivePrice, sendMessage]);

  // Tick the entry price from the shared WebSocket as live prices stream in.
  // Ticks are keyed by the canonical (upper-case) symbol, which is also the form
  // the trade is created with — a symbol restored from `recentSearches` may still
  // carry the scrip master's original casing (e.g. "Nifty 50").
  const liveTick = isSymbolSelected ? livePrices?.[symbolQuery.toUpperCase()] : undefined;
  useEffect(() => {
    if (liveTick !== undefined && liveTick > 0) {
      setEntryPrice(String(liveTick));
      setErrors((prev) => (prev.entry ? { ...prev, entry: "" } : prev));
    }
  }, [liveTick]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Guard against a second click landing before the disabled prop re-renders —
    // without this, a fast double-click can fire two full create requests.
    if (isSubmitting) return;
    setIsSubmittedOnce(true);
    if (Object.keys(validationErrors).length > 0) return;

    setIsSubmitting(true);

    const entry = parseFloat(entryPrice);
    const sl = parseFloat(stopLoss);

    const parsedTargets = targets.map((t) => ({
      target_price: parseFloat(t.price),
      book_percent: parseFloat(t.percent),
    }));

    // Map position toggle to standard direction string
    let direction: TradeDirection = "LONG";
    if (segment === "EQUITY") {
      direction = position === "LONG" ? "LONG" : "SHORT";
    } else {
      direction = position === "LONG" ? "BUY" : "SELL";
    }

    const basePayload = {
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
      expiry: expiry || undefined,
      strike_price: strikePrice ? parseFloat(strikePrice) : undefined,
      option_type: optionType || undefined,
    };

    // One trade doc can be published to several batches at once — batch and
    // plan_id are sent as parallel arrays so the backend stores a single
    // document visible to every selected batch's subscribers, instead of a
    // separate duplicate trade per batch.
    const selectedPlans = plans.filter((p) => selectedPlanIds.includes(p.plan_id));

    try {
      const res = await fetch("/api/analyst/trades", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          ...basePayload,
          batch: selectedPlans.map((p) => p.name),
          plan_id: selectedPlans.map((p) => p.plan_id),
          publish_to_telegram: publishToTelegram,
        }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        const { field, message } = resolveTradeError(data ?? {});
        setErrors({ [field]: message });
        setIsSubmitting(false);
        return;
      }

      // Mutate SWR keys to revalidate and update UI
      mutate((key: string) => typeof key === "string" && key.startsWith("/trades/"));
      mutate((key: string) => typeof key === "string" && key.startsWith("/analytics/"));

      // Trigger success confirmation toast notification
      const dirText = position === "LONG" ? "LONG" : "SHORT";
      const batchText =
        selectedPlans.length > 1
          ? `${selectedPlans.length} batches`
          : `the ${selectedPlans[0]?.name ?? "selected"} batch`;
      onSuccess(
        "Trade Created Successfully",
        `${symbolQuery.toUpperCase()} ${dirText} trade has been published to ${batchText} and broadcasted to active subscribers.`
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
                    getFieldError("symbol")
                      ? "border-[var(--red)] ring-[var(--red)]/20"
                      : "border-[var(--line)]"
                  }`}
                  onFocus={() => setShowAutocomplete(true)}
                  onBlur={() => markTouched("symbol")}
                  onChange={(e) => {
                    setSymbolQuery(e.target.value);
                    setIsSymbolSelected(false);
                    // Entry price is tied to the selected instrument — clear the
                    // stale LTP until a symbol is picked from the list again.
                    setEntryPrice("");
                    setShowAutocomplete(true);
                    performSearch(e.target.value);
                    markTouched("symbol");
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
              {getFieldError("symbol") && (
                <div className="text-[11px] text-[var(--red)] font-semibold mt-1 flex items-center gap-1">
                  <Icon name="x" className="h-2.5 w-2.5" />
                  {getFieldError("symbol")}
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
                <div
                  className={`flex bg-[var(--surface)] p-1 rounded-lg border border-[var(--line)] ${isSymbolSelected ? "opacity-75 cursor-not-allowed" : ""}`}
                >
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
            {segment === "FNO" &&
              (() => {
                const queryRaw = symbolQuery.toUpperCase().replace(/\s+/g, "");
                const isOptionAutoDetected = /^([A-Z]+?)([\d]*[A-Z]{3}\d{0,2})(\d+)(CE|PE)$/.test(
                  queryRaw
                );
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
                          getFieldError("expiry") ? "border-[var(--red)]" : "border-[var(--line)]"
                        } ${isAutoDetected ? "bg-[var(--surface)] opacity-70 cursor-not-allowed" : "bg-white"}`}
                        onChange={(e) => {
                          setExpiry(e.target.value);
                          markTouched("expiry");
                        }}
                        onBlur={() => markTouched("expiry")}
                        placeholder="e.g. 26JUN"
                        type="text"
                        value={expiry}
                        disabled={isAutoDetected}
                      />
                      {getFieldError("expiry") && (
                        <div className="text-[10px] text-[var(--red)] font-semibold mt-1 leading-snug">
                          {getFieldError("expiry")}
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
                          isAutoDetected
                            ? "bg-[var(--surface)] opacity-70 cursor-not-allowed"
                            : "bg-white"
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
                            isOptionAutoDetected
                              ? "bg-[var(--surface)] opacity-70 cursor-not-allowed"
                              : "bg-white"
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

            {/* Batch Selection (multi-select — the trade is published to every selected batch) */}
            <div className="relative" ref={batchDropdownRef}>
              <label className="block text-[11.5px] font-bold text-[var(--muted)] uppercase tracking-[0.05em] mb-1.5">
                Batches <span className="text-[var(--red)]">*</span>
              </label>
              <button
                type="button"
                onClick={() => setShowBatchDropdown((v) => !v)}
                className={`w-full flex items-center justify-between gap-2 rounded-lg border bg-white py-2 px-3.5 text-[12.5px] font-medium transition-colors focus:outline-none focus:ring-1 focus:ring-[var(--brand)] ${
                  getFieldError("batch") ? "border-[var(--red)]" : "border-[var(--line)]"
                } ${selectedPlanIds.length === 0 ? "text-[var(--muted-2)]" : "text-[var(--ink)]"}`}
              >
                <span className="flex flex-wrap items-center gap-1.5 text-left min-w-0">
                  {selectedPlanIds.length === 0
                    ? "Select batches..."
                    : plans
                        .filter((p) => selectedPlanIds.includes(p.plan_id))
                        .map((p) => (
                          <span
                            key={p.plan_id}
                            className="inline-flex items-center rounded bg-[var(--brand-light)] text-[var(--brand)] px-1.5 py-0.5 text-[11px] font-bold border border-[var(--brand)]/15"
                          >
                            {p.name}
                          </span>
                        ))}
                </span>
                <Icon
                  className="text-[var(--muted-2)] pointer-events-none h-3 w-3 shrink-0"
                  name="chevronDown"
                />
              </button>

              {showBatchDropdown && (
                <div className="absolute top-[calc(100%+4px)] left-0 right-0 z-[100] max-h-52 overflow-y-auto rounded-lg border border-[var(--line)] bg-white py-1 shadow-lg">
                  {plans.length === 0 && (
                    <div className="px-4 py-3 text-center text-[12px] text-[var(--muted-2)]">
                      No batches available — create a plan first
                    </div>
                  )}
                  {plans.map((p) => {
                    const isCompatible = isPlanSegmentCompatible(p, segment);
                    const checked = selectedPlanIds.includes(p.plan_id);
                    return (
                      <button
                        key={p.plan_id}
                        type="button"
                        disabled={!isCompatible}
                        className={`w-full px-3.5 py-2 text-left text-[12.5px] transition-colors flex items-center justify-between gap-2.5 ${
                          !isCompatible
                            ? "opacity-50 cursor-not-allowed bg-slate-50 text-[var(--muted-2)]"
                            : "text-[var(--ink)] hover:bg-[var(--surface)]"
                        }`}
                        onClick={() => {
                          if (!isCompatible) return;
                          setSelectedPlanIds((prev) =>
                            checked ? prev.filter((id) => id !== p.plan_id) : [...prev, p.plan_id]
                          );
                          markTouched("batch");
                          if (errors.batch) setErrors((prev) => ({ ...prev, batch: "" }));
                        }}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span
                            className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors ${
                              checked
                                ? "bg-[var(--brand)] border-[var(--brand)] text-white"
                                : "border-[var(--line)] bg-white"
                            }`}
                          >
                            {checked && <Icon name="check" className="h-3 w-3" />}
                          </span>
                          <span className="font-semibold truncate">{p.name}</span>
                        </div>
                        {!isCompatible && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 shrink-0">
                            Incompatible ({p.segments?.join(", ") || "Other"})
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}

              {getFieldError("batch") && (
                <div className="text-[10px] text-[var(--red)] font-semibold mt-1 leading-snug">
                  {getFieldError("batch")}
                </div>
              )}
            </div>

            {/* Price Row: Entry Price, Target Price, Stop Loss */}
            <div className="grid grid-cols-3 gap-3">
              {/* Entry — read-only, always the live LTP fetched from Angel One */}
              <div>
                <label className="block text-[11.5px] font-bold text-[var(--muted)] uppercase tracking-[0.05em] mb-1.5">
                  Entry Price{" "}
                  <span className="normal-case font-semibold text-[var(--muted-2)]">(Live)</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[12.5px] font-medium text-[var(--muted-2)]">
                    ₹
                  </span>
                  <input
                    className={`w-full rounded-lg border bg-[var(--surface)] text-[var(--muted-2)] cursor-not-allowed border-dashed py-2 pl-6 pr-8 text-[13px] font-medium transition-colors focus:outline-none ${
                      getFieldError("entry") ? "border-[var(--red)]" : "border-[var(--line)]"
                    } ${isFetchingPrice ? "animate-pulse" : ""}`}
                    onBlur={() => markTouched("entry")}
                    placeholder={isFetchingPrice ? "Fetching…" : "Select instrument"}
                    type="number"
                    step="0.05"
                    value={entryPrice}
                    disabled={isFetchingPrice}
                    readOnly={true}
                    title="Entry price is fetched live from the market — it cannot be edited"
                  />
                  {isFetchingPrice ? (
                    <Icon
                      className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin h-3.5 w-3.5 text-[var(--brand)]"
                      name="timer"
                    />
                  ) : (
                    isSymbolSelected && (
                      <button
                        type="button"
                        aria-label="Refresh live price"
                        title="Refresh live price"
                        onClick={() => fetchLivePrice(symbolQuery)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[var(--muted-2)] hover:text-[var(--brand)] transition-colors"
                      >
                        <Icon className="h-3.5 w-3.5" name="refresh" />
                      </button>
                    )
                  )}
                </div>
                {entryPrice && !getFieldError("entry") && (
                  <div className="text-[10.5px] text-[var(--muted-2)] mt-1 font-medium italic">
                    Fetched from market
                  </div>
                )}
                {getFieldError("entry") && (
                  <div className="text-[10px] text-[var(--red)] font-semibold mt-1 leading-snug">
                    {getFieldError("entry")}
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
                      const remainingPct =
                        100 - targets.reduce((acc, t) => acc + (parseFloat(t.percent) || 0), 0);
                      setTargets([
                        ...targets,
                        { price: "", percent: remainingPct > 0 ? String(remainingPct) : "0" },
                      ]);
                    }}
                    disabled={targets.length >= 5}
                    className="text-[11px] font-bold text-[var(--brand)] hover:text-[var(--brand-dark)] transition-colors flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Icon name="plus" className="h-3 w-3" /> Add Target
                  </button>
                </div>
                {getFieldError("targets") && (
                  <div className="text-[10px] text-[var(--red)] font-semibold leading-snug">
                    {getFieldError("targets")}
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
                            getFieldError(`target_${idx}_price`)
                              ? "border-[var(--red)]"
                              : "border-[var(--line)]"
                          }`}
                          onChange={(e) => {
                            const newTargets = [...targets];
                            newTargets[idx].price = e.target.value;
                            setTargets(newTargets);
                            markTouched(`target_${idx}_price`);
                          }}
                          onFocus={(e) => e.target.select()}
                          onBlur={() => markTouched(`target_${idx}_price`)}
                          placeholder={`Target ${idx + 1}`}
                          type="number"
                          step="0.05"
                          value={t.price}
                        />
                      </div>
                      {getFieldError(`target_${idx}_price`) && (
                        <div className="text-[10px] text-[var(--red)] font-semibold mt-1 leading-snug">
                          {getFieldError(`target_${idx}_price`)}
                        </div>
                      )}
                    </div>

                    <div className="w-[100px]">
                      <div className="relative">
                        <input
                          className={`w-full rounded-lg border bg-white py-2 pl-3 pr-6 text-[13px] font-medium text-[var(--ink)] transition-colors focus:outline-none focus:ring-1 focus:ring-[var(--brand)] ${
                            getFieldError(`target_${idx}_percent`)
                              ? "border-[var(--red)]"
                              : "border-[var(--line)]"
                          }`}
                          onChange={(e) => {
                            const newTargets = [...targets];
                            newTargets[idx].percent = e.target.value;
                            setTargets(newTargets);
                            markTouched(`target_${idx}_percent`);
                            markTouched("targets");
                          }}
                          onFocus={(e) => e.target.select()}
                          onBlur={() => {
                            markTouched(`target_${idx}_percent`);
                            markTouched("targets");
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
                      {getFieldError(`target_${idx}_percent`) && (
                        <div className="text-[10px] text-[var(--red)] font-semibold mt-1 leading-snug">
                          {getFieldError(`target_${idx}_percent`)}
                        </div>
                      )}
                    </div>

                    {targets.length > 1 && (
                      <button
                        type="button"
                        onClick={() => {
                          const newTargets = targets.filter((_, i) => i !== idx);
                          setTargets(newTargets);
                          setTouched((prev) => {
                            const next = { ...prev };
                            delete next[`target_${idx}_price`];
                            delete next[`target_${idx}_percent`];
                            for (let i = idx + 1; i <= targets.length; i++) {
                              if (next[`target_${i}_price`]) {
                                next[`target_${i - 1}_price`] = true;
                                delete next[`target_${i}_price`];
                              }
                              if (next[`target_${i}_percent`]) {
                                next[`target_${i - 1}_percent`] = true;
                                delete next[`target_${i}_percent`];
                              }
                            }
                            return next;
                          });
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
                      getFieldError("stopLoss") ? "border-[var(--red)]" : "border-[var(--line)]"
                    }`}
                    onChange={(e) => {
                      setStopLoss(e.target.value);
                      markTouched("stopLoss");
                    }}
                    onFocus={(e) => e.target.select()}
                    onBlur={() => markTouched("stopLoss")}
                    placeholder="0.00"
                    type="number"
                    step="0.05"
                    value={stopLoss}
                  />
                </div>
                {getFieldError("stopLoss") && (
                  <div className="text-[10px] text-[var(--red)] font-semibold mt-1 leading-snug font-medium">
                    {getFieldError("stopLoss")}
                  </div>
                )}
              </div>
            </div>

            {/* Risk : Reward Ratio */}
            {(() => {
              const e = parseFloat(entryPrice);
              const totalPercent = targets.reduce(
                (acc, t) => acc + (parseFloat(t.percent) || 0),
                0
              );
              const t =
                totalPercent > 0
                  ? targets.reduce(
                      (acc, t) => acc + (parseFloat(t.price) || 0) * (parseFloat(t.percent) || 0),
                      0
                    ) / totalPercent
                  : 0;
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
                <span
                  className={`text-[10px] font-semibold ${notes.length > 500 ? "text-[var(--red)]" : "text-[var(--muted-2)]"}`}
                >
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

          {/* Telegram Publish Toggle */}
          <div
            className={`mx-6 mb-4 flex items-start gap-3 rounded-xl border p-3.5 transition-colors ${
              publishToTelegram
                ? "border-[#229ED9]/30 bg-[#229ED9]/5"
                : "border-[var(--line)] bg-[var(--surface)]/40"
            }`}
          >
            <button
              type="button"
              id="publishToTelegramToggle"
              role="checkbox"
              aria-checked={publishToTelegram}
              onClick={() => {
                setPublishToTelegram((v) => !v);
                setErrors((prev) => ({ ...prev, telegram: "" }));
              }}
              className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition-all ${
                publishToTelegram
                  ? "border-[#229ED9] bg-[#229ED9] text-white"
                  : "border-[var(--line)] bg-white"
              }`}
            >
              {publishToTelegram && <Icon name="check" className="h-3 w-3" />}
            </button>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <svg className="h-3.5 w-3.5 text-[#229ED9] shrink-0" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L8.32 13.617l-2.96-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.194 1.006.131.828.942z" />
                </svg>
                <span className="text-[12.5px] font-bold text-[var(--ink)]">
                  Broadcast to Stoxify Channel
                </span>
              </div>
              <p className="text-[11px] text-[var(--muted)] mt-0.5">
                Broadcast this trade signal to Stoxify Channel.
              </p>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="px-6 py-4 bg-[var(--surface)] flex flex-col gap-3 border-t border-dashed border-[#1f7ae0]/25">
            {/* Submit-level error banner (permissions, account state, server errors) */}
            {errors.submit && (
              <div className="flex items-start gap-2.5 rounded-lg border border-[var(--red)]/25 bg-[var(--red)]/8 px-3.5 py-2.5 text-[12px] text-[var(--red)] font-medium leading-snug">
                <svg className="mt-[1px] h-3.5 w-3.5 shrink-0 fill-current" viewBox="0 0 16 16">
                  <path d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1Zm-.75 4a.75.75 0 0 1 1.5 0v3.5a.75.75 0 0 1-1.5 0V5Zm.75 7a1 1 0 1 1 0-2 1 1 0 0 1 0 2Z" />
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
