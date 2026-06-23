"use client";

import React, { useState, useEffect } from "react";
import { Icon } from "@/components/stoxify-icon";
import { useDashboard } from "@/components/dashboard/dashboard-context";

interface Coupon {
  _id?: string;
  code: string;
  type: "PERCENTAGE" | "FLAT";
  discount_value: number;
  availability: "EVERYONE" | "SPECIFIC";
  plan_ids: string[];
  quantity_total: number | null;
  quantity_used: number;
  valid_from: string | null;
  valid_to: string | null;
  is_active: boolean;
  is_case_insensitive: boolean;
}

interface CouponDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  planId: string;
}

export function CouponDrawer({ isOpen, onClose, planId }: CouponDrawerProps) {
  const { showSuccessToast } = useDashboard();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  const [view, setView] = useState<"LIST" | "CREATE_TYPE" | "CREATE_FORM">("LIST");
  
  // Form state
  const [code, setCode] = useState("");
  const [type, setType] = useState<"PERCENTAGE" | "FLAT">("PERCENTAGE");
  const [discountValue, setDiscountValue] = useState("");
  const [availability, setAvailability] = useState<"EVERYONE" | "SPECIFIC">("EVERYONE");
  const [quantityTotal, setQuantityTotal] = useState<string>("");
  const [validFrom, setValidFrom] = useState("");
  const [validTo, setValidTo] = useState("");
  const [isCaseInsensitive, setIsCaseInsensitive] = useState(true);

  const fetchCoupons = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/analyst/plans/coupons`);
      if (res.ok) {
        const data = await res.json();
        setCoupons(data);
      }
    } catch (e) {}
    setIsLoading(false);
  };

  useEffect(() => {
    if (isOpen) {
      setView("LIST");
      fetchCoupons();
    }
  }, [isOpen]);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this coupon?")) return;
    try {
      const res = await fetch(`/api/analyst/plans/coupons/${id}`, { method: "DELETE" });
      if (res.ok) {
        showSuccessToast("Deleted", "Coupon removed successfully");
        fetchCoupons();
      }
    } catch (e) {}
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code || !discountValue) return;

    try {
      const res = await fetch(`/api/analyst/plans/coupons`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
          type,
          discount_value: Number(discountValue),
          availability,
          plan_ids: availability === "SPECIFIC" ? [planId] : [],
          quantity_total: quantityTotal ? Number(quantityTotal) : null,
          valid_from: validFrom || null,
          valid_to: validTo || null,
          is_active: true,
          is_case_insensitive: isCaseInsensitive
        }),
      });

      if (res.ok) {
        showSuccessToast("Created", "Coupon created successfully");
        setView("LIST");
        fetchCoupons();
        // reset form
        setCode("");
        setDiscountValue("");
        setQuantityTotal("");
        setValidFrom("");
        setValidTo("");
      } else {
        showSuccessToast("Error", "Could not create coupon");
      }
    } catch (e) {}
  };

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-40 transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Drawer */}
      <div 
        className={`fixed top-0 right-0 h-full w-[450px] bg-white border-l border-slate-200 shadow-2xl transform transition-transform duration-300 ease-in-out flex flex-col z-50 ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {view === "LIST" && (
          <>
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
              <h2 className="text-[16px] font-extrabold flex items-center gap-2">
                <Icon className="h-5 w-5 text-indigo-500" name="ticket" />
                Manage Coupons
              </h2>
              <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-800 rounded-full hover:bg-slate-200 transition-colors">
                <Icon className="h-5 w-5" name="x" />
              </button>
            </div>
            
            <div className="p-6">
              <button
                onClick={() => setView("CREATE_TYPE")}
                className="w-full flex justify-center items-center gap-2 rounded-xl border-2 border-dashed border-indigo-200 bg-indigo-50/50 px-5 py-4 text-[14px] font-bold text-indigo-700 hover:bg-indigo-50 hover:border-indigo-300 transition-all cursor-pointer"
              >
                <Icon className="h-4 w-4" name="plus" />
                Create New Coupon
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 pb-6 flex flex-col gap-3">
              {isLoading ? (
                <div className="flex justify-center p-8"><Icon className="h-6 w-6 animate-spin text-slate-300" name="loader" /></div>
              ) : coupons.length === 0 ? (
                <div className="text-center p-8 text-slate-400 text-[14px]">No coupons created yet</div>
              ) : (
                coupons.map(c => (
                  <div key={c._id} className="border border-slate-200 rounded-xl p-4 flex justify-between items-center bg-white shadow-sm">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-[15px]">{c.code}</span>
                        <span className="text-[11px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                          {c.type === "PERCENTAGE" ? `${c.discount_value}% OFF` : `₹${c.discount_value} OFF`}
                        </span>
                      </div>
                      <div className="text-[12px] text-slate-500 mt-1">
                        Used: {c.quantity_used} {c.quantity_total ? `/ ${c.quantity_total}` : '(Unlimited)'}
                      </div>
                    </div>
                    <button 
                      onClick={() => handleDelete(c._id!)}
                      className="p-2 text-red-400 hover:bg-red-50 hover:text-red-600 rounded-full transition-colors"
                    >
                      <Icon className="h-4 w-4" name="trash" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </>
        )}

        {view === "CREATE_TYPE" && (
          <>
            <div className="flex items-center px-6 py-4 border-b border-slate-100 bg-slate-50 gap-3">
              <button onClick={() => setView("LIST")} className="p-1 text-slate-400 hover:text-slate-800 rounded transition-colors">
                <Icon className="h-5 w-5 rotate-180" name="arrowRight" />
              </button>
              <h2 className="text-[16px] font-extrabold">Choose Coupon Type</h2>
            </div>
            <div className="p-6 flex flex-col gap-4">
              <button onClick={() => { setType("PERCENTAGE"); setView("CREATE_FORM"); }} className="p-5 border border-slate-200 rounded-2xl hover:border-indigo-400 hover:shadow-md text-left transition-all bg-white group">
                <div className="font-bold text-slate-900 text-[15px] group-hover:text-indigo-600 transition-colors">Percentage Discount</div>
                <div className="text-slate-500 text-[13px] mt-1">e.g. 20% off all subscriptions</div>
              </button>
              <button onClick={() => { setType("FLAT"); setView("CREATE_FORM"); }} className="p-5 border border-slate-200 rounded-2xl hover:border-emerald-400 hover:shadow-md text-left transition-all bg-white group">
                <div className="font-bold text-slate-900 text-[15px] group-hover:text-emerald-600 transition-colors">Flat Discount</div>
                <div className="text-slate-500 text-[13px] mt-1">e.g. ₹500 off specific plan</div>
              </button>
            </div>
          </>
        )}

        {view === "CREATE_FORM" && (
          <>
            <div className="flex items-center px-6 py-4 border-b border-slate-100 bg-slate-50 gap-3">
              <button onClick={() => setView("CREATE_TYPE")} className="p-1 text-slate-400 hover:text-slate-800 rounded transition-colors">
                <Icon className="h-5 w-5 rotate-180" name="arrowRight" />
              </button>
              <h2 className="text-[16px] font-extrabold flex items-center gap-2">
                <Icon className="h-4 w-4 text-indigo-500" name={type === "PERCENTAGE" ? "badge" : "rupee"} />
                New {type === "PERCENTAGE" ? "Percentage" : "Flat"} Coupon
              </h2>
            </div>
            
            <div className="flex-1 overflow-y-auto px-6 py-6">
              <form id="coupon-form" onSubmit={handleCreate} className="flex flex-col gap-6">
                
                <div className="flex flex-col gap-2">
                  <label className="text-[13px] font-bold text-slate-800">Coupon Code</label>
                  <input
                    type="text"
                    required
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase().replace(/\s/g, ''))}
                    placeholder="e.g. SUMMER50"
                    className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-[14px] font-bold text-slate-900 outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 uppercase"
                  />
                  <label className="flex items-center gap-2 mt-1 cursor-pointer">
                    <input type="checkbox" checked={isCaseInsensitive} onChange={e => setIsCaseInsensitive(e.target.checked)} className="rounded border-slate-300 text-slate-900 focus:ring-slate-900" />
                    <span className="text-[12px] text-slate-500">Case insensitive</span>
                  </label>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-[13px] font-bold text-slate-800">Discount Value</label>
                  <div className="relative">
                    {type === "FLAT" && <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold">₹</span>}
                    <input
                      type="number"
                      required
                      min="1"
                      value={discountValue}
                      onChange={(e) => setDiscountValue(e.target.value)}
                      className={`w-full rounded-lg border border-slate-200 ${type === "FLAT" ? 'pl-8' : 'pl-4'} pr-8 py-2.5 text-[14px] text-slate-900 outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900`}
                    />
                    {type === "PERCENTAGE" && <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold">%</span>}
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-[13px] font-bold text-slate-800">Applies To</label>
                  <div className="grid grid-cols-2 gap-3">
                    <label className={`border rounded-lg p-3 cursor-pointer text-center text-[13px] font-bold transition-all ${availability === "EVERYONE" ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 text-slate-600 hover:bg-slate-50"}`}>
                      <input type="radio" className="hidden" checked={availability === "EVERYONE"} onChange={() => setAvailability("EVERYONE")} />
                      All Plans
                    </label>
                    <label className={`border rounded-lg p-3 cursor-pointer text-center text-[13px] font-bold transition-all ${availability === "SPECIFIC" ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 text-slate-600 hover:bg-slate-50"}`}>
                      <input type="radio" className="hidden" checked={availability === "SPECIFIC"} onChange={() => setAvailability("SPECIFIC")} />
                      This Plan Only
                    </label>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-[13px] font-bold text-slate-800">Usage Limit (Optional)</label>
                  <input
                    type="number"
                    min="1"
                    value={quantityTotal}
                    onChange={(e) => setQuantityTotal(e.target.value)}
                    placeholder="Unlimited"
                    className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-[14px] text-slate-900 outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900"
                  />
                  <div className="text-[11px] text-slate-500">Maximum number of times this coupon can be used.</div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <label className="text-[13px] font-bold text-slate-800">Valid From</label>
                    <input type="date" value={validFrom} onChange={e => setValidFrom(e.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-[13px] text-slate-900 outline-none focus:ring-2 focus:border-slate-900" />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-[13px] font-bold text-slate-800">Valid Until</label>
                    <input type="date" value={validTo} onChange={e => setValidTo(e.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-[13px] text-slate-900 outline-none focus:ring-2 focus:border-slate-900" />
                  </div>
                </div>

              </form>
            </div>

            <div className="p-6 border-t border-slate-100 bg-white">
              <button
                type="submit"
                form="coupon-form"
                className="w-full rounded-full bg-slate-900 py-3.5 text-[14px] font-bold text-white hover:bg-slate-800 shadow-md transition-all active:scale-95 cursor-pointer"
              >
                Create Coupon
              </button>
            </div>
          </>
        )}
      </div>
    </>
  );
}
