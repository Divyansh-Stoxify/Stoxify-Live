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

type GroupedAnalyst = {
  analyst_id: string;
  analyst_name: string;
  plans: Plan[];
  segments: string[];
};

const SEGMENTS = ["ALL", "EQUITY", "FNO", "COMMODITY", "CURRENCY"] as const;

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

function getStartingPrice(plan: Plan) {
  if (plan.batches && plan.batches.length > 0) {
    const prices = plan.batches.map(b => b.discounted_price || b.price);
    return Math.min(...prices);
  }
  return plan.price;
}

function AnalystCard({ analyst }: { analyst: GroupedAnalyst }) {
  const startingPrices = analyst.plans.map(p => getStartingPrice(p));
  const minStartingPrice = startingPrices.length > 0 ? Math.min(...startingPrices) : 0;

  return (
    <article className="group flex flex-col rounded-2xl border border-[var(--line)] bg-white p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_40px_rgba(0,0,0,0.06)] hover:border-blue-200">
      
      {/* Top Header: Avatar + Analyst Name + Segments */}
      <div className="flex items-start gap-4 mb-5">
        <div
          className="flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-xl text-[15px] font-black text-white shadow-sm"
          style={{ background: getGradient(analyst.analyst_id) }}
        >
          {getInitials(analyst.analyst_name)}
        </div>
        <div className="flex-1 min-w-0 pt-0.5">
          <div className="flex items-center gap-2">
            <h3 className="text-[15px] font-bold tracking-tight text-[var(--ink)] truncate">
              {analyst.analyst_name || "Unknown Analyst"}
            </h3>
            <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-50 px-1.5 py-0.5 text-[9px] font-extrabold text-emerald-700 border border-emerald-100 shrink-0">
              <Icon name="shieldCheck" className="h-3 w-3 text-emerald-600" />
              SEBI
            </span>
          </div>
          <div className="mt-1 flex flex-wrap gap-1.5">
            {analyst.segments.slice(0, 3).map(seg => (
              <span key={seg} className="inline-flex items-center text-[11px] font-bold text-[var(--muted)]">
                {seg === "FNO" ? "F&O" : seg.charAt(0) + seg.slice(1).toLowerCase()}
                <span className="ml-1.5 text-[var(--line-2)] last:hidden">•</span>
              </span>
            ))}
            {analyst.segments.length > 3 && (
              <span className="inline-flex items-center text-[11px] font-bold text-[var(--muted)]">
                +{analyst.segments.length - 3}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Advisory Plans Section */}
      <div className="flex-1 flex flex-col gap-3 mb-6">
        <div className="flex items-center justify-between border-b border-[var(--line)] pb-2">
          <span className="text-[11px] font-bold text-[var(--muted)] uppercase tracking-wider">
            {analyst.plans.length} {analyst.plans.length === 1 ? "Advisory Plan" : "Advisory Plans"}
          </span>
        </div>
        
        <div className="flex flex-col gap-2.5">
          {analyst.plans.slice(0, 3).map(plan => {
            const planStartingPrice = getStartingPrice(plan);
            return (
              <div 
                key={plan.plan_id} 
                className="flex flex-col gap-0.5 p-3 rounded-xl border border-slate-100 bg-slate-50/50 group-hover:bg-white group-hover:border-slate-200 transition-all duration-300"
              >
                <div className="flex items-start justify-between gap-2">
                  <h4 className="text-[13px] font-bold text-slate-800 leading-snug truncate">
                    {plan.name}
                  </h4>
                  <span className="text-[12.5px] font-extrabold text-slate-900 shrink-0">
                    {formatPrice(planStartingPrice)}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] font-semibold text-[var(--muted-2)]">
                  {plan.risk_level && (
                    <span className="uppercase tracking-wider">
                      {plan.risk_level} Risk
                    </span>
                  )}
                  {plan.risk_level && plan.horizons && plan.horizons.length > 0 && <span>•</span>}
                  {plan.horizons && plan.horizons.length > 0 && (
                    <span>{plan.horizons.slice(0, 1).join("")}</span>
                  )}
                </div>
              </div>
            );
          })}
          {analyst.plans.length > 3 && (
            <div className="text-[11px] font-bold text-blue-600 mt-1 pl-1">
              +{analyst.plans.length - 3} more plans available
            </div>
          )}
        </div>
      </div>

      {/* Footer / CTA */}
      <div className="mt-auto flex items-center justify-between pt-4 border-t border-[var(--line)]">
        <div className="flex flex-col">
          <span className="text-[10px] font-bold text-[var(--muted)] uppercase tracking-wider mb-0.5">Starting From</span>
          <div className="flex items-baseline gap-1">
            <span className="text-[18px] font-black text-[var(--ink)] tracking-tight">
              {formatPrice(minStartingPrice)}
            </span>
          </div>
        </div>
        <Link
          href={`/trader/analyst/${analyst.analyst_id}`}
          className="flex items-center gap-2 rounded-xl bg-[var(--ink)] px-4 py-2.5 text-[13px] font-bold text-white transition-all hover:bg-black hover:shadow-md active:scale-95"
        >
          View Plans
          <Icon name="arrowRight" className="h-4 w-4" />
        </Link>
      </div>
    </article>
  );
}

