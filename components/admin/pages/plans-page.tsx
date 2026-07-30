"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  BadgeIndianRupeeIcon,
  CheckCircle2Icon,
  FilterIcon,
  LayersIcon,
  PencilIcon,
  PlusIcon,
  PowerIcon,
  RefreshCwIcon,
  SearchIcon,
  Trash2Icon,
  UserCheckIcon,
  UsersIcon,
  XIcon,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { adminFetch } from "@/lib/admin/client-api";
import { AnalystSearchFilter } from "@/components/admin/analyst-search-filter";
import { Gated } from "@/components/admin/admin-permissions-provider";
import { DeletePlanDialog } from "@/components/admin/dialogs/delete-plan-dialog";
import { EditPlanDialog } from "@/components/admin/dialogs/edit-plan-dialog";
import { PlanStatusDialog } from "@/components/admin/dialogs/plan-status-dialog";

export type PlanRecord = {
  plan_id: string;
  name: string;
  analyst_name: string;
  segment: string;
  price: number;
  subscribers_count: number;
  is_active: boolean;
  description?: string;
  created_at?: string;
};

export function PlansPage() {
  const [plans, setPlans] = useState<PlanRecord[]>([]);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterSegment, setFilterSegment] = useState("all");
  const [filterAnalyst, setFilterAnalyst] = useState("all");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchPlans = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const res = await adminFetch("/api/admin/plans");
      if (res.ok) {
        const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
        const list = Array.isArray(data.plans)
          ? (data.plans as PlanRecord[])
          : Array.isArray(data.items)
          ? (data.items as PlanRecord[])
          : Array.isArray(data)
          ? (data as PlanRecord[])
          : [];
        setPlans(list);
      } else {
        setPlans([]);
      }
    } catch {
      setPlans([]);
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void fetchPlans();
  }, [fetchPlans]);

  const handleToggleStatus = (planId: string) => {
    setPlans((prev) =>
      prev.map((p) => (p.plan_id === planId ? { ...p, is_active: !p.is_active } : p))
    );
  };

  // Derive unique analyst names for top dropdown
  const analystList = useMemo(() => {
    const set = new Set<string>();
    for (const p of plans) {
      if (p.analyst_name) set.add(p.analyst_name);
    }
    return Array.from(set);
  }, [plans]);

  // Filtered Plans List according to search, analyst, segment, status
  const filteredPlans = useMemo(() => {
    return plans.filter((p) => {
      const q = search.toLowerCase();
      const matchesSearch =
        !search ||
        (p.name && p.name.toLowerCase().includes(q)) ||
        (p.analyst_name && p.analyst_name.toLowerCase().includes(q)) ||
        (p.segment && p.segment.toLowerCase().includes(q)) ||
        (p.plan_id && p.plan_id.toLowerCase().includes(q));

      const matchesStatus =
        filterStatus === "all" ||
        (filterStatus === "active" && p.is_active) ||
        (filterStatus === "inactive" && !p.is_active);

      const matchesSegment =
        filterSegment === "all" || (p.segment && p.segment.toLowerCase() === filterSegment.toLowerCase());

      const matchesAnalyst =
        filterAnalyst === "all" || (p.analyst_name && p.analyst_name.toLowerCase() === filterAnalyst.toLowerCase());

      return matchesSearch && matchesStatus && matchesSegment && matchesAnalyst;
    });
  }, [plans, search, filterStatus, filterSegment, filterAnalyst]);

  // Derive OVERALL Page Summary Metrics strictly from filteredPlans
  const hasPlans = filteredPlans.length > 0;
  const activeCount = hasPlans ? filteredPlans.filter((p) => p.is_active).length : "—";
  const inactiveCount = hasPlans ? filteredPlans.filter((p) => !p.is_active).length : "—";
  const totalSubscribers = hasPlans
    ? filteredPlans.reduce((sum, p) => sum + (p.subscribers_count || 0), 0)
    : "—";

  return (
    <div className="space-y-6">
      {/* ── Page Header ────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 border-b pb-5 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="font-mono text-[10px] tracking-normal text-muted-foreground uppercase">
            PLAN CATALOG & BUSINESS
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-foreground">Plans</h1>
          <p className="mt-1 text-xs text-muted-foreground">
            Manage platform subscription plans, analyst allocations, pricing, and subscriber availability.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Top Searchable Analyst Filter Component */}
          <AnalystSearchFilter
            selectedAnalyst={filterAnalyst}
            onSelectAnalyst={setFilterAnalyst}
            analysts={analystList}
          />

          <Gated power="PWR_PLAN_MODIFY_ALL">
            <EditPlanDialog
              planId="NEW_PLAN"
              refresh={fetchPlans}
              trigger={
                <Button size="sm" className="gap-1.5 bg-primary hover:bg-primary/90">
                  <PlusIcon className="size-4" /> Add Plan
                </Button>
              }
            />
          </Gated>

          <Button
            size="sm"
            variant="outline"
            onClick={fetchPlans}
            disabled={isRefreshing}
            className="gap-1.5"
          >
            <RefreshCwIcon className={`size-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Active Analyst Filter Notification Banner */}
      {filterAnalyst !== "all" && (
        <div className="flex items-center justify-between rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-2.5 text-xs font-medium text-emerald-700 dark:text-emerald-300">
          <div className="flex items-center gap-2">
            <UserCheckIcon className="size-4 text-emerald-600" />
            <span>
              Overall page metrics & table filtered for Research Analyst: <strong>{filterAnalyst}</strong>
            </span>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setFilterAnalyst("all")}
            className="h-6 text-[11px] gap-1 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-bold"
          >
            <XIcon className="size-3" /> Reset Overall Filter
          </Button>
        </div>
      )}

      {/* ── Dynamic Metric Summary Tiles Grid (Filtered by Selected Analyst) ── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="rounded-xl border bg-card p-4 shadow-xs transition-all hover:shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-foreground/70">Total Plans</span>
            <BadgeIndianRupeeIcon className="size-4 text-emerald-500" />
          </div>
          <div className="mt-3 text-2xl font-extrabold tracking-tight text-foreground">{hasPlans ? filteredPlans.length : "—"}</div>
          <p className="mt-1 text-xs text-muted-foreground">
            {filterAnalyst !== "all" ? `Plans for ${filterAnalyst}` : "Active catalog plans"}
          </p>
        </Card>

        <Card className="rounded-xl border bg-card p-4 shadow-xs transition-all hover:shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-foreground/70">Active Plans</span>
            <CheckCircle2Icon className="size-4 text-emerald-500" />
          </div>
          <div className="mt-3 text-2xl font-extrabold tracking-tight text-emerald-600 dark:text-emerald-400">{activeCount}</div>
          <p className="mt-1 text-xs text-muted-foreground">Available for subscription</p>
        </Card>

        <Card className="rounded-xl border bg-card p-4 shadow-xs transition-all hover:shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-foreground/70">Inactive Plans</span>
            <PowerIcon className="size-4 text-amber-500" />
          </div>
          <div className="mt-3 text-2xl font-extrabold tracking-tight text-amber-600 dark:text-amber-400">{inactiveCount}</div>
          <p className="mt-1 text-xs text-muted-foreground">Archived plans</p>
        </Card>

        <Card className="rounded-xl border bg-card p-4 shadow-xs transition-all hover:shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-foreground/70">Total Subscribers</span>
            <UsersIcon className="size-4 text-blue-500" />
          </div>
          <div className="mt-3 text-2xl font-extrabold tracking-tight text-blue-600 dark:text-blue-400">{totalSubscribers}</div>
          <p className="mt-1 text-xs text-muted-foreground">Subscribed traders</p>
        </Card>
      </div>

      {/* ── Main Data Table Card ──────────────────────────────────────────── */}
      <Card className="rounded-xl border bg-card text-card-foreground shadow-xs overflow-hidden">
        <CardHeader className="gap-3 border-b bg-card px-6 py-4 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle className="text-base font-bold tracking-tight text-foreground">
              {filterAnalyst !== "all" ? `Plan Catalog (${filterAnalyst})` : "Subscription Plan Catalog"}
            </CardTitle>
            <p className="mt-0.5 text-xs text-muted-foreground">Catalog plans, segment categorization, pricing, and availability</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Status Filter */}
            <div className="flex items-center gap-1.5 border rounded-md bg-background px-2 py-1">
              <FilterIcon className="size-3.5 text-muted-foreground" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="bg-transparent text-xs font-medium text-foreground focus:outline-hidden"
              >
                <option value="all">All Statuses</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            {/* Segment Filter */}
            <div className="flex items-center gap-1.5 border rounded-md bg-background px-2 py-1">
              <LayersIcon className="size-3.5 text-muted-foreground" />
              <select
                value={filterSegment}
                onChange={(e) => setFilterSegment(e.target.value)}
                className="bg-transparent text-xs font-medium text-foreground focus:outline-hidden"
              >
                <option value="all">All Segments</option>
                <option value="EQUITY">EQUITY</option>
                <option value="DERIVATIVES">DERIVATIVES</option>
                <option value="COMMODITY">COMMODITY</option>
              </select>
            </div>

            {/* Search Input */}
            <div className="relative w-full md:w-64">
              <SearchIcon className="absolute left-2.5 top-2.5 size-3.5 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search plan name, analyst..."
                className="h-8 pl-8 text-xs"
              />
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-card hover:bg-card border-b">
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3">PLAN</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3">ANALYST</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3">SEGMENT</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3">PRICE</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3">STATUS</TableHead>
                <TableHead className="w-28 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3">ACTIONS</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPlans.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-36 text-center text-xs text-muted-foreground">
                    <div className="flex flex-col items-center justify-center gap-2 py-4">
                      <BadgeIndianRupeeIcon className="size-8 text-muted-foreground/50" />
                      <p className="font-semibold text-muted-foreground">
                        {filterAnalyst !== "all"
                          ? `No subscription plans found for analyst "${filterAnalyst}"`
                          : "No subscription plans returned from backend"}
                      </p>
                      <p className="text-[11px] text-muted-foreground/80 max-w-sm">
                        Use the &ldquo;+ Add Plan&rdquo; button above to create a new plan entry or reset filters.
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredPlans.map((plan) => (
                  <TableRow key={plan.plan_id} className="transition-colors hover:bg-accent/40 border-b border-border/40">
                    {/* PLAN */}
                    <TableCell className="py-3 text-xs">
                      <div>
                        <p className="font-semibold text-foreground">{plan.name}</p>
                        <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                          <span>{plan.description || "No description"}</span>
                          <span className="font-mono text-[10px] text-muted-foreground/70">• {plan.plan_id}</span>
                        </p>
                      </div>
                    </TableCell>

                    {/* ANALYST */}
                    <TableCell className="py-3 text-xs font-medium">
                      <span
                        onClick={() => setFilterAnalyst(plan.analyst_name)}
                        className="cursor-pointer hover:underline text-emerald-600 dark:text-emerald-400 font-semibold"
                        title="Filter entire page by this analyst"
                      >
                        {plan.analyst_name || "—"}
                      </span>
                    </TableCell>

                    {/* SEGMENT */}
                    <TableCell className="py-3 text-xs">
                      <Badge variant="outline" className="text-[10px] font-mono">
                        {plan.segment || "—"}
                      </Badge>
                    </TableCell>

                    {/* PRICE */}
                    <TableCell className="py-3 text-xs font-bold text-foreground">
                      ₹{(plan.price || 0).toLocaleString("en-IN")}
                    </TableCell>

                    {/* STATUS */}
                    <TableCell className="py-3 text-xs">
                      <Badge
                        variant={plan.is_active ? "default" : "secondary"}
                        className={`font-semibold text-[10px] ${plan.is_active ? "bg-emerald-600 text-white" : ""}`}
                      >
                        {plan.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>

                    {/* ACTIONS */}
                    <TableCell className="py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Gated power="PWR_PLAN_ACTIVATE_DEACTIVATE">
                          <PlanStatusDialog
                            planId={plan.plan_id}
                            isActive={plan.is_active}
                            refresh={fetchPlans}
                            trigger={
                              <Button
                                size="icon-sm"
                                variant="ghost"
                                onClick={() => handleToggleStatus(plan.plan_id)}
                                title={plan.is_active ? "Deactivate Plan" : "Activate Plan"}
                              >
                                <PowerIcon className={`size-3.5 ${plan.is_active ? "text-emerald-600" : "text-muted-foreground"}`} />
                              </Button>
                            }
                          />
                        </Gated>

                        <Gated power="PWR_PLAN_MODIFY_ALL">
                          <EditPlanDialog
                            planId={plan.plan_id}
                            currentName={plan.name}
                            currentPrice={plan.price}
                            currentSegment={plan.segment}
                            currentDescription={plan.description}
                            refresh={fetchPlans}
                            trigger={
                              <Button size="icon-sm" variant="ghost" title="Edit Plan">
                                <PencilIcon className="size-3.5 text-muted-foreground" />
                              </Button>
                            }
                          />
                        </Gated>

                        <Gated power="PWR_PLAN_DELETE">
                          <DeletePlanDialog
                            planId={plan.plan_id}
                            planName={plan.name}
                            refresh={fetchPlans}
                            trigger={
                              <Button
                                size="icon-sm"
                                variant="ghost"
                                className="text-destructive hover:bg-destructive/10"
                                title="Delete Plan"
                              >
                                <Trash2Icon className="size-3.5" />
                              </Button>
                            }
                          />
                        </Gated>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {/* Table Footer */}
          <div className="flex items-center justify-between border-t bg-card px-6 py-3 text-xs text-muted-foreground">
            <span>
              Showing {filteredPlans.length} of {plans.length} total plans
            </span>
            <span className="font-mono text-[11px]">Plan Catalog Active</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
