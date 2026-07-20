"use client";

import { useState } from "react";
import Link from "next/link";
import { SubscriptionPlan } from "@/lib/types/analyst";
import { ChevronDown, X } from "lucide-react";

function PlansModal({ plan, onClose }: { plan: SubscriptionPlan; onClose: () => void }) {
  const batches = plan.batches || [];

  return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
        onClick={onClose}
      >
        <div
          className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-2xl rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-lg">{plan.name}</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Available Subscriptions</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-400 dark:text-slate-500"
            >
              <X size={20} />
            </button>
          </div>

          <div className="p-4 bg-slate-50/50 dark:bg-slate-800/20 max-h-[60vh] overflow-y-auto space-y-3">
            {batches.map((batch) => (
              <div
                key={batch.batch_id}
                className="bg-white/40 dark:bg-slate-800/40 backdrop-blur-lg border border-slate-200 dark:border-slate-700 rounded-xl p-4 flex items-center justify-between shadow-sm"
              >
              <div>
                <div className="font-bold text-slate-900 dark:text-white text-[15px]">{batch.name}</div>
                <div className="text-[12px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                  <span className="font-bold text-slate-700 dark:text-slate-300">₹{batch.price}</span> /{" "}
                  {batch.billing_cycle.toLowerCase()}
                </div>
              </div>
              <Link
                href={`/checkout/${plan.plan_id}?batch=${batch.batch_id}`}
                className="px-4 py-2 bg-[var(--brand)] text-white text-[13px] font-bold rounded-lg hover:bg-[var(--brand-dark)] transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                Subscribe
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function BatchListClient({ plans }: { plans: SubscriptionPlan[] }) {
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {plans.map((plan) => {
          const batches = plan.batches || [];
          const minPrice = batches.length > 0 ? Math.min(...batches.map((b) => b.price)) : 0;

          return (
            <div
              key={plan.plan_id}
              className="bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl border border-slate-200 dark:border-slate-800 flex flex-col h-full hover:shadow-lg dark:hover:shadow-slate-900/70 transition-shadow overflow-hidden cursor-pointer rounded-2xl"
              onClick={() => batches.length > 0 && setSelectedPlan(plan)}
            >
              <div className="p-6 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">{plan.name}</h3>
                    {plan.description && (
                      <p className="text-[13px] text-slate-500 dark:text-slate-400 mt-2 line-clamp-2">
                        {plan.description}
                      </p>
                    )}
                  </div>
                </div>

                <div className="mt-auto pt-6 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-[12px] text-slate-500 dark:text-slate-400 font-medium">Plans start from</span>
                    <div className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">₹{minPrice}</div>
                  </div>
                  <span className="px-3 py-1.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-[12px] font-bold rounded-lg">
                    {batches.length} {batches.length === 1 ? "Plan" : "Plans"}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {selectedPlan && <PlansModal plan={selectedPlan} onClose={() => setSelectedPlan(null)} />}
    </>
  );
}
