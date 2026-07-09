"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import Script from "next/script";

import { Icon } from "@/components/stoxify-icon";

type PlanBatch = {
  batch_id: string;
  name: string;
  price: number;
  discounted_price?: number;
  days: number;
  billing_cycle: string;
  is_active?: boolean;
};

type Plan = {
  plan_id: string;
  analyst_id: string;
  analyst_name: string;
  name: string;
  description?: string;
  days: number;
  price: number;
  segment?: string;
  segments?: string[];
  horizons?: string[];
  risk_level?: string;
  features?: string[];
  subscriber_count?: number;
  batches?: PlanBatch[];
};

type Trade = {
  trade_id: string;
  trade_type: string;
  symbol: string;
  segment: string;
  category: string;
  direction: string;
  entry_price: number;
  stop_loss: number;
  target?: number;
  targets?: { target_price: number; book_percent: number }[];
  exit_price?: number;
  status: string;
  pnl_percent?: number;
  entry_timestamp: string;
};

const gradients = [
  "linear-gradient(135deg, #3B82F6 0%, #2D5BE3 100%)",
  "linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%)",
  "linear-gradient(135deg, #F59E0B 0%, #D97706 100%)",
  "linear-gradient(135deg, #10B981 0%, #059669 100%)",
  "linear-gradient(135deg, #EF4444 0%, #DC2626 100%)",
  "linear-gradient(135deg, #EC4899 0%, #DB2777 100%)",
];

function getGradient(id?: string): string {
  const safeId = id || "default";
  let hash = 0;
  for (let i = 0; i < safeId.length; i++) {
    hash = safeId.charCodeAt(i) + ((hash << 5) - hash);
  }
  return gradients[Math.abs(hash) % gradients.length];
}

