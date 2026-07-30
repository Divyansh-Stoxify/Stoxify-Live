"use client";

import { useCallback, useEffect, useState } from "react";
import {
  ActivityIcon,
  AlertTriangleIcon,
  ArrowUpRightIcon,
  BarChart3Icon,
  CheckCircle2Icon,
  ClockIcon,
  CreditCardIcon,
  RefreshCwIcon,
  ShieldAlertIcon,
  ShieldCheckIcon,
  TrendingUpIcon,
  UserCheckIcon,
  UsersIcon,
} from "lucide-react";
import { Area, AreaChart, CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { adminFetch } from "@/lib/admin/client-api";

// ─── Backend Payload Types ────────────────────────────────────────────────────
// GET /api/admin/dashboard  → user-service getDashboard()
// GET /api/admin/analytics  → user-service getAnalyticsOverview()

type SeriesPoint = { date: string; count: number };

type DashboardPayload = {
  users?: Record<string, Record<string, number>>;
  subscriptions?: { active?: number; gross_revenue_estimate?: number };
  trades?: { live?: number };
  recent_incidents?: SecurityIncident[];
  generated_at?: string;
};

type SecurityIncident = {
  log_id?: string;
  incident_type?: string;
  severity?: string;
  user_id?: string;
  ip_address?: string;
  description?: string;
  action_taken?: string;
  service_name?: string;
  timestamp?: string;
};

type AnalyticsPayload = {
  window_days?: number;
  since?: string;
  new_users?: SeriesPoint[];
  new_subscriptions?: SeriesPoint[];
  new_trades?: SeriesPoint[];
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const numberFormat = new Intl.NumberFormat("en-IN");
const currencyFormat = new Intl.NumberFormat("en-IN", {
  currency: "INR",
  maximumFractionDigits: 0,
  style: "currency",
});

/** Sums a set of state buckets off the dashboard's user pivot. */
function countStates(
  users: DashboardPayload["users"],
  userType: string,
  states: string[]
): number | undefined {
  const bucket = users?.[userType];
  if (!bucket) return undefined;
  return states.reduce((total, state) => total + (bucket[state] ?? 0), 0);
}

function seriesTotal(series?: SeriesPoint[]): number | undefined {
  if (!series) return undefined;
  return series.reduce((total, point) => total + (point.count ?? 0), 0);
}

/**
 * The backend only emits days that had activity. Charts need a continuous axis,
 * so pad the gaps with zeroes from `since` up to today (UTC — that is what
 * $dateToString grouped on).
 */
function mergeSeries(
  since: string | undefined,
  windowDays: number,
  series: Record<string, SeriesPoint[] | undefined>
) {
  const lookup: Record<string, Map<string, number>> = {};
  for (const [key, points] of Object.entries(series)) {
    lookup[key] = new Map((points ?? []).map((point) => [point.date, point.count ?? 0]));
  }

  const start = since ? new Date(since) : new Date(Date.now() - windowDays * 86_400_000);
  const todayKey = new Date().toISOString().slice(0, 10);
  const rows: Array<Record<string, string | number>> = [];

  for (let offset = 0; offset <= windowDays; offset += 1) {
    const day = new Date(start);
    day.setUTCDate(day.getUTCDate() + offset);
    const key = day.toISOString().slice(0, 10);
    if (key > todayKey) break;

    const row: Record<string, string | number> = { date: key };
    for (const seriesKey of Object.keys(lookup)) {
      row[seriesKey] = lookup[seriesKey].get(key) ?? 0;
    }
    rows.push(row);
  }

  return rows;
}

function formatAxisDate(value: string) {
  const date = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    timeZone: "UTC",
  }).format(date);
}

