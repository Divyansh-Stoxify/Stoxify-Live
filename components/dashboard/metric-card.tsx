import { Icon, IconName } from "@/components/stoxify-icon";

interface MetricCardProps {
  label: string;
  value: string;
  icon: IconName;
  changePct?: number;
  changeLabel?: string;
  /** Optional second line below the change e.g. "+1 Today" */
  subNote?: string;
}

/**
 * METRIC CARD
 *
 * Displays a single KPI on the dashboard overview.
 * Matches the Figma layout exactly:
 * ─ Top row: label (left) + icon in gray rounded box (right)
 * ─ Middle: large bold value
 * ─ Bottom: green trend badge + change context label
 */
const ICON_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  users: {
    bg: "bg-blue-50/70",
    text: "text-blue-600",
    border: "border-blue-100/50",
  },
  wallet: {
    bg: "bg-emerald-50/70",
    text: "text-emerald-600",
    border: "border-emerald-100/50",
  },
  rupee: {
    bg: "bg-emerald-50/70",
    text: "text-emerald-600",
    border: "border-emerald-100/50",
  },
  trendingUp: {
    bg: "bg-indigo-50/70",
    text: "text-indigo-600",
    border: "border-indigo-100/50",
  },
  folder: {
    bg: "bg-amber-50/70",
    text: "text-amber-600",
    border: "border-amber-100/50",
  },
  creditCard: {
    bg: "bg-violet-50/70",
    text: "text-violet-600",
    border: "border-violet-100/50",
  },
};

export function MetricCard({
  label,
  value,
  icon,
  changePct,
  changeLabel,
  subNote,
}: MetricCardProps) {
  const isPositive = changePct !== undefined ? changePct >= 0 : true;
  const iconStyle = ICON_STYLES[icon] || {
    bg: "bg-slate-50/70",
    text: "text-slate-600",
    border: "border-slate-100",
  };

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-slate-100/80 bg-white p-5 shadow-[0_2px_8px_rgba(0,0,0,0.02)] transition-all duration-300 hover:shadow-[0_12px_40px_rgba(0,0,0,0.04)] hover:-translate-y-0.5">
      {/* ── Top row: label + icon ── */}
      <div className="flex items-start justify-between">
        <span className="text-[12.5px] font-semibold text-slate-400">{label}</span>
        <span
          className={`flex h-9 w-9 items-center justify-center rounded-xl border ${iconStyle.border} ${iconStyle.bg} ${iconStyle.text} transition-transform duration-300 hover:scale-105`}
        >
          <Icon className="h-[15px] w-[15px]" name={icon} />
        </span>
      </div>

      {/* ── Large value ── */}
      <div className="text-[28px] font-extrabold leading-none tracking-tight text-slate-900">
        {value}
      </div>

      {/* ── Trend indicator + label ── */}
      <div className="flex items-center gap-2">
        {changePct !== undefined && (
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10.5px] font-bold ${
              isPositive
                ? "bg-emerald-50 text-emerald-700 border border-emerald-200/30"
                : "bg-rose-50 text-rose-700 border border-rose-200/30"
            }`}
          >
            <Icon className="h-[9px] w-[9px]" name={isPositive ? "trendingUp" : "trendingDown"} />
            {isPositive ? "+" : ""}
            {changePct}%
          </span>
        )}
        <span className="text-[11.5px] font-medium text-slate-400">{changeLabel}</span>
        {subNote && (
          <span className="ml-auto text-[11px] font-semibold text-slate-400">{subNote}</span>
        )}
      </div>
    </div>
  );
}

/** Skeleton placeholder shown while metrics are loading */
export function MetricCardSkeleton() {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-slate-100/80 bg-white p-5 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
      <div className="flex items-start justify-between">
        <div className="h-3.5 w-24 animate-pulse rounded bg-slate-100" />
        <div className="h-9 w-9 animate-pulse rounded-xl bg-slate-100" />
      </div>
      <div className="h-8 w-28 animate-pulse rounded-lg bg-slate-100" />
      <div className="flex gap-2">
        <div className="h-5 w-14 animate-pulse rounded-full bg-slate-100" />
        <div className="h-5 w-24 animate-pulse rounded bg-slate-100" />
      </div>
    </div>
  );
}
