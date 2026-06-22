"use client";

import React, { use, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Topbar } from "@/components/dashboard/topbar";
import { Icon } from "@/components/stoxify-icon";
import { useDashboard } from "@/components/dashboard/dashboard-context";
import type { SubscriptionPlan, PlanBatch, PlanBillingCycle } from "@/lib/types/analyst";

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

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

export default function ManageBatchesPage({ params }: { params: Promise<{ plan_id: string }> }) {
  const { plan_id } = use(params);
  const router = useRouter();
  const { showSuccessToast } = useDashboard();

  // Plan and batch states
  const [plan, setPlan] = useState<SubscriptionPlan | null>(null);
  const [batches, setBatches] = useState<PlanBatch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form states for creating/editing a batch
  const [editingBatchId, setEditingBatchId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [days, setDays] = useState("30");
  const [billingCycle, setBillingCycle] = useState<PlanBillingCycle>("MONTH");
  const [isActive, setIsActive] = useState(true);

  // Validation errors
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Fetch plan details
  const fetchPlan = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/analyst/plans/${plan_id}`);
      if (!res.ok) {
        throw new Error("Failed to fetch plan details");
      }
      const data = await res.json();
      setPlan(data);
      setBatches(data.batches ?? []);
      setError(null);
    } catch (err: any) {
      setError(err.message ?? "An error occurred while loading the plan.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPlan();
  }, [plan_id]);

  // Adjust billing cycle days helper
  const handleBillingCycleChange = (cycle: PlanBillingCycle) => {
    setBillingCycle(cycle);
    if (cycle === "WEEK") setDays("7");
    else if (cycle === "MONTH") setDays("30");
    else if (cycle === "QUARTER") setDays("90");
    else if (cycle === "YEAR") setDays("365");
  };

  // Submit batch to list (local change)
  const handleSaveBatchToList = (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};

    if (!name.trim()) errors.name = "Batch name is required";
    
    const priceNum = parseFloat(price);
    if (isNaN(priceNum) || priceNum < 0) {
      errors.price = "Enter a valid non-negative price";
    }

    const daysNum = parseInt(days);
    if (isNaN(daysNum) || daysNum <= 0) {
      errors.days = "Enter a valid positive duration in days";
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setFormErrors({});

    if (editingBatchId) {
      // Editing existing batch
      setBatches((prev) =>
        prev.map((b) =>
          b.batch_id === editingBatchId
            ? {
                batch_id: editingBatchId,
                name: name.trim(),
                price: priceNum,
                days: daysNum,
                billing_cycle: billingCycle,
                is_active: isActive,
              }
            : b
        )
      );
      setEditingBatchId(null);
    } else {
      // Adding new batch
      const newBatch: PlanBatch = {
        batch_id: "batch_" + Math.random().toString(36).substring(2, 11),
        name: name.trim(),
        price: priceNum,
        days: daysNum,
        billing_cycle: billingCycle,
        is_active: true,
      };
      setBatches((prev) => [...prev, newBatch]);
    }

    // Reset form fields
    setName("");
    setPrice("");
    setDays("30");
    setBillingCycle("MONTH");
    setIsActive(true);
  };

  // Edit batch selection
  const startEditBatch = (batch: PlanBatch) => {
    setEditingBatchId(batch.batch_id);
    setName(batch.name);
    setPrice(batch.price.toString());
    setDays(batch.days.toString());
    setBillingCycle(batch.billing_cycle);
    setIsActive(batch.is_active !== false);
    setFormErrors({});
  };

  // Cancel editing
  const cancelEdit = () => {
    setEditingBatchId(null);
    setName("");
    setPrice("");
    setDays("30");
    setBillingCycle("MONTH");
    setIsActive(true);
    setFormErrors({});
  };

  // Remove batch locally
  const handleRemoveBatch = (id: string) => {
    setBatches((prev) => prev.filter((b) => b.batch_id !== id));
    if (editingBatchId === id) {
      cancelEdit();
    }
  };

  // Toggle active status directly
  const handleToggleBatchActive = (id: string) => {
    setBatches((prev) =>
      prev.map((b) =>
        b.batch_id === id ? { ...b, is_active: b.is_active === false ? true : false } : b
      )
    );
  };

  // Persist all batches to backend
  const handlePersistChanges = async () => {
    setIsSaving(true);
    try {
      const res = await fetch(`/api/analyst/plans/${plan_id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          batches: batches.map((b) => ({
            batch_id: b.batch_id,
            name: b.name,
            price: b.price,
            days: b.days,
            billing_cycle: b.billing_cycle,
            is_active: b.is_active !== false,
          })),
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? "Failed to save batch configurations");
      }

      showSuccessToast("Batches Saved Successfully", "Sub-batch pricing and durations have been updated.");
      fetchPlan(); // Reload clean data
    } catch (err: any) {
      showSuccessToast("Save Failed", err.message ?? "An error occurred.");
    } finally {
      setIsSaving(false);
    }
  };

  const hasUnsavedChanges = plan ? JSON.stringify(plan.batches ?? []) !== JSON.stringify(batches) : false;

  return (
    <>
      <Topbar title="Manage Batches" showUserProfile={true} />

      <div className="flex-1 p-6 flex flex-col gap-6 overflow-y-auto bg-[var(--surface)] text-[var(--ink)]">
        {/* Back Link */}
        <div>
          <button
            onClick={() => router.push("/dashboard/subscription-plans")}
            className="flex items-center gap-1 text-[13px] font-bold text-[var(--brand)] hover:text-[var(--brand-dark)] transition-colors cursor-pointer"
          >
            <Icon className="h-4 w-4" name="arrowRight" style={{ transform: "rotate(180deg)" }} />
            <span>Back to Subscription Plans</span>
          </button>
        </div>

        {/* Loading Indicator */}
        {isLoading ? (
          <div className="flex-1 flex flex-col items-center justify-center p-12 gap-3">
            <Icon className="h-8 w-8 text-[var(--brand)] animate-spin" name="loader" />
            <span className="text-[14px] text-[var(--muted-2)] font-semibold">Loading batch details...</span>
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6 flex flex-col gap-3">
            <h3 className="text-red-800 font-bold">Error Loading Plan</h3>
            <p className="text-[13.5px] text-red-700">{error}</p>
            <button
              onClick={fetchPlan}
              className="w-fit rounded-xl bg-red-600 px-4 py-2 text-[12.5px] font-bold text-white hover:bg-red-700 transition-colors"
            >
              Retry
            </button>
          </div>
        ) : plan ? (
          <div className="grid grid-cols-3 gap-6 max-[1120px]:grid-cols-1">
            {/* Left/Middle Column: Batches Table List */}
            <div className="col-span-2 flex flex-col gap-6">
              {/* Plan Overview Card */}
              <div className="rounded-2xl border border-[var(--line)] bg-white p-6 shadow-sm flex flex-col gap-1.5">
                <span className="text-[11px] font-extrabold text-[var(--brand)] uppercase tracking-wider block">
                  Parent Plan (Course)
                </span>
                <h2 className="text-[20px] font-black tracking-tight leading-tight">
                  {plan.name}
                </h2>
                <div className="flex items-baseline gap-1 mt-1 text-[13px] text-[var(--muted-2)] font-semibold">
                  <span>Default Price:</span>
                  <span className="text-[var(--ink)] font-black">{formatCurrency(plan.price)}</span>
                  <span>/ {getBillingLabel(plan.billing_cycle)}</span>
                </div>
              </div>

              {/* Batches Table Card */}
              <div className="rounded-2xl border border-[var(--line)] bg-white shadow-sm overflow-hidden flex flex-col">
                <div className="p-5 border-b border-[var(--line)] flex items-center justify-between bg-slate-50/50">
                  <div>
                    <h3 className="text-[15px] font-extrabold tracking-tight">Active Sub-batches & Modules</h3>
                    <p className="text-[11.5px] text-[var(--muted-2)] font-medium mt-0.5">
                      Subscribers can choose specific modules below to subscribe with custom terms.
                    </p>
                  </div>
                  {batches.length > 0 && (
                    <span className="rounded-full bg-[var(--brand-light)] text-[var(--brand)] px-2.5 py-0.5 text-[11px] font-bold">
                      {batches.length} Modules
                    </span>
                  )}
                </div>

                {batches.length === 0 ? (
                  <div className="p-12 text-center text-[var(--muted-2)] text-[13.5px] italic">
                    No sub-batches defined for this plan. Add one on the right to start offering flexible tiers.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-left">
                      <thead>
                        <tr className="border-b border-[var(--line)] bg-slate-50/30 text-[11px] font-extrabold text-[var(--muted)] uppercase tracking-wider">
                          <th className="px-6 py-3.5">Name</th>
                          <th className="px-6 py-3.5">Price</th>
                          <th className="px-6 py-3.5">Duration</th>
                          <th className="px-6 py-3.5">Cycle</th>
                          <th className="px-6 py-3.5">Status</th>
                          <th className="px-6 py-3.5 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--line)] text-[13px] font-semibold text-[var(--ink)]">
                        {batches.map((batch) => {
                          const isActive = batch.is_active !== false;
                          const isEditingThis = editingBatchId === batch.batch_id;

                          return (
                            <tr
                              key={batch.batch_id}
                              className={`hover:bg-slate-50/40 transition-colors ${
                                isEditingThis ? "bg-[var(--brand-light)]/20" : ""
                              }`}
                            >
                              <td className="px-6 py-4 font-bold">{batch.name}</td>
                              <td className="px-6 py-4 font-mono font-bold text-[var(--brand)]">
                                {formatCurrency(batch.price)}
                              </td>
                              <td className="px-6 py-4">{batch.days} days</td>
                              <td className="px-6 py-4">
                                <span className="rounded-lg bg-slate-100 border border-slate-200 px-2 py-0.5 text-[11px] text-slate-600 font-bold uppercase">
                                  {batch.billing_cycle}
                                </span>
                              </td>
                              <td className="px-6 py-4">
                                <button
                                  type="button"
                                  onClick={() => handleToggleBatchActive(batch.batch_id)}
                                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold tracking-wide uppercase cursor-pointer hover:opacity-85 transition-opacity ${
                                    isActive
                                      ? "bg-[var(--green-light)] text-[var(--green)] border border-[var(--green)]/15"
                                      : "bg-slate-100 text-slate-400 border border-slate-200"
                                  }`}
                                >
                                  {isActive ? "Active" : "Inactive"}
                                </button>
                              </td>
                              <td className="px-6 py-4 text-right">
                                <div className="inline-flex items-center gap-2">
                                  <button
                                    onClick={() => startEditBatch(batch)}
                                    className="p-1.5 rounded-lg border border-[var(--line)] bg-white text-[var(--muted)] hover:text-[var(--brand)] hover:border-[var(--brand)]/35 hover:bg-[var(--brand-light)]/10 transition-all cursor-pointer"
                                    title="Edit Batch"
                                  >
                                    <Icon className="h-3.5 w-3.5" name="edit" />
                                  </button>
                                  <button
                                    onClick={() => handleRemoveBatch(batch.batch_id)}
                                    className="p-1.5 rounded-lg border border-red-100 bg-white text-red-400 hover:text-red-600 hover:border-red-300 hover:bg-red-50/50 transition-all cursor-pointer"
                                    title="Delete Batch"
                                  >
                                    <Icon className="h-3.5 w-3.5" name="x" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Add / Edit Batch Form */}
            <div className="flex flex-col gap-6">
              {/* Action Form */}
              <div className="rounded-2xl border border-[var(--line)] bg-white p-6 shadow-sm flex flex-col gap-4">
                <div>
                  <h3 className="text-[15px] font-extrabold tracking-tight">
                    {editingBatchId ? "Edit Sub-batch" : "Add Sub-batch (Module)"}
                  </h3>
                  <p className="text-[11.5px] text-[var(--muted-2)] font-medium mt-0.5">
                    {editingBatchId
                      ? "Modify current pricing parameters and click update below."
                      : "Create a new sub-batch with custom terms for subscription."}
                  </p>
                </div>

                <form onSubmit={handleSaveBatchToList} className="flex flex-col gap-3.5">
                  {/* Name */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-extrabold text-[var(--muted)] uppercase tracking-wider">
                      Module Name
                    </label>
                    <input
                      type="text"
                      className={`w-full rounded-xl border bg-[var(--surface)] px-4 py-2.5 text-[13px] font-semibold text-[var(--ink)] outline-none transition-all focus:border-[var(--brand)] focus:bg-white focus:ring-2 focus:ring-[var(--brand)]/10 ${
                        formErrors.name ? "border-red-400 focus:ring-red-100" : "border-[var(--line)]"
                      }`}
                      placeholder="e.g. FNO Segment, Equity Swing"
                      value={name}
                      onChange={(e) => {
                        setName(e.target.value);
                        if (formErrors.name) setFormErrors((prev) => ({ ...prev, name: "" }));
                      }}
                    />
                    {formErrors.name && (
                      <span className="text-[10.5px] text-red-500 font-bold">{formErrors.name}</span>
                    )}
                  </div>

                  {/* Price */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-extrabold text-[var(--muted)] uppercase tracking-wider">
                      Pricing (INR)
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[14px] font-bold text-[var(--muted)]">
                        ₹
                      </span>
                      <input
                        type="number"
                        className={`w-full rounded-xl border bg-[var(--surface)] pl-9 pr-4 py-2.5 text-[13px] font-bold text-[var(--ink)] outline-none transition-all focus:border-[var(--brand)] focus:bg-white focus:ring-2 focus:ring-[var(--brand)]/10 ${
                          formErrors.price ? "border-red-400 focus:ring-red-100" : "border-[var(--line)]"
                        }`}
                        placeholder="e.g. 5000"
                        value={price}
                        onChange={(e) => {
                          setPrice(e.target.value);
                          if (formErrors.price) setFormErrors((prev) => ({ ...prev, price: "" }));
                        }}
                      />
                    </div>
                    {formErrors.price && (
                      <span className="text-[10.5px] text-red-500 font-bold">{formErrors.price}</span>
                    )}
                  </div>

                  {/* Billing Cycle */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-extrabold text-[var(--muted)] uppercase tracking-wider">
                      Billing Interval
                    </label>
                    <select
                      className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface)] px-4 py-2.5 text-[13px] font-bold text-[var(--ink)] outline-none focus:border-[var(--brand)] focus:bg-white"
                      value={billingCycle}
                      onChange={(e) => handleBillingCycleChange(e.target.value as PlanBillingCycle)}
                    >
                      <option value="WEEK">Weekly</option>
                      <option value="MONTH">Monthly</option>
                      <option value="QUARTER">Quarterly</option>
                      <option value="YEAR">Yearly</option>
                    </select>
                  </div>

                  {/* Days */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-extrabold text-[var(--muted)] uppercase tracking-wider">
                      Validity Period (Days)
                    </label>
                    <input
                      type="number"
                      className={`w-full rounded-xl border bg-[var(--surface)] px-4 py-2.5 text-[13px] font-semibold text-[var(--ink)] outline-none transition-all focus:border-[var(--brand)] focus:bg-white focus:ring-2 focus:ring-[var(--brand)]/10 ${
                        formErrors.days ? "border-red-400 focus:ring-red-100" : "border-[var(--line)]"
                      }`}
                      placeholder="e.g. 30"
                      value={days}
                      onChange={(e) => {
                        setDays(e.target.value);
                        if (formErrors.days) setFormErrors((prev) => ({ ...prev, days: "" }));
                      }}
                    />
                    {formErrors.days && (
                      <span className="text-[10.5px] text-red-500 font-bold">{formErrors.days}</span>
                    )}
                  </div>

                  {/* Editing Active Status */}
                  {editingBatchId && (
                    <div className="flex items-center justify-between py-2 border-y border-[var(--line)] mt-1">
                      <label className="text-[11px] font-extrabold text-[var(--muted)] uppercase tracking-wider">
                        Active Status
                      </label>
                      <input
                        type="checkbox"
                        checked={isActive}
                        onChange={(e) => setIsActive(e.target.checked)}
                        className="h-4.5 w-4.5 rounded border-gray-300 text-[var(--brand)] focus:ring-[var(--brand)] cursor-pointer"
                      />
                    </div>
                  )}

                  {/* Form Action Row */}
                  <div className="flex items-center gap-2.5 mt-2">
                    {editingBatchId && (
                      <button
                        type="button"
                        onClick={cancelEdit}
                        className="flex-1 rounded-xl border border-[var(--line)] bg-white py-2.5 text-[12.5px] font-bold text-[var(--muted)] hover:bg-[var(--surface)] hover:text-[var(--ink)] transition-colors cursor-pointer"
                      >
                        Cancel
                      </button>
                    )}
                    <button
                      type="submit"
                      className="flex-[2] rounded-xl bg-[var(--brand)] py-2.5 text-[12.5px] font-bold text-white hover:bg-[var(--brand-dark)] transition-colors shadow-sm active:scale-[0.98] cursor-pointer"
                    >
                      {editingBatchId ? "Update Batch" : "Add to List"}
                    </button>
                  </div>
                </form>
              </div>

              {/* Unsaved Changes Save Bar */}
              <div
                className={`rounded-2xl border p-5 shadow-md flex flex-col gap-3.5 transition-all duration-300 ${
                  hasUnsavedChanges
                    ? "border-[var(--brand)]/30 bg-[var(--brand-light)]/15 scale-[1.02]"
                    : "border-[var(--line)] bg-slate-50/40 opacity-70"
                }`}
              >
                <div>
                  <h4 className="text-[13.5px] font-extrabold flex items-center gap-1.5">
                    <Icon className="h-4 w-4 text-[var(--brand)]" name="circleCheck" />
                    <span>Save Configuration</span>
                  </h4>
                  <p className="text-[11px] text-[var(--muted-2)] font-medium mt-1">
                    {hasUnsavedChanges
                      ? "You have unsaved changes in the batch configurations. Save now to apply."
                      : "All batch configurations match the published plan."}
                  </p>
                </div>
                <button
                  disabled={!hasUnsavedChanges || isSaving}
                  onClick={handlePersistChanges}
                  className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-[var(--brand)] disabled:bg-slate-300 disabled:text-slate-400 py-3 text-[13px] font-bold text-white hover:bg-[var(--brand-dark)] shadow-md disabled:shadow-none shadow-[var(--brand)]/15 transition-all active:scale-[0.98] cursor-pointer"
                >
                  {isSaving ? (
                    <>
                      <Icon className="h-4 w-4 text-white animate-spin" name="loader" />
                      <span>Saving to Server...</span>
                    </>
                  ) : (
                    <>
                      <Icon className="h-4 w-4 text-white" name="check" />
                      <span>Save Published Batches</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </>
  );
}