function getInitials(name?: string): string {
  const parts = (name || "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "A";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return parts
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export default function AnalystDetailPage() {
  const params = useParams();
  const analystId = params.id as string;
  const [plans, setPlans] = useState<Plan[]>([]);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [activeSubscriptions, setActiveSubscriptions] = useState<any[]>([]);
  const [subError, setSubError] = useState<string | null>(null);
  const [subSuccess, setSubSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [analyst, setAnalyst] = useState<any>(null);

  // Checkout State
  const [checkoutPlan, setCheckoutPlan] = useState<Plan | null>(null);
  const [checkoutBatch, setCheckoutBatch] = useState<PlanBatch | null>(null);
  const [couponCode, setCouponCode] = useState("");
  const [couponError, setCouponError] = useState<string | null>(null);
  const [couponSuccess, setCouponSuccess] = useState<string | null>(null);
  const [finalPrice, setFinalPrice] = useState<number | null>(null);
  const [verifyingCoupon, setVerifyingCoupon] = useState(false);
  const [successInfo, setSuccessInfo] = useState<{
    planName: string;
    tierName: string;
    amount: number;
    paymentId: string;
    endDate?: string;
  } | null>(null);
  const router = useRouter();

  const isSubscribedToPlanOrBatch = (planId: string, batchId?: string) => {
    return activeSubscriptions.some((s: any) => {
      if (s.plan_id !== planId) return false;
      if (batchId) return s.batch_id === batchId;
      return !s.batch_id;
    });
  };

  const analystName = plans[0]?.analyst_name || "Analyst";

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [plansRes, tradesRes, subRes, analystRes] = await Promise.all([
        fetch(`/api/trader/plans?analyst_id=${analystId}`, {
          credentials: "same-origin",
          cache: "no-store",
        }),
        fetch(`/api/trader/trades?analyst_id=${analystId}&limit=10`, {
          credentials: "same-origin",
          cache: "no-store",
        }),
        fetch(`/api/trader/subscriptions?status=ACTIVE`, {
          credentials: "same-origin",
          cache: "no-store",
        }),
        fetch(`/api/public/analysts/by-id/${analystId}`, { cache: "no-store" }),
      ]);

      const plansData = await plansRes.json().catch(() => ({}));
      const tradesData = await tradesRes.json().catch(() => ({}));
      const subData = await subRes.json().catch(() => ({}));
      const analystData = await analystRes.json().catch(() => ({}));

      setPlans(plansData.plans ?? plansData.data ?? []);
      setTrades(tradesData.trades ?? tradesData.data ?? []);
      
      const activeSubs = subData.subscriptions ?? subData.data ?? [];
      setActiveSubscriptions(activeSubs);
      setAnalyst(analystRes.ok ? analystData?.analyst ?? analystData ?? null : null);
    } catch {
      setPlans([]);
      setTrades([]);
      setActiveSubscriptions([]);
      setAnalyst(null);
    } finally {
      setLoading(false);
    }
  }, [analystId]);

  const handleVerifyCoupon = async () => {
    if (!couponCode || !checkoutPlan) return;
    setVerifyingCoupon(true);
    setCouponError(null);
    setCouponSuccess(null);
    try {
      const price = checkoutBatch ? (checkoutBatch.discounted_price || checkoutBatch.price) : checkoutPlan.price;
      const res = await fetch("/api/trader/coupons/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: couponCode,
          analyst_id: checkoutPlan.analyst_id,
          plan_id: checkoutPlan.plan_id,
          price: price
        })
      });
      const data = await res.json();
      if (!res.ok) {
        setCouponError(data.error || "Invalid coupon code");
        setFinalPrice(price);
      } else {
        setCouponSuccess(`${data.type === 'PERCENTAGE' ? data.discount_value + '%' : '₹' + data.discount_value} OFF applied!`);
        setFinalPrice(data.final_price);
      }
    } catch {
      setCouponError("Network error verifying coupon.");
    } finally {
      setVerifyingCoupon(false);
    }
  };

  const startCheckout = (plan: Plan, batch?: PlanBatch) => {
    setCheckoutPlan(plan);
    setCheckoutBatch(batch || null);
    setCouponCode("");
    setCouponError(null);
    setCouponSuccess(null);
    setFinalPrice(batch ? (batch.discounted_price || batch.price) : plan.price);
  };

  const closeCheckout = () => {
    setCheckoutPlan(null);
    setCheckoutBatch(null);
  };

  const handleSubscribe = async () => {
    if (!checkoutPlan) return;
    const planId = checkoutPlan.plan_id;
    const batchId = checkoutBatch?.batch_id;
    const subKey = batchId ? `${planId}_${batchId}` : planId;

    // Final safety net against a 409 — bail if this tier is already owned.
    if (isSubscribedToPlanOrBatch(planId, batchId)) {
      setSubError("You already have an active subscription to this tier.");
      return;
    }
    // Capture display details now — the checkout modal is closed on success.
    const planName = checkoutPlan.name;
    const tierName = checkoutBatch?.name ?? "Monthly subscription";
    const amountPaid = finalPrice ?? (checkoutBatch ? (checkoutBatch.discounted_price || checkoutBatch.price) : checkoutPlan.price);

    setSubError(null);
    setSubSuccess(null);
    setIsSubmitting((prev) => ({ ...prev, [subKey]: true }));
    try {
      const res = await fetch("/api/trader/subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan_id: planId,
          ...(batchId && { batch_id: batchId }),
          ...(couponSuccess && couponCode && { coupon_code: couponCode })
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setSubError(data.error ?? "Failed to subscribe. Please try again.");
        setIsSubmitting((prev) => ({ ...prev, [subKey]: false }));
        return;
      }

      // Free / fully-discounted plan — backend activated it directly, no payment.
      if (data.free) {
        setSubSuccess("Successfully subscribed!");
        await fetchData();
        setIsSubmitting((prev) => ({ ...prev, [subKey]: false }));
        return;
      }

      // Razorpay SDK blocked (ad-blocker / Brave Shields) or not yet loaded.
      if (typeof window === "undefined" || !(window as any).Razorpay) {
        setSubError("Payment window was blocked. Disable ad-blocker/Brave Shields for this site and try again.");
        setIsSubmitting((prev) => ({ ...prev, [subKey]: false }));
        return;
      }

      // Backend must return a real order to start checkout.
      if (!data.razorpay_order_id) {
        setSubError("Could not start payment. Please try again.");
        setIsSubmitting((prev) => ({ ...prev, [subKey]: false }));
        return;
      }

      const rzpOptions = {
        key: data.key_id || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: data.amount,
        currency: data.currency,
        name: "Stoxify",
        description: "Subscription Payment",
        order_id: data.razorpay_order_id,
        handler: async function (response: any) {
          try {
            const verifyRes = await fetch(`/api/trader/subscriptions/${data.subscription.subscription_id}/verify`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });
            const verifyData = await verifyRes.json().catch(() => ({}));
            if (!verifyRes.ok) {
              setSubError(verifyData.error ?? "Payment verification failed.");
            } else {
              closeCheckout();
              setSuccessInfo({
                planName,
                tierName,
                amount: amountPaid,
                paymentId: response.razorpay_payment_id,
                endDate: verifyData.subscription?.end_date,
              });
              await fetchData();
            }
          } catch (err) {
            setSubError("Network error during verification.");
          } finally {
            setIsSubmitting((prev) => ({ ...prev, [subKey]: false }));
          }
        },
        theme: { color: "#0f172a" },
        modal: {
          ondismiss: function() {
            setIsSubmitting((prev) => ({ ...prev, [subKey]: false }));
          }
        }
      };

      const rzp = new (window as any).Razorpay(rzpOptions);
      rzp.on('payment.failed', function (response: any){
        setSubError(response.error.description || "Payment failed.");
        setIsSubmitting((prev) => ({ ...prev, [subKey]: false }));
      });
      rzp.open();

    } catch {
      setSubError("Network error. Please try again.");
      setIsSubmitting((prev) => ({ ...prev, [subKey]: false }));
    }
  };

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Compute performance stats from trades
  const closedTrades = trades.filter((t) => t.status !== "LIVE" && t.pnl_percent !== undefined);
  const totalClosed = closedTrades.length;
  const winningTrades = closedTrades.filter((t) => (t.pnl_percent ?? 0) > 0).length;
  const winRate = totalClosed > 0 ? Math.round((winningTrades / totalClosed) * 100) : 0;
  const avgPnl = totalClosed > 0 ? closedTrades.reduce((sum, t) => sum + (t.pnl_percent ?? 0), 0) / totalClosed : 0;

  const getRiskStyles = (risk: string) => {
    if (risk === "HIGH") return "text-red-700 bg-red-50 border-red-200";
    if (risk === "LOW") return "text-emerald-700 bg-emerald-50 border-emerald-200";
    return "text-orange-700 bg-orange-50 border-orange-200";
  };

  if (loading) {
    return (
      <div className="px-6 py-8 lg:px-8 max-w-[1000px] mx-auto animate-pulse flex flex-col gap-8">
        <div className="h-6 w-32 rounded bg-[var(--line)]" />
        <div className="flex items-start gap-6">
          <div className="h-20 w-20 rounded-2xl bg-[var(--line)]" />
          <div className="pt-2 flex flex-col gap-3">
            <div className="h-7 w-48 rounded bg-[var(--line)]" />
            <div className="h-5 w-64 rounded bg-[var(--line)]" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="h-28 rounded-2xl bg-[var(--line)]" />
          <div className="h-28 rounded-2xl bg-[var(--line)]" />
          <div className="h-28 rounded-2xl bg-[var(--line)]" />
          <div className="h-28 rounded-2xl bg-[var(--line)]" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fafafa]">
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
      <div className="px-6 py-8 lg:px-8 lg:py-10 max-w-[1100px] mx-auto">
        
        {/* Back Link */}
        <Link
          href="/trader/discover"
          className="inline-flex items-center gap-2 text-[13px] font-bold text-[var(--muted)] hover:text-slate-900 transition-colors mb-8 group"
        >
          <div className="flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 bg-white shadow-sm transition-transform group-hover:-translate-x-1">
            <Icon name="arrowRight" className="h-3 w-3 rotate-180" />
          </div>
          Back to Discover
        </Link>

        {/* Analyst Profile Header */}
        <div className="flex flex-col md:flex-row md:items-center gap-6 mb-10 bg-white p-6 rounded-3xl border border-[var(--line)] shadow-sm">
          <div
            className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl text-[26px] font-black text-white shadow-md"
            style={{ background: getGradient(analystId) }}
          >
            {getInitials(analystName)}
          </div>
          <div className="flex-1">
            <h1 className="text-[26px] font-black tracking-tight text-[var(--ink)] mb-2">
              {analystName}
            </h1>
            <div className="flex flex-wrap items-center gap-3">
              {analyst?.sebi_license_number && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-[12px] font-extrabold text-emerald-700 border border-emerald-200">
                  <Icon name="shieldCheck" className="h-3.5 w-3.5" />
                  SEBI Verified
                </span>
              )}
              <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-[12px] font-bold text-slate-500 border border-slate-200">
                ID: {analystId}
              </span>
            </div>
          </div>
        </div>

        {/* Performance Stats */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 mb-12">
          <div className="rounded-2xl border border-[var(--line)] bg-white p-5 flex flex-col justify-center items-center gap-1 shadow-sm transition-all hover:border-slate-300">
            <span className="text-[12px] font-bold text-[var(--muted)] uppercase tracking-wider">Total Trades</span>
            <div className="text-[28px] font-black text-[var(--ink)] tracking-tight">{totalClosed}</div>
          </div>
          <div className="rounded-2xl border border-[var(--line)] bg-white p-5 flex flex-col justify-center items-center gap-1 shadow-sm transition-all hover:border-slate-300">
            <span className="text-[12px] font-bold text-[var(--muted)] uppercase tracking-wider">Win Rate</span>
            <div className="text-[28px] font-black text-emerald-600 tracking-tight">{winRate}%</div>
          </div>
          <div className="rounded-2xl border border-[var(--line)] bg-white p-5 flex flex-col justify-center items-center gap-1 shadow-sm transition-all hover:border-slate-300">
            <span className="text-[12px] font-bold text-[var(--muted)] uppercase tracking-wider">Avg P&L</span>
            <div className={`text-[28px] font-black tracking-tight ${avgPnl >= 0 ? "text-emerald-600" : "text-red-600"}`}>
              {avgPnl >= 0 ? "+" : ""}{avgPnl.toFixed(1)}%
            </div>
          </div>
          <div className="rounded-2xl border border-[var(--line)] bg-white p-5 flex flex-col justify-center items-center gap-1 shadow-sm transition-all hover:border-slate-300">
            <span className="text-[12px] font-bold text-[var(--muted)] uppercase tracking-wider">Active Batches</span>
            <div className="text-[28px] font-black text-blue-600 tracking-tight">{plans.length}</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-8 items-start">
          
          {/* Batches (Left Column) */}
          <section className="flex flex-col gap-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <Icon name="listChecks" className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-[18px] font-black text-[var(--ink)]">Advisory Batches</h2>
                <p className="text-[13px] font-medium text-[var(--muted)]">Choose a batch to get actionable trade alerts.</p>
              </div>
            </div>

            {subError && (
              <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-[13px] font-bold text-red-700 shadow-sm">
                <Icon className="mt-0.5 h-4 w-4 shrink-0 text-red-600" name="x" />
                <span>{subError}</span>
              </div>
            )}
            {subSuccess && (
              <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-[13px] font-bold text-emerald-700 shadow-sm">
                <Icon className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" name="circleCheck" />
                <span>{subSuccess}</span>
              </div>
            )}

            {plans.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-slate-500 font-medium">
                No active batches available from this analyst at the moment.
              </div>
            ) : (
              <div className="flex flex-col gap-6">
                {plans.map((plan) => {
                  const displaySegments = plan.segments && plan.segments.length > 0 ? plan.segments : (plan.segment ? [plan.segment] : []);
                  
                  return (
                    <article key={plan.plan_id} className="rounded-2xl border border-[var(--line)] bg-white p-6 shadow-sm flex flex-col transition-all hover:border-slate-300 hover:shadow-md">
                      
                      {/* Plan Header */}
                      <div className="mb-4">
                        <div className="flex items-center justify-between gap-4 mb-2">
                          <h3 className="text-[18px] font-black text-[var(--ink)] leading-tight">{plan.name}</h3>
                          {plan.risk_level && (
                            <span className={`shrink-0 inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 ${getRiskStyles(plan.risk_level)}`}>
                              <Icon name="shieldCheck" className="h-3 w-3" />
                              <span className="text-[10px] font-extrabold tracking-wide">{plan.risk_level} RISK</span>
                            </span>
                          )}
                        </div>
                        {plan.description && (
                          <p className="text-[13.5px] font-medium leading-relaxed text-[var(--muted-2)]">
                            {plan.description}
                          </p>
                        )}
                      </div>

                      {/* Badges / Features */}
                      <div className="flex flex-wrap gap-2 mb-6">
                        {displaySegments.map((seg) => (
                          <span key={seg} className="inline-flex items-center rounded-lg bg-blue-50 px-2.5 py-1 text-[11px] font-bold text-blue-700 border border-blue-100">
                            {seg}
                          </span>
                        ))}
                        {plan.horizons?.map((hz) => (
                          <span key={hz} className="inline-flex items-center rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-slate-600 text-[11px] font-bold">
                            <Icon name="timer" className="h-3 w-3 mr-1" />
                            {hz}
                          </span>
                        ))}
                      </div>

                      {plan.features && plan.features.length > 0 && (
                        <div className="mb-6 rounded-xl bg-slate-50 border border-slate-100 p-4">
                          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {plan.features.map((f) => (
                              <li key={f} className="flex items-start gap-2 text-[12.5px] font-semibold text-slate-600">
                                <Icon name="check" className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                                <span className="leading-snug">{f}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Batches / Subscribe Action */}
                      <div className="mt-auto pt-5 border-t border-[var(--line)]">
                        {plan.batches && plan.batches.filter((b) => b.is_active !== false).length > 0 ? (
                          <div className="flex flex-col gap-3">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-[12px] font-extrabold text-[var(--ink)]">Subscription Tiers</span>
                            </div>
                            <div className="flex flex-col gap-2.5">
                              {plan.batches
                                .filter((b) => b.is_active !== false)
                                .map((batch) => {
                                  const isBatchSubbed = isSubscribedToPlanOrBatch(plan.plan_id, batch.batch_id);
                                  const subKey = `${plan.plan_id}_${batch.batch_id}`;
                                  const isThisSubmitting = isSubmitting[subKey];

                                  return (
                                    <div
                                      key={batch.batch_id}
                                      className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition-colors shadow-[0_2px_8px_rgba(0,0,0,0.02)]"
                                    >
                                      <div className="flex flex-col">
                                        <span className="text-[14px] font-bold text-slate-900 leading-none mb-1.5">{batch.name}</span>
                                        <div className="flex items-center gap-2">
                                          {batch.discounted_price && (
                                            <span className="text-[12px] font-semibold line-through text-slate-400">₹{batch.price}</span>
                                          )}
                                          <span className="text-[14px] font-black text-slate-800">₹{batch.discounted_price || batch.price}</span>
                                          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-1">/ {batch.days} Days</span>
                                        </div>
                                      </div>
                                      {isBatchSubbed ? (
                                        <button
                                          type="button" disabled
                                          className="flex items-center gap-1.5 rounded-xl bg-emerald-50 px-4 py-2.5 text-[12.5px] font-extrabold text-emerald-700 border border-emerald-200 cursor-default"
                                        >
                                          <Icon name="circleCheck" className="h-4 w-4" />
                                          Active
                                        </button>
                                      ) : (
                                        <button
                                          type="button" disabled={isThisSubmitting}
                                          onClick={() => startCheckout(plan, batch)}
                                          className="rounded-xl bg-slate-900 px-5 py-2.5 text-[12.5px] font-bold text-white transition-all hover:bg-black hover:shadow-md disabled:opacity-50 active:scale-95"
                                        >
                                          {isThisSubmitting ? "Processing..." : "Subscribe"}
                                        </button>
                                      )}
                                    </div>
                                  );
                                })}
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between">
                            <div className="flex flex-col">
                              <span className="text-[11px] font-bold text-[var(--muted)] uppercase tracking-wider mb-0.5">Price</span>
                              <div className="flex items-baseline gap-1">
                                <span className="text-[20px] font-black text-slate-900">{formatCurrency(plan.price)}</span>
                                <span className="text-[12.5px] font-bold text-slate-500">/ {plan.days} days</span>
                              </div>
                            </div>
                            {isSubscribedToPlanOrBatch(plan.plan_id) ? (
                              <button
                                type="button" disabled
                                className="flex items-center gap-1.5 rounded-xl bg-emerald-50 px-5 py-3 text-[13px] font-extrabold text-emerald-700 border border-emerald-200 cursor-default"
                              >
                                <Icon name="circleCheck" className="h-4.5 w-4.5" />
                                Active
                              </button>
                            ) : (
                              <button
                                type="button" disabled={isSubmitting[plan.plan_id]}
                                onClick={() => startCheckout(plan)}
                                className="rounded-xl bg-slate-900 px-6 py-3 text-[13px] font-bold text-white transition-all hover:bg-black hover:shadow-md disabled:opacity-50 active:scale-95"
                              >
                                {isSubmitting[plan.plan_id] ? "Processing..." : "Subscribe"}
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>

          {/* Recent Trades (Right Column) */}
          <section className="flex flex-col gap-5 sticky top-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                <Icon name="lineChart" className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-[18px] font-black text-[var(--ink)]">Recent Trades</h2>
                <p className="text-[13px] font-medium text-[var(--muted)]">Latest performance history.</p>
              </div>
            </div>
            
            <div className="rounded-2xl border border-[var(--line)] bg-white overflow-hidden shadow-sm">
              {trades.length === 0 ? (
                <div className="p-8 text-center text-[13px] font-medium text-slate-500">
                  No trades recorded yet.
                </div>
              ) : (
                <div className="flex flex-col">
                  {trades.map((trade) => {
                    const isLong = trade.direction === "LONG" || trade.direction === "BUY";
                    const isLive = trade.status === "LIVE";
                    return (
                      <div key={trade.trade_id} className="flex flex-col p-4 border-b border-[var(--line)] last:border-0 hover:bg-slate-50 transition-colors">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2.5">
                            <span className={`flex h-8 w-8 items-center justify-center rounded-lg text-[10px] font-extrabold ${isLong ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                              {isLong ? 'LONG' : 'SHRT'}
                            </span>
                            <div>
                              <div className="text-[14px] font-black text-slate-900 leading-none">{trade.symbol}</div>
                              <div className="text-[11px] font-bold text-slate-400 mt-1">{trade.segment}</div>
                            </div>
                          </div>
                          <div className="text-right">
                            {isLive ? (
                              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-black text-emerald-600 border border-emerald-100">
                                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
                                LIVE
                              </span>
                            ) : (
                              <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-black ${trade.pnl_percent && trade.pnl_percent >= 0 ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                                {trade.pnl_percent !== undefined && trade.pnl_percent !== null ? (
                                  `${trade.pnl_percent >= 0 ? '+' : ''}${trade.pnl_percent.toFixed(2)}%`
                                ) : (
                                  trade.status.replace(/_/g, " ")
                                )}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center justify-between bg-[#fafafa] rounded-lg p-2.5 border border-slate-100">
                          <div className="flex flex-col">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Entry</span>
                            <span className="text-[12.5px] font-bold text-slate-800">{formatCurrency(trade.entry_price)}</span>
                          </div>
                          <div className="flex flex-col items-center">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Target</span>
                            <span className="text-[12.5px] font-bold text-emerald-600">{formatCurrency(trade.targets && trade.targets.length > 0 ? ((trade.direction === "SHORT" || trade.direction === "SELL") ? Math.min(...trade.targets.map(t => t.target_price)) : Math.max(...trade.targets.map(t => t.target_price))) : (trade.target ?? 0))}</span>
                          </div>
                          <div className="flex flex-col items-end">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Stop Loss</span>
                            <span className="text-[12.5px] font-bold text-red-600">{formatCurrency(trade.stop_loss)}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </section>
        </div>
      </div>

      {/* Review & Checkout Modal */}
      {checkoutPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col">

            {/* Header */}
            <div className="px-6 py-5 flex items-center justify-between border-b border-slate-100">
              <div>
                <h2 className="text-[17px] font-black text-slate-900 tracking-tight">Review & Checkout</h2>
                <p className="text-[12px] font-medium text-slate-400 mt-0.5">Confirm your subscription details</p>
              </div>
              <button onClick={closeCheckout} className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 transition-colors">
                <Icon name="x" className="h-4 w-4" />
              </button>
            </div>

            <div className="px-6 py-5 flex flex-col gap-5">

              {/* Plan Info */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex flex-col gap-0.5">
                  <h3 className="text-[15px] font-black text-slate-900 leading-snug">{checkoutPlan.name}</h3>
                  <p className="text-[13px] font-medium text-slate-500">
                    {checkoutBatch ? checkoutBatch.name : 'Monthly subscription'}
                    <span className="mx-1.5 text-slate-300">·</span>
                    {checkoutBatch ? checkoutBatch.days : checkoutPlan.days} Days
                  </p>
                </div>
                <span className="shrink-0 inline-flex items-center rounded-full bg-blue-50 border border-blue-100 px-2.5 py-1 text-[11px] font-bold text-blue-700">
                  Advisory
                </span>
              </div>

              {/* Coupon Section */}
              <div className="rounded-xl border border-slate-200 p-4">
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3">Have a coupon code?</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    placeholder="Enter code"
                    className="flex-1 rounded-lg border border-slate-200 px-3.5 py-2.5 text-[13.5px] font-bold text-slate-900 placeholder:text-slate-400 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100 transition-all"
                    disabled={!!couponSuccess}
                  />
                  {!couponSuccess ? (
                    <button
                      onClick={handleVerifyCoupon}
                      disabled={!couponCode || verifyingCoupon}
                      className="rounded-lg bg-slate-100 px-4 py-2.5 text-[13px] font-bold text-slate-700 hover:bg-slate-200 transition-colors disabled:opacity-40"
                    >
                      {verifyingCoupon ? "..." : "Apply"}
                    </button>
                  ) : (
                    <button
                      onClick={() => { setCouponSuccess(null); setCouponCode(""); setFinalPrice(checkoutBatch ? (checkoutBatch.discounted_price || checkoutBatch.price) : checkoutPlan.price); }}
                      className="rounded-lg bg-red-50 px-4 py-2.5 text-[13px] font-bold text-red-600 hover:bg-red-100 transition-colors"
                    >
                      Remove
                    </button>
                  )}
                </div>
                {couponError && <p className="text-[12px] font-semibold text-red-500 mt-2">{couponError}</p>}
                {couponSuccess && <p className="text-[12px] font-semibold text-emerald-600 mt-2">✓ {couponSuccess}</p>}
              </div>

              {/* Total Due */}
              <div className="flex items-center justify-between py-3 border-t border-slate-100">
                <span className="text-[14px] font-bold text-slate-600">Total Due</span>
                <div className="flex flex-col items-end">
                  {couponSuccess && (
                    <span className="text-[12px] font-bold text-slate-400 line-through mb-0.5">
                      {formatCurrency(checkoutBatch ? (checkoutBatch.discounted_price || checkoutBatch.price) : checkoutPlan.price)}
                    </span>
                  )}
                  <span className="text-[22px] font-black text-slate-900 tracking-tight">{formatCurrency(finalPrice ?? 0)}</span>
                </div>
              </div>

            </div>

            {/* CTA */}
            <div className="px-6 pb-6">
              {(() => {
                const owned = isSubscribedToPlanOrBatch(checkoutPlan.plan_id, checkoutBatch?.batch_id);
                const submitting = isSubmitting[checkoutBatch ? `${checkoutPlan.plan_id}_${checkoutBatch.batch_id}` : checkoutPlan.plan_id];
                return (
                  <button
                    onClick={handleSubscribe}
                    disabled={owned || submitting}
                    className="w-full rounded-xl bg-slate-900 py-3.5 text-[14.5px] font-bold text-white transition-all hover:bg-black hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
                  >
                    {owned ? "Already Subscribed" : submitting ? "Processing..." : "Proceed to Payment"}
                  </button>
                );
              })()}
            </div>

          </div>
        </div>
      )}

      {/* Payment Success Modal */}
      {successInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col">
            <div className="px-6 pt-8 pb-6 flex flex-col items-center text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 ring-8 ring-emerald-50/60">
                <Icon name="circleCheck" className="h-9 w-9 text-emerald-500" />
              </div>
              <h2 className="mt-5 text-[19px] font-black text-slate-900 tracking-tight">Payment Successful</h2>
              <p className="mt-1 text-[13px] font-medium text-slate-500">
                You&apos;re now subscribed to <span className="font-bold text-slate-700">{successInfo.planName}</span>.
              </p>

              <div className="mt-6 w-full rounded-xl border border-slate-200 divide-y divide-slate-100">
                <div className="flex items-center justify-between px-4 py-3">
                  <span className="text-[12.5px] font-semibold text-slate-400">Batch</span>
                  <span className="text-[12.5px] font-bold text-slate-800">{successInfo.planName} · {successInfo.tierName}</span>
                </div>
                <div className="flex items-center justify-between px-4 py-3">
                  <span className="text-[12.5px] font-semibold text-slate-400">Amount Paid</span>
                  <span className="text-[12.5px] font-bold text-slate-800">{formatCurrency(successInfo.amount)}</span>
                </div>
                {successInfo.endDate && (
                  <div className="flex items-center justify-between px-4 py-3">
                    <span className="text-[12.5px] font-semibold text-slate-400">Valid Until</span>
                    <span className="text-[12.5px] font-bold text-slate-800">
                      {new Date(successInfo.endDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between px-4 py-3">
                  <span className="text-[12.5px] font-semibold text-slate-400">Payment ID</span>
                  <span className="text-[12px] font-mono font-semibold text-slate-500">{successInfo.paymentId}</span>
                </div>
              </div>
            </div>

            <div className="px-6 pb-6 flex flex-col gap-2.5">
              <button
                onClick={() => router.push("/trader/subscriptions")}
                className="w-full rounded-xl bg-slate-900 py-3.5 text-[14.5px] font-bold text-white transition-all hover:bg-black hover:shadow-lg active:scale-[0.98]"
              >
                View My Subscriptions
              </button>
              <button
                onClick={() => setSuccessInfo(null)}
                className="w-full rounded-xl bg-white py-3 text-[13.5px] font-bold text-slate-500 hover:bg-slate-50 transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
