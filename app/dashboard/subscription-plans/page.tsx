"use client";

import React, { useState } from "react";
import { useSWRConfig } from "swr";
import { Topbar } from "@/app/components/dashboard/topbar";
import { MetricCard } from "@/app/components/dashboard/metric-card";
import { Icon } from "@/app/components/stoxify-icon";
import { useDashboard } from "@/app/components/dashboard/dashboard-context";
import { useSubscriptionPlans, useSubscriptionPlansStats } from "@/app/lib/hooks/use-plans";
import { updateMockPlanStatus } from "@/app/lib/mock-data";
import { PlanModal } from "@/app/components/dashboard/plan-modal";
import type { SubscriptionPlan } from "@/app/lib/types";

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

// Helper to compute monthly equivalent revenue
function computeMonthlyRevenue(plan: SubscriptionPlan): number {
  let monthlyPrice = plan.price;
  if (plan.billing_cycle === "QUARTER") {
    monthlyPrice = plan.price / 3;
  } else if (plan.billing_cycle === "YEAR") {
    monthlyPrice = plan.price / 12;
  } else if (plan.billing_cycle === "WEEK") {
    monthlyPrice = plan.price * 4;
  }
  return Math.round(monthlyPrice * plan.subscribers_count);
}

export default function SubscriptionPlansPage() {
  const { mutate } = useSWRConfig();
  const { showSuccessToast } = useDashboard();

  // SWR hooks
  const { plans, isLoading: isPlansLoading } = useSubscriptionPlans();
  const { stats, isLoading: isStatsLoading } = useSubscriptionPlansStats();

  // Modal control states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | undefined>(undefined);

  // Toggle Plan status (Activate/Deactivate)
  const handleToggleStatus = (planId: string, currentStatus: string, name: string) => {
    const newStatus = currentStatus === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    updateMockPlanStatus(planId, newStatus);

    if (newStatus === "ACTIVE") {
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

    // Mutate SWR keys to re-fetch and update UI components
    mutate("/subscriptions/analyst/plans");
    mutate("/subscriptions/analyst/plans/stats");
  };

  const handleOpenCreateModal = () => {
    setSelectedPlan(undefined);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (plan: SubscriptionPlan) => {
    setSelectedPlan(plan);
    setIsModalOpen(true);
  };

  const handleModalSave = (title: string, message: string) => {
    showSuccessToast(title, message);
    mutate("/subscriptions/analyst/plans");
    mutate("/subscriptions/analyst/plans/stats");
  };

  return (
    <>
      <Topbar title="Subscription Plans" showUserProfile={true} />

      <div className="flex-1 p-6 flex flex-col gap-6 overflow-y-auto">
        {/* ─── Metrics / KPIs Strip ─── */}
        <div className="grid grid-cols-3 gap-6 max-[860px]:grid-cols-1">
          {isStatsLoading ? (
            <>
              <div className="h-[120px] rounded-xl border border-[var(--line)] bg-white animate-pulse" />
              <div className="h-[120px] rounded-xl border border-[var(--line)] bg-white animate-pulse" />
              <div className="h-[120px] rounded-xl border border-[var(--line)] bg-white animate-pulse" />
            </>
          ) : (
            <>
              <MetricCard
                changeLabel="this month"
                changePct={12} // +12 subscribers represented as positive direction trend
                icon="users"
                label="Total Subscribers"
                value={stats.total_subscribers.toString()}
              />
              <MetricCard
                changeLabel="this month"
                changePct={5.2}
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
          )}
        </div>

        {/* ─── Manage Plans Section Header ─── */}
        <div className="flex items-center justify-between mt-2">
          <h2 className="text-[18px] font-bold text-[var(--ink)] tracking-tight">Manage Plans</h2>
          <button
            className="flex items-center gap-1.5 rounded-lg bg-[var(--brand)] px-4 py-2 text-[12.5px] font-bold text-white hover:bg-[var(--brand-dark)] shadow-md shadow-[var(--brand)]/15 transition-all cursor-pointer"
            onClick={handleOpenCreateModal}
          >
            <Icon className="h-3.5 w-3.5" name="plus" />
            <span>Create New Plan</span>
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
            No subscription plans found. Click &quot;Create New Plan&quot; to get started.
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-6 max-[1120px]:grid-cols-2 max-[768px]:grid-cols-1">
            {plans.map((plan) => {
              const isActive = plan.status === "ACTIVE";
              const estMonthlyRevenue = computeMonthlyRevenue(plan);

              return (
                <div
                  key={plan.plan_id}
                  className="flex flex-col rounded-xl border border-[var(--line)] bg-white p-5 shadow-[0_1px_4px_rgba(0,0,0,0.03)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.06)] transition-all"
                >
                  {/* Card Header: Title & Status Badge */}
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-[15px] font-bold text-[var(--ink)] leading-tight">
                        {plan.name}
                      </h3>
                      <p className="text-[11.5px] text-[var(--muted-2)] mt-0.5">
                        {getBillingDesc(plan.billing_cycle)}
                      </p>
                    </div>
                    <span
                      className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10.5px] font-bold ${
                        isActive
                          ? "bg-[var(--green-light)] text-[var(--green)]"
                          : "bg-[var(--line)] text-[var(--muted)]"
                      }`}
                    >
                      {isActive ? "Active" : "Inactive"}
                    </span>
                  </div>

                  {/* Pricing Display */}
                  <div className="mt-4 flex items-baseline gap-1">
                    <span className="text-[26px] font-extrabold text-[var(--ink)] tracking-tight">
                      {formatCurrency(plan.price)}
                    </span>
                    <span className="text-[12px] font-medium text-[var(--muted)]">
                      / {getBillingLabel(plan.billing_cycle)}
                    </span>
                  </div>

                  {/* Divider */}
                  <div className="my-4.5 border-t border-[var(--line)]" />

                  {/* Mini-Stats Grid */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-[10px] font-bold text-[var(--muted-2)] uppercase tracking-wider block">
                        Subscribers
                      </span>
                      <span className="text-[15px] font-extrabold text-[var(--ink)] mt-1 block">
                        {plan.subscribers_count}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-[var(--muted-2)] uppercase tracking-wider block">
                        Est. Revenue
                      </span>
                      <span className="text-[15px] font-extrabold text-[var(--ink)] mt-1 block">
                        {formatCurrency(estMonthlyRevenue)}/mo
                      </span>
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="my-4.5 border-t border-[var(--line)]" />

                  {/* Actions Row */}
                  <div className="flex items-center gap-3 mt-auto">
                    {/* Edit button */}
                    <button
                      className="flex-1 flex items-center justify-center gap-1.5 rounded-lg border border-[var(--line)] bg-white py-2 text-[12.5px] font-bold text-[var(--ink)] hover:bg-[var(--surface)] transition-all cursor-pointer"
                      onClick={() => handleOpenEditModal(plan)}
                    >
                      <Icon className="h-3.5 w-3.5 text-[var(--muted-2)]" name="edit" />
                      <span>Edit</span>
                    </button>

                    {/* Toggle Activation status */}
                    <button
                      className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg border py-2 text-[12.5px] font-bold transition-all cursor-pointer ${
                        isActive
                          ? "border-[var(--orange)]/35 text-[var(--orange)] hover:bg-[var(--orange)]/5"
                          : "border-[var(--green)]/35 text-[var(--green)] hover:bg-[var(--green)]/5"
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

      {/* Plan creation / editing modal overlay */}
      {isModalOpen && (
        <PlanModal
          plan={selectedPlan}
          onClose={() => setIsModalOpen(false)}
          onSave={handleModalSave}
        />
      )}
    </>
  );
}
