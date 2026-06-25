"use client";

import React, { useState, use } from "react";
import { Icon } from "@/components/stoxify-icon";
import { useAnalystCoupons } from "@/hooks/use-analyst-dashboard";
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

export default function BatchDiscountsPage({ params }: { params: Promise<{ plan_id: string }> }) {
  const { plan_id } = use(params);
  const { showSuccessToast } = useDashboard();
  const { coupons, isLoading, refetch } = useAnalystCoupons(plan_id);

  const [isTypeModalOpen, setIsTypeModalOpen] = useState(false);
  const [sidebarType, setSidebarType] = useState<"PERCENTAGE" | "FLAT" | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const handleCreateCouponClick = () => {
    setIsTypeModalOpen(true);
  };

  const handleSelectType = (type: "PERCENTAGE" | "FLAT") => {
    setIsTypeModalOpen(false);
    setSidebarType(type);
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
    } catch (err) {
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
    } catch (err) {
      showSuccessToast("Error", "Could not update coupon status.");
    }
  };

  const filteredCoupons = coupons.filter((c) =>
    c.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      <div className="flex-1 p-6 flex flex-col gap-6 overflow-y-auto">
        <div className="flex flex-col gap-1">
          <h1 className="text-[22px] font-black tracking-tight text-[var(--ink)]">Discounts</h1>
          <p className="text-[13px] text-[var(--muted-2)] font-medium">Manage discount coupons available for this batch.</p>
        </div>

        {/* Header Section */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 bg-white border border-[var(--line)] rounded-xl px-4 py-2 flex-1 max-w-md focus-within:ring-2 focus-within:ring-[var(--brand)]/20 focus-within:border-[var(--brand)] transition-all shadow-[0_1px_4px_rgba(0,0,0,0.03)]">
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
            className="flex items-center gap-1.5 rounded-full bg-black px-5 py-2.5 text-[12.5px] font-bold text-white hover:opacity-90 shadow-[0_2px_8px_rgba(0,0,0,0.15)] transition-opacity cursor-pointer"
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
          <div className="flex-1 flex flex-col items-center justify-center p-12 gap-4 mt-8 rounded-xl border border-[var(--line)] bg-white shadow-[0_1px_4px_rgba(0,0,0,0.03)]">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-slate-100 text-slate-300">
              <Icon className="h-10 w-10" name="ticket" />
            </div>
            <div className="text-center">
              <h3 className="text-[16px] font-extrabold text-[var(--ink)] tracking-tight">
                No coupons to show
              </h3>
              <p className="text-[13px] text-[var(--muted-2)] font-medium mt-1 max-w-sm">
                You haven't created any coupons for this batch yet.
              </p>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-[var(--line)] bg-white shadow-[0_1px_4px_rgba(0,0,0,0.04)] overflow-hidden flex flex-col">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-[var(--line)] bg-[var(--line-2)] text-[11px] font-bold text-[var(--muted-2)] uppercase tracking-[0.06em]">
                    <th className="px-6 py-4.5">Code</th>
                    <th className="px-6 py-4.5">Type</th>
                    <th className="px-6 py-4.5">Discount</th>
                    <th className="px-6 py-4.5">Usage</th>
                    <th className="px-6 py-4.5">Status</th>
                    <th className="px-6 py-4.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--line)] text-[13px] font-semibold text-[var(--ink)]">
                  {filteredCoupons.map((coupon) => (
                    <tr key={coupon.coupon_id} className="hover:bg-slate-50/40 transition-colors">
                      <td className="px-6 py-4 font-mono font-bold text-[var(--brand)]">
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
                      <td className="px-6 py-4 text-[var(--muted-2)] font-medium">
                        <span className="text-[var(--ink)] font-bold">{coupon.quantity_used}</span> / {coupon.quantity_total === null ? "∞" : coupon.quantity_total}
                      </td>
                      <td className="px-6 py-4">
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(coupon.coupon_id, coupon.is_active, coupon.code)}
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
                        <button
                          onClick={() => handleDeleteCoupon(coupon.coupon_id, coupon.code)}
                          className="p-1.5 rounded-lg border border-red-100 bg-white text-red-400 hover:text-red-600 hover:border-red-300 hover:bg-red-50/50 transition-all cursor-pointer"
                          title="Delete Coupon"
                        >
                          <Icon className="h-3.5 w-3.5" name="trash" />
                        </button>
                      </td>
                    </tr>
                  ))}
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
          onClose={() => setSidebarType(null)}
          onSave={refetch}
          showSuccessToast={showSuccessToast}
        />
      )}
    </>
  );
}