function SkeletonPlanCard() {
  return (
    <div className="rounded-2xl border border-[var(--line)] bg-white p-6 animate-pulse flex flex-col h-full">
      <div className="flex items-start gap-4 mb-5">
        <div className="h-[46px] w-[46px] rounded-xl bg-[var(--line)]" />
        <div className="flex-1 pt-1">
          <div className="h-4 w-28 rounded bg-[var(--line)] mb-2.5" />
          <div className="h-2.5 w-20 rounded bg-[var(--line)]" />
        </div>
      </div>
      <div className="h-5 w-3/4 rounded bg-[var(--line)] mb-2" />
      <div className="h-3 w-full rounded bg-[var(--line)] mb-1" />
      <div className="h-3 w-2/3 rounded bg-[var(--line)] mb-5" />
      <div className="flex gap-2 mb-5">
        <div className="h-6 w-20 rounded-lg bg-[var(--line)]" />
        <div className="h-6 w-24 rounded-lg bg-[var(--line)]" />
      </div>
      <div className="space-y-3 mb-6 flex-1">
        <div className="h-3 w-16 rounded bg-[var(--line)] mb-4" />
        <div className="flex justify-between">
          <div className="h-4 w-24 rounded bg-[var(--line)]" />
          <div className="h-4 w-16 rounded bg-[var(--line)]" />
        </div>
        <div className="flex justify-between">
          <div className="h-4 w-20 rounded bg-[var(--line)]" />
          <div className="h-4 w-16 rounded bg-[var(--line)]" />
        </div>
      </div>
      <div className="flex justify-between items-center pt-4 border-t border-[var(--line)] mt-auto">
        <div className="space-y-1.5">
          <div className="h-2.5 w-16 rounded bg-[var(--line)]" />
          <div className="h-5 w-24 rounded bg-[var(--line)]" />
        </div>
        <div className="h-10 w-28 rounded-xl bg-[var(--line)]" />
      </div>
    </div>
  );
}

export default function DiscoverPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [segment, setSegment] = useState<string>("ALL");
  const [search, setSearch] = useState("");

  const fetchPlans = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ is_active: "true", limit: "50" });
      if (segment !== "ALL") params.set("segment", segment);
      const res = await fetch(`/api/trader/plans?${params.toString()}`, {
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
  }, [segment]);

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  // Group plans by analyst
  const groupedAnalysts = useMemo(() => {
    const groups: Record<string, GroupedAnalyst> = {};
    plans.forEach((plan) => {
      if (!groups[plan.analyst_id]) {
        groups[plan.analyst_id] = {
          analyst_id: plan.analyst_id,
          analyst_name: plan.analyst_name,
          plans: [],
          segments: [],
        };
      }
      groups[plan.analyst_id].plans.push(plan);
      
      const planSegments = plan.segments && plan.segments.length > 0 
        ? plan.segments 
        : (plan.segment ? [plan.segment] : []);
      planSegments.forEach((seg) => {
        if (!groups[plan.analyst_id].segments.includes(seg)) {
          groups[plan.analyst_id].segments.push(seg);
        }
      });
    });
    return Object.values(groups);
  }, [plans]);

  const filteredAnalysts = useMemo(() => {
    if (!search) return groupedAnalysts;
    const searchLower = search.toLowerCase();
    return groupedAnalysts.filter((analyst) => {
      const matchesAnalystName = analyst.analyst_name.toLowerCase().includes(searchLower);
      const matchesPlanName = analyst.plans.some((plan) =>
        plan.name.toLowerCase().includes(searchLower)
      );
      return matchesAnalystName || matchesPlanName;
    });
  }, [groupedAnalysts, search]);

  return (
    <div className="min-h-screen bg-[#fafafa]">
      <div className="px-6 py-8 lg:px-8 lg:py-10 max-w-[1200px] mx-auto">
        
        {/* Header */}
        <div className="mb-8 max-w-2xl">
          <h1 className="text-[28px] font-black tracking-tight text-[var(--ink)] mb-2">
            Discover Analysts
          </h1>
          <p className="text-[14px] text-[var(--muted)] font-medium leading-relaxed">
            Browse top SEBI-registered Research Analysts. Compare strategies, analyze risk levels, and subscribe to premium advisory plans that fit your trading style.
          </p>
        </div>

        {/* Filters */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          
          {/* Segment Pills */}
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
                {seg === "FNO"
                  ? "F&O"
                  : seg === "ALL"
                    ? "All"
                    : seg.charAt(0) + seg.slice(1).toLowerCase()}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative w-full sm:w-[320px]">
            <Icon
              name="search"
              className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              placeholder="Search analysts or plans..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-[var(--line)] bg-white py-2.5 pl-10 pr-4 text-[13px] font-medium text-[var(--ink)] placeholder:text-slate-400 shadow-sm transition-all focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10"
            />
          </div>
        </div>

        {/* Plans Grid */}
        {loading ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <SkeletonPlanCard />
            <SkeletonPlanCard />
            <SkeletonPlanCard />
            <SkeletonPlanCard />
            <SkeletonPlanCard />
            <SkeletonPlanCard />
          </div>
        ) : filteredAnalysts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center rounded-3xl border border-[var(--line)] bg-white shadow-sm">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 text-blue-500">
              <Icon name="search" className="h-6 w-6" />
            </div>
            <h3 className="text-[17px] font-bold text-[var(--ink)] mb-1.5">
              {search ? "No matching analysts" : "No analysts available"}
            </h3>
            <p className="text-[14px] text-[var(--muted)] font-medium max-w-[320px]">
              {search
                ? "Try a different search term or clear your segment filters."
                : "New SEBI-registered analysts are being onboarded. Check back soon!"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 items-stretch">
            {filteredAnalysts.map((analyst) => (
              <AnalystCard key={analyst.analyst_id} analyst={analyst} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
