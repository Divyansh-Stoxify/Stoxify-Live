"use client";

import React, { useState } from "react";
import { Icon } from "@/components/stoxify-icon";
import type { SubscriptionPlan, PlanBillingCycle, PlanStatus } from "@/lib/types/analyst";

interface PlanModalProps {
  plan?: SubscriptionPlan; // If provided, we are editing this plan
  onClose: () => void;
  onSave: (title: string, message: string) => void; // Success notification callback
}

/**
 * PLAN CREATION / EDIT MODAL
 *
 * An overlay modal designed to look premium, matching the Create Trade modal design.
 * Features inline input validation and handles updating the mock storage.
 */
export function PlanModal({ plan, onClose, onSave }: PlanModalProps) {
  const isEditMode = !!plan;

  // Form states
  const [name, setName] = useState(plan?.name ?? "");
  const [price, setPrice] = useState(plan?.price?.toString() ?? "");
  const [billingCycle, setBillingCycle] = useState<PlanBillingCycle>(
    plan?.billing_cycle ?? "MONTH"
  );
  const [status, setStatus] = useState<PlanStatus>(plan?.status ?? "ACTIVE");
  // Batches are managed separately via the full page batch editor.

  // Error state
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!name.trim()) {
      newErrors.name = "Plan name is required";
    }

    const priceNum = parseFloat(price);
    if (isNaN(priceNum) || priceNum <= 0) {
      newErrors.price = "Enter a valid price greater than 0";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    let days = 30;
    if (billingCycle === "WEEK") days = 7;
    else if (billingCycle === "QUARTER") days = 90;
    else if (billingCycle === "YEAR") days = 365;

    try {
      if (isEditMode && plan) {
        const res = await fetch(`/api/analyst/plans/${plan.plan_id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: name.trim(),
            days,
            price: parseFloat(price),
          }),
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          setErrors({ form: data.error ?? "Failed to update plan" });
          return;
        }

        onSave(
          "Plan Updated Successfully",
          `"${name.trim()}" subscription plan has been modified.`
        );
      } else {
        const res = await fetch("/api/analyst/plans", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: name.trim(),
            description: "",
            days,
            price: parseFloat(price),
            segment: "EQUITY",
            features: [],
            is_active: status === "ACTIVE",
            batches: [], // initialized empty, managed via full-page batches manager
          }),
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          setErrors({ form: data.error ?? "Failed to create plan" });
          return;
        }

        onSave(
          "Plan Created Successfully",
          `New plan "${name.trim()}" has been created and is now available.`
        );
      }
      onClose();
    } catch {
      setErrors({ form: "Unable to reach the server. Please try again." });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9990] flex items-center justify-center bg-black/45 backdrop-blur-[2px] p-4 animate-[fadeIn_0.2s_ease-out]">
      <div className="w-full max-w-[480px] rounded-2xl bg-white border border-[var(--line)] shadow-2xl p-6 relative flex flex-col gap-4">
        {/* Close Button */}
        <button
          aria-label="Close modal"
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full text-[var(--muted-2)] transition-colors hover:bg-[var(--surface)] hover:text-[var(--ink)]"
          onClick={onClose}
          type="button"
        >
          <Icon className="h-4 w-4" name="x" />
        </button>

        {/* Modal Header */}
        <div>
          <h2 className="text-[18px] font-bold text-[var(--ink)] tracking-tight">
            {isEditMode ? "Edit Subscription Plan" : "Create New Subscription Plan"}
          </h2>
          <p className="text-[12px] text-[var(--muted)] mt-1">
            Configure pricing, billing intervals, and status for your subscriber tiers.
          </p>
        </div>

        {/* Form Body */}
        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          {errors.form && (
            <div className="flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 px-3.5 py-3 text-[13px] text-red-700">
              <Icon className="mt-0.5 h-4 w-4 shrink-0" name="x" />
              <span>{errors.form}</span>
            </div>
          )}
          {/* Plan Name */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-extrabold text-[var(--muted)] uppercase tracking-wider">
              Plan Name
            </label>
            <input
              className={`w-full rounded-xl border bg-[var(--surface)] px-4 py-2.5 text-[13.5px] font-semibold text-[var(--ink)] outline-none transition-all focus:border-[var(--brand)] focus:bg-white focus:ring-2 focus:ring-[var(--brand)]/10 ${
                errors.name
                  ? "border-[var(--red)] focus:border-[var(--red)] focus:ring-[var(--red)]/10"
                  : "border-[var(--line)]"
              }`}
              placeholder="e.g. Monthly Pro, Annual Premium"
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (errors.name) setErrors((prev) => ({ ...prev, name: "" }));
              }}
            />
            {errors.name && (
              <span className="text-[11px] font-bold text-[var(--red)] mt-0.5">{errors.name}</span>
            )}
          </div>

          {/* Pricing */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-extrabold text-[var(--muted)] uppercase tracking-wider">
              Price (INR)
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[15px] font-bold text-[var(--muted)]">
                ₹
              </span>
              <input
                className={`w-full rounded-xl border bg-[var(--surface)] pl-9 pr-4 py-2.5 text-[13.5px] font-bold text-[var(--ink)] outline-none transition-all focus:border-[var(--brand)] focus:bg-white focus:ring-2 focus:ring-[var(--brand)]/10 ${
                  errors.price
                    ? "border-[var(--red)] focus:border-[var(--red)] focus:ring-[var(--red)]/10"
                    : "border-[var(--line)]"
                }`}
                placeholder="e.g. 2500"
                type="number"
                value={price}
                onChange={(e) => {
                  setPrice(e.target.value);
                  if (errors.price) setErrors((prev) => ({ ...prev, price: "" }));
                }}
              />
            </div>
            {errors.price && (
              <span className="text-[11px] font-bold text-[var(--red)] mt-0.5">{errors.price}</span>
            )}
          </div>

          {/* Grid: Billing Cycle & Status */}
          <div className="grid grid-cols-2 gap-4">
            {/* Billing Cycle */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-extrabold text-[var(--muted)] uppercase tracking-wider">
                Billing Cycle
              </label>
              <select
                className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface)] px-4 py-2.5 text-[13.5px] font-bold text-[var(--ink)] outline-none focus:border-[var(--brand)] focus:bg-white focus:ring-2 focus:ring-[var(--brand)]/10"
                value={billingCycle}
                onChange={(e) => setBillingCycle(e.target.value as PlanBillingCycle)}
              >
                <option value="WEEK">Weekly</option>
                <option value="MONTH">Monthly</option>
                <option value="QUARTER">Quarterly</option>
                <option value="YEAR">Yearly</option>
              </select>
            </div>

            {/* Status */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-extrabold text-[var(--muted)] uppercase tracking-wider">
                Status
              </label>
              <select
                className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface)] px-4 py-2.5 text-[13.5px] font-bold text-[var(--ink)] outline-none focus:border-[var(--brand)] focus:bg-white focus:ring-2 focus:ring-[var(--brand)]/10"
                value={status}
                onChange={(e) => setStatus(e.target.value as PlanStatus)}
              >
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </div>
          </div>

          {/* Batches are managed separately via the full page batch editor */}

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 mt-4 pt-4 border-t border-[var(--line)]">
            <button
              className="rounded-xl border border-[var(--line)] bg-white px-5 py-2.5 text-[13px] font-bold text-[var(--muted)] hover:bg-[var(--surface)] hover:text-[var(--ink)] transition-all active:scale-[0.98] cursor-pointer"
              onClick={onClose}
              type="button"
            >
              Cancel
            </button>
            <button
              className="flex items-center justify-center gap-1.5 rounded-xl bg-[var(--brand)] px-6 py-2.5 text-[13px] font-bold text-white hover:bg-[var(--brand-dark)] shadow-md shadow-[var(--brand)]/15 transition-all active:scale-[0.98] cursor-pointer disabled:opacity-50"
              disabled={isSubmitting}
              type="submit"
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  <span>Saving...</span>
                </>
              ) : (
                <span>{isEditMode ? "Save Changes" : "Create Plan"}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
