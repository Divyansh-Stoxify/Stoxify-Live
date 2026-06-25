"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Topbar } from "@/components/dashboard/topbar";
import { MetricCard } from "@/components/dashboard/metric-card";
import { Icon } from "@/components/stoxify-icon";
import { useDashboard } from "@/components/dashboard/dashboard-context";
import { useSubscriptionPlans, useSubscriptionPlansStats } from "@/hooks/use-analyst-dashboard";
import type { SubscriptionPlan } from "@/lib/types/analyst";

// Helper to format currency in Indian numbering system (Lakh/Crore)
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

// Helper to get billing cycle labels
function getBillingLabel(cycle: string): string {
  switch (cycle) {
    case "WEEK":
      return "week";
    case "MONTH":
      return "month";
    case "QUARTER":
      return "quarter";
    case "YEAR":
      return "year";
    default:
      return "month";
  }
}

// Helper to get descriptive billing text
function getBillingDesc(cycle: string): string {
  switch (cycle) {
    case "WEEK":
      return "Billed every week";
    case "MONTH":
      return "Billed every month";
    case "QUARTER":
      return "Billed every 3 months";
    case "YEAR":
      return "Billed yearly";
    default:
      return "Billed every month";
  }
}



export default function SubscriptionPlansPage() {
  const router = useRouter();
  const { showSuccessToast } = useDashboard();

  // SWR hooks
  const { plans, isLoading: isPlansLoading, refetch: refetchPlans } = useSubscriptionPlans();
  const { stats, isLoading: isStatsLoading, refetch: refetchStats } = useSubscriptionPlansStats();

  // Toggle Plan status (Activate/Deactivate)
  const handleToggleStatus = async (planId: string, currentStatus: string, name: string) => {
    const isActive = currentStatus === "ACTIVE";
    const newIsActive = !isActive;

    try {
      const res = await fetch(`/api/analyst/plans/${planId}/status`, {
        method: "PATCH",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: newIsActive }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        showSuccessToast(
          "Toggle Failed",
          err.error ?? `Could not ${newIsActive ? "activate" : "deactivate"} "${name}".`
        );
        return;
      }

      if (newIsActive) {
        showSuccessToast(
          "Plan Activated",
          `"${name}" plan is now active and new subscribers can subscribe.`
        );
      } else {
        showSuccessToast(
          "Plan Deactivated",
          `"${name}" plan has been deactivated. Current subscribers remain active.`
        );
      }
    } catch {
      showSuccessToast("Network Error", `Unable to update "${name}" plan status.`);
    }

    // Re-fetch plans and stats
    refetchPlans();
    refetchStats();
  };

  const handleOpenCreateModal = () => {
    router.push("/dashboard/subscription-plans/create");
  };

  const handleOpenEditModal = (plan: SubscriptionPlan) => {
    router.push(`/dashboard/subscription-plans/${plan.plan_id}/edit`);
  };

  return (
    <>
      <Topbar title="Batches" showUserProfile={true} />

      <div className="flex-1 p-6 flex flex-col gap-6 overflow-y-auto">
        {/* ─── Metrics / KPIs Strip ─── */}
        <div className="grid grid-cols-3 gap-6 max-[860px]:grid-cols-1">
          {isStatsLoading || !stats ? (
            <>
              <div className="h-[120px] rounded-xl border border-[var(--line)] bg-white animate-pulse" />
              <div className="h-[120px] rounded-xl border border-[var(--line)] bg-white animate-pulse" />
              <div className="h-[120px] rounded-xl border border-[var(--line)] bg-white animate-pulse" />
            </>
          ) : stats ? (
            <>
              <MetricCard
                changeLabel="this month"
                changePct={undefined} // Real stats don't have mock changes
                icon="users"
                label="Total Subscribers"
                value={stats.total_subscribers.toString()}
              />
              <MetricCard
                changeLabel="this month"
                changePct={undefined} // Real stats don't have mock changes
                icon="rupee"
                label="Monthly Recurring Revenue"
                value={formatCurrency(stats.monthly_recurring_revenue)}
              />
              <MetricCard
                changeLabel={`Out of ${stats.total_plans_count} total plans`}
                icon="creditCard"
                label="Active Plans"
                value={stats.active_plans_count.toString()}
              />
            </>
          ) : null}
        </div>

        {/* ─── Manage Batches Section Header ─── */}
        <div className="flex items-center justify-between mt-2">
          <h2 className="text-[18px] font-bold text-[var(--ink)] tracking-tight">Manage Batches</h2>
          <button
            className="flex items-center gap-1.5 rounded-lg bg-[var(--brand)] px-4 py-2 text-[12.5px] font-bold text-white hover:bg-[var(--brand-dark)] shadow-md shadow-[var(--brand)]/15 transition-all cursor-pointer"
            onClick={handleOpenCreateModal}
          >
            <Icon className="h-3.5 w-3.5" name="plus" />
            <span>Create New Batch</span>
          </button>
        </div>

        {/* ─── Plans Grid ─── */}
        {isPlansLoading ? (
          <div className="grid grid-cols-3 gap-6 max-[1120px]:grid-cols-2 max-[768px]:grid-cols-1">
            <div className="h-[280px] rounded-xl border border-[var(--line)] bg-white animate-pulse" />
            <div className="h-[280px] rounded-xl border border-[var(--line)] bg-white animate-pulse" />
            <div className="h-[280px] rounded-xl border border-[var(--line)] bg-white animate-pulse" />
          </div>
        ) : plans.length === 0 ? (
          <div className="rounded-xl border border-[var(--line)] bg-white p-12 text-center text-[var(--muted-2)] text-[14px]">
            No batches found. Click &quot;Create New Batch&quot; to get started.
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-6 max-[1120px]:grid-cols-2 max-[768px]:grid-cols-1">
            {plans.map((plan: any) => {
              const isActive = plan.status === "ACTIVE";
              const estMonthlyRevenue = plan.est_monthly_revenue || 0;

              return (
                <div
                  key={plan.plan_id}
                  className="group relative flex flex-col rounded-2xl border border-[var(--line)] bg-white/80 backdrop-blur-md p-6 shadow-sm hover:shadow-[0_22px_40px_rgba(0,0,0,0.06)] hover:-translate-y-1 transition-all duration-300 overflow-hidden animate-[fadeIn_0.3s_ease-out]"
                >
                  {/* Decorative glowing gradient top border on active cards */}
                  {isActive && (
                    <div className="absolute top-0 left-0 right-0 h-[5px] bg-gradient-to-r from-violet-600 via-indigo-600 to-blue-500" />
                  )}

                  {/* Card Header: Title & Status Badge */}
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-[16px] font-extrabold text-[var(--ink)] tracking-tight leading-tight group-hover:text-[var(--brand)] transition-colors">
                        {plan.name}
                      </h3>
                      <p className="text-[12px] text-[var(--muted-2)] font-medium mt-0.5">
                        Batch
                      </p>
                    </div>
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10.5px] font-bold tracking-wide uppercase ${
                        isActive
                          ? "bg-[var(--green-light)] text-[var(--green)] border border-[var(--green)]/15"
                          : "bg-[var(--line)] text-[var(--muted)]"
                      }`}
                    >
                      {isActive ? (
                        <>
                          <span className="h-1.5 w-1.5 rounded-full bg-[var(--green)] animate-pulse" />
                          Active
                        </>
                      ) : (
                        "Inactive"
                      )}
                    </span>
                  </div>

                  {/* Batches Display */}
                  {plan.batches && plan.batches.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-1.5">
                      {plan.batches.map((b: any) => {
                        const isString = typeof b === "string";
                        const batchId = isString ? b : b.batch_id;
                        const batchName = isString ? b : b.name;
                        const isActive = isString ? true : b.is_active !== false;

                        return (
                          <span
                            key={batchId}
                            className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-bold shadow-[0_1px_2px_rgba(0,0,0,0.02)] transition-all cursor-default ${
                              isActive
                                ? "bg-[var(--brand-light)] border border-[var(--brand)]/10 text-[var(--brand)] hover:border-[var(--brand)]/30"
                                : "bg-slate-100 border border-slate-200 text-slate-400"
                            }`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full shadow-sm ${
                              isActive
                                ? "bg-[var(--brand)] shadow-[var(--brand)]/50"
                                : "bg-slate-300"
                            }`} />
                            <span>
                              {isString ? batchName : `${batchName} (${formatCurrency(b.price)}/${getBillingLabel(b.billing_cycle)})`}
                            </span>
                          </span>
                        );
                      })}
                    </div>
                  )}

                  {/* Manage Pricing Link */}
                  <div className="mt-4">
                    <a
                      href={`/dashboard/subscription-plans/${plan.plan_id}/overview`}
                      className="w-full flex items-center justify-center gap-1.5 rounded-xl border border-[var(--brand)]/20 bg-[var(--brand-light)] py-2.5 text-[12.5px] font-bold text-[var(--brand)] hover:bg-[var(--brand)]/10 hover:border-[var(--brand)]/40 shadow-sm transition-all active:scale-[0.98] text-center"
                    >
                      <Icon className="h-3.5 w-3.5 text-[var(--brand)]" name="layoutDashboard" />
                      <span>Manage Batch</span>
                    </a>
                  </div>

                  {/* Mini-Stats Grid */}
                  <div className="mt-5 grid grid-cols-2 gap-4 rounded-xl border border-dashed border-[var(--line)] p-4 bg-slate-50/20">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[10px] font-bold text-[var(--muted-2)] uppercase tracking-wider block">
                        Total Subscribers
                      </span>
                      <span className="text-[18px] font-black text-[var(--ink)] tracking-tight flex items-center gap-1.5">
                        <Icon className="h-4 w-4 text-[var(--brand)] opacity-80" name="users" />
                        {plan.subscribers_count}
                      </span>
                    </div>
                    <div className="flex flex-col gap-0.5 border-l border-[var(--line)] pl-4">
                      <span className="text-[10px] font-bold text-[var(--muted-2)] uppercase tracking-wider block">
                        Est. Revenue
                      </span>
                      <span className="text-[18px] font-black text-[var(--ink)] tracking-tight flex items-baseline gap-0.5">
                        <span className="text-emerald-600">{formatCurrency(estMonthlyRevenue)}</span>
                        <span className="text-[10.5px] font-semibold text-[var(--muted-2)] lowercase">/mo</span>
                      </span>
                    </div>
                  </div>

                  {/* Actions Row */}
                  <div className="flex items-center gap-3 mt-6">
                    <button
                      className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-[var(--line)] bg-white py-2.5 text-[12.5px] font-bold text-[var(--ink)] hover:bg-[var(--surface)] hover:border-slate-300 shadow-sm transition-all active:scale-[0.98] cursor-pointer"
                      onClick={() => handleOpenEditModal(plan)}
                    >
                      <Icon className="h-3.5 w-3.5 text-[var(--muted-2)]" name="edit" />
                      <span>Edit Details</span>
                    </button>

                    <button
                      className={`flex-1 flex items-center justify-center gap-1.5 rounded-xl border py-2.5 text-[12.5px] font-bold shadow-sm transition-all active:scale-[0.98] cursor-pointer ${
                        isActive
                          ? "border-red-200 bg-red-50/50 text-red-600 hover:bg-red-50 hover:border-red-300"
                          : "border-emerald-200 bg-emerald-50/50 text-emerald-600 hover:bg-emerald-50 hover:border-emerald-300"
                      }`}
                      onClick={() => handleToggleStatus(plan.plan_id, plan.status, plan.name)}
                    >
                      <Icon className="h-3.5 w-3.5" name={isActive ? "ban" : "power"} />
                      <span>{isActive ? "Deactivate" : "Activate"}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
