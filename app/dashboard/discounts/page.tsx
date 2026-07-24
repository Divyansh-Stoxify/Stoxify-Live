"use client";

import React, { useState } from "react";
import { Topbar } from "@/components/dashboard/topbar";
import { Icon } from "@/components/stoxify-icon";
import { useAnalystCoupons, useSubscriptionPlans, Coupon } from "@/hooks/use-analyst-dashboard";
import { useDashboard } from "@/components/dashboard/dashboard-context";
import { CreateCouponModal } from "@/components/dashboard/coupons/CreateCouponModal";
import { CreateCouponSidebar } from "@/components/dashboard/coupons/CreateCouponSidebar";

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function DiscountsPage() {
  const { showSuccessToast } = useDashboard();
  const { coupons, isLoading, refetch } = useAnalystCoupons();
  const { plans } = useSubscriptionPlans();

  const [isTypeModalOpen, setIsTypeModalOpen] = useState(false);
  const [sidebarType, setSidebarType] = useState<"PERCENTAGE" | "FLAT" | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [expandedCouponId, setExpandedCouponId] = useState<string | null>(null);

  const handleCreateCouponClick = () => {
    setIsTypeModalOpen(true);
  };

  const handleSelectType = (type: "PERCENTAGE" | "FLAT") => {
    setIsTypeModalOpen(false);
    setEditingCoupon(null);
    setSidebarType(type);
  };

  const handleEditCoupon = (coupon: Coupon) => {
    setEditingCoupon(coupon);
    setSidebarType(coupon.type);
  };

  const handleDeleteCoupon = async (coupon_id: string, code: string) => {
    if (!confirm(`Are you sure you want to delete coupon ${code}?`)) return;
    try {
      const res = await fetch(`/api/analyst/plans/coupons/${coupon_id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete coupon");
      showSuccessToast("Coupon Deleted", `Coupon ${code} has been deleted.`);
      refetch();
    } catch {
      showSuccessToast("Error", "Could not delete coupon.");
    }
  };

  const handleToggleStatus = async (coupon_id: string, currentStatus: boolean, code: string) => {
    try {
      const res = await fetch(`/api/analyst/plans/coupons/${coupon_id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: !currentStatus }),
      });
      if (!res.ok) throw new Error("Failed to update status");
      showSuccessToast(
        "Status Updated",
        `Coupon ${code} is now ${!currentStatus ? "active" : "inactive"}.`
      );
      refetch();
    } catch {
      showSuccessToast("Error", "Could not update coupon status.");
    }
  };

  const filteredCoupons = coupons.filter((c) =>
    (c.code || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  const calculateDiscPrice = (price: number, coupon: Coupon) => {
    if (coupon.type === "PERCENTAGE") {
      const disc = price - (price * coupon.discount_value) / 100;
      return Math.max(0, disc);
    } else {
      return Math.max(0, price - coupon.discount_value);
    }
  };

  // Helper to resolve plan_ids to full batch details
  const resolveBatchDetails = (coupon: Coupon) => {
    const planIds = coupon.plan_ids || [];
    const appliesToAll = planIds.length === 0;

    const batchNames: string[] = [];
    const pricingNames: string[] = [];
    const resolvedBatches: Array<{ planName: string; batch: any }> = [];
    const seenBatchIds = new Set<string>();

    for (const id of planIds) {
      if (id.startsWith("PLAN_")) {
        const plan = plans.find((p) => p.plan_id === id);
        if (plan) {
          batchNames.push(plan.name);
          if (plan.batches) {
            plan.batches.forEach((b: any) => {
              if (!seenBatchIds.has(b.batch_id)) {
                seenBatchIds.add(b.batch_id);
                resolvedBatches.push({ planName: plan.name, batch: b });
              }
            });
          }
        }
      } else if (id.startsWith("batch_")) {
        for (const plan of plans) {
          const batch = (plan.batches || []).find((b: any) => b.batch_id === id);
          if (batch) {
            pricingNames.push(`${batch.name} (${plan.name})`);
            if (!seenBatchIds.has(id)) {
              seenBatchIds.add(id);
              resolvedBatches.push({ planName: plan.name, batch });
            }
            break;
          }
        }
      }
    }

    return { appliesToAll, batchNames, pricingNames, resolvedBatches };
  };

  return (
    <>
      <Topbar title="Discount Coupons" showUserProfile={true} />

      <div className="flex-1 p-6 flex flex-col gap-6 overflow-y-auto bg-[var(--surface)]">
        {/* Header Section */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 bg-white border border-[var(--line)] rounded-xl px-4 py-2 flex-1 max-w-md focus-within:ring-2 focus-within:ring-[var(--brand)]/20 focus-within:border-[var(--brand)] transition-all">
            <Icon className="h-4 w-4 text-[var(--muted)]" name="search" />
            <input
              type="text"
              placeholder="Search coupons..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-[13px] font-semibold text-[var(--ink)] outline-none placeholder:text-[var(--muted)] bg-transparent"
            />
          </div>
          <button
            onClick={handleCreateCouponClick}
            className="flex items-center gap-1.5 rounded-full bg-black px-5 py-2.5 text-[12.5px] font-bold text-white hover:opacity-90 shadow-md transition-opacity cursor-pointer"
          >
            <Icon className="h-3.5 w-3.5" name="plus" />
            <span>Create Coupon</span>
          </button>
        </div>

        {/* Content Section */}
        {isLoading ? (
          <div className="flex-1 flex flex-col items-center justify-center p-12 gap-3">
            <Icon className="h-8 w-8 text-[var(--muted)] animate-spin" name="loader" />
          </div>
        ) : filteredCoupons.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-12 gap-4 mt-12">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-slate-100 text-slate-300">
              <Icon className="h-10 w-10" name="ticket" />
            </div>
            <div className="text-center">
              <h3 className="text-[16px] font-extrabold text-[var(--ink)] tracking-tight">
                No coupons to show
              </h3>
              <p className="text-[13px] text-[var(--muted-2)] font-medium mt-1 max-w-sm">
                You can create and manage all your coupons on this page. Learn more about coupons{" "}
                <a href="#" className="underline text-[var(--brand)]">
                  here
                </a>
                .
              </p>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-[var(--line)] bg-white shadow-sm overflow-hidden flex flex-col">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-[var(--line)] bg-slate-50/30 text-[11px] font-extrabold text-[var(--muted)] uppercase tracking-wider">
                    <th className="px-6 py-4">Code</th>
                    <th className="px-6 py-4">Type</th>
                    <th className="px-6 py-4">Discount</th>
                    <th className="px-6 py-4">Batches</th>
                    <th className="px-6 py-4">Plans</th>
                    <th className="px-6 py-4">Usage</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--line)] text-[13px] font-semibold text-[var(--ink)]">
                  {filteredCoupons.map((coupon) => {
                    const { appliesToAll, batchNames, pricingNames, resolvedBatches } = resolveBatchDetails(coupon);
                    const isExpanded = expandedCouponId === coupon.coupon_id;
                    return (
                      <React.Fragment key={coupon.coupon_id}>
                      <tr
                        onClick={() => setExpandedCouponId(isExpanded ? null : coupon.coupon_id)}
                        className="hover:bg-slate-50 cursor-pointer transition-colors"
                      >
                        <td className="px-6 py-4 font-mono font-bold text-[var(--brand)] flex items-center gap-2">
                          <Icon
                            name="chevronDown"
                            className={`w-4 h-4 text-[var(--muted)] transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}
                          />
                          {coupon.code}
                        </td>
                        <td className="px-6 py-4">
                          <span className="rounded-lg bg-slate-100 border border-slate-200 px-2 py-0.5 text-[11px] text-slate-600 font-bold uppercase">
                            {coupon.type}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {coupon.type === "PERCENTAGE"
                            ? `${coupon.discount_value}%`
                            : formatCurrency(coupon.discount_value)}
                        </td>
                        <td className="px-6 py-4">
                          {batchNames.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {batchNames.map((name, i) => (
                                <span
                                  key={i}
                                  className="inline-flex items-center rounded-full bg-blue-50 border border-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-600"
                                >
                                  {name}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-[11px] text-[var(--muted)] font-medium italic">
                              All
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          {pricingNames.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {pricingNames.map((name, i) => (
                                <span
                                  key={i}
                                  className="inline-flex items-center rounded-full bg-violet-50 border border-violet-100 px-2 py-0.5 text-[10px] font-bold text-violet-600"
                                >
                                  {name}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-[11px] text-[var(--muted)] font-medium italic">
                              All
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          {coupon.quantity_used} /{" "}
                          {coupon.quantity_total === null ? "∞" : coupon.quantity_total}
                        </td>
                        <td className="px-6 py-4">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleStatus(coupon.coupon_id, coupon.is_active, coupon.code);
                            }}
                            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold tracking-wide uppercase cursor-pointer hover:opacity-85 transition-opacity ${
                              coupon.is_active
                                ? "bg-[var(--green-light)] text-[var(--green)] border border-[var(--green)]/15"
                                : "bg-slate-100 text-slate-400 border border-slate-200"
                            }`}
                          >
                            {coupon.is_active ? "Active" : "Inactive"}
                          </button>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={(e) => { e.stopPropagation(); handleEditCoupon(coupon); }}
                              className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-400 hover:text-[var(--brand)] hover:border-[var(--brand)]/30 hover:bg-[var(--brand)]/5 transition-all cursor-pointer"
                              title="Edit Coupon"
                            >
                              <Icon className="h-3.5 w-3.5" name="edit" />
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); handleDeleteCoupon(coupon.coupon_id, coupon.code); }}
                              className="p-1.5 rounded-lg border border-red-100 bg-white text-red-400 hover:text-red-600 hover:border-red-300 hover:bg-red-50/50 transition-all cursor-pointer"
                              title="Delete Coupon"
                            >
                              <Icon className="h-3.5 w-3.5" name="trash" />
                            </button>
                          </div>
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr className="bg-slate-50/80 border-b border-[var(--line)]">
                          <td colSpan={8} className="p-6">
                            {/* Section A: Metadata Grid */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                              <div className="bg-white p-3 rounded-xl border border-[var(--line)] shadow-sm">
                                <p className="text-[10px] uppercase font-extrabold text-[var(--muted)] mb-1">Valid Dates (IST)</p>
                                <p className="text-[13px] font-bold text-[var(--ink)]">
                                  {coupon.valid_from ? new Date(coupon.valid_from).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' }) : "Always"} -
                                  {" "}{coupon.valid_to ? new Date(coupon.valid_to).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' }) : "Never Expires"}
                                </p>
                              </div>
                              <div className="bg-white p-3 rounded-xl border border-[var(--line)] shadow-sm">
                                <p className="text-[10px] uppercase font-extrabold text-[var(--muted)] mb-1">Availability & Limits</p>
                                <p className="text-[13px] font-bold text-[var(--ink)]">
                                  {coupon.availability.replace('_', ' ')} • Limit:
                                  {" "}{coupon.quantity_total === null ? "Unlimited" : coupon.quantity_total}
                                </p>
                              </div>
                              <div className="bg-white p-3 rounded-xl border border-[var(--line)] shadow-sm">
                                <p className="text-[10px] uppercase font-extrabold text-[var(--muted)] mb-1">Stackable & Case</p>
                                <p className="text-[13px] font-bold text-[var(--ink)]">
                                  Case Insensitive: {coupon.is_case_insensitive ? "Yes" : "No"}
                                </p>
                              </div>
                              <div className="bg-white p-3 rounded-xl border border-[var(--line)] shadow-sm">
                                <p className="text-[10px] uppercase font-extrabold text-[var(--muted)] mb-1">Created At (IST)</p>
                                <p className="text-[13px] font-bold text-[var(--ink)]">
                                  {new Date(coupon.created_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
                                </p>
                              </div>
                            </div>

                            {/* Section B: Batches Table */}
                            <div>
                              <h4 className="text-[12px] font-extrabold text-[var(--ink)] uppercase mb-3 flex items-center gap-2">
                                <Icon name="list" className="w-4 h-4 text-[var(--muted)]" />
                                Associated Batches
                              </h4>
                              {appliesToAll ? (
                                <div className="bg-white p-4 rounded-xl border border-[var(--line)] text-[13px] font-semibold text-[var(--muted-2)]">
                                  Applies to all active batches.
                                </div>
                              ) : resolvedBatches.length === 0 ? (
                                <div className="bg-white p-4 rounded-xl border border-[var(--line)] text-[13px] font-semibold text-[var(--muted-2)] text-red-500">
                                  No valid active batches found.
                                </div>
                              ) : (
                                <div className="bg-white border border-[var(--line)] rounded-xl overflow-x-auto max-h-64 overflow-y-auto">
                                  <table className="w-full text-left border-collapse">
                                    <thead className="sticky top-0 bg-slate-50 border-b border-[var(--line)]">
                                      <tr className="text-[10px] font-extrabold text-[var(--muted)] uppercase tracking-wider">
                                        <th className="px-4 py-3">Plan Name</th>
                                        <th className="px-4 py-3">Batch Name</th>
                                        <th className="px-4 py-3">Price</th>
                                        <th className="px-4 py-3">Disc. Price (INR)</th>
                                        <th className="px-4 py-3">Cycle</th>
                                        <th className="px-4 py-3">Days</th>
                                        <th className="px-4 py-3">Active</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[var(--line)] text-[12px] font-semibold text-[var(--ink)]">
                                      {resolvedBatches.map((b, idx) => {
                                        const discPrice = calculateDiscPrice(b.batch.price, coupon);
                                        return (
                                          <tr key={idx} className="hover:bg-slate-50/50">
                                            <td className="px-4 py-2.5">{b.planName}</td>
                                            <td className="px-4 py-2.5">{b.batch.name}</td>
                                            <td className="px-4 py-2.5 line-through text-[var(--muted)]">
                                              {formatCurrency(b.batch.price)}
                                            </td>
                                            <td className="px-4 py-2.5 text-[var(--green)] font-bold">
                                              {formatCurrency(discPrice)}
                                            </td>
                                            <td className="px-4 py-2.5">{b.batch.billing_cycle}</td>
                                            <td className="px-4 py-2.5">{b.batch.days}</td>
                                            <td className="px-4 py-2.5">
                                              {b.batch.is_active !== false ? "✅" : "❌"}
                                            </td>
                                          </tr>
                                        );
                                      })}
                                    </tbody>
                                  </table>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {isTypeModalOpen && (
        <CreateCouponModal
          onClose={() => setIsTypeModalOpen(false)}
          onSelectType={handleSelectType}
        />
      )}

      {sidebarType && (
        <CreateCouponSidebar
          type={sidebarType}
          onClose={() => {
            setSidebarType(null);
            setEditingCoupon(null);
          }}
          onSave={refetch}
          showSuccessToast={showSuccessToast}
          editCoupon={editingCoupon}
        />
      )}
    </>
  );
}
