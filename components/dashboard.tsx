"use client";

import { useState } from "react";
import {
  ActivityIcon,
  ArrowUpRightIcon,
  BarChart3Icon,
  BriefcaseIcon,
  CheckCircle2Icon,
  ClockIcon,
  CreditCardIcon,
  FilterIcon,
  LayersIcon,
  RefreshCwIcon,
  ShieldAlertIcon,
  ShieldCheckIcon,
  TrendingUpIcon,
  UserCheckIcon,
  UsersIcon,
  ZapIcon,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

// ─── Data Types & Options ─────────────────────────────────────────────────────

type AnalystOption = {
  id: string;
  name: string;
  username: string;
};

const ANALYST_OPTIONS: AnalystOption[] = [
  { id: "all", name: "All Analysts", username: "all" },
  { id: "analyst_1", name: "Rakesh Jhunjhunwala", username: "rakesh_j" },
  { id: "analyst_2", name: "Vijay Kedia", username: "vijay_k" },
  { id: "analyst_3", name: "Radhakishan Damani", username: "rk_damani" },
];

const RECENT_ACTIVITY_FEED = [
  { id: "act_1", actor: "Admin (Founder)", action: "Approved SEBI verification for Analyst @sunil_s", timestamp: "10 mins ago", type: "verify" },
  { id: "act_2", actor: "System Security", action: "Blocked suspicious IP 192.168.1.102 (Rate limit exceeded)", timestamp: "25 mins ago", type: "security" },
  { id: "act_3", actor: "Support Lead", action: "Processed refund ₹1,999 for user USR_90211", timestamp: "1 hour ago", type: "refund" },
  { id: "act_4", actor: "Admin (Founder)", action: "Updated platform fee threshold in System Config", timestamp: "3 hours ago", type: "config" },
];

// ─── KPI Card Component ──────────────────────────────────────────────────────

function KpiCard({
  title,
  valuePlaceholder = "—",
  subtitle,
  icon: Icon,
  accentColor = "text-primary",
  badgeText,
}: {
  title: string;
  valuePlaceholder?: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
  accentColor?: string;
  badgeText?: string;
}) {
  return (
    <Card className="relative overflow-hidden border shadow-xs transition-all hover:shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {title}
        </CardTitle>
        <div className={`rounded-lg bg-muted/60 p-2 ${accentColor}`}>
          <Icon className="size-4" />
        </div>
      </CardHeader>
      <CardContent className="space-y-1.5">
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-3xl font-extrabold tracking-tight tabular-nums text-muted-foreground/80">
            {valuePlaceholder}
          </span>
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

// ─── Main Dashboard Component ────────────────────────────────────────────────

export function Dashboard() {
  const [selectedAnalyst, setSelectedAnalyst] = useState<string>("all");
  const [daysWindow, setDaysWindow] = useState<number>(30);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 500);
  };

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
          {/* Analyst Filter Dropdown */}
          <div className="flex items-center gap-2">
            <FilterIcon className="size-4 text-muted-foreground" />
            <select
              value={selectedAnalyst}
              onChange={(e) => setSelectedAnalyst(e.target.value)}
              className="h-9 rounded-md border border-input bg-background px-3 py-1 text-xs font-medium text-foreground shadow-xs transition-colors focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring"
            >
              {ANALYST_OPTIONS.map((analyst) => (
                <option key={analyst.id} value={analyst.id}>
                  {analyst.name}
                </option>
              ))}
            </select>
          </div>

          {/* Time Window Selector */}
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

          <Button size="sm" variant="outline" onClick={handleRefresh} disabled={isRefreshing}>
            <RefreshCwIcon className={`size-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* ── System Health & Quick-Access Action Shortcuts Bar ─────────────── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* System Health: API Status */}
        <div className="flex items-center justify-between rounded-xl border bg-emerald-500/10 p-3.5 text-xs text-emerald-700 dark:text-emerald-400">
          <div className="flex items-center gap-2.5">
            <CheckCircle2Icon className="size-4 shrink-0 text-emerald-600" />
            <div>
              <p className="font-bold text-foreground">API Gateway</p>
              <p className="text-[11px] opacity-80">99.98% Uptime &bull; Operational</p>
            </div>
          </div>
          <Badge variant="default" className="bg-emerald-600 text-[10px]">Healthy</Badge>
        </div>

        {/* System Health: Market Data Feed Status */}
        <div className="flex items-center justify-between rounded-xl border bg-emerald-500/10 p-3.5 text-xs text-emerald-700 dark:text-emerald-400">
          <div className="flex items-center gap-2.5">
            <ActivityIcon className="size-4 shrink-0 text-emerald-600" />
            <div>
              <p className="font-bold text-foreground">Market Data Feed</p>
              <p className="text-[11px] opacity-80">NSE/BSE Live Feeds Active</p>
            </div>
          </div>
          <Badge variant="default" className="bg-emerald-600 text-[10px]">Live Sync</Badge>
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

      {/* ── Summary Metric Cards Grid (5 Specified Metrics) ─────────────────── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <KpiCard
          title="Active Users"
          valuePlaceholder="—"
          subtitle="Registered trader accounts"
          icon={UsersIcon}
          accentColor="text-blue-500"
          badgeText="Active Users"
        />

        <KpiCard
          title="Active Analysts"
          valuePlaceholder="—"
          subtitle="Analysts with ≥1 active plan"
          icon={UserCheckIcon}
          accentColor="text-emerald-500"
          badgeText="Verified SEBI"
        />

        <KpiCard
          title="Pending Verifications"
          valuePlaceholder="—"
          subtitle="Credential review queue"
          icon={ClockIcon}
          accentColor="text-amber-500"
          badgeText="Verification Queue"
        />

        <KpiCard
          title="Open Incidents"
          valuePlaceholder="—"
          subtitle="Security investigation cases"
          icon={ShieldAlertIcon}
          accentColor="text-destructive"
          badgeText="Security"
        />

        <KpiCard
          title="MRR / Subscriptions"
          valuePlaceholder="—"
          subtitle="Active monthly subscriptions"
          icon={CreditCardIcon}
          accentColor="text-purple-500"
          badgeText="Revenue"
        />
      </div>

      {/* ── Activity Feed & Trader Activity ────────────────────────────────── */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent Admin Activity Feed */}
        <Card className="lg:col-span-1 border shadow-xs">
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <ClockIcon className="size-4 text-muted-foreground" />
              Recent Admin Activity Feed
            </CardTitle>
            <CardDescription>Audit log of recent actions across platform</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {RECENT_ACTIVITY_FEED.map((act) => (
              <div key={act.id} className="flex items-start justify-between border-b pb-2 text-xs last:border-0">
                <div>
                  <p className="font-semibold text-foreground">{act.actor}</p>
                  <p className="text-[11px] text-muted-foreground">{act.action}</p>
                </div>
                <span className="text-[10px] font-mono text-muted-foreground shrink-0">{act.timestamp}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Trader & Trade Activity Trends */}
        <Card className="lg:col-span-2 border shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base font-semibold">Trader & Trade Activity</CardTitle>
              <CardDescription>
                Daily trader registrations and trades created ({daysWindow}-day window)
              </CardDescription>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <span className="flex items-center gap-1.5 font-medium text-blue-500">
                <span className="size-2.5 rounded-full bg-blue-500" /> Traders
              </span>
              <span className="flex items-center gap-1.5 font-medium text-amber-500">
                <span className="size-2.5 rounded-full bg-amber-500" /> Trades
              </span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="w-full min-w-0 h-[220px] flex items-center justify-center border border-dashed rounded-lg bg-muted/20">
              <div className="text-center space-y-2 p-6">
                <BarChart3Icon className="size-8 mx-auto text-muted-foreground/60" />
                <p className="text-sm font-medium text-muted-foreground">Main Activity Chart</p>
                <p className="text-xs text-muted-foreground/80 max-w-sm">
                  Daily trader signups & trade volume overview for the selected window.
                </p>
              </div>
            </div>
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
              Growth metrics displaying New Analysts, New Users, and New Subscriptions ({daysWindow}-day window).
            </p>
          </div>
          <Badge variant="outline" className="font-mono text-[11px] self-start sm:self-auto">
            Growth Analytics ({daysWindow}d)
          </Badge>
        </div>

        {/* 3 Metric Cards for New Users, New Analysts, New Subscriptions */}
        <div className="grid gap-4 sm:grid-cols-3">
          <KpiCard
            title="New Users"
            valuePlaceholder="—"
            subtitle={`Registrations in last ${daysWindow} days`}
            icon={UsersIcon}
            accentColor="text-blue-500"
            badgeText="New Users"
          />

          <KpiCard
            title="New Analysts"
            valuePlaceholder="—"
            subtitle={`Analyst signups in last ${daysWindow} days`}
            icon={UserCheckIcon}
            accentColor="text-emerald-500"
            badgeText="New Analysts"
          />

          <KpiCard
            title="New Subscriptions"
            valuePlaceholder="—"
            subtitle={`Subscription starts in last ${daysWindow} days`}
            icon={CreditCardIcon}
            accentColor="text-purple-500"
            badgeText="New Subscriptions"
          />
        </div>

        {/* Growth Trends Chart */}
        <Card className="border shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base font-semibold">Growth Trends</CardTitle>
              <CardDescription>
                Visual comparison of New Users, New Analysts, and New Subscriptions over time ({daysWindow}-day window)
              </CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-xs font-medium">
              <span className="flex items-center gap-1.5 text-blue-500">
                <span className="size-2.5 rounded-full bg-blue-500" /> New Users
              </span>
              <span className="flex items-center gap-1.5 text-emerald-500">
                <span className="size-2.5 rounded-full bg-emerald-500" /> New Analysts
              </span>
              <span className="flex items-center gap-1.5 text-purple-500">
                <span className="size-2.5 rounded-full bg-purple-500" /> New Subscriptions
              </span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="w-full min-w-0 h-[240px] flex items-center justify-center border border-dashed rounded-lg bg-muted/20">
              <div className="text-center space-y-2 p-6">
                <TrendingUpIcon className="size-8 mx-auto text-muted-foreground/60" />
                <p className="text-sm font-medium text-muted-foreground">Growth Trends Overview</p>
                <p className="text-xs text-muted-foreground/80 max-w-md">
                  Growth trends for New Users, New Analysts, and New Subscriptions over the selected time window.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
