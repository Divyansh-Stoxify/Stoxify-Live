"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertTriangleIcon, SearchIcon } from "lucide-react";

import { Input } from "@/components/ui/input";
import { adminFetch } from "@/lib/admin/client-api";

export type Power = {
  power_id: string;
  power_name?: string;
  category?: string;
  description?: string;
};

// Without this power the backend admin-session check refuses the account, so a
// sub-admin that has everything else still can't open the console.
export const CONSOLE_ENTRY_POWER = "PWR_ADMIN_DASHBOARD_VIEW";

/**
 * Ready-made sub-admin shapes. Each one is a starting point the admin can then
 * add to or trim — they all include console entry so the account can sign in.
 */
export const POWER_PRESETS: { id: string; label: string; hint: string; powers: string[] }[] = [
  {
    id: "analyst-verifier",
    label: "Analyst verifier",
    hint: "Open Pending Reviews and approve analyst applications to ACTIVE — nothing else",
    // The minimum that actually works: console entry, the pending queue plus the
    // approve/reject action, and the analyst detail read.
    powers: [CONSOLE_ENTRY_POWER, "PWR_ANALYST_VERIFY", "PWR_ANALYST_READ_ALL"],
  },
  {
    id: "reviewer",
    label: "Analyst reviewer (+ edit)",
    hint: "Verifier, plus editing analyst profiles and viewing audit logs",
    powers: [
      CONSOLE_ENTRY_POWER,
      "PWR_ANALYST_VERIFY",
      "PWR_ANALYST_READ_ALL",
      "PWR_ANALYST_PROFILE_EDIT_ALL",
      "PWR_USER_READ_ALL",
      "PWR_ADMIN_LOGS_VIEW",
    ],
  },
  {
    id: "support",
    label: "Support desk",
    hint: "Handle user tickets, refunds and device revokes",
    powers: [
      CONSOLE_ENTRY_POWER,
      "PWR_USER_READ_ALL",
      "PWR_USER_PROFILE_EDIT_ALL",
      "PWR_ANALYST_READ_ALL",
      "PWR_SUBSCRIPTION_READ_ALL",
      "PWR_SUBSCRIPTION_CANCEL_ALL",
      "PWR_SUBSCRIPTION_REFUND",
      "PWR_SECURITY_DEVICE_REVOKE",
    ],
  },
  {
    id: "readonly",
    label: "Read-only observer",
    hint: "See everything, change nothing",
    powers: [
      CONSOLE_ENTRY_POWER,
      "PWR_ADMIN_ANALYTICS_VIEW",
      "PWR_USER_READ_ALL",
      "PWR_ANALYST_READ_ALL",
      "PWR_TRADE_READ_ALL",
      "PWR_PLAN_READ_ALL",
      "PWR_SUBSCRIPTION_READ_ALL",
    ],
  },
];

// The catalog is a fixed seed list, and these dialogs are rendered once per table
// row — share a single in-flight request instead of firing one per row.
let catalogPromise: Promise<Power[]> | null = null;

function fetchPowerCatalog(): Promise<Power[]> {
  catalogPromise ??= adminFetch("/api/admin/rbac/powers")
    .then((r) => r.json())
    .then((d: unknown) => {
      const data = d as Record<string, unknown>;
      return Array.isArray(data.powers) ? (data.powers as Power[]) : [];
    })
    .catch((err) => {
      // Don't cache a failure — the next dialog should get a fresh attempt.
      catalogPromise = null;
      throw err;
    });
  return catalogPromise;
}

