"use client";

import React, { use, useState, useEffect } from "react";
import Link from "next/link";
import { Icon } from "@/components/stoxify-icon";
import { useAnalystCoupons } from "@/hooks/use-analyst-dashboard";

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

export default function PlanOverviewPage({ params }: { params: Promise<{ plan_id: string }> }) {
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
          {/* Card 1: Page Views */}
          <div className="bg-white border border-[var(--line)] rounded-2xl p-5 shadow-[0_1px_4px_rgba(0,0,0,0.03)] hover:shadow-[0_12px_24px_rgba(0,0,0,0.04)] hover:-translate-y-0.5 transition-all duration-300 relative overflow-hidden group flex flex-col justify-between min-h-[120px]">
            {/* Top Accent line on hover */}
            <div className="absolute top-0 left-0 right-0 h-[4px] transition-colors duration-300 bg-transparent group-hover:bg-amber-500" />
            
            {/* Watermark Icon */}
            <Icon className="absolute -right-4 -bottom-6 h-20 w-20 text-amber-500 opacity-[0.03] group-hover:opacity-[0.08] group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 ease-out pointer-events-none" name="eye" />
            
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-xl bg-amber-50 flex items-center justify-center border border-amber-100/50 text-amber-500 transition-transform duration-300 group-hover:scale-105">
                <Icon className="h-4 w-4" name="eye" />
              </div>
              <span className="text-[12.5px] font-medium text-[var(--muted)] flex items-center gap-1 group-hover:text-[var(--ink)] transition-colors">
                Page Views 
                <Icon className="h-3 w-3 text-[var(--muted-2)] opacity-40 hover:opacity-100 cursor-help transition-opacity" name="helpCircle" title="Total page views of this plan's landing page" />
              </span>
            </div>
            <div className="text-[32px] font-extrabold leading-none tracking-tight text-[var(--ink)] mt-3.5 tabular-nums">
              1
            </div>
          </div>

          {/* Card 2: Total Sales */}
          <div className="bg-white border border-[var(--line)] rounded-2xl p-5 shadow-[0_1px_4px_rgba(0,0,0,0.03)] hover:shadow-[0_12px_24px_rgba(0,0,0,0.04)] hover:-translate-y-0.5 transition-all duration-300 relative overflow-hidden group flex flex-col justify-between min-h-[120px]">
            {/* Top Accent line on hover */}
            <div className="absolute top-0 left-0 right-0 h-[4px] transition-colors duration-300 bg-transparent group-hover:bg-emerald-500" />
            
            {/* Watermark Icon */}
            <Icon className="absolute -right-4 -bottom-6 h-20 w-20 text-emerald-500 opacity-[0.03] group-hover:opacity-[0.08] group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 ease-out pointer-events-none" name="rupee" />
            
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-xl bg-emerald-50 flex items-center justify-center border border-emerald-100/50 text-emerald-500 transition-transform duration-300 group-hover:scale-105">
                <Icon className="h-4 w-4" name="rupee" />
              </div>
              <span className="text-[12.5px] font-medium text-[var(--muted)] flex items-center gap-1 group-hover:text-[var(--ink)] transition-colors">
                Total Sales 
                <Icon className="h-3 w-3 text-[var(--muted-2)] opacity-40 hover:opacity-100 cursor-help transition-opacity" name="helpCircle" title="Total revenue generated from subscribers of this plan" />
              </span>
            </div>
            <div className="text-[32px] font-extrabold leading-none tracking-tight text-[var(--ink)] mt-3.5 tabular-nums">
              ₹0
            </div>
          </div>

          {/* Card 3: Total Subscriptions */}
          <div className="bg-white border border-[var(--line)] rounded-2xl p-5 shadow-[0_1px_4px_rgba(0,0,0,0.03)] hover:shadow-[0_12px_24px_rgba(0,0,0,0.04)] hover:-translate-y-0.5 transition-all duration-300 relative overflow-hidden group flex flex-col justify-between min-h-[120px]">
            {/* Top Accent line on hover */}
            <div className="absolute top-0 left-0 right-0 h-[4px] transition-colors duration-300 bg-transparent group-hover:bg-blue-500" />
            
            {/* Watermark Icon */}
            <Icon className="absolute -right-4 -bottom-6 h-20 w-20 text-blue-500 opacity-[0.03] group-hover:opacity-[0.08] group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 ease-out pointer-events-none" name="users" />
            
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-xl bg-blue-50 flex items-center justify-center border border-blue-100/50 text-blue-500 transition-transform duration-300 group-hover:scale-105">
                <Icon className="h-4 w-4" name="users" />
              </div>
              <span className="text-[12.5px] font-medium text-[var(--muted)] flex items-center gap-1 group-hover:text-[var(--ink)] transition-colors">
                Total Subscriptions 
                <Icon className="h-3 w-3 text-[var(--muted-2)] opacity-40 hover:opacity-100 cursor-help transition-opacity" name="helpCircle" title="Total active subscribers in this plan" />
              </span>
            </div>
            <div className="text-[32px] font-extrabold leading-none tracking-tight text-[var(--ink)] mt-3.5 tabular-nums">
              --
            </div>
          </div>

          {/* Card 4: Churn Rate */}
          <div className="bg-white border border-[var(--line)] rounded-2xl p-5 shadow-[0_1px_4px_rgba(0,0,0,0.03)] hover:shadow-[0_12px_24px_rgba(0,0,0,0.04)] hover:-translate-y-0.5 transition-all duration-300 relative overflow-hidden group flex flex-col justify-between min-h-[120px]">
            {/* Top Accent line on hover */}
            <div className="absolute top-0 left-0 right-0 h-[4px] transition-colors duration-300 bg-transparent group-hover:bg-red-500" />
            
            {/* Watermark Icon */}
            <Icon className="absolute -right-4 -bottom-6 h-20 w-20 text-red-500 opacity-[0.03] group-hover:opacity-[0.08] group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 ease-out pointer-events-none" name="activity" />
            
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-xl bg-red-50 flex items-center justify-center border border-red-100/50 text-red-500 transition-transform duration-300 group-hover:scale-105">
                <Icon className="h-4 w-4" name="activity" />
              </div>
              <span className="text-[12.5px] font-medium text-[var(--muted)] flex items-center gap-1 group-hover:text-[var(--ink)] transition-colors">
                Churn Rate 
                <Icon className="h-3 w-3 text-[var(--muted-2)] opacity-40 hover:opacity-100 cursor-help transition-opacity" name="helpCircle" title="Percentage of subscribers who cancelled their subscription" />
              </span>
            </div>
            <div className="text-[32px] font-extrabold leading-none tracking-tight text-[var(--ink)] mt-3.5 tabular-nums">
              0%
            </div>
          </div>
        </div>

        {/* Widgets Row */}
        <div className="grid grid-cols-3 gap-6">
          {/* Widget 1: Top Members */}
          <div className="bg-white border border-[var(--line)] rounded-2xl p-5 shadow-sm min-h-[320px] flex flex-col hover:shadow-[0_12px_24px_rgba(0,0,0,0.02)] transition-all duration-300 group/card">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-[14px] font-bold text-[var(--ink)] tracking-tight flex items-center gap-1.5">
                Top Members 
                <Icon className="h-3 w-3 text-[var(--muted-2)] opacity-40 hover:opacity-100 cursor-help transition-opacity" name="helpCircle" title="List of members currently subscribed to this plan workspace" />
              </h3>
              <Link 
                href={`/dashboard/subscription-plans/${plan_id}/members`}
                className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-50 border border-slate-100 text-[var(--muted-2)] hover:bg-[var(--brand-light)] hover:text-[var(--brand)] hover:border-[var(--brand)]/20 transition-all cursor-pointer"
              >
                <Icon className="h-3 w-3" name="arrowRight" style={{ transform: "rotate(-45deg)" }} />
              </Link>
            </div>
            
            <div className="flex-1 flex flex-col overflow-y-auto pr-1 no-scrollbar">
              {isSubscribersLoading ? (
                <div className="space-y-3">
                  <div className="h-12 rounded-xl bg-[var(--line)]/50 animate-pulse w-full"></div>
                  <div className="h-12 rounded-xl bg-[var(--line)]/50 animate-pulse w-full"></div>
                </div>
              ) : subscribers.length > 0 ? (
                <div className="flex flex-col gap-2.5">
                  {subscribers.slice(0, 5).map((sub) => (
                    <div key={sub.subscription_id} className="flex items-center gap-3 p-2.5 hover:bg-slate-50/80 rounded-xl transition-all border border-transparent hover:border-[var(--line)]/50 group/item">
                      {sub.user_avatar ? (
                        <img alt={sub.user_name} className="h-9 w-9 shrink-0 rounded-xl object-cover border border-[var(--line)]/60 transition-transform duration-300 group-hover/item:scale-105" src={sub.user_avatar} />
                      ) : (
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-[11px] font-extrabold text-white transition-transform duration-300 group-hover/item:scale-105" style={{ background: avatarGradient(sub.user_name) }}>
                          {getInitials(sub.user_name)}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="text-[13px] font-bold text-[var(--ink)] truncate group-hover/item:text-[var(--brand)] transition-colors">{sub.user_name}</div>
                        <div className="text-[11px] text-[var(--muted-2)] truncate mt-0.5">{sub.user_email || "No email"}</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center py-4">
                  <div className="h-12 w-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center mb-3 text-slate-400 transition-transform duration-300 group-hover/card:scale-105">
                    <Icon className="h-5 w-5" name="users" />
                  </div>
                  <h4 className="text-[13.5px] font-bold text-[var(--ink)] mb-0.5">No members yet</h4>
                  <p className="text-[11.5px] text-[var(--muted-2)] max-w-[180px] leading-relaxed">
                    No one has subscribed to your plan yet.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Widget 2: Recent Transactions */}
          <div className="bg-white border border-[var(--line)] rounded-2xl p-5 shadow-sm min-h-[320px] flex flex-col hover:shadow-[0_12px_24px_rgba(0,0,0,0.02)] transition-all duration-300 group/card">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-[14px] font-bold text-[var(--ink)] tracking-tight flex items-center gap-1.5">
                Recent Transactions 
                <Icon className="h-3 w-3 text-[var(--muted-2)] opacity-40 hover:opacity-100 cursor-help transition-opacity" name="helpCircle" title="Recent billing history and subscription payments" />
              </h3>
              <Link 
                href={`/dashboard/subscription-plans/${plan_id}/transactions`}
                className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-50 border border-slate-100 text-[var(--muted-2)] hover:bg-[var(--brand-light)] hover:text-[var(--brand)] hover:border-[var(--brand)]/20 transition-all cursor-pointer"
              >
                <Icon className="h-3 w-3" name="arrowRight" style={{ transform: "rotate(-45deg)" }} />
              </Link>
            </div>
            
            <div className="flex-1 flex flex-col overflow-y-auto pr-1 no-scrollbar">
              {isSubscribersLoading ? (
                <div className="space-y-3">
                  <div className="h-12 rounded-xl bg-[var(--line)]/50 animate-pulse w-full"></div>
                  <div className="h-12 rounded-xl bg-[var(--line)]/50 animate-pulse w-full"></div>
                </div>
              ) : subscribers.length > 0 ? (
                <div className="flex flex-col gap-2.5">
                  {subscribers.slice(0, 5).map((sub) => (
                    <div key={sub.subscription_id} className="flex items-center justify-between p-2.5 hover:bg-slate-50/80 rounded-xl transition-all border border-transparent hover:border-[var(--line)]/50 group/item">
                      <div className="flex items-center gap-3 min-w-0 pr-2">
                         <div className="h-9 w-9 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0 border border-emerald-100/50 text-emerald-600 transition-transform duration-300 group-hover/item:scale-105">
                           <Icon className="h-4 w-4" name="receipt" />
                         </div>
                         <div className="min-w-0">
                           <div className="text-[13px] font-bold text-[var(--ink)] truncate group-hover/item:text-[var(--brand)] transition-colors">{sub.user_name}</div>
                           <div className="text-[11.5px] text-[var(--muted-2)] truncate mt-0.5">{sub.plan_name}</div>
                         </div>
                      </div>
                      <div className="text-[12.5px] font-bold text-emerald-700 shrink-0 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-100/30 shadow-2xs">
                        +{formatCurrency(sub.amount ?? 0)}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center py-4">
                  <div className="h-12 w-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center mb-3 text-slate-400 transition-transform duration-300 group-hover/card:scale-105">
                    <Icon className="h-5 w-5" name="receipt" />
                  </div>
                  <h4 className="text-[13.5px] font-bold text-[var(--ink)] mb-0.5">No transactions</h4>
                  <p className="text-[11.5px] text-[var(--muted-2)] max-w-[180px] leading-relaxed">
                    No transactions have been made yet.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Widget 3: Discounts */}
          <div className="bg-white border border-[var(--line)] rounded-2xl p-5 shadow-sm min-h-[320px] flex flex-col hover:shadow-[0_12px_24px_rgba(0,0,0,0.02)] transition-all duration-300 group/card">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-[14px] font-bold text-[var(--ink)] tracking-tight flex items-center gap-1.5">
                Discounts 
                <Icon className="h-3 w-3 text-[var(--muted-2)] opacity-40 hover:opacity-100 cursor-help transition-opacity" name="helpCircle" title="Active coupons and discount campaigns for this plan" />
              </h3>
              <Link 
                href={`/dashboard/subscription-plans/${plan_id}/discounts`}
                className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-50 border border-slate-100 text-[var(--muted-2)] hover:bg-[var(--brand-light)] hover:text-[var(--brand)] hover:border-[var(--brand)]/20 transition-all cursor-pointer"
              >
                <Icon className="h-3 w-3" name="arrowRight" style={{ transform: "rotate(-45deg)" }} />
              </Link>
            </div>
            
            <div className="flex-1 flex flex-col overflow-y-auto pr-1 no-scrollbar">
              {isCouponsLoading ? (
                <div className="space-y-3">
                  <div className="h-12 rounded-xl bg-[var(--line)]/50 animate-pulse w-full"></div>
                  <div className="h-12 rounded-xl bg-[var(--line)]/50 animate-pulse w-full"></div>
                </div>
              ) : coupons && coupons.length > 0 ? (
                <div className="flex flex-col gap-2.5">
                  {coupons.slice(0, 5).map((coupon) => (
                    <div key={coupon.code} className="flex items-center justify-between text-[12.5px] font-semibold text-[var(--ink)] px-3.5 py-2.5 border border-dashed border-[var(--line)] rounded-xl bg-slate-50/35 hover:border-pink-300 hover:bg-pink-50/20 transition-all duration-200 group/coupon">
                      <div className="flex items-center gap-2 min-w-0 pr-2">
                        <div className="h-6 w-6 shrink-0 rounded-lg bg-pink-50 border border-pink-100/50 flex items-center justify-center text-pink-500 transition-transform group-hover/coupon:scale-105">
                          <Icon className="h-3 w-3" name="ticket" />
                        </div>
                        <span className="font-mono font-bold tracking-wider truncate text-[13px] text-[var(--ink)]" title={coupon.code}>{coupon.code}</span>
                      </div>
                      <div className="text-[11px] font-bold text-[var(--muted)] bg-white border border-[var(--line)] px-2 py-0.5 rounded-full shadow-2xs shrink-0">
                        {coupon.quantity_used || 0} used
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center py-4">
                  <div className="h-12 w-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center mb-3 text-slate-400 transition-transform duration-300 group-hover/card:scale-105">
                    <Icon className="h-5 w-5" name="ticket" />
                  </div>
                  <h4 className="text-[13.5px] font-bold text-[var(--ink)] mb-0.5">No active coupons</h4>
                  <p className="text-[11.5px] text-[var(--muted-2)] max-w-[180px] leading-relaxed">
                    No active discounts are available for this plan yet.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
