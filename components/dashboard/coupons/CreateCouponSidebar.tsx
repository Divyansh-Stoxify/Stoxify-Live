/* eslint-disable react-hooks/set-state-in-effect */
import React, { useState, useEffect, useRef } from "react";
import { Icon } from "@/components/stoxify-icon";
import { useSubscriptionPlans, Coupon } from "@/hooks/use-analyst-dashboard";

interface CreateCouponSidebarProps {
  type: "PERCENTAGE" | "FLAT";
  onClose: () => void;
  onSave: () => void;
  showSuccessToast: (title: string, msg: string) => void;
  editCoupon?: Coupon | null;
}

export function CreateCouponSidebar({ type, onClose, onSave, showSuccessToast, editCoupon }: CreateCouponSidebarProps) {
  const isEditMode = !!editCoupon;
  const { plans } = useSubscriptionPlans();

  const getTodayString = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const todayStr = getTodayString();

  const [code, setCode] = useState("");
  const [isCaseInsensitive, setIsCaseInsensitive] = useState(false);
  const [selectedPlans, setSelectedPlans] = useState<string[]>([]);
  const [discountValue, setDiscountValue] = useState("");
  const [availability, setAvailability] = useState<"EVERYONE" | "NEW_USER" | "EXISTING_USER" | "SPECIFIC">("EVERYONE");
  const [quantity, setQuantity] = useState<"UNLIMITED" | "LIMITED">("UNLIMITED");
  const [quantityTotal, setQuantityTotal] = useState("");
  const [validFrom, setValidFrom] = useState(todayStr);
  const [validTo, setValidTo] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [subscribers, setSubscribers] = useState<{ user_id: string; user_name: string; user_email: string; user_avatar?: string }[]>([]);
  const [isLoadingSubscribers, setIsLoadingSubscribers] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [batchScope, setBatchScope] = useState<"ALL" | "SPECIFIC">("ALL");
  const [batchSearchQuery, setBatchSearchQuery] = useState("");
  const [batchDropdownOpen, setBatchDropdownOpen] = useState(false);
  const batchDropdownRef = useRef<HTMLDivElement>(null);

  const [selectedPricingPlans, setSelectedPricingPlans] = useState<string[]>([]);
  const [pricingSearchQuery, setPricingSearchQuery] = useState("");
  const [pricingDropdownOpen, setPricingDropdownOpen] = useState(false);
  const pricingDropdownRef = useRef<HTMLDivElement>(null);

  // Pre-fill state when editing
  useEffect(() => {
    if (!editCoupon || plans.length === 0) return;
    setCode(editCoupon.code.toUpperCase());
    setIsCaseInsensitive(editCoupon.is_case_insensitive);
    setDiscountValue(String(editCoupon.discount_value));
    setAvailability(editCoupon.availability);
    setQuantity(editCoupon.quantity_total != null ? "LIMITED" : "UNLIMITED");
    setQuantityTotal(editCoupon.quantity_total != null ? String(editCoupon.quantity_total) : "");
    if (editCoupon.valid_from) setValidFrom(editCoupon.valid_from.substring(0, 10));
    if (editCoupon.valid_to) setValidTo(editCoupon.valid_to.substring(0, 10));
    if (editCoupon.user_ids && editCoupon.user_ids.length > 0) {
      setSelectedUsers(editCoupon.user_ids);
    }
    const planIds = editCoupon.plan_ids || [];
    if (planIds.length > 0) {
      setBatchScope("SPECIFIC");
      const batchGroupIds = planIds.filter((id) => id.startsWith("PLAN_"));
      const pricingIds = planIds.filter((id) => id.startsWith("batch_"));
      setSelectedPlans(batchGroupIds);
      setSelectedPricingPlans(pricingIds);
    } else {
      setBatchScope("ALL");
    }
  }, [editCoupon, plans]);

  useEffect(() => {
    let active = true;
    async function loadSubscribers() {
      setIsLoadingSubscribers(true);
      try {
        const res = await fetch("/api/analyst/subscribers?limit=1000");
        if (!res.ok) throw new Error();
        const json = await res.json();
        const rawList = json.subscriptions || json.data || json || [];
        const uniqueUsers: any[] = [];
        const seenIds = new Set<string>();
        for (const s of rawList) {
          if (s.user_id && !seenIds.has(s.user_id)) {
            seenIds.add(s.user_id);
            uniqueUsers.push(s);
          }
        }
        if (active) {
          setSubscribers(uniqueUsers);
        }
      } catch (err) {
        console.error("Failed to load subscribers", err);
      } finally {
        if (active) {
          setIsLoadingSubscribers(false);
        }
      }
    }

    if (availability === "SPECIFIC") {
      void loadSubscribers();
    }

    return () => {
      active = false;
    };
  }, [availability]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
      if (batchDropdownRef.current && !batchDropdownRef.current.contains(event.target as Node)) {
        setBatchDropdownOpen(false);
      }
      if (pricingDropdownRef.current && !pricingDropdownRef.current.contains(event.target as Node)) {
        setPricingDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // user_name/user_email can be missing (phone-OTP signups have no email)
  const filteredSubscribers = subscribers.filter((sub) => {
    const q = userSearchQuery.toLowerCase();
    return (
      (sub.user_name || "").toLowerCase().includes(q) ||
      (sub.user_email || "").toLowerCase().includes(q)
    );
  });

  const handleToggleUser = (userId: string) => {
    setSelectedUsers((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  const handleRemoveUser = (userId: string) => {
    setSelectedUsers((prev) => prev.filter((id) => id !== userId));
  };

  // Flatten all pricing batches across all plans/batch groups
  const allBatches = (plans || []).flatMap((p) =>
    (p.batches || []).map((b) => ({
      ...b,
      plan_name: p.name,
      plan_id: p.plan_id,
    }))
  );

  const getBatchDisplayName = (batchName: string, planName: string) => {
    const hasDuplicate = plans.some((p) =>
      p.name !== planName &&
      (p.batches || []).some((b) => b.name.toLowerCase() === batchName.toLowerCase())
    );
    return hasDuplicate ? `${batchName} (${planName})` : batchName;
  };

  const filteredPlans = plans.filter((p) =>
    p.name.toLowerCase().includes(batchSearchQuery.toLowerCase())
  );

  const handleTogglePlan = (planId: string) => {
    setSelectedPlans((prev) => {
      const next = prev.includes(planId)
        ? prev.filter((id) => id !== planId)
        : [...prev, planId];
      // Clean up selectedPricingPlans whose parent plan is not in next
      setSelectedPricingPlans((curr) =>
        curr.filter((bId) => {
          const batch = allBatches.find((b) => b.batch_id === bId);
          return batch && next.includes(batch.plan_id);
        })
      );
      return next;
    });
  };

  const handleRemovePlan = (planId: string) => {
    setSelectedPlans((prev) => {
      const next = prev.filter((id) => id !== planId);
      // Clean up selectedPricingPlans
      setSelectedPricingPlans((curr) =>
        curr.filter((bId) => {
          const batch = allBatches.find((b) => b.batch_id === bId);
          return batch && next.includes(batch.plan_id);
        })
      );
      return next;
    });
  };

  const eligiblePricingPlans = allBatches.filter((b) => selectedPlans.includes(b.plan_id));

  const filteredPricingBatches = eligiblePricingPlans.filter((b) => {
    const q = pricingSearchQuery.toLowerCase();
    return b.name.toLowerCase().includes(q) || b.plan_name.toLowerCase().includes(q);
  });

  const handleTogglePricingPlan = (batchId: string) => {
    setSelectedPricingPlans((prev) =>
      prev.includes(batchId)
        ? prev.filter((id) => id !== batchId)
        : [...prev, batchId]
    );
  };

  const handleRemovePricingPlan = (batchId: string) => {
    setSelectedPricingPlans((prev) => prev.filter((id) => id !== batchId));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!code.trim()) newErrors.code = "Coupon code is required";
    if (!discountValue) newErrors.discountValue = "Discount value is required";
    else if (type === "PERCENTAGE" && (Number(discountValue) <= 0 || Number(discountValue) > 100)) {
      newErrors.discountValue = "Percentage must be between 1 and 100";
    }

    if (quantity === "LIMITED" && (!quantityTotal || Number(quantityTotal) <= 0)) {
      newErrors.quantityTotal = "Valid quantity is required";
    }

    if (availability === "SPECIFIC" && selectedUsers.length === 0) {
      newErrors.users = "At least one specific user must be selected";
    }

    if (batchScope === "SPECIFIC" && selectedPlans.length === 0) {
      newErrors.plans = "At least one batch must be selected";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    const payload = {
      // Coupon code is immutable after creation — never send it on update
      ...(isEditMode ? {} : { code: code.trim().toUpperCase() }),
      type,
      discount_value: Number(discountValue),
      plan_ids: batchScope === "SPECIFIC" ? [...selectedPlans, ...selectedPricingPlans] : [],
      availability,
      user_ids: availability === "SPECIFIC" ? selectedUsers : [],
      quantity_total: quantity === "UNLIMITED" ? null : Number(quantityTotal),
      valid_from: validFrom || undefined,
      valid_to: validTo || undefined,
      is_case_insensitive: isCaseInsensitive,
    };

    try {
      const url = isEditMode
        ? `/api/analyst/plans/coupons/${editCoupon!.coupon_id}`
        : "/api/analyst/plans/coupons";
      const method = isEditMode ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Failed to ${isEditMode ? "update" : "create"} coupon`);
      }

      showSuccessToast(
        isEditMode ? "Coupon Updated" : "Coupon Created",
        `Coupon ${code} has been ${isEditMode ? "updated" : "created"} successfully.`
      );
      onSave();
      onClose();
    } catch (err: any) {
      setErrors({ form: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-[200] bg-black/20 backdrop-blur-sm transition-opacity" onClick={onClose} />
      <div className="fixed inset-y-0 right-0 z-[210] w-[400px] bg-white shadow-2xl flex flex-col animate-[slideInRight_0.2s_ease-out]">
        <div className="flex items-center gap-3 border-b border-[var(--line)] px-6 py-5">
          <button onClick={onClose} className="text-[var(--muted)] hover:text-[var(--ink)] transition-colors cursor-pointer">
            <Icon className="h-4 w-4" name="chevronRight" style={{ transform: "rotate(180deg)" }} />
          </button>
          <h2 className="text-[16px] font-extrabold text-[var(--ink)] tracking-tight">
            {isEditMode ? "Edit Coupon" : (type === "PERCENTAGE" ? "Percentage Discount" : "Flat Discount")}
          </h2>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <form id="coupon-form" onSubmit={handleSubmit} className="flex flex-col gap-6">
            {errors.form && (
              <div className="rounded-lg bg-red-50 p-3 text-[12.5px] font-bold text-red-600 border border-red-200">
                {errors.form}
              </div>
            )}

            {/* Coupon Code */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-bold text-[var(--ink)]">Coupon Code</label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                autoCapitalize="characters"
                disabled={isEditMode}
                className={`w-full rounded-xl border px-4 py-2.5 text-[13px] font-semibold outline-none transition-all focus:ring-2 focus:ring-[var(--brand)]/20 uppercase ${
                  errors.code ? "border-red-400" : "border-[var(--line)] focus:border-[var(--brand)]"
                } ${isEditMode ? "bg-slate-100 text-[var(--muted)] cursor-not-allowed" : ""}`}
                placeholder="Enter coupon code"
                maxLength={20}
              />
              {isEditMode && (
                <span className="text-[11px] text-[var(--muted-2)] font-medium">
                  Coupon code cannot be changed
                </span>
              )}
              {errors.code && <span className="text-[11px] font-bold text-red-500">{errors.code}</span>}
            </div>

            {/* Case Insensitive Toggle */}
            <div className="flex items-center justify-between">
              <label className="text-[12px] font-bold text-[var(--ink)]">Make Coupon Code Case InSensitive</label>
              <button
                type="button"
                role="switch"
                aria-checked={isCaseInsensitive}
                onClick={() => setIsCaseInsensitive(!isCaseInsensitive)}
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  isCaseInsensitive ? "bg-[var(--brand)]" : "bg-slate-200"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    isCaseInsensitive ? "translate-x-4" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            {/* Select Batch */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-bold text-[var(--ink)]">Select Batch Scope</label>
              <select
                className="w-full rounded-xl border border-[var(--line)] bg-white px-4 py-2.5 text-[13px] font-semibold outline-none focus:border-[var(--brand)]"
                value={batchScope}
                onChange={(e) => {
                  const val = e.target.value as "ALL" | "SPECIFIC";
                  setBatchScope(val);
                  if (val === "ALL") {
                    setSelectedPlans([]);
                    setSelectedPricingPlans([]);
                  }
                }}
              >
                <option value="ALL">All batches selected</option>
                <option value="SPECIFIC">Specific Batches</option>
              </select>
            </div>

            {batchScope === "SPECIFIC" && (
              <>
                {/* Field 1: Select Batches */}
                <div className="flex flex-col gap-1.5 relative" ref={batchDropdownRef}>
                  <label className="text-[12px] font-bold text-[var(--ink)]">Select Batches</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={batchSearchQuery}
                      onChange={(e) => {
                        setBatchSearchQuery(e.target.value);
                        setBatchDropdownOpen(true);
                      }}
                      onFocus={() => setBatchDropdownOpen(true)}
                      placeholder="Search batches..."
                      className={`w-full rounded-xl border pl-10 pr-4 py-2.5 text-[13px] font-semibold outline-none transition-all focus:ring-2 focus:ring-[var(--brand)]/20 ${
                        errors.plans ? "border-red-400" : "border-[var(--line)] focus:border-[var(--brand)]"
                      }`}
                    />
                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--muted)]">
                      <Icon className="h-4 w-4" name="search" />
                    </div>
                  </div>
                  {errors.plans && <span className="text-[11px] font-bold text-red-500">{errors.plans}</span>}

                  {/* Selected Batches Badges */}
                  {selectedPlans.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-1 max-h-28 overflow-y-auto p-1 bg-slate-50 rounded-xl border border-[var(--line)]">
                      {selectedPlans.map((planId) => {
                        const plan = plans.find((p) => p.plan_id === planId);
                        return (
                          <div
                            key={planId}
                            className="flex items-center gap-1 bg-white border border-slate-200 rounded-full px-2.5 py-1 text-[11px] font-bold text-[var(--ink)] shadow-sm"
                          >
                            <span className="truncate max-w-[150px]">{plan?.name || "Unknown Batch"}</span>
                            <button
                              type="button"
                              onClick={() => handleRemovePlan(planId)}
                              className="text-slate-400 hover:text-slate-600 focus:outline-none ml-1 cursor-pointer"
                            >
                              <Icon className="h-2.5 w-2.5" name="x" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Dropdown Options for Batches */}
                  {batchDropdownOpen && (
                    <div className="absolute top-[calc(100%+4px)] left-0 z-20 w-full bg-white border border-[var(--line)] rounded-xl shadow-xl max-h-52 overflow-y-auto">
                      {filteredPlans.length === 0 ? (
                        <div className="p-4 text-center text-xs text-[var(--muted)] font-semibold">
                          No batches found
                        </div>
                      ) : (
                        <div className="py-1">
                          {filteredPlans.map((plan) => {
                            const isSelected = selectedPlans.includes(plan.plan_id);
                            return (
                              <button
                                key={plan.plan_id}
                                type="button"
                                onClick={() => handleTogglePlan(plan.plan_id)}
                                className="w-full flex items-center justify-between px-4 py-2.5 text-left hover:bg-slate-50 transition-colors cursor-pointer"
                              >
                                <span className="text-[12.5px] font-bold text-[var(--ink)] truncate mr-2">{plan.name}</span>
                                {isSelected && (
                                  <Icon className="h-3.5 w-3.5 text-[var(--brand)] shrink-0" name="check" />
                                )}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Field 2: Select Pricing Plans */}
                <div className="flex flex-col gap-1.5 relative" ref={pricingDropdownRef}>
                  <label className="text-[12px] font-bold text-[var(--ink)] flex items-center justify-between">
                    <span>Select Pricing Plans (Optional)</span>
                    {selectedPlans.length > 0 && (
                      <span className="text-[10px] text-[var(--brand)] font-extrabold uppercase tracking-wider">
                        {eligiblePricingPlans.length} Available
                      </span>
                    )}
                  </label>
                  
                  {selectedPlans.length === 0 ? (
                    <div className="w-full rounded-xl border border-dashed border-[var(--line)] bg-slate-50/50 px-4 py-3 text-[12px] font-semibold text-[var(--muted)] text-center">
                      Select at least one batch above first
                    </div>
                  ) : (
                    <>
                      <div className="relative">
                        <input
                          type="text"
                          value={pricingSearchQuery}
                          onChange={(e) => {
                            setPricingSearchQuery(e.target.value);
                            setPricingDropdownOpen(true);
                          }}
                          onFocus={() => setPricingDropdownOpen(true)}
                          placeholder="Search pricing plans (e.g. Yearly)..."
                          className="w-full rounded-xl border pl-10 pr-4 py-2.5 text-[13px] font-semibold outline-none transition-all focus:ring-2 focus:ring-[var(--brand)]/20 border-[var(--line)] focus:border-[var(--brand)]"
                        />
                        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--muted)]">
                          <Icon className="h-4 w-4" name="search" />
                        </div>
                      </div>

                      {/* Selected Pricing Badges */}
                      {selectedPricingPlans.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-1 max-h-28 overflow-y-auto p-1 bg-slate-50 rounded-xl border border-[var(--line)]">
                          {selectedPricingPlans.map((batchId) => {
                            const pricing = eligiblePricingPlans.find((b) => b.batch_id === batchId);
                            const displayName = pricing
                              ? getBatchDisplayName(pricing.name, pricing.plan_name)
                              : "Unknown Plan";
                            return (
                              <div
                                key={batchId}
                                className="flex items-center gap-1 bg-white border border-slate-200 rounded-full px-2.5 py-1 text-[11px] font-bold text-[var(--ink)] shadow-sm"
                              >
                                <span className="truncate max-w-[150px]">{displayName}</span>
                                <button
                                  type="button"
                                  onClick={() => handleRemovePricingPlan(batchId)}
                                  className="text-slate-400 hover:text-slate-600 focus:outline-none ml-1 cursor-pointer"
                                >
                                  <Icon className="h-2.5 w-2.5" name="x" />
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Dropdown Options for Pricing Plans */}
                      {pricingDropdownOpen && (
                        <div className="absolute top-[calc(100%+4px)] left-0 z-20 w-full bg-white border border-[var(--line)] rounded-xl shadow-xl max-h-52 overflow-y-auto">
                          {filteredPricingBatches.length === 0 ? (
                            <div className="p-4 text-center text-xs text-[var(--muted)] font-semibold">
                              No pricing plans found
                            </div>
                          ) : (
                            <div className="py-1">
                              {filteredPricingBatches.map((batch) => {
                                const isSelected = selectedPricingPlans.includes(batch.batch_id);
                                const displayName = getBatchDisplayName(batch.name, batch.plan_name);
                                return (
                                  <button
                                    key={batch.batch_id}
                                    type="button"
                                    onClick={() => handleTogglePricingPlan(batch.batch_id)}
                                    className="w-full flex items-center justify-between px-4 py-2.5 text-left hover:bg-slate-50 transition-colors cursor-pointer"
                                  >
                                    <span className="text-[12.5px] font-bold text-[var(--ink)] truncate mr-2">{displayName}</span>
                                    {isSelected && (
                                      <Icon className="h-3.5 w-3.5 text-[var(--brand)] shrink-0" name="check" />
                                    )}
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </>
            )}

            {/* Discount Value */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-bold text-[var(--ink)]">
                {type === "PERCENTAGE" ? "Discount Percentage" : "Discount Amount"}
              </label>
              <div className="relative">
                {type === "FLAT" && (
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[13px] font-bold text-[var(--muted)]">
                    ₹
                  </span>
                )}
                <input
                  type="number"
                  value={discountValue}
                  onChange={(e) => setDiscountValue(e.target.value)}
                  className={`w-full rounded-xl border px-4 py-2.5 text-[13px] font-semibold outline-none transition-all focus:ring-2 focus:ring-[var(--brand)]/20 ${
                    type === "FLAT" ? "pl-8" : ""
                  } ${errors.discountValue ? "border-red-400" : "border-[var(--line)] focus:border-[var(--brand)]"}`}
                  placeholder={type === "PERCENTAGE" ? "Enter percentage" : "Enter value"}
                />
                {type === "PERCENTAGE" && (
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[13px] font-bold text-[var(--muted)]">
                    %
                  </span>
                )}
              </div>
              {errors.discountValue && <span className="text-[11px] font-bold text-red-500">{errors.discountValue}</span>}
            </div>

            {/* Offer Availability */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-bold text-[var(--ink)]">Offer Availability</label>
              <select
                value={availability}
                onChange={(e) => setAvailability(e.target.value as "EVERYONE" | "NEW_USER" | "EXISTING_USER" | "SPECIFIC")}
                className="w-full rounded-xl border border-[var(--line)] bg-white px-4 py-2.5 text-[13px] font-semibold outline-none focus:border-[var(--brand)]"
              >
                <option value="EVERYONE">Everyone</option>
                <option value="NEW_USER">New Users</option>
                <option value="EXISTING_USER">Existing Users</option>
                <option value="SPECIFIC">Specific Users</option>
              </select>
              <span className="text-[11px] text-[var(--muted-2)] font-medium">
                {availability === "EVERYONE" && "Offer available to everyone"}
                {availability === "NEW_USER" && "Only users who have never subscribed to you can redeem this"}
                {availability === "EXISTING_USER" && "Only your current or past subscribers can redeem this"}
                {availability === "SPECIFIC" && "Offer available only to the users you select below"}
              </span>
            </div>

            {availability === "SPECIFIC" && (
              <div className="flex flex-col gap-1.5 relative" ref={dropdownRef}>
                <label className="text-[12px] font-bold text-[var(--ink)]">Select Users</label>
                <div className="relative">
                  <input
                    type="text"
                    value={userSearchQuery}
                    onChange={(e) => {
                      setUserSearchQuery(e.target.value);
                      setDropdownOpen(true);
                    }}
                    onFocus={() => setDropdownOpen(true)}
                    placeholder="Search users by name or email..."
                    className={`w-full rounded-xl border pl-10 pr-4 py-2.5 text-[13px] font-semibold outline-none transition-all focus:ring-2 focus:ring-[var(--brand)]/20 ${
                      errors.users ? "border-red-400" : "border-[var(--line)] focus:border-[var(--brand)]"
                    }`}
                  />
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--muted)]">
                    <Icon className="h-4 w-4" name="search" />
                  </div>
                </div>
                {errors.users && <span className="text-[11px] font-bold text-red-500">{errors.users}</span>}

                {/* Selected Users Badges */}
                {selectedUsers.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-1 max-h-28 overflow-y-auto p-1 bg-slate-50 rounded-xl border border-[var(--line)]">
                    {selectedUsers.map((userId) => {
                      const user = subscribers.find((s) => s.user_id === userId);
                      return (
                        <div
                          key={userId}
                          className="flex items-center gap-1 bg-white border border-slate-200 rounded-full px-2.5 py-1 text-[11px] font-bold text-[var(--ink)] shadow-sm"
                        >
                          {user?.user_avatar ? (
                            <img src={user.user_avatar} alt="" className="h-3.5 w-3.5 rounded-full object-cover" />
                          ) : (
                            <div className="h-3.5 w-3.5 rounded-full bg-[var(--brand)]/10 text-[var(--brand)] flex items-center justify-center text-[8px] font-bold uppercase">
                              {(user?.user_name || "U")[0]}
                            </div>
                          )}
                          <span className="truncate max-w-[120px]">{user?.user_name || user?.user_email || "User"}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveUser(userId)}
                            className="text-slate-400 hover:text-slate-600 focus:outline-none ml-1 cursor-pointer"
                          >
                            <Icon className="h-2.5 w-2.5" name="x" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Dropdown Options */}
                {dropdownOpen && (
                  <div className="absolute top-[calc(100%+4px)] left-0 z-10 w-full bg-white border border-[var(--line)] rounded-xl shadow-xl max-h-56 overflow-y-auto">
                    {isLoadingSubscribers ? (
                      <div className="p-4 text-center text-xs text-[var(--muted)] flex items-center justify-center gap-2">
                        <Icon className="h-4 w-4 animate-spin text-[var(--brand)]" name="loader" />
                        <span>Loading users...</span>
                      </div>
                    ) : filteredSubscribers.length === 0 ? (
                      <div className="p-4 text-center text-xs text-[var(--muted)] font-semibold">
                        No users found
                      </div>
                    ) : (
                      <div className="py-1">
                        {filteredSubscribers.map((sub) => {
                          const isSelected = selectedUsers.includes(sub.user_id);
                          return (
                            <button
                              key={sub.user_id}
                              type="button"
                              onClick={() => handleToggleUser(sub.user_id)}
                              className="w-full flex items-center justify-between px-4 py-2 text-left hover:bg-slate-50 transition-colors cursor-pointer"
                            >
                              <div className="flex items-center gap-3">
                                {sub.user_avatar ? (
                                  <img src={sub.user_avatar} alt="" className="h-6 w-6 rounded-full object-cover" />
                                ) : (
                                  <div className="h-6 w-6 rounded-full bg-[var(--brand)]/10 text-[var(--brand)] flex items-center justify-center text-xs font-bold uppercase">
                                    {(sub.user_name || "U")[0]}
                                  </div>
                                )}
                                <div className="flex flex-col min-w-0">
                                  <span className="text-[12.5px] font-bold text-[var(--ink)] truncate">{sub.user_name || "Subscriber"}</span>
                                  {sub.user_email && (
                                    <span className="text-[11px] text-[var(--muted-2)] font-semibold truncate">{sub.user_email}</span>
                                  )}
                                </div>
                              </div>
                              {isSelected && (
                                <Icon className="h-3.5 w-3.5 text-[var(--brand)]" name="check" />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Available Quantity */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-bold text-[var(--ink)]">Available Quantity</label>
              <select
                value={quantity}
                onChange={(e) => setQuantity(e.target.value as "UNLIMITED" | "LIMITED")}
                className="w-full rounded-xl border border-[var(--line)] bg-white px-4 py-2.5 text-[13px] font-semibold outline-none focus:border-[var(--brand)]"
              >
                <option value="UNLIMITED">Unlimited</option>
                <option value="LIMITED">Limited</option>
              </select>
              {quantity === "LIMITED" && (
                <div className="mt-2">
                  <input
                    type="number"
                    value={quantityTotal}
                    onChange={(e) => setQuantityTotal(e.target.value)}
                    className={`w-full rounded-xl border px-4 py-2.5 text-[13px] font-semibold outline-none transition-all ${
                      errors.quantityTotal ? "border-red-400" : "border-[var(--line)] focus:border-[var(--brand)]"
                    }`}
                    placeholder="Enter maximum usage"
                  />
                  {errors.quantityTotal && (
                    <span className="text-[11px] font-bold text-red-500 mt-1 block">{errors.quantityTotal}</span>
                  )}
                </div>
              )}
            </div>

            {/* Coupon Validity */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-bold text-[var(--ink)]">Coupon Validity</label>
              <div className="rounded-xl border border-[var(--line)] p-4 flex flex-col gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-bold text-[var(--muted)]">From</label>
                  <input
                    type="date"
                    value={validFrom}
                    min={todayStr}
                    onChange={(e) => {
                      setValidFrom(e.target.value);
                      if (validTo && e.target.value > validTo) {
                        setValidTo("");
                      }
                    }}
                    className="w-full rounded-lg border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-[12.5px] font-semibold outline-none focus:border-[var(--brand)]"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-bold text-[var(--muted)]">To (Optional)</label>
                  <input
                    type="date"
                    value={validTo}
                    min={validFrom || todayStr}
                    onChange={(e) => setValidTo(e.target.value)}
                    className="w-full rounded-lg border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-[12.5px] font-semibold outline-none focus:border-[var(--brand)]"
                  />
                </div>
              </div>
            </div>
          </form>
        </div>

        <div className="border-t border-[var(--line)] p-4 bg-slate-50 flex justify-end">
          <button
            type="submit"
            form="coupon-form"
            disabled={isSubmitting}
            className="rounded-full bg-black px-6 py-2.5 text-[13px] font-bold text-white hover:opacity-90 transition-opacity disabled:opacity-50 cursor-pointer shadow-md"
          >
            {isSubmitting ? (isEditMode ? "Updating..." : "Creating...") : (isEditMode ? "Update Coupon" : "Create Coupon")}
          </button>
        </div>
      </div>
    </>
  );
}