function formatRelativeTime(value?: string) {
  if (!value) return "-";
  const timestamp = new Date(value).getTime();
  if (Number.isNaN(timestamp)) return value;

  const minutes = Math.round((Date.now() - timestamp) / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} min${minutes === 1 ? "" : "s"} ago`;

  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;

  const days = Math.round(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

function severityClass(severity?: string) {
  if (severity === "CRITICAL") return "border-destructive/40 bg-destructive/10 text-destructive";
  if (severity === "HIGH") return "border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-400";
  return "border-border bg-muted text-muted-foreground";
}

// ─── KPI Card Component ──────────────────────────────────────────────────────

function KpiCard({
  title,
  value,
  subtitle,
  icon: Icon,
  accentColor = "text-primary",
  badgeText,
  isLoading,
}: {
  title: string;
  value: number | undefined;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
  accentColor?: string;
  badgeText?: string;
  isLoading: boolean;
}) {
  let iconBg = "bg-primary/10";
  if (accentColor.includes("blue")) iconBg = "bg-blue-500/10";
  else if (accentColor.includes("emerald")) iconBg = "bg-emerald-500/10";
  else if (accentColor.includes("amber")) iconBg = "bg-amber-500/10";
  else if (accentColor.includes("destructive") || accentColor.includes("red")) iconBg = "bg-destructive/10";
  else if (accentColor.includes("purple")) iconBg = "bg-purple-500/10";

  return (
    <Card className="relative overflow-hidden border bg-card shadow-xs transition-all hover:shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-xs font-bold uppercase tracking-wider text-foreground/75">
          {title}
        </CardTitle>
        <div className={`rounded-lg p-2 ${iconBg} ${accentColor}`}>
          <Icon className="size-4" />
        </div>
      </CardHeader>
      <CardContent className="space-y-1.5">
        <div className="flex items-baseline justify-between gap-2">
          {isLoading ? (
            <span className="h-8 w-16 animate-pulse rounded bg-muted" aria-hidden />
          ) : (
            <span className={`text-3xl font-extrabold tracking-tight tabular-nums ${accentColor}`}>
              {value === undefined ? "—" : numberFormat.format(value)}
            </span>
          )}
          {badgeText && (
            <Badge variant="outline" className="text-[10px] font-mono tracking-wide">
              {badgeText}
            </Badge>
          )}
        </div>
        <p className="text-xs text-muted-foreground">{subtitle}</p>
      </CardContent>
    </Card>
  );
}

// ─── Chart Configs ───────────────────────────────────────────────────────────

const activityChartConfig = {
  new_users: { label: "Traders", color: "#3b82f6" },
  new_trades: { label: "Trades", color: "#f59e0b" },
} satisfies ChartConfig;

const growthChartConfig = {
  new_users: { label: "New Users", color: "#3b82f6" },
  new_trades: { label: "New Trades", color: "#10b981" },
  new_subscriptions: { label: "New Subscriptions", color: "#a855f7" },
} satisfies ChartConfig;

// ─── Main Dashboard Component ────────────────────────────────────────────────

type DashboardState = {
  dashboard: DashboardPayload | null;
  analytics: AnalyticsPayload | null;
  error: string | null;
  loadedFor: string;
};

const EMPTY_STATE: DashboardState = {
  dashboard: null,
  analytics: null,
  error: null,
  loadedFor: "",
};

/** Reads a settled fetch, or null when the request failed outright. */
async function readPayload<T>(result: PromiseSettledResult<Response>): Promise<T | null> {
  if (result.status !== "fulfilled" || !result.value.ok) return null;
  return (await result.value.json().catch(() => null)) as T | null;
}

export function Dashboard() {
  const [daysWindow, setDaysWindow] = useState<number>(30);
  const [reloadKey, setReloadKey] = useState<number>(0);
  const [state, setState] = useState<DashboardState>(EMPTY_STATE);

  // Derive isLoading from the request the state was last written for, so the
  // effect never has to setState synchronously (same pattern as ApiAdminPage).
  const currentKey = `${daysWindow}|${reloadKey}`;
  const isLoading = state.loadedFor !== currentKey;

  useEffect(() => {
    let isActive = true;

    void (async () => {
      const results = await Promise.allSettled([
        adminFetch("/api/admin/dashboard"),
        adminFetch(`/api/admin/analytics?days=${daysWindow}`),
      ]);

      const dashboard = await readPayload<DashboardPayload>(results[0]);
      const analytics = await readPayload<AnalyticsPayload>(results[1]);

      const failed = [
        dashboard === null ? "dashboard metrics" : null,
        analytics === null ? "growth analytics" : null,
      ].filter(Boolean);

      if (!isActive) return;
      setState({
        dashboard,
        analytics,
        error: failed.length ? `Unable to load ${failed.join(" and ")}.` : null,
        loadedFor: currentKey,
      });
    })();

    return () => {
      isActive = false;
    };
  }, [currentKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const refresh = useCallback(() => setReloadKey((current) => current + 1), []);

  const { dashboard, analytics, error } = state;
  const users = dashboard?.users;
  const incidents = dashboard?.recent_incidents ?? [];
  const activeSubscriptions = dashboard?.subscriptions?.active;
  const grossRevenue = dashboard?.subscriptions?.gross_revenue_estimate;

  const windowDays = analytics?.window_days ?? daysWindow;
  const chartRows = mergeSeries(analytics?.since, windowDays, {
    new_users: analytics?.new_users,
    new_trades: analytics?.new_trades,
    new_subscriptions: analytics?.new_subscriptions,
  });
  const hasChartData = chartRows.length > 0;

  return (
    <div className="space-y-8 p-6">
      {/* ── Header & Filter Bar ───────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 border-b pb-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Admin Dashboard</h1>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Overall platform performance, trader metrics, trade volume, and growth analytics.
          </p>
        </div>

        {/* Filters Controls */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Time Window Selector — drives the ?days= param on /api/admin/analytics */}
          <div className="flex items-center rounded-lg border bg-muted/40 p-1 text-xs">
            {[7, 30, 90].map((dWindow) => (
              <button
                key={dWindow}
                onClick={() => setDaysWindow(dWindow)}
                className={`rounded-md px-3 py-1 font-medium transition-all ${
                  daysWindow === dWindow
                    ? "bg-background text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {dWindow} Days
              </button>
            ))}
          </div>

          <Button size="sm" variant="outline" onClick={refresh} disabled={isLoading}>
            <RefreshCwIcon className={`size-3.5 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2.5 rounded-xl border border-destructive/40 bg-destructive/10 p-3.5 text-xs text-destructive">
          <AlertTriangleIcon className="size-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* ── Live Platform State & Quick-Access Action Shortcuts Bar ───────── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Live trades right now */}
        <div className="flex items-center justify-between rounded-xl border bg-card p-3.5 text-xs">
          <div className="flex items-center gap-2.5">
            <ActivityIcon className="size-4 shrink-0 text-emerald-600" />
            <div>
              <p className="font-bold text-foreground">Live Trades</p>
              <p className="text-[11px] text-muted-foreground">Currently open positions</p>
            </div>
          </div>
          <Badge variant="outline" className="font-mono text-[10px] tabular-nums">
            {dashboard?.trades?.live === undefined ? "—" : numberFormat.format(dashboard.trades.live)}
          </Badge>
        </div>

        {/* Gross recurring revenue from active subscriptions */}
        <div className="flex items-center justify-between rounded-xl border bg-card p-3.5 text-xs">
          <div className="flex items-center gap-2.5">
            <CheckCircle2Icon className="size-4 shrink-0 text-purple-500" />
            <div>
              <p className="font-bold text-foreground">Gross Revenue</p>
              <p className="text-[11px] text-muted-foreground">Active subscription value</p>
            </div>
          </div>
          <Badge variant="outline" className="font-mono text-[10px] tabular-nums">
            {grossRevenue === undefined ? "—" : currencyFormat.format(grossRevenue)}
          </Badge>
        </div>

        {/* Quick Shortcut: Verification Queue */}
        <a href="#analysts" className="flex items-center justify-between rounded-xl border bg-card p-3.5 text-xs transition-all hover:bg-muted/40 group">
          <div className="flex items-center gap-2.5">
            <UserCheckIcon className="size-4 shrink-0 text-amber-500" />
            <div>
              <p className="font-bold text-foreground group-hover:text-primary transition-colors">Verification Queue</p>
              <p className="text-[11px] text-muted-foreground">Action required applications</p>
            </div>
          </div>
          <ArrowUpRightIcon className="size-4 text-muted-foreground group-hover:text-primary transition-colors" />
        </a>

        {/* Quick Shortcut: Pending Refunds */}
        <a href="#subscriptions" className="flex items-center justify-between rounded-xl border bg-card p-3.5 text-xs transition-all hover:bg-muted/40 group">
          <div className="flex items-center gap-2.5">
            <CreditCardIcon className="size-4 shrink-0 text-purple-500" />
            <div>
              <p className="font-bold text-foreground group-hover:text-primary transition-colors">Refund Requests</p>
              <p className="text-[11px] text-muted-foreground">Pending processing queue</p>
            </div>
          </div>
          <ArrowUpRightIcon className="size-4 text-muted-foreground group-hover:text-primary transition-colors" />
        </a>
      </div>

      {/* ── Summary Metric Cards Grid ───────────────────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <KpiCard
          title="Active Users"
          value={countStates(users, "END_USER", ["ACTIVE"])}
          subtitle="Registered trader accounts"
          icon={UsersIcon}
          accentColor="text-blue-500"
          badgeText="Active Users"
          isLoading={isLoading}
        />

        <KpiCard
          title="Active Analysts"
          value={countStates(users, "ANALYST", ["ACTIVE"])}
          subtitle="Verified, active analyst accounts"
          icon={UserCheckIcon}
          accentColor="text-emerald-500"
          badgeText="Verified SEBI"
          isLoading={isLoading}
        />

        <KpiCard
          title="Pending Verifications"
          value={countStates(users, "ANALYST", [
            "VERIFICATION_PENDING",
            "VERIFICATION_ONGOING",
          ])}
          subtitle="Credential review queue"
          icon={ClockIcon}
          accentColor="text-amber-500"
          badgeText="Verification Queue"
          isLoading={isLoading}
        />

        <KpiCard
          title="Open Incidents"
          value={dashboard ? incidents.length : undefined}
          subtitle="Latest high & critical security logs"
          icon={ShieldAlertIcon}
          accentColor="text-destructive"
          badgeText="Security"
          isLoading={isLoading}
        />

        <KpiCard
          title="Subscriptions"
          value={activeSubscriptions}
          subtitle={
            grossRevenue === undefined
              ? "Active monthly subscriptions"
              : `${currencyFormat.format(grossRevenue)} gross value`
          }
          icon={CreditCardIcon}
          accentColor="text-purple-500"
          badgeText="Revenue"
          isLoading={isLoading}
        />
      </div>

      {/* ── Security Incidents & Trader Activity ───────────────────────────── */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent high/critical security incidents */}
        <Card className="lg:col-span-1 border shadow-xs">
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <ShieldCheckIcon className="size-4 text-muted-foreground" />
              Recent Security Incidents
            </CardTitle>
            <CardDescription>Latest high &amp; critical entries from the security log</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {isLoading ? (
              <div className="space-y-3">
                {[0, 1, 2, 3].map((row) => (
                  <div key={row} className="h-10 animate-pulse rounded bg-muted" aria-hidden />
                ))}
              </div>
            ) : incidents.length === 0 ? (
              <p className="py-6 text-center text-xs text-muted-foreground">
                No high or critical incidents logged.
              </p>
            ) : (
              incidents.map((incident, index) => (
                <div
                  key={incident.log_id ?? index}
                  className="flex items-start justify-between gap-3 border-b pb-2 text-xs last:border-0"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="truncate font-semibold text-foreground">
                        {incident.incident_type ?? "INCIDENT"}
                      </p>
                      <span
                        className={`rounded border px-1 py-px text-[9px] font-bold uppercase ${severityClass(incident.severity)}`}
                      >
                        {incident.severity ?? "—"}
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground line-clamp-2">
                      {incident.description ?? incident.action_taken ?? incident.service_name ?? "-"}
                    </p>
                    {incident.ip_address && (
                      <p className="mt-0.5 font-mono text-[10px] text-muted-foreground/80">
                        {incident.ip_address}
                      </p>
                    )}
                  </div>
                  <span className="shrink-0 font-mono text-[10px] text-muted-foreground">
                    {formatRelativeTime(incident.timestamp)}
                  </span>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Trader & Trade Activity Trends */}
        <Card className="lg:col-span-2 border shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base font-semibold">Trader &amp; Trade Activity</CardTitle>
              <CardDescription>
                Daily registrations and trades created ({windowDays}-day window)
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading || !hasChartData ? (
              <div className="w-full min-w-0 h-[220px] flex items-center justify-center border border-dashed rounded-lg bg-muted/20">
                <div className="text-center space-y-2 p-6">
                  <BarChart3Icon className="size-8 mx-auto text-muted-foreground/60" />
                  <p className="text-sm font-medium text-muted-foreground">
                    {isLoading ? "Loading activity…" : "No activity data available"}
                  </p>
                </div>
              </div>
            ) : (
              <ChartContainer className="aspect-auto h-[220px] w-full" config={activityChartConfig}>
                <AreaChart accessibilityLayer data={chartRows} margin={{ left: 4, right: 8, top: 8 }}>
                  <CartesianGrid vertical={false} />
                  <XAxis
                    axisLine={false}
                    dataKey="date"
                    interval="preserveStartEnd"
                    minTickGap={24}
                    tickFormatter={formatAxisDate}
                    tickLine={false}
                    tickMargin={8}
                  />
                  <YAxis allowDecimals={false} axisLine={false} tickLine={false} width={28} />
                  <ChartTooltip
                    content={<ChartTooltipContent labelFormatter={(value) => formatAxisDate(String(value))} />}
                  />
                  <ChartLegend content={<ChartLegendContent />} />
                  <Area
                    dataKey="new_users"
                    fill="var(--color-new_users)"
                    fillOpacity={0.15}
                    stroke="var(--color-new_users)"
                    type="monotone"
                  />
                  <Area
                    dataKey="new_trades"
                    fill="var(--color-new_trades)"
                    fillOpacity={0.15}
                    stroke="var(--color-new_trades)"
                    type="monotone"
                  />
                </AreaChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Integrated Growth Analytics Section ────────────────────────────── */}
      <div className="border-t pt-8 space-y-6">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <TrendingUpIcon className="size-5 text-emerald-500" />
              Growth Analytics
            </h2>
            <p className="text-xs text-muted-foreground">
              New registrations, trades, and subscriptions ({windowDays}-day window).
            </p>
          </div>
          <Badge variant="outline" className="font-mono text-[11px] self-start sm:self-auto">
            Growth Analytics ({windowDays}d)
          </Badge>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <KpiCard
            title="New Users"
            value={seriesTotal(analytics?.new_users)}
            subtitle={`Registrations in last ${windowDays} days`}
            icon={UsersIcon}
            accentColor="text-blue-500"
            badgeText="New Users"
            isLoading={isLoading}
          />

          <KpiCard
            title="New Trades"
            value={seriesTotal(analytics?.new_trades)}
            subtitle={`Trades opened in last ${windowDays} days`}
            icon={ActivityIcon}
            accentColor="text-emerald-500"
            badgeText="New Trades"
            isLoading={isLoading}
          />

          <KpiCard
            title="New Subscriptions"
            value={seriesTotal(analytics?.new_subscriptions)}
            subtitle={`Subscription starts in last ${windowDays} days`}
            icon={CreditCardIcon}
            accentColor="text-purple-500"
            badgeText="New Subscriptions"
            isLoading={isLoading}
          />
        </div>

        {/* Growth Trends Chart */}
        <Card className="border shadow-xs">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Growth Trends</CardTitle>
            <CardDescription>
              New Users, New Trades, and New Subscriptions over time ({windowDays}-day window)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading || !hasChartData ? (
              <div className="w-full min-w-0 h-[240px] flex items-center justify-center border border-dashed rounded-lg bg-muted/20">
                <div className="text-center space-y-2 p-6">
                  <TrendingUpIcon className="size-8 mx-auto text-muted-foreground/60" />
                  <p className="text-sm font-medium text-muted-foreground">
                    {isLoading ? "Loading growth trends…" : "No growth data available"}
                  </p>
                </div>
              </div>
            ) : (
              <ChartContainer className="aspect-auto h-[240px] w-full" config={growthChartConfig}>
                <LineChart accessibilityLayer data={chartRows} margin={{ left: 4, right: 8, top: 8 }}>
                  <CartesianGrid vertical={false} />
                  <XAxis
                    axisLine={false}
                    dataKey="date"
                    interval="preserveStartEnd"
                    minTickGap={24}
                    tickFormatter={formatAxisDate}
                    tickLine={false}
                    tickMargin={8}
                  />
                  <YAxis allowDecimals={false} axisLine={false} tickLine={false} width={28} />
                  <ChartTooltip
                    content={<ChartTooltipContent labelFormatter={(value) => formatAxisDate(String(value))} />}
                  />
                  <ChartLegend content={<ChartLegendContent />} />
                  <Line
                    dataKey="new_users"
                    dot={false}
                    stroke="var(--color-new_users)"
                    strokeWidth={2}
                    type="monotone"
                  />
                  <Line
                    dataKey="new_trades"
                    dot={false}
                    stroke="var(--color-new_trades)"
                    strokeWidth={2}
                    type="monotone"
                  />
                  <Line
                    dataKey="new_subscriptions"
                    dot={false}
                    stroke="var(--color-new_subscriptions)"
                    strokeWidth={2}
                    type="monotone"
                  />
                </LineChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
