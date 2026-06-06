import { Icon, IconName } from "@/app/components/stoxify-icon";

interface MetricCardProps {
  label: string;
  value: string;
  icon: IconName;
  changePct?: number;
  changeLabel: string;
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
export function MetricCard({
  label,
  value,
  icon,
  changePct,
  changeLabel,
  subNote,
}: MetricCardProps) {
  const isPositive = changePct !== undefined ? changePct >= 0 : true;

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-[var(--line)] bg-white p-5 shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
      {/* ── Top row: label + icon ── */}
      <div className="flex items-start justify-between">
        <span className="text-[12.5px] font-medium text-[var(--muted)]">{label}</span>
        {/* Icon container — matches the gray rounded square in the Figma */}
        <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--line)] bg-[var(--surface)] text-[var(--muted-2)]">
          <Icon className="h-[15px] w-[15px]" name={icon} />
        </span>
      </div>

      {/* ── Large value ── */}
      <div className="text-[32px] font-extrabold leading-none tracking-[-1px] text-[var(--ink)]">
        {value}
      </div>

      {/* ── Trend indicator + label ── */}
      <div className="flex items-center gap-2">
        {changePct !== undefined && (
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold ${
              isPositive
                ? "bg-[var(--green-light)] text-[var(--green)]"
                : "bg-[var(--red-light)] text-[var(--red)]"
            }`}
          >
            <Icon className="h-[9px] w-[9px]" name={isPositive ? "trendingUp" : "trendingDown"} />
            {isPositive ? "+" : ""}
            {changePct}%
          </span>
        )}
        <span className="text-[12px] text-[var(--muted-2)]">{changeLabel}</span>
        {subNote && (
          <span className="ml-auto text-[11px] font-semibold text-[var(--muted)]">{subNote}</span>
        )}
      </div>
    </div>
  );
}

/** Skeleton placeholder shown while metrics are loading */
export function MetricCardSkeleton() {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-[var(--line)] bg-white p-5 shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
      <div className="flex items-start justify-between">
        <div className="h-3 w-24 animate-pulse rounded bg-[var(--line)]" />
        <div className="h-9 w-9 animate-pulse rounded-lg bg-[var(--line)]" />
      </div>
      <div className="h-9 w-28 animate-pulse rounded-lg bg-[var(--line)]" />
      <div className="flex gap-2">
        <div className="h-5 w-14 animate-pulse rounded-full bg-[var(--line)]" />
        <div className="h-5 w-24 animate-pulse rounded bg-[var(--line)]" />
      </div>
    </div>
  );
}
