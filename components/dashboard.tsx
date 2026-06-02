"use client";

import { useEffect, useState } from "react";
import { RefreshCwIcon, AlertTriangleIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { adminFetch } from "@/lib/admin/client-api";

// ─── Types from backend service ──────────────────────────────────────────────

type DashboardData = {
  users?: { total?: number; active?: number; blocked?: number; kyc_pending?: number };
  analysts?: { total?: number; active?: number; pending_verification?: number };
  trades?: { total?: number; live?: number };
  plans?: { total?: number; active?: number };
  subscriptions?: { total?: number; active?: number };
  generated_at?: string;
};

type AnalyticsData = {
  period?: { days?: number };
  users?: { new?: number };
  analysts?: { new?: number };
  trades?: { new?: number; closed?: number };
  subscriptions?: { new?: number; cancelled?: number };
  security?: { incidents?: number };
};

type KpiState = {
  dashboard: DashboardData | null;
  analytics: AnalyticsData | null;
  isLoading: boolean;
  error: string | null;
};

// ─── KPI tile ────────────────────────────────────────────────────────────────

function KpiTile({
  label,
  value,
  sub,
  isLoading,
}: {
  label: string;
  value: string | number | undefined;
  sub?: string;
  isLoading: boolean;
}) {
  return (
    <Card className="rounded-none border-0">
      <CardHeader className="pb-1">
        <CardTitle className="font-normal text-xs tracking-wide text-muted-foreground uppercase">
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent className="pb-2">
        {isLoading ? (
          <Skeleton className="h-8 w-20" />
        ) : (
          <p className="font-semibold text-2xl tabular-nums">
            {value !== undefined ? fmt(value) : "—"}
          </p>
        )}
      </CardContent>
      {sub && (
        <CardFooter className="pt-0 text-muted-foreground text-xs">{sub}</CardFooter>
      )}
    </Card>
  );
}

function fmt(value: string | number) {
  if (typeof value === "number") {
    return new Intl.NumberFormat("en-IN").format(value);
  }
  return value;
}

// ─── Section header ──────────────────────────────────────────────────────────

function SectionHeader({ label }: { label: string }) {
  return (
    <div className="col-span-full border-b bg-muted/40 px-4 py-1.5">
      <span className="font-medium text-muted-foreground text-xs uppercase tracking-widest">{label}</span>
    </div>
  );
}

// ─── Error tile ───────────────────────────────────────────────────────────────

function ErrorTile({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="col-span-full flex flex-col items-center gap-3 py-10 text-center">
      <AlertTriangleIcon className="size-8 text-destructive" />
      <p className="text-sm text-muted-foreground">{message}</p>
      <Button size="sm" variant="outline" onClick={onRetry}>
        <RefreshCwIcon className="size-3.5" />
        Retry
      </Button>
    </div>
  );
}

// ─── Dashboard ───────────────────────────────────────────────────────────────

export function Dashboard() {
  const [state, setState] = useState<KpiState>({
    dashboard: null,
    analytics: null,
    isLoading: true,
    error: null,
  });
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;
    setState((s) => ({ ...s, isLoading: true, error: null }));

    void (async () => {
      try {
        const [dashRes, analyticsRes] = await Promise.all([
          adminFetch("/api/admin/dashboard"),
          adminFetch("/api/admin/analytics"),
        ]);

        const [dashData, analyticsData] = await Promise.all([
          dashRes.json().catch(() => ({})) as Promise<DashboardData>,
          analyticsRes.json().catch(() => ({})) as Promise<AnalyticsData>,
        ]);

        if (!active) return;

        if (!dashRes.ok) {
          setState({ dashboard: null, analytics: null, isLoading: false, error: "Dashboard API returned an error. Check service health." });
          return;
        }

        setState({ dashboard: dashData, analytics: analyticsData, isLoading: false, error: null });
      } catch (err) {
        if (!active) return;
        setState({
          dashboard: null,
          analytics: null,
          isLoading: false,
          error: err instanceof Error ? err.message : "Failed to load dashboard data.",
        });
      }
    })();

    return () => { active = false; };
  }, [reloadKey]);

  const retry = () => setReloadKey((k) => k + 1);
  const { dashboard: d, analytics: a, isLoading, error } = state;

  return (
    <div className="space-y-0">
      <div className="flex items-center justify-between border-b px-6 py-3">
        <h2 className="font-semibold text-sm">Live Overview</h2>
        <Button size="sm" variant="ghost" onClick={retry} disabled={isLoading}>
          <RefreshCwIcon className={`size-3.5 ${isLoading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-px bg-border md:grid-cols-3 lg:grid-cols-4">
        {error ? (
          <ErrorTile message={error} onRetry={retry} />
        ) : (
          <>
            <SectionHeader label="Users" />
            <KpiTile label="Total users" value={d?.users?.total} isLoading={isLoading} />
            <KpiTile label="Active users" value={d?.users?.active} isLoading={isLoading} />
            <KpiTile label="Blocked users" value={d?.users?.blocked} isLoading={isLoading} />
            <KpiTile label="KYC pending" value={d?.users?.kyc_pending} isLoading={isLoading} />

            <SectionHeader label="Analysts" />
            <KpiTile label="Total analysts" value={d?.analysts?.total} isLoading={isLoading} />
            <KpiTile label="Active analysts" value={d?.analysts?.active} isLoading={isLoading} />
            <KpiTile label="Pending verification" value={d?.analysts?.pending_verification} isLoading={isLoading} />

            <SectionHeader label="Trades" />
            <KpiTile label="Total trades" value={d?.trades?.total} isLoading={isLoading} />
            <KpiTile label="Live trades" value={d?.trades?.live} isLoading={isLoading} />

            <SectionHeader label="Subscriptions" />
            <KpiTile label="Total subscriptions" value={d?.subscriptions?.total} isLoading={isLoading} />
            <KpiTile label="Active subscriptions" value={d?.subscriptions?.active} isLoading={isLoading} />

            <SectionHeader label="Plans" />
            <KpiTile label="Total plans" value={d?.plans?.total} isLoading={isLoading} />
            <KpiTile label="Active plans" value={d?.plans?.active} isLoading={isLoading} />

            {(a?.users?.new !== undefined || a?.subscriptions?.new !== undefined || !isLoading) && (
              <>
                <SectionHeader label={`Activity (last ${a?.period?.days ?? 30} days)`} />
                <KpiTile label="New users" value={a?.users?.new} isLoading={isLoading} />
                <KpiTile label="New analysts" value={a?.analysts?.new} isLoading={isLoading} />
                <KpiTile label="New subscriptions" value={a?.subscriptions?.new} isLoading={isLoading} />
                <KpiTile label="Cancelled subscriptions" value={a?.subscriptions?.cancelled} isLoading={isLoading} />
                <KpiTile label="New trades" value={a?.trades?.new} isLoading={isLoading} />
                <KpiTile label="Closed trades" value={a?.trades?.closed} isLoading={isLoading} />
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
