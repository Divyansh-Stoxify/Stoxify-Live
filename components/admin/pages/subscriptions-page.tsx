"use client";

import { useMemo, useState } from "react";
import {
  BanIcon,
  CheckCircle2Icon,
  CreditCardIcon,
  FilterIcon,
  ReceiptTextIcon,
  RefreshCwIcon,
  RotateCcwIcon,
  SearchIcon,
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
import { CancelSubscriptionDialog } from "@/components/admin/dialogs/cancel-subscription-dialog";
import { RefundSubscriptionDialog } from "@/components/admin/dialogs/refund-subscription-dialog";
import { RefundFormDialog, type RefundData } from "@/components/admin/dialogs/refund-form-dialog";

export type SubscriptionRecord = {
  subscription_id: string;
  user_name: string;
  user_email: string;
  analyst_name: string;
  plan_name: string;
  amount: number;
  status: "ACTIVE" | "CANCELLED" | "EXPIRED" | "REFUNDED";
  end_date: string;
};

function statusVariant(value: string): "default" | "secondary" | "destructive" | "outline" {
  if (/cancelled|refunded/i.test(value)) return "destructive";
  if (/expired/i.test(value)) return "outline";
  if (/active/i.test(value)) return "default";
  return "secondary";
}

export function SubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<SubscriptionRecord[]>([]);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const handleRefundSuccess = (refund: RefundData) => {
    const newSub: SubscriptionRecord = {
      subscription_id: `SUB_${Math.floor(1000 + Math.random() * 9000)}`,
      user_name: refund.user_name,
      user_email: refund.user_email,
      analyst_name: "Platform Analyst",
      plan_name: "Refunded Plan",
      amount: refund.amount,
      status: "REFUNDED",
      end_date: new Date().toISOString(),
    };
    setSubscriptions((prev) => [newSub, ...prev]);
  };

  const handleCancelSub = (subId: string) => {
    setSubscriptions((prev) =>
      prev.map((s) => (s.subscription_id === subId ? { ...s, status: "CANCELLED" } : s))
    );
  };

  // Filtered Subscriptions List
  const filteredSubscriptions = useMemo(() => {
    return subscriptions.filter((s) => {
      const q = search.toLowerCase();
      const matchesSearch =
        !search ||
        s.user_name.toLowerCase().includes(q) ||
        s.user_email.toLowerCase().includes(q) ||
        s.analyst_name.toLowerCase().includes(q) ||
        s.plan_name.toLowerCase().includes(q) ||
        s.subscription_id.toLowerCase().includes(q);

      const matchesStatus =
        filterStatus === "all" || s.status.toLowerCase() === filterStatus.toLowerCase();

      return matchesSearch && matchesStatus;
    });
  }, [subscriptions, search, filterStatus]);

  const hasSubs = subscriptions.length > 0;
  const activeCount = hasSubs ? subscriptions.filter((s) => s.status === "ACTIVE").length : "—";
  const cancelledCount = hasSubs ? subscriptions.filter((s) => s.status === "CANCELLED").length : "—";
  const refundedCount = hasSubs ? subscriptions.filter((s) => s.status === "REFUNDED").length : "—";

  return (
    <div className="space-y-6">
      {/* ── Page Header ────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 border-b pb-5 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="font-mono text-[10px] tracking-normal text-muted-foreground uppercase">
            SUBSCRIPTION LEDGER & REVENUE
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-foreground">Subscriptions</h1>
          <p className="mt-1 text-xs text-muted-foreground">
            View active, cancelled, and expired trader subscriptions, process refunds, and track recurring revenue.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Initiate Refund Form Dialog */}
          <Gated power="PWR_SUBSCRIPTION_REFUND">
            <RefundFormDialog onSuccess={handleRefundSuccess} />
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
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total Subscriptions</span>
            <ReceiptTextIcon className="size-4 text-blue-500" />
          </div>
          <div className="mt-3 text-2xl font-extrabold tracking-tight text-muted-foreground/80">{hasSubs ? subscriptions.length : "—"}</div>
          <p className="mt-1 text-xs text-muted-foreground">Platform subscription ledger</p>
        </Card>

        <Card className="rounded-xl border bg-card p-4 shadow-xs transition-all hover:shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Active Subscriptions</span>
            <CheckCircle2Icon className="size-4 text-emerald-500" />
          </div>
          <div className="mt-3 text-2xl font-extrabold tracking-tight text-muted-foreground/80">{activeCount}</div>
          <p className="mt-1 text-xs text-muted-foreground">Currently active trader plans</p>
        </Card>

        <Card className="rounded-xl border bg-card p-4 shadow-xs transition-all hover:shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Cancelled</span>
            <BanIcon className="size-4 text-amber-500" />
          </div>
          <div className="mt-3 text-2xl font-extrabold tracking-tight text-muted-foreground/80">{cancelledCount}</div>
          <p className="mt-1 text-xs text-muted-foreground">Cancelled subscriptions</p>
        </Card>

        <Card className="rounded-xl border bg-card p-4 shadow-xs transition-all hover:shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Refunded</span>
            <RotateCcwIcon className="size-4 text-purple-500" />
          </div>
          <div className="mt-3 text-2xl font-extrabold tracking-tight text-muted-foreground/80">{refundedCount}</div>
          <p className="mt-1 text-xs text-muted-foreground">Processed refund requests</p>
        </Card>
      </div>

      {/* ── Main Data Table Card ──────────────────────────────────────────── */}
      <Card className="rounded-xl border bg-card text-card-foreground shadow-xs overflow-hidden">
        <CardHeader className="gap-3 border-b bg-muted/20 px-6 py-4 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle className="text-base font-bold tracking-tight text-foreground">Subscription Ledger & History</CardTitle>
            <p className="mt-0.5 text-xs text-muted-foreground">Subscriber plans, analyst allocations, pricing, and renewal dates</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Status Filter Dropdown */}
            <div className="flex items-center gap-1.5 border rounded-md bg-background px-2 py-1">
              <FilterIcon className="size-3.5 text-muted-foreground" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="bg-transparent text-xs font-medium text-foreground focus:outline-hidden"
              >
                <option value="all">All Statuses</option>
                <option value="ACTIVE">ACTIVE</option>
                <option value="CANCELLED">CANCELLED</option>
                <option value="EXPIRED">EXPIRED</option>
                <option value="REFUNDED">REFUNDED</option>
              </select>
            </div>

            {/* Search Input */}
            <div className="relative w-full md:w-64">
              <SearchIcon className="absolute left-2.5 top-2.5 size-3.5 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search sub ID, user, analyst..."
                className="h-8 pl-8 text-xs"
              />
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30 hover:bg-muted/30">
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3">SUBSCRIPTION</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3">USER</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3">ANALYST & PLAN</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3">AMOUNT</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3">STATUS</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3">ENDS</TableHead>
                <TableHead className="w-28 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3">ACTIONS</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSubscriptions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-36 text-center text-xs text-muted-foreground">
                    <div className="flex flex-col items-center justify-center gap-2 py-4">
                      <ReceiptTextIcon className="size-8 text-muted-foreground/50" />
                      <p className="font-semibold text-muted-foreground">No subscription records to display</p>
                      <p className="text-[11px] text-muted-foreground/80 max-w-sm">
                        Use the &ldquo;Initiate Refund&rdquo; button above or connect backend routes to load subscription entries.
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredSubscriptions.map((sub) => {
                  const isActive = sub.status === "ACTIVE";
                  return (
                    <TableRow key={sub.subscription_id} className="transition-colors hover:bg-muted/40">
                      {/* SUBSCRIPTION */}
                      <TableCell className="py-3 text-xs">
                        <div>
                          <p className="font-semibold text-foreground font-mono">{sub.subscription_id}</p>
                          <p className="text-[11px] text-muted-foreground">{sub.plan_name}</p>
                        </div>
                      </TableCell>

                      {/* USER */}
                      <TableCell className="py-3 text-xs">
                        <div>
                          <p className="font-semibold text-foreground">{sub.user_name}</p>
                          <p className="text-[11px] text-muted-foreground">{sub.user_email}</p>
                        </div>
                      </TableCell>

                      {/* ANALYST & PLAN */}
                      <TableCell className="py-3 text-xs">
                        <div>
                          <p className="font-semibold text-foreground">{sub.analyst_name}</p>
                          <Badge variant="outline" className="text-[10px] font-mono mt-0.5">
                            {sub.plan_name}
                          </Badge>
                        </div>
                      </TableCell>

                      {/* AMOUNT */}
                      <TableCell className="py-3 text-xs font-bold text-foreground">
                        ₹{sub.amount.toLocaleString("en-IN")}
                      </TableCell>

                      {/* STATUS */}
                      <TableCell className="py-3 text-xs">
                        <Badge variant={statusVariant(sub.status)} className="font-semibold text-[10px] tracking-wide px-2 py-0.5">
                          {sub.status}
                        </Badge>
                      </TableCell>

                      {/* ENDS */}
                      <TableCell className="py-3 text-xs text-muted-foreground">
                        {sub.end_date ? new Date(sub.end_date).toLocaleDateString("en-IN") : "—"}
                      </TableCell>

                      {/* ACTIONS */}
                      <TableCell className="py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {isActive && (
                            <Gated power="PWR_SUBSCRIPTION_CANCEL_ALL">
                              <CancelSubscriptionDialog
                                subscriptionId={sub.subscription_id}
                                refresh={handleRefresh}
                                trigger={
                                  <Button
                                    size="icon-sm"
                                    variant="ghost"
                                    onClick={() => handleCancelSub(sub.subscription_id)}
                                    title="Cancel Subscription"
                                  >
                                    <BanIcon className="size-3.5 text-amber-600" />
                                  </Button>
                                }
                              />
                            </Gated>
                          )}

                          <Gated power="PWR_SUBSCRIPTION_REFUND">
                            <RefundSubscriptionDialog
                              subscriptionId={sub.subscription_id}
                              defaultAmount={sub.amount}
                              refresh={handleRefresh}
                              trigger={
                                <Button size="icon-sm" variant="ghost" title="Process Refund">
                                  <RotateCcwIcon className="size-3.5 text-purple-600" />
                                </Button>
                              }
                            />
                          </Gated>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>

          {/* Table Footer */}
          <div className="flex items-center justify-between border-t bg-muted/10 px-6 py-3 text-xs text-muted-foreground">
            <span>
              Showing {filteredSubscriptions.length} of {subscriptions.length} total subscriptions
            </span>
            <span className="font-mono text-[11px]">Subscription Ledger Active</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
