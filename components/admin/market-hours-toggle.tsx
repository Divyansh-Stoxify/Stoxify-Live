"use client";

import { useCallback, useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Gated } from "@/components/admin/admin-permissions-provider";
import { adminFetch } from "@/lib/admin/client-api";

// Mirrors SystemConfigKeys.BYPASS_MARKET_HOURS in @stoxify/database. Flipping it
// on lets analysts publish and modify trades outside 09:15-15:30 IST, which is
// how we exercise the trade flow while testing after hours. trade-service caches
// config for ~10s, so a flip lands within a few seconds rather than instantly.
const CONFIG_KEY = "trading.bypass_market_hours";

type ConfigRow = { key: string; value: unknown };

export function MarketHoursToggle({ onChanged }: { onChanged?: () => void }) {
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await adminFetch(`/api/admin/system-config?q=${encodeURIComponent(CONFIG_KEY)}`);
      const data = (await res.json().catch(() => ({}))) as { config?: ConfigRow[] };
      if (!res.ok) throw new Error("Could not load the market-hours flag");
      const row = data.config?.find((item) => item.key === CONFIG_KEY);
      setEnabled(row?.value === true);
      setError(null);
    } catch {
      setError("Could not load the market-hours flag");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function toggle() {
    if (enabled === null || saving) return;
    const next = !enabled;
    setSaving(true);
    setError(null);
    // Optimistic: the switch should feel immediate, and load() below reconciles.
    setEnabled(next);
    try {
      const res = await adminFetch("/api/admin/system-config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key: CONFIG_KEY,
          value: next,
          category: "feature-flags",
          description: "Allow analysts to create and modify trades outside market hours (testing).",
        }),
      });
      if (!res.ok) throw new Error("save failed");
      onChanged?.();
    } catch {
      setEnabled(!next);
      setError("Could not save. Try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Off-hours trading
          {enabled !== null && (
            <Badge variant={enabled ? "default" : "secondary"}>
              {enabled ? "Allowed" : "Blocked"}
            </Badge>
          )}
        </CardTitle>
        <CardDescription>
          When allowed, analysts can publish and modify trades outside 09:15&ndash;15:30 IST and on
          weekends. Takes effect within ~10 seconds. Intended for testing.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex items-center justify-between gap-4">
        <div className="text-sm text-muted-foreground">
          {enabled === null
            ? "Loading current setting…"
            : enabled
              ? "The market-hours check is currently bypassed."
              : "Trades outside market hours are currently rejected."}
          {error && <span className="ml-2 text-destructive">{error}</span>}
        </div>
        <Gated power="PWR_ADMIN_SYSTEM_CONFIG">
          <button
            type="button"
            role="switch"
            aria-checked={enabled ?? false}
            aria-label="Allow analysts to trade outside market hours"
            disabled={enabled === null || saving}
            onClick={toggle}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border border-transparent transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
              enabled ? "bg-primary" : "bg-input"
            }`}
          >
            <span
              className={`pointer-events-none block size-5 rounded-full bg-background shadow transition-transform ${
                enabled ? "translate-x-5" : "translate-x-0.5"
              }`}
            />
          </button>
        </Gated>
      </CardContent>
    </Card>
  );
}
