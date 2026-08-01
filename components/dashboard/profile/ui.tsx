"use client";

import React from "react";
import { Icon } from "@/components/stoxify-icon";

// ─── Shared form chrome ───────────────────────────────────────────────────────
// Presentational only. Extracted from the profile page so the settings tabs can
// share one set of primitives instead of re-deriving them per tab.

export const INPUT_BASE =
  "w-full h-11 rounded-xl border border-slate-200 bg-white px-3.5 text-[13.5px] text-slate-800 placeholder:text-slate-300 outline-none transition-all focus:border-[var(--brand)] focus:ring-4 focus:ring-[var(--brand)]/10";

export const INPUT_LOCKED =
  "w-full h-11 rounded-xl border border-slate-200/70 bg-slate-50 px-3.5 text-[13.5px] text-slate-400 outline-none cursor-not-allowed";

export const BTN_GHOST =
  "inline-flex h-10 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 text-[13px] font-bold text-slate-700 shadow-[0_1px_2px_rgba(16,24,40,0.04)] transition-colors hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed enabled:cursor-pointer";

export const BTN_PRIMARY =
  "inline-flex h-10 items-center justify-center gap-1.5 rounded-xl bg-[var(--brand)] px-4 text-[13px] font-bold text-white shadow-sm shadow-[var(--brand)]/25 transition-colors hover:bg-[var(--brand-dark)] disabled:opacity-50 disabled:cursor-not-allowed enabled:cursor-pointer";

export const HINT = "mt-1.5 text-[11.5px] leading-relaxed text-slate-400";

/** Panel title + one-line subtitle, with an optional status pill beside it. */
export function SectionHead({
  title,
  subtitle,
  badge,
  tone = "slate",
}: {
  title: string;
  subtitle: string;
  badge?: React.ReactNode;
  tone?: "slate" | "danger";
}) {
  return (
    <div>
      <h2
        className={`flex flex-wrap items-center gap-2.5 text-[18px] font-extrabold leading-tight tracking-[-0.01em] ${
          tone === "danger" ? "text-red-600" : "text-slate-900"
        }`}
      >
        {title}
        {badge}
      </h2>
      <p className="mt-1.5 text-[13px] text-slate-400">{subtitle}</p>
    </div>
  );
}

/**
 * One settings line: describing label on the left, the control on the right.
 * Collapses to a single stacked column below `md`.
 */
export function SettingsRow({
  label,
  description,
  htmlFor,
  children,
}: {
  label: string;
  description?: string;
  htmlFor?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-1 gap-x-10 gap-y-2.5 border-t border-slate-100 py-6 md:grid-cols-[minmax(0,18rem)_minmax(0,52rem)]">
      <div className="min-w-0">
        {htmlFor ? (
          <label htmlFor={htmlFor} className="block text-[13px] font-bold text-slate-800">
            {label}
          </label>
        ) : (
          <span className="block text-[13px] font-bold text-slate-800">{label}</span>
        )}
        {description && (
          <p className="mt-1 text-[12px] leading-relaxed text-slate-400">{description}</p>
        )}
      </div>
      <div className="min-w-0">{children}</div>
    </div>
  );
}

/** Read-only field with a leading glyph — used for values only support can change. */
export function LockedField({
  icon,
  value,
}: {
  icon: React.ComponentProps<typeof Icon>["name"];
  value: string;
}) {
  return (
    <div className="relative">
      <Icon
        name={icon}
        className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-300"
      />
      <input type="text" value={value} disabled className={`${INPUT_LOCKED} pl-10 pr-10`} />
      <Icon
        name="lock"
        className="pointer-events-none absolute right-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-300"
      />
    </div>
  );
}

/** Key/value pair used inside the Bank & Payouts summary cards. */
export function DetailPair({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <span className="block text-[10.5px] font-extrabold uppercase tracking-[0.06em] text-slate-400">
        {label}
      </span>
      <span className="mt-1 block text-[13.5px] font-bold text-slate-800">{value}</span>
    </div>
  );
}

/** Green/amber/red status pill reused across the verification cards. */
export function StatusPill({
  tone,
  icon,
  children,
}: {
  tone: "ok" | "pending" | "danger";
  icon: React.ComponentProps<typeof Icon>["name"];
  children: React.ReactNode;
}) {
  const skin =
    tone === "ok"
      ? "border-emerald-200 bg-emerald-50 text-emerald-600"
      : tone === "danger"
        ? "border-red-200 bg-red-50 text-red-600"
        : "border-amber-200 bg-amber-50 text-amber-600";
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10.5px] font-extrabold uppercase tracking-[0.04em] ${skin}`}
    >
      <Icon className="h-3 w-3" name={icon} />
      {children}
    </span>
  );
}
