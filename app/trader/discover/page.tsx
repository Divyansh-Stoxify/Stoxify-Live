"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import { Icon } from "@/components/stoxify-icon";
import type { PlanBatch } from "@/lib/types/analyst";

type Plan = {
  plan_id: string;
  analyst_id: string;
  analyst_name: string;
  name: string;
  description?: string;
  days: number;
  price: number;
  segment?: string;
  segments?: string[];
  horizons?: string[];
  risk_level?: string;
  features?: string[];
  batches?: PlanBatch[];
  subscriber_count?: number;
  is_active: boolean;
};

const SEGMENTS = ["ALL", "EQUITY", "FNO", "COMMODITY", "CURRENCY"] as const;

const RISK_LEVELS = [
  { key: "LOW", label: "Low" },
  { key: "MEDIUM", label: "Med" },
  { key: "HIGH", label: "High" },
] as const;

type SortKey = "popularity" | "price_asc" | "price_desc";

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: "popularity", label: "Popularity" },
  { key: "price_asc", label: "Price: Low to High" },
  { key: "price_desc", label: "Price: High to Low" },
];

const gradients = [
  "linear-gradient(135deg, #3B82F6 0%, #2D5BE3 100%)",
  "linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%)",
  "linear-gradient(135deg, #F59E0B 0%, #D97706 100%)",
  "linear-gradient(135deg, #10B981 0%, #059669 100%)",
  "linear-gradient(135deg, #EF4444 0%, #DC2626 100%)",
  "linear-gradient(135deg, #EC4899 0%, #DB2777 100%)",
];

function getGradient(id?: string): string {
  const safeId = id || "default";
  let hash = 0;
  for (let i = 0; i < safeId.length; i++) {
    hash = safeId.charCodeAt(i) + ((hash << 5) - hash);
  }
  return gradients[Math.abs(hash) % gradients.length];
}

function getInitials(name?: string): string {
  const parts = (name || "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "A";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return parts
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();
}

function formatPrice(value: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function getStartingPrice(plan: Plan): number {
  if (plan.batches && plan.batches.length > 0) {
    const prices = plan.batches
      .filter((b) => b.is_active !== false)
      .map((b) => b.discounted_price || b.price);
    if (prices.length > 0) return Math.min(...prices);
  }
  return plan.price;
}

function formatSegment(seg: string): string {
  if (seg === "FNO") return "F&O";
  if (seg === "ALL") return "All";
  return seg.charAt(0) + seg.slice(1).toLowerCase();
}

const RISK_META: Record<string, { label: string; dot: string; text: string }> = {
  LOW: { label: "Low", dot: "bg-emerald-500", text: "text-emerald-600" },
  MEDIUM: { label: "Med.", dot: "bg-amber-500", text: "text-amber-600" },
  HIGH: { label: "High", dot: "bg-red-500", text: "text-red-600" },
};

function PlanRow({ plan }: { plan: Plan }) {
  const startingPrice = getStartingPrice(plan);
  const displaySegments =
    plan.segments && plan.segments.length > 0
      ? plan.segments
      : plan.segment
        ? [plan.segment]
        : [];
  const risk = plan.risk_level
    ? RISK_META[plan.risk_level.toUpperCase()]
    : undefined;
  const horizon = plan.horizons && plan.horizons.length > 0 ? plan.horizons[0] : null;

  return (
    <Link
      href={`/trader/batch/${plan.plan_id}`}
      className="group grid grid-cols-1 sm:grid-cols-[minmax(0,1fr)_auto] items-center gap-4 sm:gap-6 px-5 py-4 transition-colors hover:bg-[var(--line-2)]"
    >
      {/* Left: avatar + name + description */}
      <div className="flex items-start gap-3.5 min-w-0">
        <div
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-[13px] font-black text-white shadow-sm"
          style={{ background: getGradient(plan.analyst_id) }}
        >
          {getInitials(plan.analyst_name)}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-[14.5px] font-bold tracking-tight text-blue-600 truncate group-hover:underline">
              {plan.name}
            </h3>
            {risk && (
              <span className={`hidden sm:inline-flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wider ${risk.text}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${risk.dot}`} />
                {risk.label} Risk
              </span>
            )}
          </div>
          <p className="mt-0.5 text-[12.5px] font-medium leading-snug text-[var(--muted)] line-clamp-2">
            {plan.description || `Advisory batch by ${plan.analyst_name}`}
          </p>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] font-bold text-[var(--muted-2)]">
            <span className="inline-flex items-center gap-1 text-[var(--muted)]">
              <Icon name="shieldCheck" className="h-3 w-3 text-emerald-600" />
              {plan.analyst_name}
            </span>
            {displaySegments.slice(0, 2).map((seg) => (
              <span key={seg} className="inline-flex items-center">
                <span className="mr-2 text-[var(--line)]">•</span>
                {formatSegment(seg)}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Right: metric columns */}
      <div className="flex items-center gap-6 sm:gap-8 pl-[58px] sm:pl-0">
        <div className="flex flex-col">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted-2)]">
            Plans Start At :
          </span>
          <span className="mt-0.5 text-[14px] font-extrabold text-[var(--ink)]">
            {formatPrice(startingPrice)}
          </span>
        </div>

        <div className="hidden md:flex flex-col w-[90px]">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted-2)]">
            Horizon
          </span>
          <span className="mt-0.5 text-[13px] font-bold text-[var(--ink)] capitalize truncate">
            {horizon ? horizon.toLowerCase().replace(/_/g, " ") : "—"}
          </span>
        </div>

        <div className="flex flex-col w-[64px]">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted-2)]">
            Risk
          </span>
          {risk ? (
            <span className={`mt-0.5 inline-flex items-center gap-1 text-[13px] font-bold ${risk.text}`}>
              <span className={`h-2 w-2 rounded-full ${risk.dot}`} />
              {risk.label}
            </span>
          ) : (
            <span className="mt-0.5 text-[13px] font-bold text-[var(--muted-2)]">—</span>
          )}
        </div>

        <Icon
          name="arrowRight"
          className="hidden sm:block h-4 w-4 text-[var(--muted-2)] transition-transform group-hover:translate-x-0.5 group-hover:text-[var(--ink)]"
        />
      </div>
    </Link>
  );
}

