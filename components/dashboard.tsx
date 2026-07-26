"use client";

import { useState } from "react";
import {
  BarChart3Icon,
  BriefcaseIcon,
  CreditCardIcon,
  FilterIcon,
  LayersIcon,
  RefreshCwIcon,
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

// Analyst List for the Analyst Filter
const ANALYST_OPTIONS: AnalystOption[] = [
  { id: "all", name: "All Analysts", username: "all" },
  { id: "analyst_1", name: "Rakesh Jhunjhunwala", username: "rakesh_j" },
  { id: "analyst_2", name: "Vijay Kedia", username: "vijay_k" },
  { id: "analyst_3", name: "Radhakishan Damani", username: "rk_damani" },
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

      {/* ── Primary KPI Cards Grid ─────────────────────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-3">
        {/* KPI 1: Total Users (Traders) */}
        <KpiCard
          title="Total Users (Traders)"
          valuePlaceholder="—"
          subtitle="Calculated by total registered trader accounts"
          icon={UsersIcon}
          accentColor="text-blue-500"
          badgeText="Trader Accounts"
        />

        {/* KPI 2: Active Analysts (≥1 Active Plan) */}
        <KpiCard
          title="Active Analysts"
          valuePlaceholder="—"
          subtitle="Analysts having at least 1 active subscription plan"
          icon={UserCheckIcon}
          accentColor="text-emerald-500"
          badgeText="≥1 Active Plan"
        />

        {/* KPI 3: Live & Historical Trades Created by Everyone */}
        <KpiCard
          title="Total Trades Created"
          valuePlaceholder="—"
          subtitle="Number of trades created across all analysts"
          icon={ZapIcon}
          accentColor="text-amber-500"
          badgeText="Created by Everyone"
        />
      </div>

      {/* ── Trader & Trade Activity Section ───────────────────────────────── */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
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

        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">Analyst Segment Overview</CardTitle>
            <CardDescription>Analysts with active plans overview</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="w-full min-w-0 h-[220px] flex items-center justify-center border border-dashed rounded-lg bg-muted/20">
              <div className="text-center space-y-2 p-6">
                <BriefcaseIcon className="size-8 mx-auto text-muted-foreground/60" />
                <p className="text-sm font-medium text-muted-foreground font-mono text-xs uppercase tracking-wider">
                  Analyst Segment Breakdown
                </p>
                <p className="text-xs text-muted-foreground/80">
                  Active plan distribution per trading segment.
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

      {/* ── Analyst Directory Table ────────────────────────────────────────── */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base font-semibold">Analyst Directory & Active Plans</CardTitle>
            <CardDescription>
              Filterable analyst directory, active plan status, and trade counts
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border border-dashed p-8 text-center bg-muted/10">
            <div className="max-w-md mx-auto space-y-3">
              <LayersIcon className="size-8 mx-auto text-muted-foreground/60" />
              <h3 className="text-sm font-semibold">Analyst Directory Overview</h3>
              <p className="text-xs text-muted-foreground">
                Detailed listing of analysts, their active plans count (≥1 active plan criteria), total trades published, and subscriber totals.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

