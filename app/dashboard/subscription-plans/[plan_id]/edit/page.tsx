"use client";

import React, { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { useDashboard } from "@/components/dashboard/dashboard-context";
import { Icon } from "@/components/stoxify-icon";
import type { PlanStatus, PlanBatch, PlanBillingCycle } from "@/lib/types/analyst";
import { nanoid } from "nanoid";
import { motion, AnimatePresence } from "motion/react";

const SEGMENTS = ["EQUITY", "FNO", "COMMODITY", "CURRENCY"];
const HORIZONS = ["INTRADAY", "SWING", "SHORT", "MEDIUM", "LONG TERM"];
const RISK_LEVELS = ["LOW", "MEDIUM", "HIGH"];
// PRD: minimum batch price is ₹99 (applies to the discounted price too)
const MIN_BATCH_PRICE = 99;

export default function EditPlanPage({ params }: { params: Promise<{ plan_id: string }> }) {
  const router = useRouter();
  const { showSuccessToast } = useDashboard();
  const { plan_id } = use(params);

  // Core Fields
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<PlanStatus>("ACTIVE");
  const [riskLevel, setRiskLevel] = useState("MEDIUM");
  const [segments, setSegments] = useState<string[]>([]);
  const [horizons, setHorizons] = useState<string[]>([]);
  const [features, setFeatures] = useState<string[]>([]);
  const [newFeature, setNewFeature] = useState("");

  // Pricing Tiers (Batches)
  const [pricingTiers, setPricingTiers] = useState<PlanBatch[]>([]);
  const [isSlideOverOpen, setIsSlideOverOpen] = useState(false);
  const [editingTierId, setEditingTierId] = useState<string | null>(null);

  // Slide-over state
  const [soName, setSoName] = useState("");
  const [soPlanType, setSoPlanType] = useState<"SUBSCRIPTION" | "LIFETIME">("SUBSCRIPTION");
  const [soDurationValue, setSoDurationValue] = useState("1");
  const [soDurationUnit, setSoDurationUnit] = useState<PlanBillingCycle>("MONTH");
  const [soPrice, setSoPrice] = useState("");
  const [soHasDiscount, setSoHasDiscount] = useState(false);
  const [soDiscountedPrice, setSoDiscountedPrice] = useState("");
  const [soIsActive, setSoIsActive] = useState(true);
  const [soDiscountError, setSoDiscountError] = useState("");
  const [soErrors, setSoErrors] = useState<Record<string, string>>({});

  const [isLoading, setIsLoading] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetch(`/api/analyst/plans/${plan_id}`, { credentials: "same-origin" })
      .then(res => res.json())
      .then(planToEdit => {
        if (planToEdit && planToEdit.plan_id) {
          setName(planToEdit.name);
          setDescription(planToEdit.description ?? "");
          setStatus(planToEdit.status ?? (planToEdit.is_active ? "ACTIVE" : "INACTIVE"));
          setRiskLevel(planToEdit.risk_level ?? "MEDIUM");
          setSegments(planToEdit.segments && planToEdit.segments.length > 0 ? planToEdit.segments : ["EQUITY"]);
          setHorizons(planToEdit.horizons && planToEdit.horizons.length > 0 ? planToEdit.horizons : ["INTRADAY"]);
          setFeatures(planToEdit.features ?? []);
          setPricingTiers(planToEdit.batches || []);
        }
        setIsLoading(false);
      })
      .catch(() => setIsLoading(false));
  }, [plan_id]);

  const toggleSelection = (item: string, current: string[], setter: React.Dispatch<React.SetStateAction<string[]>>) => {
    if (current.includes(item)) {
      if (current.length > 1) {
        setter(current.filter((i) => i !== item));
      }
    } else {
      setter([...current, item]);
    }
  };

  const addFeature = () => {
    const value = newFeature.trim();
    if (!value) return;
    if (features.some((f) => f.toLowerCase() === value.toLowerCase())) {
      setNewFeature("");
      return;
    }
    setFeatures((prev) => [...prev, value]);
    setNewFeature("");
  };

  const removeFeature = (index: number) => {
    setFeatures((prev) => prev.filter((_, i) => i !== index));
  };

  const getDaysFromCycle = (val: number, unit: PlanBillingCycle) => {
    if (unit === "DAY") return val;
    if (unit === "WEEK") return val * 7;
    if (unit === "MONTH") return val * 30;
    if (unit === "QUARTER") return val * 90;
    if (unit === "YEAR") return val * 365;
    return 0;
  };

  const openSlideOver = (tier?: PlanBatch) => {
    setSoErrors({});
    setSoDiscountError("");
    if (tier) {
      setEditingTierId(tier.batch_id);
      setSoName(tier.name);
      setSoPlanType(tier.plan_type || "SUBSCRIPTION");
      setSoPrice(tier.price.toString());
      setSoHasDiscount(tier.discounted_price !== undefined);
      setSoDiscountedPrice(tier.discounted_price ? tier.discounted_price.toString() : "");
      setSoIsActive(tier.is_active ?? true);
      if (tier.plan_type === "SUBSCRIPTION") {
        setSoDurationUnit(tier.billing_cycle);
        let val = 1;
        if (tier.billing_cycle === "DAY") val = tier.days;
        if (tier.billing_cycle === "WEEK") val = tier.days / 7;
        if (tier.billing_cycle === "MONTH") val = tier.days / 30;
        if (tier.billing_cycle === "QUARTER") val = tier.days / 90;
        if (tier.billing_cycle === "YEAR") val = tier.days / 365;
        setSoDurationValue(val.toString());
      }
    } else {
      setEditingTierId(null);
      setSoName("");
      setSoPlanType("SUBSCRIPTION");
      setSoDurationValue("1");
      setSoDurationUnit("MONTH");
      setSoPrice("");
      setSoHasDiscount(false);
      setSoDiscountedPrice("");
      setSoIsActive(true);
    }
    setIsSlideOverOpen(true);
  };

  const savePricingTier = () => {
    const newErrors: Record<string, string> = {};

    if (!soName.trim()) {
      newErrors.name = "Plan Name is required";
    }

    const priceNum = Number(soPrice);
    if (!soPrice || isNaN(priceNum) || priceNum < 0) {
      newErrors.price = "Valid Plan Price is required";
    } else if (priceNum < MIN_BATCH_PRICE) {
      newErrors.price = `Plan price must be at least ₹${MIN_BATCH_PRICE}`;
    }

    const durationVal = parseInt(soDurationValue);
    if (soPlanType === "SUBSCRIPTION" && (isNaN(durationVal) || durationVal <= 0)) {
      newErrors.duration = "Valid duration is required";
    }

    const discountedNum = soHasDiscount && soDiscountedPrice ? Number(soDiscountedPrice) : undefined;

    if (discountedNum !== undefined && discountedNum >= priceNum) {
      setSoDiscountError("Discounted price cannot be more than the plan price");
      newErrors.discount = "Discounted price is invalid";
    } else if (discountedNum !== undefined && discountedNum < MIN_BATCH_PRICE) {
      setSoDiscountError(`Discounted price must be at least ₹${MIN_BATCH_PRICE}`);
      newErrors.discount = "Discounted price is invalid";
    } else {
      setSoDiscountError("");
    }

    const newDays = soPlanType === "LIFETIME" ? 36500 : getDaysFromCycle(durationVal, soDurationUnit);

    // Each plan in a batch must have a unique duration — block duplicates here
    // so the user never reaches a save that the backend would reject.
    const hasDuplicateDuration = pricingTiers.some(
      t => t.batch_id !== editingTierId && t.days === newDays
    );
    if (hasDuplicateDuration) {
      newErrors.duration = "Another plan already uses this duration. Each plan must have a unique duration.";
    }

    if (Object.keys(newErrors).length > 0) {
      setSoErrors(newErrors);
      return;
    }
    setSoErrors({});

    const newTier: PlanBatch = {
      batch_id: editingTierId || `batch_${nanoid(6)}`,
      name: soName.trim(),
      plan_type: soPlanType,
      price: priceNum,
      discounted_price: discountedNum,
      billing_cycle: soPlanType === "LIFETIME" ? "YEAR" : soDurationUnit,
      days: newDays,
      is_active: soIsActive,
    };

    if (editingTierId) {
      setPricingTiers(prev => prev.map(t => t.batch_id === editingTierId ? newTier : t));
    } else {
      setPricingTiers(prev => [...prev, newTier]);
    }
    setIsSlideOverOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!name.trim()) newErrors.name = "Batch name is required";
    if (segments.length === 0) newErrors.segments = "Select at least one segment";
    if (horizons.length === 0) newErrors.horizons = "Select at least one horizon";
    // if (pricingTiers.length === 0) newErrors.form = "At least one pricing tier is mandatory while updating a batch.";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      const res = await fetch(`/api/analyst/plans/${plan_id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim(),
          risk_level: riskLevel,
          segments,
          horizons,
          features,
          batches: pricingTiers,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setErrors({ form: data.error ?? "Failed to update batch" });
        return;
      }

      await fetch(`/api/analyst/plans/${plan_id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: status === "ACTIVE" }),
      });

      showSuccessToast(
        "Batch Updated",
        `"${name.trim()}" batch has been successfully modified.`
      );

      router.push("/dashboard/subscription-plans");
    } catch {
      setErrors({ form: "Unable to reach the server. Please try again." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const calculateDiscountPct = (price: number, disc: number) => {
    if (price <= 0 || disc >= price) return 0;
    return Math.round(((price - disc) / price) * 100);
  };

  const formatDurationText = (tier: PlanBatch) => {
    if (tier.plan_type === "LIFETIME") return "Lifetime";
    let val = 1;
    if (tier.billing_cycle === "DAY") val = tier.days;
    if (tier.billing_cycle === "WEEK") val = tier.days / 7;
    if (tier.billing_cycle === "MONTH") val = tier.days / 30;
    if (tier.billing_cycle === "QUARTER") val = tier.days / 90;
    if (tier.billing_cycle === "YEAR") val = tier.days / 365;
    return `${val} ${tier.billing_cycle.charAt(0) + tier.billing_cycle.slice(1).toLowerCase()}${val > 1 ? 's' : ''}`;
  };

  const getDynamicSummaryText = () => {
    const priceNum = Number(soPrice) || 0;
    const discNum = soHasDiscount && soDiscountedPrice ? Number(soDiscountedPrice) : undefined;

    if (soPlanType === "LIFETIME") {
      if (discNum !== undefined && discNum < priceNum) {
        return (
          <span>
            Subscribers will pay a discounted, one-time fee of <strong className="text-[var(--ink)]">₹{discNum.toLocaleString("en-IN")}</strong> (saving <strong className="text-emerald-600 font-bold">{calculateDiscountPct(priceNum, discNum)}%</strong> off the standard ₹{priceNum.toLocaleString("en-IN")} price) for lifetime access.
          </span>
        );
      }
      return (
        <span>
          Subscribers will pay a one-time fee of <strong className="text-[var(--ink)]">₹{priceNum.toLocaleString("en-IN")}</strong> for lifetime access.
        </span>
      );
    } else {
      const cycle = soDurationUnit.toLowerCase();
      const val = parseInt(soDurationValue) || 1;
      const cycleText = `${val} ${cycle}${val > 1 ? "s" : ""}`;

      if (discNum !== undefined && discNum < priceNum) {
        return (
          <span>
            Subscribers will pay a discounted fee of <strong className="text-[var(--ink)]">₹{discNum.toLocaleString("en-IN")}</strong> every <strong className="text-[var(--ink)]">{cycleText}</strong> (saving <strong className="text-emerald-600 font-bold">{calculateDiscountPct(priceNum, discNum)}%</strong> off the standard ₹{priceNum.toLocaleString("en-IN")} / {cycleText}).
          </span>
        );
      }
      return (
        <span>
          Subscribers will be billed <strong className="text-[var(--ink)]">₹{priceNum.toLocaleString("en-IN")}</strong> every <strong className="text-[var(--ink)]">{cycleText}</strong>.
        </span>
      );
    }
  };

  return (
    <>
      <div className="flex-1 p-6 md:p-8 flex flex-col gap-8 overflow-y-auto bg-[#fafafa] relative">
        <div className="w-full max-w-4xl mx-auto mt-4">

          <div className="flex items-center gap-4 mb-8">
            <button
              onClick={() => router.back()}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white border border-[var(--line)] text-[var(--muted)] hover:text-[var(--ink)] hover:bg-slate-50 transition-all shadow-sm active:scale-95"
            >
              <Icon className="h-4 w-4" name="arrowRight" style={{ transform: "rotate(180deg)" }} />
            </button>
            <div>
              <h1 className="text-[24px] font-black text-[var(--ink)] tracking-tight leading-none">
                Edit Batch
              </h1>
              <p className="text-[14px] text-[var(--muted-2)] font-medium mt-1.5">
                Update the foundational details, risk parameters, and pricing tiers for this batch.
              </p>
            </div>
          </div>

          {isLoading ? (
            <div className="rounded-3xl border border-[var(--line)] bg-white p-12 shadow-sm flex flex-col items-center justify-center gap-4">
              <Icon className="h-8 w-8 text-[var(--brand)] animate-spin" name="loader" />
              <p className="text-[14px] font-semibold text-[var(--muted)]">Loading batch details...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-6">

              {errors.form && (
                <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50/50 p-4 text-[14px] font-medium text-red-800 shadow-sm backdrop-blur-md">
                  <div className="mt-0.5 rounded-full bg-red-100 p-1">
                    <Icon className="h-4 w-4 text-red-600" name="x" />
                  </div>
                  <span className="pt-0.5">{errors.form}</span>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-[1fr_300px] gap-6">

                <div className="flex flex-col gap-6">
                  {/* General Information */}
                  <div className="rounded-3xl border border-[var(--line)] bg-white p-6 md:p-8 shadow-sm">
                    <h2 className="text-[16px] font-bold text-[var(--ink)] mb-6 flex items-center gap-2">
                      <div className="h-6 w-1 rounded-full bg-[var(--brand)]"></div>
                      General Information
                    </h2>
                    <div className="flex flex-col gap-5">
                      <div className="flex flex-col gap-2">
                        <label className="text-[13px] font-bold text-[var(--ink)]">Batch Name</label>
                        <input
                          className={`w-full rounded-2xl border bg-[#fafafa] px-5 py-3.5 text-[14px] font-semibold text-[var(--ink)] outline-none transition-all placeholder:text-[var(--muted-2)] focus:border-[var(--brand)] focus:bg-white focus:ring-4 focus:ring-[var(--brand)]/10 ${errors.name ? "border-[var(--red)] focus:border-[var(--red)]" : "border-[var(--line)]"}`}
                          placeholder="e.g. FNO Mastery, Swing Trading Alpha"
                          type="text"
                          value={name}
                          onChange={(e) => { setName(e.target.value); if (errors.name) setErrors((prev) => ({ ...prev, name: "" })); }}
                        />
                        {errors.name && <span className="text-[12px] font-bold text-[var(--red)] px-1">{errors.name}</span>}
                      </div>
                      <div className="flex flex-col gap-2">
                        <label className="text-[13px] font-bold text-[var(--ink)]">Description (Optional)</label>
                        <textarea
                          className="w-full rounded-2xl border border-[var(--line)] bg-[#fafafa] px-5 py-3.5 text-[14px] font-medium text-[var(--ink)] outline-none transition-all placeholder:text-[var(--muted-2)] focus:border-[var(--brand)] focus:bg-white focus:ring-4 min-h-[100px] resize-y"
                          placeholder="Describe what this batch offers..."
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Market Parameters */}
                  <div className="rounded-3xl border border-[var(--line)] bg-white p-6 md:p-8 shadow-sm">
                    <h2 className="text-[16px] font-bold text-[var(--ink)] mb-6 flex items-center gap-2">
                      <div className="h-6 w-1 rounded-full bg-violet-500"></div>
                      Market Parameters
                    </h2>
                    <div className="flex flex-col gap-8">
                      <div className="flex flex-col gap-3">
                        <label className="text-[13px] font-bold text-[var(--ink)]">Allowed Segments</label>
                        <div className="flex flex-wrap gap-2">
                          {SEGMENTS.map(seg => (
                            <button
                              key={seg} type="button" onClick={() => toggleSelection(seg, segments, setSegments)}
                              className={`px-4 py-2.5 rounded-xl text-[13px] font-bold transition-all border ${segments.includes(seg) ? "bg-violet-50 border-violet-200 text-violet-700 shadow-[inset_0_0_0_1px_rgba(139,92,246,0.1)]" : "bg-white border-[var(--line)] text-[var(--muted)] hover:border-violet-200 hover:bg-slate-50"}`}
                            >
                              {seg}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="flex flex-col gap-3">
                        <label className="text-[13px] font-bold text-[var(--ink)]">Trading Horizons</label>
                        <div className="flex flex-wrap gap-2">
                          {HORIZONS.map(hz => (
                            <button
                              key={hz} type="button" onClick={() => toggleSelection(hz, horizons, setHorizons)}
                              className={`px-4 py-2.5 rounded-xl text-[13px] font-bold transition-all border ${horizons.includes(hz) ? "bg-blue-50 border-blue-200 text-blue-700 shadow-[inset_0_0_0_1px_rgba(59,130,246,0.1)]" : "bg-white border-[var(--line)] text-[var(--muted)] hover:border-blue-200 hover:bg-slate-50"}`}
                            >
                              {hz}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Features */}
                  <div className="rounded-3xl border border-[var(--line)] bg-white p-6 md:p-8 shadow-sm">
                    <h2 className="text-[16px] font-bold text-[var(--ink)] mb-2 flex items-center gap-2">
                      <div className="h-6 w-1 rounded-full bg-teal-500"></div>
                      Features
                    </h2>
                    <p className="text-[13px] text-[var(--muted-2)] font-medium mb-6">
                      Highlights shown to subscribers as a checklist on the batch card.
                    </p>
                    <div className="flex flex-col gap-4">
                      <div className="flex gap-2">
                        <input
                          className="flex-1 rounded-2xl border border-[var(--line)] bg-[#fafafa] px-5 py-3.5 text-[14px] font-medium text-[var(--ink)] outline-none transition-all placeholder:text-[var(--muted-2)] focus:border-[var(--brand)] focus:bg-white focus:ring-4 focus:ring-[var(--brand)]/10"
                          placeholder="e.g. Daily 2-3 swing trade ideas"
                          type="text"
                          value={newFeature}
                          onChange={(e) => setNewFeature(e.target.value)}
                          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addFeature(); } }}
                        />
                        <button
                          type="button"
                          onClick={addFeature}
                          className="flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-5 text-[14px] font-bold text-white hover:opacity-90 transition-all active:scale-95"
                        >
                          <Icon name="plus" className="h-4 w-4" />
                          Add
                        </button>
                      </div>
                      {features.length > 0 ? (
                        <div className="flex flex-col gap-2">
                          {features.map((feature, index) => (
                            <div key={`${feature}-${index}`} className="flex items-center justify-between gap-3 rounded-2xl border border-[var(--line)] bg-slate-50 px-4 py-3">
                              <div className="flex items-center gap-2.5 min-w-0">
                                <Icon name="check" className="h-4 w-4 text-emerald-500 shrink-0" />
                                <span className="text-[13.5px] font-semibold text-[var(--ink)] truncate">{feature}</span>
                              </div>
                              <button
                                type="button"
                                onClick={() => removeFeature(index)}
                                className="p-1.5 text-[var(--muted)] hover:text-[var(--red)] transition-colors rounded-full hover:bg-red-50 shrink-0"
                              >
                                <Icon name="x" className="h-4 w-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-[12.5px] italic text-[var(--muted-2)] text-center py-3 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                          No features added yet
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Plans and Pricing */}
                  <div className="rounded-3xl border border-[var(--line)] bg-white p-6 md:p-8 shadow-sm">
                    <h2 className="text-[16px] font-bold text-[var(--ink)] mb-6 flex items-center gap-2">
                      <div className="h-6 w-1 rounded-full bg-emerald-500"></div>
                      Plans and Pricing
                    </h2>
                    <div className="flex flex-col gap-4">
                      {pricingTiers.map((tier) => (
                        <div key={tier.batch_id} className={`flex items-center justify-between p-5 rounded-2xl border transition-all ${tier.is_active ? 'border-[var(--line)] bg-white shadow-sm' : 'border-dashed border-[var(--line)] bg-slate-50 opacity-60'}`}>
                          <div className="flex items-center gap-4">
                            <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0">
                              <Icon name="ticket" className="h-5 w-5 text-slate-500" />
                            </div>
                            <div className="flex flex-col gap-1">
                              <span className="text-[15px] font-bold text-[var(--ink)] leading-none">{tier.name}</span>
                              <div className="flex items-center gap-2 text-[13px] text-[var(--muted)] font-medium">
                                <span>₹{tier.discounted_price || tier.price} / {formatDurationText(tier)}</span>
                                {tier.discounted_price && (
                                  <span className="line-through text-slate-400">₹{tier.price}</span>
                                )}
                                {tier.discounted_price && (
                                  <span className="text-emerald-600 font-bold">({calculateDiscountPct(tier.price, tier.discounted_price)}% off)</span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <button
                              type="button"
                              onClick={() => openSlideOver(tier)}
                              className="p-2 text-[var(--muted)] hover:text-[var(--brand)] transition-colors rounded-full hover:bg-blue-50"
                            >
                              <Icon name="edit" className="h-5 w-5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setPricingTiers(prev => prev.map(t => t.batch_id === tier.batch_id ? { ...t, is_active: !t.is_active } : t));
                              }}
                              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${tier.is_active ? 'bg-emerald-500' : 'bg-slate-300'}`}
                            >
                              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${tier.is_active ? 'translate-x-6' : 'translate-x-1'}`} />
                            </button>
                          </div>
                        </div>
                      ))}

                      <button
                        type="button"
                        onClick={() => openSlideOver()}
                        className="w-full flex items-center justify-center gap-2 p-4 rounded-2xl border border-dashed border-slate-300 text-[14px] font-bold text-[var(--muted)] hover:bg-slate-50 hover:text-[var(--ink)] hover:border-slate-400 transition-all"
                      >
                        <Icon name="plus" className="h-4 w-4" />
                        Add another Plan
                      </button>
                    </div>
                  </div>

                </div>

                {/* Right Column: Configuration */}
                <div className="flex flex-col gap-6">
                  <div className="rounded-3xl border border-[var(--line)] bg-white p-6 shadow-sm sticky top-6">
                    <h2 className="text-[16px] font-bold text-[var(--ink)] mb-6 flex items-center gap-2">
                      <div className="h-6 w-1 rounded-full bg-orange-400"></div>
                      Configuration
                    </h2>
                    <div className="flex flex-col gap-6">
                      <div className="flex flex-col gap-3">
                        <label className="text-[13px] font-bold text-[var(--ink)]">Risk Level</label>
                        <div className="flex flex-col gap-2">
                          {RISK_LEVELS.map(risk => (
                            <label key={risk} onClick={() => setRiskLevel(risk)} className={`flex items-center gap-3 p-3.5 rounded-2xl border cursor-pointer transition-all ${riskLevel === risk ? "border-orange-400 bg-orange-50/50" : "border-[var(--line)] hover:bg-slate-50"}`}>
                              <div className={`h-4 w-4 rounded-full border-2 flex items-center justify-center ${riskLevel === risk ? "border-orange-500" : "border-[var(--muted-2)]"}`}>
                                {riskLevel === risk && <div className="h-2 w-2 rounded-full bg-orange-500" />}
                              </div>
                              <span className={`text-[13.5px] font-bold ${riskLevel === risk ? "text-orange-900" : "text-[var(--ink)]"}`}>{risk.charAt(0) + risk.slice(1).toLowerCase()} Risk</span>
                            </label>
                          ))}
                        </div>
                      </div>
                      <hr className="border-[var(--line)]" />
                      <div className="flex flex-col gap-3">
                        <label className="text-[13px] font-bold text-[var(--ink)]">Status</label>
                        <div className="relative">
                          <select className="w-full appearance-none rounded-2xl border border-[var(--line)] bg-[#fafafa] px-5 py-3.5 text-[14px] font-bold text-[var(--ink)] outline-none focus:border-[var(--brand)] focus:bg-white focus:ring-4 focus:ring-[var(--brand)]/10 transition-all cursor-pointer" value={status} onChange={(e) => setStatus(e.target.value as PlanStatus)}>
                            <option value="ACTIVE">Active (Visible)</option>
                            <option value="INACTIVE">Inactive (Hidden)</option>
                          </select>
                          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-5 text-[var(--muted)]">
                            <Icon className="h-4 w-4" name="arrowRight" style={{ transform: "rotate(90deg)" }} />
                          </div>
                        </div>
                      </div>
                      <div className="pt-2">
                        <button
                          className="w-full flex items-center justify-center gap-2 rounded-2xl bg-black px-6 py-4 text-[14px] font-bold text-white hover:opacity-90 transition-all shadow-[0_4px_14px_0_rgba(0,0,0,0.25)] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
                          disabled={isSubmitting} type="submit"
                        >
                          {isSubmitting ? <><Icon className="h-5 w-5 animate-spin" name="loader" /><span>Saving...</span></> : <span>Save Changes</span>}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </form>
          )}
        </div>
      </div>

      {/* Slide-over Panel for Plan/Pricing */}
      <AnimatePresence>
        {isSlideOverOpen && (
          <div className="fixed inset-0 z-50 flex justify-end">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-[3px] transition-opacity cursor-pointer"
              onClick={() => setIsSlideOverOpen(false)}
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 350 }}
              className="relative z-10 w-full max-w-[420px] h-full bg-white shadow-2xl flex flex-col"
            >
              <div className="flex items-center gap-3 p-6 border-b border-[var(--line)]">
                <button onClick={() => setIsSlideOverOpen(false)} className="p-2 -ml-2 rounded-full hover:bg-slate-100 text-[var(--muted)] transition-colors cursor-pointer">
                  <Icon name="x" className="h-5 w-5" />
                </button>
                <h2 className="text-[18px] font-black text-[var(--ink)] leading-none">{editingTierId ? "Edit Plan Option" : "New Plan Option"}</h2>
              </div>

              <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
                {/* Plan Name */}
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[13px] font-bold text-[var(--ink)]">Plan Name</label>
                    <span className="text-[11px] font-bold text-[var(--muted-2)]">{soName.length}/75</span>
                  </div>
                  <input
                    type="text" maxLength={75} value={soName} onChange={e => setSoName(e.target.value)}
                    placeholder="e.g. Quarterly Advisory, Lifetime Special"
                    className="w-full rounded-xl border border-[var(--line)] bg-white px-4 py-3 text-[14px] font-medium text-[var(--ink)] outline-none transition-all placeholder:text-[var(--muted-2)] focus:border-[var(--brand)] focus:ring-4 focus:ring-[var(--brand)]/10"
                  />
                  {soErrors.name && <span className="text-[11px] text-[var(--red)] font-bold px-1">{soErrors.name}</span>}
                </div>

                {/* Plan Type */}
                <div className="flex flex-col gap-2">
                  <label className="text-[13px] font-bold text-[var(--ink)]">Plan Type</label>
                  <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1.5 rounded-2xl border border-[var(--line)]">
                    <button
                      type="button"
                      onClick={() => setSoPlanType("SUBSCRIPTION")}
                      className={`py-2.5 rounded-xl text-[13px] font-bold transition-all cursor-pointer ${soPlanType === "SUBSCRIPTION"
                          ? "bg-white text-[var(--ink)] shadow-sm font-extrabold"
                          : "text-[var(--muted)] hover:text-[var(--ink)] font-semibold"
                        }`}
                    >
                      Subscription
                    </button>
                    <button
                      type="button"
                      onClick={() => setSoPlanType("LIFETIME")}
                      className={`py-2.5 rounded-xl text-[13px] font-bold transition-all cursor-pointer ${soPlanType === "LIFETIME"
                          ? "bg-white text-[var(--ink)] shadow-sm font-extrabold"
                          : "text-[var(--muted)] hover:text-[var(--ink)] font-semibold"
                        }`}
                    >
                      Lifetime Access
                    </button>
                  </div>
                </div>

                {/* Duration (Only for Subscription) */}
                {soPlanType === "SUBSCRIPTION" && (
                  <div className="flex flex-col gap-2">
                    <label className="text-[13px] font-bold text-[var(--ink)]">Billing Period / Duration</label>
                    <div className="flex gap-3">
                      <input
                        type="number" min="1" value={soDurationValue} onChange={e => setSoDurationValue(e.target.value)}
                        className="w-24 rounded-xl border border-[var(--line)] bg-white px-4 py-3 text-[14px] font-bold text-[var(--ink)] outline-none transition-all text-center focus:border-[var(--brand)] focus:ring-4 focus:ring-[var(--brand)]/10"
                      />
                      <div className="relative flex-1">
                        <select
                          value={soDurationUnit} onChange={e => setSoDurationUnit(e.target.value as PlanBillingCycle)}
                          className="w-full appearance-none rounded-xl border border-[var(--line)] bg-white px-4 py-3 text-[14px] font-semibold text-[var(--ink)] outline-none focus:border-[var(--brand)] focus:ring-4 focus:ring-[var(--brand)]/10 transition-all cursor-pointer"
                        >
                          <option value="DAY">Days</option>
                          <option value="WEEK">Weeks</option>
                          <option value="MONTH">Months</option>
                          <option value="QUARTER">Quarters</option>
                          <option value="YEAR">Years</option>
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-[var(--muted)]">
                          <Icon className="h-4 w-4" name="arrowRight" style={{ transform: "rotate(90deg)" }} />
                        </div>
                      </div>
                    </div>
                    {soErrors.duration && <span className="text-[11px] text-[var(--red)] font-bold px-1">{soErrors.duration}</span>}
                  </div>
                )}

                {/* Plan Price */}
                <div className="flex flex-col gap-2">
                  <label className="text-[13px] font-bold text-[var(--ink)]">Plan Standard Price</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <span className="text-[14px] font-medium text-[var(--muted)]">₹</span>
                    </div>
                    <input
                      type="number" min="0" value={soPrice} onChange={e => setSoPrice(e.target.value)}
                      placeholder="0"
                      className="w-full rounded-xl border border-[var(--line)] bg-white pl-8 pr-4 py-3 text-[14px] font-medium text-[var(--ink)] outline-none transition-all focus:border-[var(--brand)] focus:ring-4 focus:ring-[var(--brand)]/10"
                    />
                  </div>
                  {soErrors.price && <span className="text-[11px] text-[var(--red)] font-bold px-1">{soErrors.price}</span>}
                </div>

                {/* Discount Toggle */}
                <div className="flex flex-col gap-4 bg-slate-50 border border-[var(--line)] p-4 rounded-2xl">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" checked={soHasDiscount} onChange={e => setSoHasDiscount(e.target.checked)} className="w-4 h-4 text-[var(--brand)] border-[var(--line)] rounded focus:ring-[var(--brand)] cursor-pointer" />
                    <span className="text-[13.5px] font-bold text-[var(--ink)]">Offer discounted price on plan price</span>
                  </label>

                  {soHasDiscount && (
                    <div className="mt-1 flex flex-col gap-1.5">
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                          <span className="text-[14px] font-medium text-[var(--muted)]">₹</span>
                        </div>
                        <input
                          type="number" min="0" value={soDiscountedPrice}
                          onChange={e => { setSoDiscountedPrice(e.target.value); if (soDiscountError) setSoDiscountError(""); }}
                          placeholder="Discounted Price"
                          className={`w-full rounded-xl border bg-white pl-8 pr-4 py-3 text-[14px] font-medium text-[var(--ink)] outline-none transition-all focus:ring-4 ${soDiscountError ? "border-[var(--red)] focus:border-[var(--red)] focus:ring-[var(--red)]/10" : "border-[var(--line)] focus:border-emerald-500 focus:ring-emerald-500/10"}`}
                        />
                      </div>
                      {soDiscountError && (
                        <span className="text-[12px] font-bold text-[var(--red)] px-1">{soDiscountError}</span>
                      )}
                    </div>
                  )}
                </div>

                {/* Plan Dynamic Summary Help text */}
                {Number(soPrice) > 0 && (
                  <div className="bg-blue-50/40 border border-blue-100 rounded-2xl p-4 text-[12px] text-slate-600 leading-relaxed flex items-start gap-2.5 my-2">
                    <Icon name="helpCircle" className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      {getDynamicSummaryText()}
                    </div>
                  </div>
                )}
              </div>

              <div className="p-6 border-t border-[var(--line)] bg-white">
                <button
                  type="button"
                  onClick={savePricingTier}
                  className="w-full flex items-center justify-center rounded-2xl bg-black px-6 py-4 text-[14px] font-bold text-white hover:opacity-90 transition-all shadow-[0_4px_14px_0_rgba(0,0,0,0.25)] active:scale-[0.98]"
                >
                  Save Changes
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
