"use client";

import React, { useState } from "react";
import { Icon } from "@/app/components/stoxify-icon";
import { createMockPlan, updateMockPlan } from "@/app/lib/mock-data";
import type { SubscriptionPlan, PlanBillingCycle, PlanStatus } from "@/app/lib/types";

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

  // Error state
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
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

    // Simulate small latency for premium feel
    setTimeout(() => {
      const planData = {
        name: name.trim(),
        price: parseFloat(price),
        billing_cycle: billingCycle,
        status,
        subscribers_count: plan?.subscribers_count ?? 0, // Retain subscribers or start at 0
      };

      if (isEditMode && plan) {
        updateMockPlan(plan.plan_id, planData);
        onSave(
          "Plan Updated Successfully",
          `"${name.trim()}" subscription plan has been modified.`
        );
      } else {
        createMockPlan(planData);
        onSave(
          "Plan Created Successfully",
          `New plan "${name.trim()}" has been created and is now available.`
        );
      }

      setIsSubmitting(false);
      onClose();
    }, 600);
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
          {/* Plan Name */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11.5px] font-bold text-[var(--muted)] uppercase tracking-wider">
              Plan Name
            </label>
            <input
              className={`w-full rounded-lg border bg-[var(--surface)] px-3 py-2 text-[13.5px] font-medium text-[var(--ink)] outline-none transition-all focus:border-[var(--brand)] focus:bg-white focus:ring-1 focus:ring-[var(--brand)]/20 ${
                errors.name
                  ? "border-[var(--red)] focus:border-[var(--red)]"
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
              <span className="text-[11px] font-semibold text-[var(--red)]">{errors.name}</span>
            )}
          </div>

          {/* Pricing */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11.5px] font-bold text-[var(--muted)] uppercase tracking-wider">
              Price (INR)
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[14px] font-semibold text-[var(--muted)]">
                ₹
              </span>
              <input
                className={`w-full rounded-lg border bg-[var(--surface)] pl-8 pr-3 py-2 text-[13.5px] font-medium text-[var(--ink)] outline-none transition-all focus:border-[var(--brand)] focus:bg-white focus:ring-1 focus:ring-[var(--brand)]/20 ${
                  errors.price
                    ? "border-[var(--red)] focus:border-[var(--red)]"
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
              <span className="text-[11px] font-semibold text-[var(--red)]">{errors.price}</span>
            )}
          </div>

          {/* Grid: Billing Cycle & Status */}
          <div className="grid grid-cols-2 gap-4">
            {/* Billing Cycle */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[11.5px] font-bold text-[var(--muted)] uppercase tracking-wider">
                Billing Cycle
              </label>
              <select
                className="w-full rounded-lg border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-[13.5px] font-semibold text-[var(--ink)] outline-none focus:border-[var(--brand)] focus:bg-white"
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
              <label className="text-[11.5px] font-bold text-[var(--muted)] uppercase tracking-wider">
                Status
              </label>
              <select
                className="w-full rounded-lg border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-[13.5px] font-semibold text-[var(--ink)] outline-none focus:border-[var(--brand)] focus:bg-white"
                value={status}
                onChange={(e) => setStatus(e.target.value as PlanStatus)}
              >
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 mt-4 pt-4 border-t border-[var(--line)]">
            <button
              className="rounded-lg border border-[var(--line)] bg-white px-4 py-2 text-[13px] font-bold text-[var(--muted)] hover:bg-[var(--surface)] transition-all cursor-pointer"
              onClick={onClose}
              type="button"
            >
              Cancel
            </button>
            <button
              className="flex items-center justify-center gap-1.5 rounded-lg bg-[var(--brand)] px-5 py-2 text-[13px] font-bold text-white hover:bg-[var(--brand-dark)] shadow-md shadow-[var(--brand)]/15 transition-all cursor-pointer disabled:opacity-50"
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
