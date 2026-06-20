"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { Icon } from "@/components/stoxify-icon";

type Plan = {
  plan_id: string;
  analyst_id: string;
  analyst_name: string;
  name: string;
  description?: string;
  days: number;
  price: number;
  segment: string;
  features?: string[];
  subscriber_count?: number;
  is_active: boolean;
};

const SEGMENTS = ["ALL", "EQUITY", "FNO", "BOTH"] as const;

const gradients = [
  "linear-gradient(135deg,#3B82F6,#2D5BE3)",
  "linear-gradient(135deg,#8B5CF6,#6D28D9)",
  "linear-gradient(135deg,#F59E0B,#D97706)",
  "linear-gradient(135deg,#10B981,#059669)",
  "linear-gradient(135deg,#EF4444,#DC2626)",
  "linear-gradient(135deg,#EC4899,#DB2777)",
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

function PlanCard({ plan }: { plan: Plan }) {
  return (
    <article className="flex flex-col rounded-xl border-[1.5px] border-[var(--line)] bg-white p-6 transition-all hover:-translate-y-[2px] hover:border-[var(--brand-mid)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)]">
      {/* Analyst Info */}
      <div className="mb-5 flex items-start gap-3.5">
        <div
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[14px] text-[16px] font-extrabold text-white"
          style={{ background: getGradient(plan.analyst_id) }}
        >
          {getInitials(plan.analyst_name)}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-[15px] font-bold tracking-[-0.02em] text-[var(--ink)] truncate">
            {plan.analyst_name || "Unknown Analyst"}
          </h3>
          <div className="mt-[3px] flex flex-wrap gap-[5px]">
            <span className="inline-flex items-center rounded-full bg-[var(--brand-light)] px-2.5 py-0.5 text-[11px] font-semibold text-[var(--brand)]">
              {plan.segment}
            </span>
            <span className="inline-flex items-center rounded-full bg-[var(--line-2)] px-2.5 py-0.5 text-[11px] font-semibold text-[var(--muted)]">
              {plan.days} days
            </span>
          </div>
        </div>
      </div>

      {/* Plan Name & Description */}
      <div className="mb-4 flex-1">
        <h4 className="text-[14px] font-bold text-[var(--ink)] mb-1">{plan.name}</h4>
        {plan.description && (
          <p className="text-[12px] leading-relaxed text-[var(--muted)] line-clamp-2">
            {plan.description}
          </p>
        )}
      </div>

      {/* Features */}
      {plan.features && plan.features.length > 0 && (
        <ul className="mb-4 flex flex-col gap-1.5">
          {plan.features.slice(0, 3).map((feature) => (
            <li key={feature} className="flex items-center gap-2 text-[12px] text-[var(--muted)]">
              <Icon name="check" className="h-3 w-3 text-[var(--green)]" />
              {feature}
            </li>
          ))}
        </ul>
      )}

      {/* Stats */}
      {plan.subscriber_count !== undefined && (
        <div className="mb-4 rounded-lg bg-[var(--surface)] px-3 py-2.5 grid grid-cols-2 gap-2">
          <div className="text-center">
            <div className="text-[15px] font-extrabold text-[var(--ink)]">
              {plan.subscriber_count}
            </div>
            <div className="text-[10px] text-[var(--muted)]">Subscribers</div>
          </div>
          <div className="text-center">
            <div className="text-[15px] font-extrabold text-[var(--green)]">{plan.days}d</div>
            <div className="text-[10px] text-[var(--muted)]">Duration</div>
          </div>
        </div>
      )}

      {/* Price & CTA */}
      <div className="flex items-center justify-between gap-3 pt-2 border-t border-[var(--line)]">
        <div>
          <span className="text-[17px] font-extrabold text-[var(--ink)]">
            {formatPrice(plan.price)}
          </span>
          <span className="text-[12px] text-[var(--muted)]"> /{plan.days}d</span>
        </div>
        <Link
          href={`/trader/analyst/${plan.analyst_id}`}
          className="rounded-lg bg-[var(--brand)] px-4 py-2 text-[13px] font-bold text-white transition-colors hover:bg-[var(--brand-dark)]"
        >
          View Analyst
        </Link>
      </div>
    </article>
  );
}

function SkeletonPlanCard() {
  return (
    <div className="rounded-xl border border-[var(--line)] bg-white p-6 animate-pulse">
      <div className="flex items-start gap-3.5 mb-5">
        <div className="h-12 w-12 rounded-[14px] bg-[var(--line)]" />
        <div className="flex-1">
          <div className="h-4 w-28 rounded bg-[var(--line)] mb-2" />
          <div className="h-3 w-20 rounded bg-[var(--line)]" />
        </div>
      </div>
      <div className="h-4 w-32 rounded bg-[var(--line)] mb-2" />
      <div className="h-3 w-full rounded bg-[var(--line)] mb-1" />
      <div className="h-3 w-2/3 rounded bg-[var(--line)] mb-4" />
      <div className="flex justify-between items-center pt-3 border-t border-[var(--line)]">
        <div className="h-5 w-16 rounded bg-[var(--line)]" />
        <div className="h-8 w-24 rounded bg-[var(--line)]" />
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
    Promise.resolve().then(() => {
      fetchPlans();
    });
  }, [fetchPlans]);

  const filteredPlans = search
    ? plans.filter(
        (p) =>
          p.analyst_name.toLowerCase().includes(search.toLowerCase()) ||
          p.name.toLowerCase().includes(search.toLowerCase())
      )
    : plans;

  return (
    <div className="px-6 py-6 lg:px-8 lg:py-8 max-w-[1100px] mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-[24px] font-extrabold tracking-[-0.5px] text-[var(--ink)]">
          Discover Analysts
        </h1>
        <p className="mt-1 text-[13px] text-[var(--muted)]">
          Browse SEBI-registered Research Analysts and subscribe to their plans.
        </p>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px] max-w-[360px]">
          <Icon
            name="search"
            className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--muted-2)]"
          />
          <input
            type="text"
            placeholder="Search analysts or plans..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-[var(--line)] bg-white py-2.5 pl-9 pr-3 text-[13px] text-[var(--ink)] placeholder:text-[var(--muted-2)] transition-colors focus:border-[var(--brand)] focus:outline-none"
          />
        </div>

        {/* Segment Pills */}
        <div className="flex rounded-lg border border-[var(--line)] bg-[var(--surface)] p-0.5">
          {SEGMENTS.map((seg) => (
            <button
              key={seg}
              type="button"
              onClick={() => setSegment(seg)}
              className={[
                "rounded-md px-3.5 py-1.5 text-[12px] font-bold transition-all",
                segment === seg
                  ? "bg-white text-[var(--brand)] shadow-sm"
                  : "text-[var(--muted)] hover:text-[var(--ink)]",
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
      </div>

      {/* Plans Grid */}
      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <SkeletonPlanCard />
          <SkeletonPlanCard />
          <SkeletonPlanCard />
          <SkeletonPlanCard />
          <SkeletonPlanCard />
          <SkeletonPlanCard />
        </div>
      ) : filteredPlans.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--brand-light)] text-[var(--brand)]">
            <Icon name="search" className="h-6 w-6" />
          </div>
          <h3 className="text-[15px] font-bold text-[var(--ink)] mb-1.5">
            {search ? "No matching analysts" : "No analysts available"}
          </h3>
          <p className="text-[13px] text-[var(--muted)] max-w-[300px]">
            {search
              ? "Try a different search term or clear your filters."
              : "New analysts are being onboarded. Check back soon!"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredPlans.map((plan) => (
            <PlanCard key={plan.plan_id} plan={plan} />
          ))}
        </div>
      )}
    </div>
  );
}