function SkeletonRow() {
  return (
    <div className="flex items-center gap-4 px-5 py-4 animate-pulse">
      <div className="h-11 w-11 rounded-xl bg-[var(--line)]" />
      <div className="flex-1">
        <div className="h-3.5 w-40 rounded bg-[var(--line)] mb-2" />
        <div className="h-2.5 w-64 rounded bg-[var(--line)]" />
      </div>
      <div className="h-8 w-20 rounded bg-[var(--line)]" />
    </div>
  );
}

type Facet = { value: string; count: number };
type Facets = { segments: Facet[]; risk_levels: Facet[]; horizons: Facet[] };

export default function DiscoverPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [facets, setFacets] = useState<Facets>({ segments: [], risk_levels: [], horizons: [] });
  const [loading, setLoading] = useState(true);
  const [segment, setSegment] = useState<string>("ALL");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [riskFilter, setRiskFilter] = useState<Set<string>>(new Set());
  const [horizonFilter, setHorizonFilter] = useState<Set<string>>(new Set());
  const [sort, setSort] = useState<SortKey>("popularity");

  // Debounce the search box so we don't fire a backend request per keystroke.
  useEffect(() => {
    const id = setTimeout(() => setDebouncedSearch(search), 350);
    return () => clearTimeout(id);
  }, [search]);

  // Serialize the active filters into the query string shared by the list and
  // facets endpoints. The backend does all filtering/sorting now.
  const filterParams = useMemo(() => {
    const params = new URLSearchParams({ is_active: "true", limit: "50" });
    if (segment !== "ALL") params.set("segments", segment);
    if (riskFilter.size > 0) params.set("risk_levels", Array.from(riskFilter).join(","));
    if (horizonFilter.size > 0) params.set("horizons", Array.from(horizonFilter).join(","));
    if (debouncedSearch.trim()) params.set("search", debouncedSearch.trim());
    params.set("sort", sort);
    return params;
  }, [segment, riskFilter, horizonFilter, debouncedSearch, sort]);

  const fetchPlans = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/trader/plans?${filterParams.toString()}`, {
        credentials: "same-origin",
        cache: "no-store",
      });
      const data = await res.json().catch(() => ({}));
      setPlans(data.plans ?? data.data ?? []);
    } catch {
      setPlans([]);
    } finally {
      setLoading(false);
    }
  }, [filterParams]);

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  // Facets drive the sidebar's selectable options + counts, independent of the
  // current page. Refetched as filters change so counts stay accurate.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/trader/plans/facets?${filterParams.toString()}`, {
          credentials: "same-origin",
          cache: "no-store",
        });
        const data = await res.json().catch(() => ({}));
        if (!cancelled) {
          setFacets({
            segments: data.segments ?? [],
            risk_levels: data.risk_levels ?? [],
            horizons: data.horizons ?? [],
          });
        }
      } catch {
        if (!cancelled) setFacets({ segments: [], risk_levels: [], horizons: [] });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [filterParams]);

  // Available horizons come from the facets endpoint so options don't vanish
  // once the result set is narrowed.
  const availableHorizons = useMemo(
    () => facets.horizons.map((h) => h.value),
    [facets.horizons]
  );
  const riskCounts = useMemo(() => {
    const map = new Map<string, number>();
    facets.risk_levels.forEach((r) => map.set(r.value, r.count));
    return map;
  }, [facets.risk_levels]);

  const toggleRisk = (key: string) => {
    setRiskFilter((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const toggleHorizon = (key: string) => {
    setHorizonFilter((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const resetFilters = () => {
    setRiskFilter(new Set());
    setHorizonFilter(new Set());
    setSearch("");
  };

  const activeFilterCount = riskFilter.size + horizonFilter.size;

  // Filtering and sorting now happen on the backend; render the result as-is.
  const filteredPlans = plans;

  return (
    <div className="min-h-screen bg-[#fafafa]">
      <div className="px-6 py-8 lg:px-8 lg:py-10 max-w-[1200px] mx-auto">
        {/* Header */}
        <div className="mb-8 max-w-2xl">
          <h1 className="text-[28px] font-black tracking-tight text-[var(--ink)] mb-2">
            Discover Batches
          </h1>
          <p className="text-[14px] text-[var(--muted)] font-medium leading-relaxed">
            Browse advisory batches from top SEBI-registered Research Analysts. Filter by
            risk and horizon, compare pricing, and subscribe to batches that fit your trading
            style.
          </p>
        </div>

        {/* Segment Tabs + Search */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex rounded-xl border border-[var(--line)] bg-white p-1 overflow-x-auto hide-scrollbar shadow-sm">
            {SEGMENTS.map((seg) => (
              <button
                key={seg}
                type="button"
                onClick={() => setSegment(seg)}
                className={[
                  "rounded-lg px-4 py-2 text-[13px] font-bold transition-all whitespace-nowrap",
                  segment === seg
                    ? "bg-slate-900 text-white shadow-sm"
                    : "text-[var(--muted)] hover:text-[var(--ink)] hover:bg-slate-50",
                ].join(" ")}
              >
                {formatSegment(seg)}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-[320px]">
            <Icon
              name="search"
              className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              placeholder="Search analysts or batches..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-[var(--line)] bg-white py-2.5 pl-10 pr-4 text-[13px] font-medium text-[var(--ink)] placeholder:text-slate-400 shadow-sm transition-all focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10"
            />
          </div>
        </div>

        {/* Two-column: filter rail + list */}
        <div className="grid grid-cols-1 lg:grid-cols-[230px_1fr] gap-6 items-start">
          {/* Filter Sidebar */}
          <aside className="rounded-2xl border border-[var(--line)] bg-white p-5 shadow-sm lg:sticky lg:top-6">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <span className="text-[13px] font-extrabold text-[var(--ink)]">Filters</span>
                {activeFilterCount > 0 && (
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-slate-900 px-1.5 text-[10px] font-bold text-white">
                    {activeFilterCount}
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={resetFilters}
                className="text-[12px] font-bold text-[var(--muted)] hover:text-[var(--ink)] transition-colors"
              >
                Reset
              </button>
            </div>

            {/* Risk Level */}
            <div className="mb-6">
              <h4 className="text-[12px] font-extrabold text-[var(--ink)] mb-1">Risk Level</h4>
              <p className="text-[11px] font-medium text-[var(--muted-2)] mb-3">
                Based on batch strategy
              </p>
              <div className="grid grid-cols-3 gap-2">
                {RISK_LEVELS.map(({ key, label }) => {
                  const active = riskFilter.has(key);
                  const meta = RISK_META[key];
                  const count = riskCounts.get(key) ?? 0;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => toggleRisk(key)}
                      className={[
                        "flex flex-col items-center gap-1.5 rounded-xl border py-3 transition-all",
                        active
                          ? "border-slate-900 bg-slate-50 shadow-sm"
                          : "border-[var(--line)] bg-white hover:border-slate-300",
                      ].join(" ")}
                    >
                      <span className={`h-2.5 w-2.5 rounded-full ${meta.dot}`} />
                      <span
                        className={`text-[11px] font-bold ${active ? "text-[var(--ink)]" : "text-[var(--muted)]"}`}
                      >
                        {label}
                      </span>
                      <span className="text-[10px] font-bold text-[var(--muted-2)]">{count}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Horizon */}
            <div>
              <h4 className="text-[12px] font-extrabold text-[var(--ink)] mb-1">Horizon</h4>
              <p className="text-[11px] font-medium text-[var(--muted-2)] mb-3">
                Trade holding period
              </p>
              {availableHorizons.length === 0 ? (
                <p className="text-[11px] font-medium text-[var(--muted-2)]">
                  No horizons available
                </p>
              ) : (
                <div className="flex flex-col gap-1">
                  {facets.horizons.map(({ value: h, count }) => {
                    const active = horizonFilter.has(h);
                    return (
                      <button
                        key={h}
                        type="button"
                        onClick={() => toggleHorizon(h)}
                        className="flex items-center gap-2.5 py-1.5 text-left group/h"
                      >
                        <span
                          className={[
                            "flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-all",
                            active
                              ? "border-slate-900 bg-slate-900"
                              : "border-[var(--line)] bg-white group-hover/h:border-slate-400",
                          ].join(" ")}
                        >
                          {active && <Icon name="check" className="h-3 w-3 text-white" />}
                        </span>
                        <span
                          className={`flex-1 text-[12.5px] font-semibold capitalize ${active ? "text-[var(--ink)]" : "text-[var(--muted)]"}`}
                        >
                          {h.toLowerCase().replace(/_/g, " ")}
                        </span>
                        <span className="text-[11px] font-bold text-[var(--muted-2)]">{count}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </aside>

          {/* List */}
          <div className="rounded-2xl border border-[var(--line)] bg-white shadow-sm overflow-hidden">
            {/* List header: count + sort */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-[var(--line)]">
              <span className="text-[12.5px] font-bold text-[var(--muted)]">
                {loading
                  ? "Loading…"
                  : `${filteredPlans.length} ${filteredPlans.length === 1 ? "batch" : "batches"}`}
              </span>
              <label className="flex items-center gap-2 text-[12.5px] font-bold text-[var(--muted)]">
                Sort by
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value as SortKey)}
                  className="rounded-lg border border-[var(--line)] bg-white px-2.5 py-1.5 text-[12.5px] font-bold text-[var(--ink)] outline-none cursor-pointer focus:border-blue-500"
                >
                  {SORT_OPTIONS.map((o) => (
                    <option key={o.key} value={o.key}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {loading ? (
              <div className="divide-y divide-[var(--line)]">
                <SkeletonRow />
                <SkeletonRow />
                <SkeletonRow />
                <SkeletonRow />
                <SkeletonRow />
              </div>
            ) : filteredPlans.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 text-blue-500">
                  <Icon name="search" className="h-6 w-6" />
                </div>
                <h3 className="text-[16px] font-bold text-[var(--ink)] mb-1.5">
                  {search || activeFilterCount > 0
                    ? "No matching batches"
                    : "No batches available"}
                </h3>
                <p className="text-[13.5px] text-[var(--muted)] font-medium max-w-[320px]">
                  {search || activeFilterCount > 0
                    ? "Try a different search term or clear your filters."
                    : "New SEBI-registered analysts are being onboarded. Check back soon!"}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-[var(--line)]">
                {filteredPlans.map((plan) => (
                  <PlanRow key={plan.plan_id} plan={plan} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
