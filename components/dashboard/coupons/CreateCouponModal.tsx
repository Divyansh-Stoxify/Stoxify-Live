import React from "react";
import { Icon } from "@/components/stoxify-icon";

interface CreateCouponModalProps {
  onClose: () => void;
  onSelectType: (type: "PERCENTAGE" | "FLAT") => void;
}

export function CreateCouponModal({ onClose, onSelectType }: CreateCouponModalProps) {
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]">
      <div className="w-full max-w-[500px] overflow-hidden rounded-2xl bg-white shadow-2xl animate-[scaleIn_0.2s_ease-out]">
        <div className="flex items-center justify-between border-b border-[var(--line)] px-6 py-4">
          <h2 className="text-[16px] font-extrabold text-[var(--ink)] tracking-tight">
            Choose coupon type
          </h2>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--muted-2)] hover:bg-slate-100 hover:text-[var(--ink)] transition-colors cursor-pointer"
          >
            <Icon className="h-4 w-4" name="x" />
          </button>
        </div>

        <div className="p-6 flex flex-col gap-4">
          <button
            onClick={() => onSelectType("PERCENTAGE")}
            className="flex items-start gap-4 rounded-xl border border-[var(--line)] p-4 text-left hover:border-pink-300 hover:bg-pink-50/50 transition-all cursor-pointer group"
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-pink-100 text-pink-500 group-hover:scale-105 transition-transform">
              <Icon className="h-5 w-5" name="ticket" />
            </div>
            <div className="flex flex-col gap-1 mt-0.5">
              <span className="text-[14px] font-bold text-[var(--ink)]">Percentage Discount</span>
              <span className="text-[12.5px] text-[var(--muted-2)] font-medium">
                Offer a percentage discount to your customers
              </span>
            </div>
          </button>

          <button
            onClick={() => onSelectType("FLAT")}
            className="flex items-start gap-4 rounded-xl border border-[var(--line)] p-4 text-left hover:border-emerald-300 hover:bg-emerald-50/50 transition-all cursor-pointer group"
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-500 group-hover:scale-105 transition-transform">
              <Icon className="h-5 w-5" name="banknote" />
            </div>
            <div className="flex flex-col gap-1 mt-0.5">
              <span className="text-[14px] font-bold text-[var(--ink)]">Flat Discount</span>
              <span className="text-[12.5px] text-[var(--muted-2)] font-medium">
                Offer a fixed discount to your customers
              </span>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
