"use client";

import React, { use, useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Topbar } from "@/components/dashboard/topbar";
import { Icon } from "@/components/stoxify-icon";
import { useDashboard } from "@/components/dashboard/dashboard-context";
import { CouponDrawer } from "@/components/analyst/coupon-drawer";
import type { SubscriptionPlan, PlanBatch, PlanBillingCycle } from "@/lib/types/analyst";

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
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

  // Drawer / Form state
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isCouponDrawerOpen, setIsCouponDrawerOpen] = useState(false);
  const [editingBatchId, setEditingBatchId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [planType, setPlanType] = useState<"SUBSCRIPTION" | "LIFETIME">("SUBSCRIPTION");
  const [price, setPrice] = useState("");
  const [offerDiscount, setOfferDiscount] = useState(false);
  const [discountedPrice, setDiscountedPrice] = useState("");
  const [days, setDays] = useState("30");
  const [billingCycle, setBillingCycle] = useState<PlanBillingCycle>("MONTH");
  const [description, setDescription] = useState("");
  const [isActive, setIsActive] = useState(true);

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const descriptionRef = useRef<HTMLTextAreaElement>(null);

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
      // Map old batches without plan_type
      const loadedBatches = (data.batches ?? []).map((b: any) => ({
        ...b,
        plan_type: b.plan_type || "SUBSCRIPTION",
      }));
      setBatches(loadedBatches);
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

  const handleBillingCycleChange = (cycle: PlanBillingCycle) => {
    setBillingCycle(cycle);
    if (cycle === "WEEK") setDays("7");
    else if (cycle === "MONTH") setDays("30");
    else if (cycle === "QUARTER") setDays("90");
    else if (cycle === "YEAR") setDays("365");
  };

  const resetForm = () => {
    setEditingBatchId(null);
    setName("");
    setPlanType("SUBSCRIPTION");
    setPrice("");
    setOfferDiscount(false);
    setDiscountedPrice("");
    setDays("30");
    setBillingCycle("MONTH");
    setDescription("");
    setIsActive(true);
    setFormErrors({});
  };

  const handleSaveBatchToList = (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};

    if (!name.trim()) errors.name = "Plan name is required";

    const priceNum = parseFloat(price);
    if (isNaN(priceNum) || priceNum < 0) {
      errors.price = "Enter a valid non-negative price";
    }

    let discountNum: number | undefined;
    if (offerDiscount) {
      discountNum = parseFloat(discountedPrice);
      if (isNaN(discountNum) || discountNum < 0) {
        errors.discountedPrice = "Enter a valid discounted price";
      } else if (discountNum >= priceNum) {
        errors.discountedPrice = "Discounted price must be less than original price";
      }
    }

    let daysNum = 0;
    if (planType === "SUBSCRIPTION") {
      daysNum = parseInt(days);
      if (isNaN(daysNum) || daysNum <= 0) {
        errors.days = "Enter a valid positive duration in days";
      }
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setFormErrors({});

    const batchData: PlanBatch = {
      batch_id: editingBatchId || "batch_" + Math.random().toString(36).substring(2, 11),
      name: name.trim(),
      plan_type: planType,
      price: priceNum,
      discounted_price: offerDiscount ? discountNum : undefined,
      days: daysNum,
      billing_cycle: planType === "LIFETIME" ? "YEAR" : billingCycle, // Default billing for lifetime
      description: description.trim(),
      is_active: isActive,
    };

    if (editingBatchId) {
      setBatches((prev) => prev.map((b) => (b.batch_id === editingBatchId ? batchData : b)));
    } else {
      setBatches((prev) => [...prev, batchData]);
    }

    setIsDrawerOpen(false);
    resetForm();
  };

  const startEditBatch = (batch: PlanBatch) => {
    setEditingBatchId(batch.batch_id);
    setName(batch.name);
    setPlanType(batch.plan_type || "SUBSCRIPTION");
    setPrice(batch.price.toString());
    setOfferDiscount(!!batch.discounted_price);
    setDiscountedPrice(batch.discounted_price ? batch.discounted_price.toString() : "");
    setDays((batch.days || 30).toString());
    setBillingCycle(batch.billing_cycle || "MONTH");
    setDescription(batch.description || "");
    setIsActive(batch.is_active !== false);
    setFormErrors({});
    setIsDrawerOpen(true);
  };

  const handleRemoveBatch = (id: string) => {
    if (confirm("Are you sure you want to delete this plan?")) {
      setBatches((prev) => prev.filter((b) => b.batch_id !== id));
      if (editingBatchId === id) {
        setIsDrawerOpen(false);
        resetForm();
      }
    }
  };

  const handleToggleBatchActive = (id: string) => {
    setBatches((prev) =>
      prev.map((b) =>
        b.batch_id === id ? { ...b, is_active: b.is_active === false ? true : false } : b
      )
    );
  };

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
            plan_type: b.plan_type,
            price: b.price,
            discounted_price: b.discounted_price,
            days: b.days,
            billing_cycle: b.billing_cycle,
            description: b.description,
            is_active: b.is_active !== false,
          })),
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? "Failed to save plan configurations");
      }

      showSuccessToast("Plans Saved Successfully", "Sub-plans have been updated.");
      fetchPlan();
    } catch (err: any) {
      showSuccessToast("Save Failed", err.message ?? "An error occurred.");
    } finally {
      setIsSaving(false);
    }
  };

  const insertMarkdown = (prefix: string, suffix: string = "") => {
    const textarea = descriptionRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const before = text.substring(0, start);
    const selected = text.substring(start, end);
    const after = text.substring(end);

    const newValue = before + prefix + selected + suffix + after;
    setDescription(newValue);
    
    // Reset focus and selection
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, end + prefix.length);
    }, 0);
  };

  // Compare batches exactly
  const hasUnsavedChanges = plan ? JSON.stringify(plan.batches ?? []) !== JSON.stringify(batches) : false;

  return (
    <div className="min-h-full flex flex-col bg-[#F9FAFB]">
      <Topbar title="Plans and Pricing" showUserProfile={true} />

      <div className="flex-1 flex max-h-[calc(100vh-64px)] overflow-hidden relative">
        {/* Main Content Area */}
        <div className={`flex-1 overflow-y-auto p-8 transition-all duration-300 ${isDrawerOpen ? 'mr-[420px]' : ''}`}>
          <div className="max-w-4xl mx-auto flex flex-col gap-8">
            
            {/* Header / Back Link */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => router.push("/dashboard/subscription-plans")}
                  className="p-2 rounded-full hover:bg-slate-200 transition-colors text-slate-600 cursor-pointer"
                >
                  <Icon className="h-5 w-5" name="arrowRight" style={{ transform: "rotate(180deg)" }} />
                </button>
                <div>
                  <h1 className="text-2xl font-black tracking-tight text-slate-900">
                    Plans and Pricing
                  </h1>
                  <p className="text-sm text-slate-500 font-medium">
                    {plan?.name ? `Manage sub-plans for ${plan.name}` : 'Loading...'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setIsCouponDrawerOpen(true)}
                  className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-2.5 text-[13px] font-bold text-slate-700 hover:bg-slate-50 transition-all cursor-pointer shadow-sm active:scale-95"
                >
                  <Icon className="h-4 w-4 text-indigo-500" name="ticket" />
                  <span>Coupons</span>
                </button>
                <button
                  onClick={() => {
                    resetForm();
                    setIsDrawerOpen(true);
                  }}
                  className="flex items-center gap-2 rounded-full bg-slate-900 px-5 py-2.5 text-[13px] font-bold text-white hover:bg-slate-800 transition-all cursor-pointer shadow-sm active:scale-95"
                >
                  <Icon className="h-4 w-4" name="plus" />
                  <span>Add another Plan</span>
                </button>
              </div>
            </div>

            {/* Error / Loading */}
            {isLoading && (
              <div className="flex justify-center p-12">
                <Icon className="h-8 w-8 text-slate-400 animate-spin" name="loader" />
              </div>
            )}
            {!isLoading && error && (
              <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">
                <h3 className="font-bold">Error</h3>
                <p className="text-sm mt-1">{error}</p>
                <button onClick={fetchPlan} className="mt-3 text-sm font-bold underline">Retry</button>
              </div>
            )}

            {/* Batches List */}
            {!isLoading && !error && (
              <div className="flex flex-col gap-4">
                {batches.length === 0 ? (
                  <div className="rounded-2xl border-2 border-dashed border-slate-200 p-12 text-center flex flex-col items-center gap-3">
                    <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-slate-400">
                      <Icon className="h-6 w-6" name="folder" />
                    </div>
                    <p className="text-slate-500 font-medium">No plans added yet.</p>
                  </div>
                ) : (
                  batches.map((batch) => {
                    const isActive = batch.is_active !== false;
                    const discountPct = batch.discounted_price ? Math.round(((batch.price - batch.discounted_price) / batch.price) * 100) : 0;
                    
                    return (
                      <div key={batch.batch_id} className={`rounded-2xl border bg-white p-5 shadow-sm transition-all flex items-center justify-between ${!isActive ? 'opacity-60 grayscale' : 'border-slate-200 hover:border-slate-300 hover:shadow-md'}`}>
                        <div className="flex items-start gap-4">
                          <div className="mt-1 text-slate-300">
                            <Icon className="h-5 w-5" name="grid" />
                          </div>
                          <div>
                            <h3 className="text-[16px] font-bold text-slate-900">{batch.name}</h3>
                            <div className="flex items-baseline gap-2 mt-1">
                              <span className="text-[14px] font-medium text-slate-700">
                                {batch.discounted_price ? formatCurrency(batch.discounted_price) : formatCurrency(batch.price)}
                              </span>
                              <span className="text-[13px] text-slate-500">
                                / {batch.plan_type === 'LIFETIME' ? 'Lifetime' : `${batch.days} Days`}
                              </span>
                              {batch.discounted_price && (
                                <>
                                  <span className="text-[12px] text-slate-400 line-through ml-1">{formatCurrency(batch.price)}</span>
                                  <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded ml-1">
                                    {discountPct}% off
                                  </span>
                                </>
                              )}
                            </div>
                            <p className="text-[12px] text-slate-500 mt-1">{batch.plan_type === 'SUBSCRIPTION' ? 'Subscription Plan' : 'Lifetime Access'}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-6">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => startEditBatch(batch)}
                              className="p-2 text-slate-400 hover:text-slate-800 transition-colors cursor-pointer"
                              title="Edit Plan"
                            >
                              <Icon className="h-4 w-4" name="edit" />
                            </button>
                            <button
                              onClick={() => handleRemoveBatch(batch.batch_id)}
                              className="p-2 text-red-300 hover:text-red-600 transition-colors cursor-pointer"
                              title="Delete Plan"
                            >
                              <Icon className="h-4 w-4" name="trash" />
                            </button>
                          </div>
                          <div className="w-px h-8 bg-slate-200"></div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" className="sr-only peer" checked={isActive} onChange={() => handleToggleBatchActive(batch.batch_id)} />
                            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                          </label>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {/* Save Button Row */}
            <div className="flex justify-end pt-8 pb-12 border-t border-slate-200 mt-8">
              <button
                disabled={!hasUnsavedChanges || isSaving}
                onClick={handlePersistChanges}
                className={`px-8 py-3 rounded-full text-[14px] font-bold shadow-md transition-all active:scale-95 flex items-center gap-2 cursor-pointer ${
                  hasUnsavedChanges ? "bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-600/20" : "bg-slate-200 text-slate-400 shadow-none cursor-not-allowed"
                }`}
              >
                {isSaving ? (
                  <><Icon className="h-4 w-4 animate-spin" name="loader" /> Saving...</>
                ) : (
                  "Save Changes"
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Side Drawer */}
        <div 
          className={`absolute top-0 right-0 h-full w-[420px] bg-white border-l border-slate-200 shadow-2xl transform transition-transform duration-300 ease-in-out flex flex-col z-10 ${
            isDrawerOpen ? "translate-x-0" : "translate-x-full"
          }`}
        >
          {/* Drawer Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
            <h2 className="text-[16px] font-extrabold flex items-center gap-2">
              <Icon className="h-4 w-4 text-slate-400" name="chevronRight" style={{ transform: "rotate(180deg)" }} />
              {editingBatchId ? "Edit Plan" : "New Plan"}
            </h2>
            <button 
              onClick={() => setIsDrawerOpen(false)}
              className="p-2 text-slate-400 hover:text-slate-800 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <Icon className="h-5 w-5" name="x" />
            </button>
          </div>

          {/* Drawer Content Form */}
          <div className="flex-1 overflow-y-auto px-6 py-6">
            <form id="plan-form" onSubmit={handleSaveBatchToList} className="flex flex-col gap-6">
              
              {/* Plan Name */}
              <div className="flex flex-col gap-2">
                <label className="text-[13px] font-bold text-slate-800">Plan Name</label>
                <div className="relative">
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => { setName(e.target.value); if(formErrors.name) setFormErrors(p => ({...p, name:""})) }}
                    placeholder="Give your plan a name"
                    className={`w-full rounded-lg border px-4 py-2.5 text-[14px] text-slate-900 outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-all ${formErrors.name ? 'border-red-400' : 'border-slate-200'}`}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-slate-400">{name.length}/75</span>
                </div>
                {formErrors.name && <span className="text-[11px] text-red-500 font-bold">{formErrors.name}</span>}
              </div>

              {/* Plan Type */}
              <div className="flex flex-col gap-3">
                <label className="text-[13px] font-bold text-slate-800">Plan Type</label>
                <div className="flex items-center gap-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="radio" 
                      checked={planType === "SUBSCRIPTION"} 
                      onChange={() => setPlanType("SUBSCRIPTION")}
                      className="w-4 h-4 accent-slate-900 cursor-pointer" 
                    />
                    <span className="text-[14px] text-slate-700">Subscription</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="radio" 
                      checked={planType === "LIFETIME"} 
                      onChange={() => setPlanType("LIFETIME")}
                      className="w-4 h-4 accent-slate-900 cursor-pointer" 
                    />
                    <span className="text-[14px] text-slate-700">Lifetime</span>
                  </label>
                </div>
              </div>

              {/* Duration (Subscription Only) */}
              {planType === "SUBSCRIPTION" && (
                <div className="flex gap-3">
                  <div className="flex-1">
                    <input
                      type="number"
                      value={days}
                      onChange={(e) => { setDays(e.target.value); if(formErrors.days) setFormErrors(p => ({...p, days:""})) }}
                      className={`w-full rounded-lg border px-4 py-2.5 text-[14px] text-slate-900 outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-all ${formErrors.days ? 'border-red-400' : 'border-slate-200'}`}
                    />
                  </div>
                  <div className="flex-[2]">
                    <select
                      value={billingCycle}
                      onChange={(e) => handleBillingCycleChange(e.target.value as PlanBillingCycle)}
                      className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-[14px] text-slate-900 outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 appearance-none bg-white cursor-pointer"
                    >
                      <option value="WEEK">Weeks</option>
                      <option value="MONTH">Months</option>
                      <option value="QUARTER">Quarters</option>
                      <option value="YEAR">Years</option>
                    </select>
                  </div>
                </div>
              )}
              {formErrors.days && planType === "SUBSCRIPTION" && <span className="text-[11px] text-red-500 font-bold -mt-4">{formErrors.days}</span>}

              {/* Pricing */}
              <div className="flex flex-col gap-2">
                <label className="text-[13px] font-bold text-slate-800">Plan Price</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[14px] font-bold text-slate-500">₹</span>
                  <input
                    type="number"
                    value={price}
                    onChange={(e) => { setPrice(e.target.value); if(formErrors.price) setFormErrors(p => ({...p, price:""})) }}
                    className={`w-full rounded-lg border pl-8 pr-4 py-2.5 text-[14px] text-slate-900 outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-all ${formErrors.price ? 'border-red-400' : 'border-slate-200'}`}
                  />
                </div>
                {formErrors.price && <span className="text-[11px] text-red-500 font-bold">{formErrors.price}</span>}
              </div>

              {/* Discount Checkbox */}
              <div className="flex flex-col gap-3">
                <label className="flex items-start gap-2 cursor-pointer group">
                  <input 
                    type="checkbox" 
                    checked={offerDiscount} 
                    onChange={(e) => setOfferDiscount(e.target.checked)}
                    className="mt-0.5 rounded border-slate-300 text-slate-900 focus:ring-slate-900 cursor-pointer" 
                  />
                  <span className="text-[13.5px] text-slate-700 group-hover:text-slate-900 transition-colors">Offer discounted price on plan price</span>
                </label>

                {offerDiscount && (
                  <div className="flex flex-col gap-2 ml-6">
                    <label className="text-[12px] font-bold text-slate-500">Discounted Price</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[14px] font-bold text-slate-500">₹</span>
                      <input
                        type="number"
                        value={discountedPrice}
                        onChange={(e) => { setDiscountedPrice(e.target.value); if(formErrors.discountedPrice) setFormErrors(p => ({...p, discountedPrice:""})) }}
                        className={`w-full rounded-lg border pl-8 pr-4 py-2.5 text-[14px] text-slate-900 outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-all ${formErrors.discountedPrice ? 'border-red-400' : 'border-slate-200'}`}
                      />
                    </div>
                    {formErrors.discountedPrice && <span className="text-[11px] text-red-500 font-bold">{formErrors.discountedPrice}</span>}
                  </div>
                )}
              </div>

              {/* Description (Rich Text Lite) */}
              <div className="flex flex-col gap-2 mt-2">
                <label className="text-[13px] font-bold text-slate-800">Description</label>
                <div className="border border-slate-200 rounded-lg overflow-hidden focus-within:border-slate-900 focus-within:ring-2 focus-within:ring-slate-900/10 transition-all">
                  <div className="flex items-center gap-1 bg-slate-50 border-b border-slate-200 p-1.5">
                    <button type="button" onClick={() => insertMarkdown("**", "**")} className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-200 rounded transition-colors" title="Bold"><Icon className="h-3.5 w-3.5" name="bold" /></button>
                    <button type="button" onClick={() => insertMarkdown("*", "*")} className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-200 rounded transition-colors" title="Italic"><Icon className="h-3.5 w-3.5" name="italic" /></button>
                    <div className="w-px h-4 bg-slate-300 mx-1"></div>
                    <button type="button" onClick={() => insertMarkdown("\n- ")} className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-200 rounded transition-colors" title="Bullet List"><Icon className="h-3.5 w-3.5" name="list" /></button>
                    <button type="button" onClick={() => insertMarkdown("[Link Text](url)")} className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-200 rounded transition-colors" title="Link"><Icon className="h-3.5 w-3.5" name="link" /></button>
                  </div>
                  <textarea
                    ref={descriptionRef}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe what's included..."
                    className="w-full h-32 p-4 text-[13.5px] text-slate-800 outline-none resize-y"
                  />
                </div>
              </div>

            </form>
          </div>

          {/* Drawer Footer Actions */}
          <div className="p-6 border-t border-slate-100 bg-white">
            <button
              type="submit"
              form="plan-form"
              className="w-full rounded-full bg-slate-900 py-3.5 text-[14px] font-bold text-white hover:bg-slate-800 shadow-md transition-all active:scale-95 cursor-pointer"
            >
              Save Plan
            </button>
          </div>
        </div>

        <CouponDrawer 
          isOpen={isCouponDrawerOpen} 
          onClose={() => setIsCouponDrawerOpen(false)} 
          planId={plan_id} 
        />
      </div>
    </div>
  );
}
