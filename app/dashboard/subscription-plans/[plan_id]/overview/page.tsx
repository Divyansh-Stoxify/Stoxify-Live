"use client";

import React, { use, useState, useEffect } from "react";
import { Icon } from "@/components/stoxify-icon";
import { useAnalystCoupons } from "@/lib/hooks/use-analyst-dashboard";

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function getInitials(name?: string): string {
  if (!name || !name.trim()) return "S";
  return name.trim().split(/\s+/).filter(Boolean).map((n) => n[0]).join("").slice(0, 2).toUpperCase();
}

const AVATAR_GRADIENTS = [
  "linear-gradient(135deg, #3B82F6, #1D4ED8)",
  "linear-gradient(135deg, #10B981, #047857)",
  "linear-gradient(135deg, #F59E0B, #D97706)",
  "linear-gradient(135deg, #EF4444, #B91C1C)",
  "linear-gradient(135deg, #8B5CF6, #6D28D9)",
];

function avatarGradient(name?: string) {
  const safeName = name?.trim() || "Subscriber";
  const idx = safeName.charCodeAt(0) % AVATAR_GRADIENTS.length;
  return AVATAR_GRADIENTS[idx];
}

export default function BatchOverviewPage({ params }: { params: Promise<{ plan_id: string }> }) {
  const { plan_id } = use(params);
  const { coupons, isLoading: isCouponsLoading } = useAnalystCoupons(plan_id);
  
  const [subscribers, setSubscribers] = useState<any[]>([]);
  const [isSubscribersLoading, setIsSubscribersLoading] = useState(true);

  useEffect(() => {
    async function fetchSubscribers() {
      setIsSubscribersLoading(true);
      try {
        const res = await fetch(`/api/analyst/subscribers?plan_id=${plan_id}&limit=10`, {
          credentials: "same-origin",
          cache: "no-store",
        });
        if (res.ok) {
          const json = await res.json();
          const list = json.subscriptions ?? json.data ?? json ?? [];
          setSubscribers(Array.isArray(list) ? list : []);
        }
      } catch (err) {
        console.error("Failed to fetch recent subscribers", err);
      } finally {
        setIsSubscribersLoading(false);
      }
    }
    void fetchSubscribers();
  }, [plan_id]);

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="max-w-[1000px]">
        {/* Metric Cards Row */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-white border border-[var(--line)] rounded-xl p-4 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
              <Icon className="h-16 w-16 text-[var(--brand)]" name="eye" />
            </div>
            <div className="flex items-center gap-2 mb-2">
              <div className="h-6 w-6 rounded-full bg-amber-50 flex items-center justify-center border border-amber-100">
                <Icon className="h-3.5 w-3.5 text-amber-500" name="eye" />
              </div>
              <span className="text-[12px] font-bold tracking-wide text-[var(--muted)] flex items-center gap-1">
                Page Views <Icon className="h-3 w-3" name="helpCircle" />
              </span>
            </div>
            <div className="text-[24px] font-black text-[var(--ink)] tracking-tight">
              1
            </div>
          </div>

          <div className="bg-white border border-[var(--line)] rounded-xl p-4 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
              <Icon className="h-16 w-16 text-emerald-600" name="rupee" />
            </div>
            <div className="flex items-center gap-2 mb-2">
              <div className="h-6 w-6 rounded-full bg-emerald-50 flex items-center justify-center border border-emerald-100">
                <Icon className="h-3.5 w-3.5 text-emerald-600" name="rupee" />
              </div>
              <span className="text-[12px] font-bold tracking-wide text-[var(--muted)] flex items-center gap-1">
                Total Sales <Icon className="h-3 w-3" name="helpCircle" />
              </span>
            </div>
            <div className="text-[24px] font-black text-[var(--ink)] tracking-tight">
              ₹0
            </div>
          </div>

          <div className="bg-white border border-[var(--line)] rounded-xl p-4 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
              <Icon className="h-16 w-16 text-blue-600" name="users" />
            </div>
            <div className="flex items-center gap-2 mb-2">
              <div className="h-6 w-6 rounded-full bg-blue-50 flex items-center justify-center border border-blue-100">
                <Icon className="h-3.5 w-3.5 text-blue-600" name="users" />
              </div>
              <span className="text-[12px] font-bold tracking-wide text-[var(--muted)] flex items-center gap-1">
                Total Subscriptions <Icon className="h-3 w-3" name="helpCircle" />
              </span>
            </div>
            <div className="text-[24px] font-black text-[var(--ink)] tracking-tight">
              --
            </div>
          </div>

          <div className="bg-white border border-[var(--line)] rounded-xl p-4 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
              <Icon className="h-16 w-16 text-red-600" name="activity" />
            </div>
            <div className="flex items-center gap-2 mb-2">
              <div className="h-6 w-6 rounded-full bg-red-50 flex items-center justify-center border border-red-100">
                <Icon className="h-3.5 w-3.5 text-red-600" name="activity" />
              </div>
              <span className="text-[12px] font-bold tracking-wide text-[var(--muted)] flex items-center gap-1">
                Churn Rate <Icon className="h-3 w-3" name="helpCircle" />
              </span>
            </div>
            <div className="text-[24px] font-black text-[var(--ink)] tracking-tight">
              0%
            </div>
          </div>
        </div>

        {/* Widgets Row */}
        <div className="grid grid-cols-3 gap-6">
          <div className="bg-white border border-[var(--line)] rounded-xl p-5 shadow-sm min-h-[300px] flex flex-col">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-[13px] font-bold tracking-wide text-[var(--muted)] flex items-center gap-1.5">
                Top Members <Icon className="h-3.5 w-3.5" name="helpCircle" />
              </h3>
              <Icon className="h-3.5 w-3.5 text-[var(--muted-2)]" name="arrowRight" style={{ transform: "rotate(-45deg)" }} />
            </div>
            
            <div className="flex-1 flex flex-col overflow-y-auto pr-1">
              {isSubscribersLoading ? (
                <div className="space-y-3">
                  <div className="h-10 rounded bg-[var(--line)] animate-pulse w-full"></div>
                  <div className="h-10 rounded bg-[var(--line)] animate-pulse w-full"></div>
                </div>
              ) : subscribers.length > 0 ? (
                <div className="flex flex-col gap-3">
                  {subscribers.slice(0, 5).map((sub) => (
                    <div key={sub.subscription_id} className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded-lg transition-colors border border-transparent hover:border-[var(--line)]">
                      {sub.user_avatar ? (
                        <img alt={sub.user_name} className="h-9 w-9 shrink-0 rounded-full object-cover border border-[var(--line)]" src={sub.user_avatar} />
                      ) : (
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[11px] font-extrabold text-white" style={{ background: avatarGradient(sub.user_name) }}>
                          {getInitials(sub.user_name)}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="text-[13px] font-bold text-[var(--ink)] truncate">{sub.user_name}</div>
                        <div className="text-[11.5px] text-[var(--muted-2)] truncate mt-0.5">{sub.user_email || "No email"}</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center py-4">
                  <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center mb-3">
                    <Icon className="h-5 w-5 text-slate-400" name="users" />
                  </div>
                  <h4 className="text-[13px] font-bold text-[var(--ink)] mb-1">No members yet</h4>
                  <p className="text-[11.5px] text-[var(--muted-2)] max-w-[180px] leading-relaxed">
                    No one has subscribed to your batch yet.
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white border border-[var(--line)] rounded-xl p-5 shadow-sm min-h-[300px] flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-[13px] font-bold tracking-wide text-[var(--muted)] flex items-center gap-1.5">
                Recent Transactions <Icon className="h-3.5 w-3.5" name="helpCircle" />
              </h3>
              <Icon className="h-3.5 w-3.5 text-[var(--muted-2)]" name="arrowRight" style={{ transform: "rotate(-45deg)" }} />
            </div>
            <div className="flex-1 flex flex-col overflow-y-auto pr-1">
              {isSubscribersLoading ? (
                <div className="space-y-3">
                  <div className="h-10 rounded bg-[var(--line)] animate-pulse w-full"></div>
                  <div className="h-10 rounded bg-[var(--line)] animate-pulse w-full"></div>
                </div>
              ) : subscribers.length > 0 ? (
                <div className="flex flex-col gap-3">
                  {subscribers.slice(0, 5).map((sub) => (
                    <div key={sub.subscription_id} className="flex items-center justify-between p-2 hover:bg-slate-50 rounded-lg transition-colors border border-transparent hover:border-[var(--line)]">
                      <div className="flex items-center gap-2.5 min-w-0 pr-2">
                         <div className="h-8 w-8 rounded-full bg-emerald-50 flex items-center justify-center shrink-0 border border-emerald-100">
                           <Icon className="h-3.5 w-3.5 text-emerald-500" name="receipt" />
                         </div>
                         <div className="min-w-0">
                           <div className="text-[12.5px] font-bold text-[var(--ink)] truncate">{sub.user_name}</div>
                           <div className="text-[11px] text-[var(--muted-2)] truncate mt-0.5">{sub.plan_name}</div>
                         </div>
                      </div>
                      <div className="text-[13px] font-black text-emerald-600 shrink-0">
                        +{formatCurrency(sub.amount ?? 0)}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center py-4">
                  <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center mb-3">
                    <Icon className="h-5 w-5 text-slate-400" name="receipt" />
                  </div>
                  <h4 className="text-[13px] font-bold text-[var(--ink)] mb-1">No transactions</h4>
                  <p className="text-[11.5px] text-[var(--muted-2)] max-w-[180px] leading-relaxed">
                    No transactions have been made yet.
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white border border-[var(--line)] rounded-xl p-5 shadow-sm min-h-[300px] flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[13px] font-bold tracking-wide text-[var(--muted)] flex items-center gap-1.5">
                Discounts <Icon className="h-3.5 w-3.5" name="helpCircle" />
              </h3>
              <Icon className="h-3.5 w-3.5 text-[var(--muted-2)]" name="arrowRight" style={{ transform: "rotate(-45deg)" }} />
            </div>
            
            {/* Real Discount Data */}
            <div className="mt-2 flex-1 overflow-y-auto pr-1">
              {isCouponsLoading ? (
                <div className="space-y-2">
                  <div className="h-8 rounded bg-[var(--line)] animate-pulse w-full"></div>
                  <div className="h-8 rounded bg-[var(--line)] animate-pulse w-full"></div>
                </div>
              ) : coupons && coupons.length > 0 ? (
                <>
                  <div className="grid grid-cols-2 text-[10px] font-bold uppercase tracking-wider text-[var(--muted-2)] bg-slate-50 px-3 py-2 rounded-lg mb-2">
                    <div>CODE</div>
                    <div className="text-right">TIMES USED</div>
                  </div>
                  <div className="flex flex-col gap-2">
                    {coupons.slice(0, 5).map((coupon) => (
                      <div key={coupon.code} className="grid grid-cols-2 items-center text-[12px] font-semibold text-[var(--ink)] px-3 py-2 border border-[var(--line)] rounded-lg shadow-sm bg-white hover:border-pink-200 hover:bg-pink-50/30 transition-colors">
                        <div className="flex items-center gap-1.5 truncate pr-2">
                          <div className="h-4 w-4 shrink-0 rounded-full bg-pink-100 flex items-center justify-center">
                            <Icon className="h-2.5 w-2.5 text-pink-500" name="ticket" />
                          </div>
                          <span className="truncate" title={coupon.code}>{coupon.code}</span>
                        </div>
                        <div className="text-right">{coupon.quantity_used || 0}</div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center py-6">
                  <Icon className="h-8 w-8 text-slate-300 mb-2" name="ticket" />
                  <p className="text-[12px] text-[var(--muted-2)]">No active coupons available.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
