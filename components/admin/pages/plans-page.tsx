"use client";

import { useMemo, useState } from "react";
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
  UsersIcon,
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
import { Gated } from "@/components/admin/admin-permissions-provider";
import { ConfirmActionDialog } from "@/components/admin/dialogs/confirm-action-dialog";
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
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const handleAddPlan = (newPlan: Omit<PlanRecord, "plan_id" | "subscribers_count">) => {
    const plan: PlanRecord = {
      ...newPlan,
      plan_id: `PLN_${Math.floor(1000 + Math.random() * 9000)}`,
      subscribers_count: 0,
      created_at: new Date().toISOString(),
    };
    setPlans((prev) => [plan, ...prev]);
  };

  const handleDeletePlan = (planId: string) => {
    setPlans((prev) => prev.filter((p) => p.plan_id !== planId));
  };

  const handleToggleStatus = (planId: string) => {
    setPlans((prev) =>
      prev.map((p) => (p.plan_id === planId ? { ...p, is_active: !p.is_active } : p))
    );
  };

  // Filtered Plans List
  const filteredPlans = useMemo(() => {
    return plans.filter((p) => {
      const q = search.toLowerCase();
      const matchesSearch =
        !search ||
        p.name.toLowerCase().includes(q) ||
        p.analyst_name.toLowerCase().includes(q) ||
        p.segment.toLowerCase().includes(q) ||
        p.plan_id.toLowerCase().includes(q);

      const matchesStatus =
        filterStatus === "all" ||
        (filterStatus === "active" && p.is_active) ||
        (filterStatus === "inactive" && !p.is_active);

      const matchesSegment =
        filterSegment === "all" || p.segment.toLowerCase() === filterSegment.toLowerCase();

      return matchesSearch && matchesStatus && matchesSegment;
    });
  }, [plans, search, filterStatus, filterSegment]);

  const hasPlans = plans.length > 0;
  const activeCount = hasPlans ? plans.filter((p) => p.is_active).length : "—";
  const inactiveCount = hasPlans ? plans.filter((p) => !p.is_active).length : "—";
  const totalSubscribers = hasPlans
    ? plans.reduce((sum, p) => sum + (p.subscribers_count || 0), 0)
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

        <div className="flex items-center gap-2">
          <Gated power="PWR_PLAN_MODIFY_ALL">
            <EditPlanDialog
              planId="NEW_PLAN"
              refresh={handleRefresh}
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
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="gap-1.5"
          >
            <RefreshCwIcon className={`size-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* ── Metric Summary Tiles Grid (Placeholders) ──────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="rounded-xl border bg-card p-4 shadow-xs transition-all hover:shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total Plans</span>
            <BadgeIndianRupeeIcon className="size-4 text-emerald-500" />
          </div>
          <div className="mt-3 text-2xl font-extrabold tracking-tight text-muted-foreground/80">{hasPlans ? plans.length : "—"}</div>
          <p className="mt-1 text-xs text-muted-foreground">Active catalog plans</p>
        </Card>

        <Card className="rounded-xl border bg-card p-4 shadow-xs transition-all hover:shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Active Plans</span>
            <CheckCircle2Icon className="size-4 text-emerald-500" />
          </div>
          <div className="mt-3 text-2xl font-extrabold tracking-tight text-muted-foreground/80">{activeCount}</div>
          <p className="mt-1 text-xs text-muted-foreground">Available for subscription</p>
        </Card>

        <Card className="rounded-xl border bg-card p-4 shadow-xs transition-all hover:shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Inactive Plans</span>
            <PowerIcon className="size-4 text-amber-500" />
          </div>
          <div className="mt-3 text-2xl font-extrabold tracking-tight text-muted-foreground/80">{inactiveCount}</div>
          <p className="mt-1 text-xs text-muted-foreground">Archived plans</p>
        </Card>

        <Card className="rounded-xl border bg-card p-4 shadow-xs transition-all hover:shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total Subscribers</span>
            <UsersIcon className="size-4 text-blue-500" />
          </div>
          <div className="mt-3 text-2xl font-extrabold tracking-tight text-muted-foreground/80">{totalSubscribers}</div>
          <p className="mt-1 text-xs text-muted-foreground">Subscribed traders</p>
        </Card>
      </div>

      {/* ── Main Data Table Card ──────────────────────────────────────────── */}
      <Card className="rounded-xl border bg-card text-card-foreground shadow-xs overflow-hidden">
        <CardHeader className="gap-3 border-b bg-muted/20 px-6 py-4 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle className="text-base font-bold tracking-tight text-foreground">Subscription Plan Catalog</CardTitle>
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
              <TableRow className="bg-muted/30 hover:bg-muted/30">
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
                      <p className="font-semibold text-muted-foreground">No subscription plans to display</p>
                      <p className="text-[11px] text-muted-foreground/80 max-w-sm">
                        Use the &ldquo;+ Add Plan&rdquo; button above to create a new plan entry or connect backend routes to load catalog items.
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredPlans.map((plan) => (
                  <TableRow key={plan.plan_id} className="transition-colors hover:bg-muted/40">
                    {/* PLAN */}
                    <TableCell className="py-3 text-xs">
                      <div>
                        <p className="font-semibold text-foreground">{plan.name}</p>
                        <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                          <span>{plan.description || "Subscription plan"}</span>
                          <span className="font-mono text-[10px] text-muted-foreground/70">• {plan.plan_id}</span>
                        </p>
                      </div>
                    </TableCell>

                    {/* ANALYST */}
                    <TableCell className="py-3 text-xs font-medium">
                      {plan.analyst_name}
                    </TableCell>

                    {/* SEGMENT */}
                    <TableCell className="py-3 text-xs">
                      <Badge variant="outline" className="text-[10px] font-mono">
                        {plan.segment}
                      </Badge>
                    </TableCell>

                    {/* PRICE */}
                    <TableCell className="py-3 text-xs font-bold text-foreground">
                      ₹{plan.price.toLocaleString("en-IN")}
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
                            refresh={handleRefresh}
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
                            refresh={handleRefresh}
                            trigger={
                              <Button size="icon-sm" variant="ghost" title="Edit Plan">
                                <PencilIcon className="size-3.5 text-muted-foreground" />
                              </Button>
                            }
                          />
                        </Gated>

                        <Gated power="PWR_ADMIN_SYSTEM_CONFIG">
                          <ConfirmActionDialog
                            title="Delete Plan (Founder Only)"
                            description={`Are you sure you want to delete "${plan.name}"? Action requires typing DELETE.`}
                            requireConfirmText="DELETE"
                            confirmLabel="Delete Plan"
                            destructive
                            onConfirm={() => handleDeletePlan(plan.plan_id)}
                            trigger={
                              <Button
                                size="icon-sm"
                                variant="ghost"
                                className="text-destructive hover:bg-destructive/10"
                                title="Founder Action: Delete Plan"
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
          <div className="flex items-center justify-between border-t bg-muted/10 px-6 py-3 text-xs text-muted-foreground">
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