/** Loads the power catalog once per session and shares it across dialogs. */
export function usePowerCatalog() {
  const [powers, setPowers] = useState<Power[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchPowerCatalog()
      .then((list) => {
        if (!cancelled) setPowers(list);
      })
      .catch(() => {
        if (!cancelled) setError("Could not load the power catalog");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { powers, error };
}

function labelFor(power: Power) {
  return power.power_name ?? power.power_id.replace(/^PWR_/, "");
}

type Props = {
  powers: Power[];
  selected: string[];
  onChange: (next: string[]) => void;
  disabled?: boolean;
  /** Warn when the console-entry power is missing. Off for non-console roles. */
  requireConsoleEntry?: boolean;
};

export function PowerPicker({
  powers,
  selected,
  onChange,
  disabled = false,
  requireConsoleEntry = true,
}: Props) {
  const [query, setQuery] = useState("");

  const selectedSet = useMemo(() => new Set(selected), [selected]);

  const groups = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const matched = needle
      ? powers.filter(
          (p) =>
            p.power_id.toLowerCase().includes(needle) ||
            (p.power_name ?? "").toLowerCase().includes(needle)
        )
      : powers;

    const byCategory = new Map<string, Power[]>();
    for (const power of matched) {
      const category = power.category ?? "OTHER";
      const bucket = byCategory.get(category);
      if (bucket) bucket.push(power);
      else byCategory.set(category, [power]);
    }
    return [...byCategory.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [powers, query]);

  function toggle(powerId: string) {
    onChange(
      selectedSet.has(powerId) ? selected.filter((p) => p !== powerId) : [...selected, powerId]
    );
  }

  function setGroup(groupPowers: Power[], enabled: boolean) {
    const ids = groupPowers.map((p) => p.power_id);
    onChange(
      enabled
        ? [...new Set([...selected, ...ids])]
        : selected.filter((p) => !ids.includes(p))
    );
  }

  const missingConsoleEntry = requireConsoleEntry && !selectedSet.has(CONSOLE_ENTRY_POWER);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <label className="text-sm font-medium">Permissions</label>
        <span className="text-xs text-muted-foreground">{selected.length} selected</span>
      </div>

      <div className="relative">
        <SearchIcon className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Filter permissions..."
          className="pl-8"
          disabled={disabled}
        />
      </div>

      {missingConsoleEntry && (
        <p className="flex items-start gap-2 rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-700 dark:text-amber-400">
          <AlertTriangleIcon className="mt-px size-3.5 shrink-0" />
          <span>
            Without <span className="font-mono">ADMIN_DASHBOARD_VIEW</span> this account can sign in
            but cannot open the admin console.
          </span>
        </p>
      )}

      <div className="max-h-72 space-y-3 overflow-y-auto rounded-lg border border-input p-2">
        {groups.map(([category, groupPowers]) => {
          const selectedInGroup = groupPowers.filter((p) => selectedSet.has(p.power_id)).length;
          const allSelected = selectedInGroup === groupPowers.length;

          return (
            <div key={category}>
              <div className="mb-1 flex items-center justify-between gap-2 border-b border-border/60 pb-1">
                <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {category}
                  <span className="ml-1.5 font-normal normal-case">
                    ({selectedInGroup}/{groupPowers.length})
                  </span>
                </span>
                <button
                  type="button"
                  className="text-xs text-primary hover:underline disabled:opacity-50"
                  disabled={disabled}
                  onClick={() => setGroup(groupPowers, !allSelected)}
                >
                  {allSelected ? "Clear" : "Select all"}
                </button>
              </div>

              <div className="space-y-0.5">
                {groupPowers.map((power) => (
                  <label
                    key={power.power_id}
                    className="flex cursor-pointer items-center gap-2 rounded px-1 py-0.5 text-sm hover:bg-muted/50"
                  >
                    <input
                      type="checkbox"
                      checked={selectedSet.has(power.power_id)}
                      onChange={() => toggle(power.power_id)}
                      disabled={disabled}
                      className="h-4 w-4 rounded border-input"
                    />
                    <span>{labelFor(power)}</span>
                    <span className="ml-auto font-mono text-[10px] text-muted-foreground">
                      {power.power_id}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          );
        })}

        {powers.length === 0 && (
          <p className="px-1 py-2 text-xs text-muted-foreground">Loading permissions...</p>
        )}
        {powers.length > 0 && groups.length === 0 && (
          <p className="px-1 py-2 text-xs text-muted-foreground">
            No permissions match &ldquo;{query}&rdquo;.
          </p>
        )}
      </div>
    </div>
  );
}
