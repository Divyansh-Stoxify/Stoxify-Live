import React, { useState } from "react";
import { Icon } from "@/components/stoxify-icon";
import { useSubscriptionPlans } from "@/hooks/use-analyst-dashboard";

interface CreateCouponSidebarProps {
  type: "PERCENTAGE" | "FLAT";
  onClose: () => void;
  onSave: () => void;
  showSuccessToast: (title: string, msg: string) => void;
}

export function CreateCouponSidebar({ type, onClose, onSave, showSuccessToast }: CreateCouponSidebarProps) {
  const { plans } = useSubscriptionPlans();

  const [code, setCode] = useState("");
  const [isCaseInsensitive, setIsCaseInsensitive] = useState(false);
  const [selectedPlans, setSelectedPlans] = useState<string[]>([]);
  const [discountValue, setDiscountValue] = useState("");
  const [availability, setAvailability] = useState<"EVERYONE" | "SPECIFIC">("EVERYONE");
  const [quantity, setQuantity] = useState<"UNLIMITED" | "LIMITED">("UNLIMITED");
  const [quantityTotal, setQuantityTotal] = useState("");
  const [validFrom, setValidFrom] = useState("");
  const [validTo, setValidTo] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

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

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      const res = await fetch("/api/analyst/plans/coupons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: code.trim(),
          type,
          discount_value: Number(discountValue),
          plan_ids: selectedPlans.length > 0 ? selectedPlans : [],
          availability,
          quantity_total: quantity === "UNLIMITED" ? null : Number(quantityTotal),
          valid_from: validFrom || undefined,
          valid_to: validTo || undefined,
          is_case_insensitive: isCaseInsensitive,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to create coupon");
      }

      showSuccessToast("Coupon Created", `Coupon ${code} has been created successfully.`);
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
            {type === "PERCENTAGE" ? "Percentage Discount" : "Flat Discount"}
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
                onChange={(e) => setCode(e.target.value)}
                className={`w-full rounded-xl border px-4 py-2.5 text-[13px] font-semibold outline-none transition-all focus:ring-2 focus:ring-[var(--brand)]/20 ${
                  errors.code ? "border-red-400" : "border-[var(--line)] focus:border-[var(--brand)]"
                }`}
                placeholder="Enter coupon code"
                maxLength={20}
              />
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
              <label className="text-[12px] font-bold text-[var(--ink)]">Select Batch</label>
              <select
                className="w-full rounded-xl border border-[var(--line)] bg-white px-4 py-2.5 text-[13px] font-semibold outline-none focus:border-[var(--brand)]"
                value={selectedPlans.length === 0 ? "ALL" : selectedPlans[0]}
                onChange={(e) => {
                  if (e.target.value === "ALL") setSelectedPlans([]);
                  else setSelectedPlans([e.target.value]);
                }}
              >
                <option value="ALL">All plans selected</option>
                {plans.map((p) => (
                  <option key={p.plan_id} value={p.plan_id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

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
                onChange={(e) => setAvailability(e.target.value as "EVERYONE" | "SPECIFIC")}
                className="w-full rounded-xl border border-[var(--line)] bg-white px-4 py-2.5 text-[13px] font-semibold outline-none focus:border-[var(--brand)]"
              >
                <option value="EVERYONE">Everyone</option>
                <option value="SPECIFIC">Specific Users</option>
              </select>
              <span className="text-[11px] text-[var(--muted-2)] font-medium">
                Offer available to {availability === "EVERYONE" ? "Everyone" : "Specific Users"}
              </span>
            </div>

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
                    onChange={(e) => setValidFrom(e.target.value)}
                    className="w-full rounded-lg border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-[12.5px] font-semibold outline-none focus:border-[var(--brand)]"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-bold text-[var(--muted)]">To (Optional)</label>
                  <input
                    type="date"
                    value={validTo}
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
            {isSubmitting ? "Creating..." : "Create Coupon"}
          </button>
        </div>
      </div>
    </>
  );
}

