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
                label="Revenue Collected"
                value={formatCurrency(stats.monthly_recurring_revenue)}
              />
              <MetricCard
                changeLabel={`Out of ${stats.total_plans_count} total batches`}
                icon="creditCard"
                label="Active Batches"
                value={stats.active_plans_count.toString()}
              />
            </>
          ) : null}
        </div>

        {/* ─── Manage Plans Section Header ─── */}
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
                  className="group relative flex flex-col rounded-2xl border border-slate-100 bg-white p-5 shadow-[0_2px_8px_rgba(0,0,0,0.02)] hover:border-blue-500/20 hover:shadow-[0_20px_40px_rgba(31,122,224,0.06)] hover:-translate-y-1 transition-all duration-300 overflow-hidden animate-[fadeIn_0.3s_ease-out]"
                >
                  {/* Decorative glowing gradient top border on active cards */}
                  {isActive && (
                    <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-blue-500 via-indigo-500 to-violet-500" />
                  )}

                  {/* Card Header: Title & Status Badge */}
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-[16px] font-bold text-slate-900 tracking-tight leading-tight group-hover:text-[var(--brand)] transition-colors">
                        {plan.name}
                      </h3>
                      <p className="text-[12px] text-slate-400 font-medium mt-0.5">Subscription Batch</p>
                    </div>
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10.5px] font-bold tracking-wide uppercase border ${
                        isActive
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200/40"
                          : "bg-slate-100 text-slate-500 border-slate-200/50"
                      }`}
                    >
                      {isActive ? (
                        <>
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          Active
                        </>
                      ) : (
                        "Inactive"
                      )}
                    </span>
                  </div>

                  {/* Batches Display */}
                  {plan.batches && plan.batches.length > 0 && (
                    <div className="mt-4 space-y-2">
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Pricing Tiers
                      </div>
                      <div className="space-y-1.5">
                        {plan.batches.map((b: any) => {
                          const isString = typeof b === "string";
                          const batchId = isString ? b : b.batch_id;
                          const batchName = isString ? b : b.name;
                          const isActive = isString ? true : b.is_active !== false;

                          return (
                            <div
                              key={batchId}
                              className={`flex items-center justify-between rounded-xl px-3 py-2 text-[12px] font-semibold border ${
                                isActive
                                  ? "bg-slate-50/50 border-slate-100 text-slate-700"
                                  : "bg-slate-50/20 border-dashed border-slate-200 text-slate-400"
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <span
                                  className={`w-1.5 h-1.5 rounded-full ${
                                    isActive
                                      ? "bg-[var(--brand)] shadow-[0_0_8px_var(--brand)]"
                                      : "bg-slate-300"
                                  }`}
                                />
                                <span>{batchName}</span>
                              </div>
                              {!isString && (
                                <span className="font-bold text-slate-900">
                                  {formatCurrency(b.price)}
                                  <span className="text-[10px] font-normal text-slate-400">
                                    /{getBillingLabel(b.billing_cycle)}
                                  </span>
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Mini-Stats Grid */}
                  <div className="mt-5 grid grid-cols-2 gap-0 divide-x divide-slate-100 rounded-xl border border-slate-100 bg-slate-50/40 py-3.5">
                    <div className="flex flex-col items-center justify-center">
                      <span className="text-[9.5px] font-bold text-slate-400 uppercase tracking-wider">
                        Subscribers
                      </span>
                      <span className="text-[18px] font-extrabold text-slate-900 tracking-tight mt-1 flex items-center gap-1.5">
                        <Icon className="h-3.5 w-3.5 text-blue-500" name="users" />
                        {plan.subscribers_count}
                      </span>
                    </div>

                    <div className="flex flex-col items-center justify-center">
                      <span className="text-[9.5px] font-bold text-slate-400 uppercase tracking-wider">
                        Revenue Collected
                      </span>
                      <span className="text-[18px] font-extrabold text-emerald-600 tracking-tight mt-1">
                        {formatCurrency(estMonthlyRevenue)}
                      </span>
                    </div>
                  </div>

                  {/* Actions Row */}
                  <div className="flex items-center gap-2 mt-5">
                    <button
                      className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white py-2.5 text-[12.5px] font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-300 shadow-sm transition-all active:scale-[0.98] cursor-pointer"
                      onClick={() => handleOpenEditModal(plan)}
                    >
                      <Icon className="h-3.5 w-3.5 text-slate-400" name="edit" />
                      <span>Edit</span>
                    </button>

                    <a
                      href={`/dashboard/subscription-plans/${plan.plan_id}/overview`}
                      className="flex-[2] flex items-center justify-center gap-1.5 rounded-xl bg-[var(--brand)] py-2.5 text-[12.5px] font-bold text-white hover:bg-[var(--brand-dark)] shadow-sm hover:shadow-[0_4px_12px_rgba(31,122,224,0.2)] transition-all active:scale-[0.98] text-center"
                    >
                      <Icon className="h-3.5 w-3.5 text-white" name="layoutDashboard" />
                      <span>Manage Batch</span>
                    </a>
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
