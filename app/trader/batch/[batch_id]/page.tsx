"use client";

import Link from "next/link";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import Script from "next/script";
import { Area, AreaChart, XAxis, YAxis } from "recharts";

import { Icon } from "@/components/stoxify-icon";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

type Plan = {
  batch_id: string;
  name: string;
  price: number;
  discounted_price?: number;
  days: number;
  billing_cycle: string;
  description?: string;
  is_active?: boolean;
};

type Batch = {
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
  batches?: Plan[];
};

type AnalystPerformance = {
  total_trades?: number;
  winning_trades?: number;
  average_pnl_percent?: number;
  total_subscribers?: number;
  last_calculated?: string;
};

type AnalystProfile = {
  user_id?: string;
  username?: string;
  name?: string;
  profile_pic_url?: string;
  bio?: string;
  specialization?: string[] | string;
  company_name?: string;
  state?: string;
  performance?: AnalystPerformance;
  sebi_license_number?: string;
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
  target: number;
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

function formatSegment(seg: string): string {
  if (seg === "FNO") return "F&O";
  return seg.charAt(0) + seg.slice(1).toLowerCase();
}

const RISK_META: Record<string, { label: string; dot: string; text: string; chip: string }> = {
  LOW: { label: "Low", dot: "bg-emerald-500", text: "text-emerald-600", chip: "text-emerald-700 bg-emerald-50 border-emerald-200" },
  MEDIUM: { label: "Med.", dot: "bg-amber-500", text: "text-amber-600", chip: "text-orange-700 bg-orange-50 border-orange-200" },
  HIGH: { label: "High", dot: "bg-red-500", text: "text-red-600", chip: "text-red-700 bg-red-50 border-red-200" },
};

function getStartingPrice(batch: Batch): number {
  const active = (batch.batches ?? []).filter((b) => b.is_active !== false);
  if (active.length > 0) return Math.min(...active.map((b) => b.discounted_price || b.price));
  return batch.price;
}

const chartConfig = {
  pnl: { label: "Cumulative P&L", color: "var(--chart-2)" },
} satisfies ChartConfig;

export default function BatchDetailPage() {
  const params = useParams();
  const batchId = params.batch_id as string;
  const router = useRouter();

  const [batch, setBatch] = useState<Batch | null>(null);
  const [analyst, setAnalyst] = useState<AnalystProfile | null>(null);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [activeSubscriptions, setActiveSubscriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [subError, setSubError] = useState<string | null>(null);
  const [subSuccess, setSubSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<Record<string, boolean>>({});

  // Checkout state
  const [checkoutPlan, setCheckoutPlan] = useState<Plan | null>(null);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [couponError, setCouponError] = useState<string | null>(null);
  const [couponSuccess, setCouponSuccess] = useState<string | null>(null);
  const [finalPrice, setFinalPrice] = useState<number | null>(null);
  const [verifyingCoupon, setVerifyingCoupon] = useState(false);
  const [successInfo, setSuccessInfo] = useState<{
    batchName: string;
    tierName: string;
    amount: number;
    paymentId: string;
    endDate?: string;
  } | null>(null);

  const isSubscribedToPlanOrBatch = useCallback(
    (pId: string, batchId?: string) =>
      activeSubscriptions.some((s: any) => {
        if (s.plan_id !== pId) return false;
        if (batchId) return s.batch_id === batchId;
        return !s.batch_id;
      }),
    [activeSubscriptions]
  );

  const isSubscribed = useMemo(
    () => activeSubscriptions.some((s: any) => s.plan_id === batchId),
    [activeSubscriptions, batchId]
  );

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const planRes = await fetch(`/api/trader/plans/${batchId}`, {
        credentials: "same-origin",
        cache: "no-store",
      });
      const planData = await planRes.json().catch(() => ({}));
      const resolvedPlan: Batch | null =
        planData?.plan ?? (planData?.plan_id ? planData : planData?.data ?? null);

      if (!planRes.ok || !resolvedPlan?.plan_id) {
        setNotFound(true);
        setLoading(false);
        return;
      }
      setBatch(resolvedPlan);

      const [analystRes, tradesRes, subRes] = await Promise.all([
        fetch(`/api/public/analysts/by-id/${resolvedPlan.analyst_id}`, { cache: "no-store" }),
        fetch(`/api/trader/trades?analyst_id=${resolvedPlan.analyst_id}&plan_id=${batchId}&limit=50`, {
          credentials: "same-origin",
          cache: "no-store",
        }),
        fetch(`/api/trader/subscriptions?status=ACTIVE`, {
          credentials: "same-origin",
          cache: "no-store",
        }),
      ]);

      const analystData = await analystRes.json().catch(() => ({}));
      const tradesData = await tradesRes.json().catch(() => ({}));
      const subData = await subRes.json().catch(() => ({}));

      setAnalyst(analystRes.ok ? analystData?.analyst ?? analystData ?? null : null);
      setTrades(tradesData.trades ?? tradesData.data ?? []);
      setActiveSubscriptions(subData.subscriptions ?? subData.data ?? []);
    } catch {
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  }, [batchId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ── Performance stats + equity curve ──────────────────────────────────────
  const closedTrades = useMemo(
    () => trades.filter((t) => t.status !== "LIVE" && t.pnl_percent !== undefined && t.pnl_percent !== null),
    [trades]
  );

  // Prefer the backend-computed performance snapshot (visible to everyone,
  // incl. non-subscribers who can't read the gated trades feed); fall back to
  // client-side aggregation of whatever trades we did receive.
  const perf = analyst?.performance;
  const clientClosed = closedTrades.length;
  const clientWinning = closedTrades.filter((t) => (t.pnl_percent ?? 0) > 0).length;

  const totalClosed = perf?.total_trades ?? clientClosed;
  const winningTrades = perf?.winning_trades ?? clientWinning;
  const winRate = totalClosed > 0 ? Math.round((winningTrades / totalClosed) * 100) : 0;
  const avgPnl =
    perf?.average_pnl_percent !== undefined
      ? perf.average_pnl_percent
      : clientClosed > 0
        ? closedTrades.reduce((s, t) => s + (t.pnl_percent ?? 0), 0) / clientClosed
        : 0;

  const equityCurve = useMemo(() => {
    const ordered = [...closedTrades].sort(
      (a, b) => new Date(a.entry_timestamp).getTime() - new Date(b.entry_timestamp).getTime()
    );
    let cumulative = 0;
    return ordered.map((t, i) => {
      cumulative += t.pnl_percent ?? 0;
      return { index: i + 1, pnl: Number(cumulative.toFixed(2)) };
    });
  }, [closedTrades]);

  // ── Checkout ──────────────────────────────────────────────────────────────
  const startCheckout = (plan?: Plan) => {
    if (!plan && !batch) return;
    setCheckoutPlan(plan || null);
    setCheckoutOpen(true);
    setCouponCode("");
    setCouponError(null);
    setCouponSuccess(null);
    setFinalPrice(plan ? plan.discounted_price || plan.price : batch!.price);
  };

  const closeCheckout = () => {
    setCheckoutOpen(false);
    setCheckoutPlan(null);
  };

  const handleVerifyCoupon = async () => {
    if (!couponCode || !batch) return;
    setVerifyingCoupon(true);
    setCouponError(null);
    setCouponSuccess(null);
    try {
      const price = checkoutPlan ? checkoutPlan.discounted_price || checkoutPlan.price : batch.price;
      const res = await fetch("/api/trader/coupons/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: couponCode,
          analyst_id: batch.analyst_id,
          plan_id: batch.plan_id,
          batch_id: checkoutPlan ? checkoutPlan.batch_id : undefined,
          price,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setCouponError(data.error || "Invalid coupon code");
        setFinalPrice(price);
      } else {
        setCouponSuccess(`${data.type === "PERCENTAGE" ? data.discount_value + "%" : "₹" + data.discount_value} OFF applied!`);
        setFinalPrice(data.final_price);
      }
    } catch {
      setCouponError("Network error verifying coupon.");
    } finally {
      setVerifyingCoupon(false);
    }
  };

  const handleSubscribe = async () => {
    if (!batch) return;
    const batchId2 = batch.plan_id;
    const batchId = checkoutPlan?.batch_id;
    const subKey = batchId ? `${batchId2}_${batchId}` : batchId2;

    if (isSubscribedToPlanOrBatch(batchId2, batchId)) {
      setSubError("You already have an active subscription to this tier.");
      return;
    }
    const batchName = batch.name;
    const tierName = checkoutPlan?.name ?? "Monthly subscription";
    const amountPaid = finalPrice ?? (checkoutPlan ? checkoutPlan.discounted_price || checkoutPlan.price : batch.price);

    setSubError(null);
    setSubSuccess(null);
    setIsSubmitting((prev) => ({ ...prev, [subKey]: true }));
    try {
      const res = await fetch("/api/trader/subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan_id: batchId2,
          ...(batchId && { batch_id: batchId }),
          ...(couponSuccess && couponCode && { coupon_code: couponCode }),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setSubError(data.error ?? "Failed to subscribe. Please try again.");
        setIsSubmitting((prev) => ({ ...prev, [subKey]: false }));
        return;
      }

      if (data.free) {
        setSubSuccess("Successfully subscribed!");
        closeCheckout();
        await fetchData();
        setIsSubmitting((prev) => ({ ...prev, [subKey]: false }));
        return;
      }

      if (typeof window === "undefined" || !(window as any).Razorpay) {
        setSubError("Payment window was blocked. Disable ad-blocker/Brave Shields for this site and try again.");
        setIsSubmitting((prev) => ({ ...prev, [subKey]: false }));
        return;
      }

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
            const verifyRes = await fetch(
              `/api/trader/subscriptions/${data.subscription.subscription_id}/verify`,
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_signature: response.razorpay_signature,
                }),
              }
            );
            const verifyData = await verifyRes.json().catch(() => ({}));
            if (!verifyRes.ok) {
              setSubError(verifyData.error ?? "Payment verification failed.");
            } else {
              closeCheckout();
              setSuccessInfo({
                batchName,
                tierName,
                amount: amountPaid,
                paymentId: response.razorpay_payment_id,
                endDate: verifyData.subscription?.end_date,
              });
              await fetchData();
            }
          } catch {
            setSubError("Network error during verification.");
          } finally {
            setIsSubmitting((prev) => ({ ...prev, [subKey]: false }));
          }
        },
        theme: { color: "#0f172a" },
        modal: {
          ondismiss: function () {
            setIsSubmitting((prev) => ({ ...prev, [subKey]: false }));
          },
        },
      };

      const rzp = new (window as any).Razorpay(rzpOptions);
      rzp.on("payment.failed", function (response: any) {
        setSubError(response.error.description || "Payment failed.");
        setIsSubmitting((prev) => ({ ...prev, [subKey]: false }));
      });
      rzp.open();
    } catch {
      setSubError("Network error. Please try again.");
      setIsSubmitting((prev) => ({ ...prev, [subKey]: false }));
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="px-6 py-8 lg:px-8 max-w-[1100px] mx-auto animate-pulse flex flex-col gap-8">
        <div className="h-6 w-32 rounded bg-[var(--line)]" />
        <div className="h-40 rounded-3xl bg-[var(--line)]" />
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8">
          <div className="h-80 rounded-2xl bg-[var(--line)]" />
          <div className="h-80 rounded-2xl bg-[var(--line)]" />
        </div>
      </div>
    );
  }

  if (notFound || !batch) {
    return (
      <div className="min-h-screen bg-[#fafafa]">
        <div className="px-6 py-20 max-w-[1100px] mx-auto text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 text-blue-500">
            <Icon name="search" className="h-6 w-6" />
          </div>
          <h1 className="text-[18px] font-bold text-[var(--ink)] mb-1.5">Batch not found</h1>
          <p className="text-[13.5px] text-[var(--muted)] font-medium mb-6">
            This batch may no longer be available.
          </p>
          <Link
            href="/trader/discover"
            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-[13px] font-bold text-white hover:bg-black transition-all"
          >
            Back to Discover
          </Link>
        </div>
      </div>
    );
  }

  const risk = batch.risk_level ? RISK_META[batch.risk_level.toUpperCase()] : undefined;
  const displaySegments = batch.segments && batch.segments.length > 0 ? batch.segments : batch.segment ? [batch.segment] : [];
  const activeBatches = (batch.batches ?? []).filter((b: Plan) => b.is_active !== false);
  const specializations = Array.isArray(analyst?.specialization)
    ? analyst?.specialization
    : analyst?.specialization
      ? [analyst.specialization]
      : [];

  return (
    <div className="min-h-screen bg-[#fafafa]">
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
      <div className="px-6 py-8 lg:px-8 lg:py-10 max-w-[1100px] mx-auto">
        {/* Back link */}
        <Link
          href="/trader/discover"
          className="inline-flex items-center gap-2 text-[13px] font-bold text-[var(--muted)] hover:text-slate-900 transition-colors mb-6 group"
        >
          <div className="flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 bg-white shadow-sm transition-transform group-hover:-translate-x-1">
            <Icon name="arrowRight" className="h-3 w-3 rotate-180" />
          </div>
          Back to Discover
        </Link>

        {/* Hero header */}
        <div className="rounded-3xl border border-[var(--line)] bg-white p-6 shadow-sm mb-8">
          <div className="flex flex-col md:flex-row md:items-start gap-5">
            <div
              className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl text-[20px] font-black text-white shadow-md"
              style={{ background: getGradient(batch.analyst_id) }}
            >
              {getInitials(batch.analyst_name)}
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-[24px] font-black tracking-tight text-[var(--ink)] leading-tight">
                {batch.name}
              </h1>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-[13px] font-semibold text-[var(--muted)]">
                <span>by {batch.analyst_name}</span>
                {analyst?.sebi_license_number && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-extrabold text-emerald-700 border border-emerald-100">
                    <Icon name="shieldCheck" className="h-3 w-3 text-emerald-600" />
                    SEBI
                  </span>
                )}
              </div>
              {batch.description && (
                <p className="mt-3 text-[13.5px] font-medium leading-relaxed text-[var(--muted-2)] max-w-2xl">
                  {batch.description}
                </p>
              )}
              <div className="mt-4 flex flex-wrap gap-2">
                {displaySegments.map((seg: string) => (
                  <span key={seg} className="inline-flex items-center rounded-lg bg-blue-50 px-2.5 py-1 text-[11px] font-bold text-blue-700 border border-blue-100">
                    {formatSegment(seg)}
                  </span>
                ))}
                {batch.horizons?.map((hz: string) => (
                  <span key={hz} className="inline-flex items-center rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-slate-600 text-[11px] font-bold capitalize">
                    <Icon name="timer" className="h-3 w-3 mr-1" />
                    {hz.toLowerCase().replace(/_/g, " ")}
                  </span>
                ))}
              </div>
            </div>

            {/* Headline metric + volatility */}
            <div className="flex md:flex-col items-center md:items-end gap-3 md:gap-2 shrink-0">
              <div className="text-right">
                <span className="block text-[11px] font-bold uppercase tracking-wider text-[var(--muted-2)]">Win Rate</span>
                <span className="text-[22px] font-black tracking-tight text-emerald-600">{winRate}%</span>
              </div>
              {risk && (
                <span className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 ${risk.chip}`}>
                  <span className={`h-2 w-2 rounded-full ${risk.dot}`} />
                  <span className="text-[10px] font-extrabold tracking-wide uppercase">{batch.risk_level} Volatility</span>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Feedback banners */}
        {subError && (
          <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-[13px] font-bold text-red-700 shadow-sm">
            <Icon className="mt-0.5 h-4 w-4 shrink-0 text-red-600" name="x" />
            <span>{subError}</span>
          </div>
        )}
        {subSuccess && (
          <div className="mb-6 flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-[13px] font-bold text-emerald-700 shadow-sm">
            <Icon className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" name="circleCheck" />
            <span>{subSuccess}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8 items-start">
          {/* Left column */}
          <div className="flex flex-col gap-8">
            {/* Features */}
            {batch.features && batch.features.length > 0 && (
              <section className="rounded-2xl border border-[var(--line)] bg-white p-6 shadow-sm">
                <h2 className="text-[16px] font-black text-[var(--ink)] mb-4">What you get</h2>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {batch.features.map((f: string) => (
                    <li key={f} className="flex items-start gap-2.5 text-[13px] font-semibold text-slate-600">
                      <Icon name="check" className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                      <span className="leading-snug">{f}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* Performance */}
            <section className="rounded-2xl border border-[var(--line)] bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                  <Icon name="lineChart" className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-[16px] font-black text-[var(--ink)]">Performance</h2>
                  <p className="text-[12.5px] font-medium text-[var(--muted)]">Analyst track record from recent trades.</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 mb-6">
                <div className="rounded-xl border border-[var(--line)] bg-[#fafafa] p-3.5 flex flex-col items-center">
                  <span className="text-[10.5px] font-bold text-[var(--muted)] uppercase tracking-wider">Closed Trades</span>
                  <span className="text-[20px] font-black text-[var(--ink)]">{totalClosed}</span>
                </div>
                <div className="rounded-xl border border-[var(--line)] bg-[#fafafa] p-3.5 flex flex-col items-center">
                  <span className="text-[10.5px] font-bold text-[var(--muted)] uppercase tracking-wider">Win Rate</span>
                  <span className="text-[20px] font-black text-emerald-600">{winRate}%</span>
                </div>
                <div className="rounded-xl border border-[var(--line)] bg-[#fafafa] p-3.5 flex flex-col items-center">
                  <span className="text-[10.5px] font-bold text-[var(--muted)] uppercase tracking-wider">Avg P&L</span>
                  <span className={`text-[20px] font-black ${avgPnl >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                    {avgPnl >= 0 ? "+" : ""}{avgPnl.toFixed(1)}%
                  </span>
                </div>
              </div>

              {equityCurve.length >= 2 ? (
                <ChartContainer className="aspect-auto h-56 w-full" config={chartConfig}>
                  <AreaChart accessibilityLayer data={equityCurve} margin={{ left: 4, right: 8, top: 8, bottom: 0 }}>
                    <defs>
                      <linearGradient id="fillPnl" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--color-pnl)" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="var(--color-pnl)" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="index" axisLine={false} tickLine={false} tickMargin={8} fontSize={11} />
                    <YAxis axisLine={false} tickLine={false} width={36} fontSize={11} tickFormatter={(v) => `${v}%`} />
                    <ChartTooltip content={<ChartTooltipContent hideLabel />} cursor={false} />
                    <Area dataKey="pnl" type="monotone" stroke="var(--color-pnl)" strokeWidth={2} fill="url(#fillPnl)" />
                  </AreaChart>
                </ChartContainer>
              ) : (
                <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/60 py-12 text-center">
                  <Icon name="lineChart" className="h-7 w-7 text-slate-300 mb-2" />
                  <p className="text-[13px] font-semibold text-[var(--muted)]">Not enough data yet</p>
                  <p className="text-[12px] font-medium text-[var(--muted-2)] mt-0.5">Performance chart appears as trades close.</p>
                </div>
              )}
            </section>

            {/* Recent Trades — gated */}
            <section className="rounded-2xl border border-[var(--line)] bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <Icon name="activity" className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-[16px] font-black text-[var(--ink)]">Recent Trades</h2>
                  <p className="text-[12.5px] font-medium text-[var(--muted)]">Live calls &amp; latest closed positions.</p>
                </div>
              </div>

              {isSubscribed ? (
                trades.length === 0 ? (
                  <div className="p-8 text-center text-[13px] font-medium text-slate-500">No trades recorded yet.</div>
                ) : (
                  <div className="flex flex-col divide-y divide-[var(--line)]">
                    {trades.slice(0, 8).map((trade) => {
                      const isLong = trade.direction === "LONG" || trade.direction === "BUY";
                      const isLive = trade.status === "LIVE";
                      return (
                        <div key={trade.trade_id} className="flex flex-col py-4 first:pt-0 last:pb-0">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2.5">
                              <span className={`flex h-8 w-8 items-center justify-center rounded-lg text-[10px] font-extrabold ${isLong ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>
                                {isLong ? "LONG" : "SHRT"}
                              </span>
                              <div>
                                <div className="text-[14px] font-black text-slate-900 leading-none">{trade.symbol}</div>
                                <div className="text-[11px] font-bold text-slate-400 mt-1">{trade.segment}</div>
                              </div>
                            </div>
                            {isLive ? (
                              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-black text-emerald-600 border border-emerald-100">
                                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
                                LIVE
                              </span>
                            ) : (
                              <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-black ${trade.pnl_percent && trade.pnl_percent >= 0 ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
                                {trade.pnl_percent !== undefined && trade.pnl_percent !== null
                                  ? `${trade.pnl_percent >= 0 ? "+" : ""}${trade.pnl_percent.toFixed(2)}%`
                                  : trade.status.replace(/_/g, " ")}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center justify-between bg-[#fafafa] rounded-lg p-2.5 border border-slate-100">
                            <div className="flex flex-col">
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Entry</span>
                              <span className="text-[12.5px] font-bold text-slate-800">{formatCurrency(trade.entry_price)}</span>
                            </div>
                            <div className="flex flex-col items-center">
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Target</span>
                              <span className="text-[12.5px] font-bold text-emerald-600">{formatCurrency(trade.target)}</span>
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
                )
              ) : (
                <div className="relative overflow-hidden rounded-xl border border-slate-100">
                  {/* Blurred fake rows */}
                  <div className="flex flex-col divide-y divide-[var(--line)] blur-[5px] select-none pointer-events-none p-1">
                    {[0, 1, 2].map((i) => (
                      <div key={i} className="flex items-center justify-between py-4 px-3">
                        <div className="flex items-center gap-2.5">
                          <span className="h-8 w-8 rounded-lg bg-slate-200" />
                          <div>
                            <div className="h-3.5 w-20 rounded bg-slate-200" />
                            <div className="h-2.5 w-12 rounded bg-slate-100 mt-1.5" />
                          </div>
                        </div>
                        <span className="h-6 w-16 rounded-full bg-slate-200" />
                      </div>
                    ))}
                  </div>
                  {/* Lock overlay */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center bg-white/40 backdrop-blur-[1px] px-6">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-900 text-white shadow-md mb-3">
                      <Icon name="lock" className="h-5 w-5" />
                    </div>
                    <h3 className="text-[15px] font-black text-[var(--ink)]">Subscribe to unlock recent trades</h3>
                    <p className="text-[12.5px] font-medium text-[var(--muted)] mt-1 max-w-[280px]">
                      Get live trade alerts, entries, targets &amp; stop-losses the moment they go out.
                    </p>
                    <button
                      type="button"
                      onClick={() => startCheckout(activeBatches[0])}
                      className="mt-4 rounded-xl bg-slate-900 px-5 py-2.5 text-[13px] font-bold text-white transition-all hover:bg-black hover:shadow-md active:scale-95"
                    >
                      Subscribe Now
                    </button>
                  </div>
                </div>
              )}
            </section>

            {/* About the analyst */}
            <section className="rounded-2xl border border-[var(--line)] bg-white p-6 shadow-sm">
              <h2 className="text-[16px] font-black text-[var(--ink)] mb-4">About the analyst</h2>
              <div className="flex items-start gap-4">
                {analyst?.profile_pic_url ? (
                  <Image
                    src={analyst.profile_pic_url}
                    alt={batch.analyst_name}
                    width={56}
                    height={56}
                    className="h-14 w-14 rounded-2xl object-cover shadow-sm"
                    unoptimized
                  />
                ) : (
                  <div
                    className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-[16px] font-black text-white shadow-sm"
                    style={{ background: getGradient(batch.analyst_id) }}
                  >
                    {getInitials(batch.analyst_name)}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-[15px] font-bold text-[var(--ink)]">{analyst?.name || batch.analyst_name}</h3>
                    {analyst?.sebi_license_number && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-extrabold text-emerald-700 border border-emerald-100">
                        <Icon name="shieldCheck" className="h-3 w-3 text-emerald-600" />
                        SEBI Verified
                      </span>
                    )}
                  </div>
                  {analyst?.company_name && (
                    <p className="text-[12.5px] font-semibold text-[var(--muted-2)] mt-0.5">{analyst.company_name}</p>
                  )}
                  {analyst?.bio && (
                    <p className="text-[13px] font-medium leading-relaxed text-[var(--muted)] mt-2">{analyst.bio}</p>
                  )}
                  {specializations.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {specializations.map((s) => (
                        <span key={s} className="inline-flex items-center rounded-lg border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-bold text-slate-600">
                          {s}
                        </span>
                      ))}
                    </div>
                  )}
                  <Link
                    href={`/trader/analyst/${batch.analyst_id}`}
                    className="mt-3 inline-flex items-center gap-1.5 text-[12.5px] font-bold text-blue-600 hover:underline"
                  >
                    View full analyst profile
                    <Icon name="arrowRight" className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            </section>
          </div>

          {/* Right sidebar — pricing */}
          <aside className="lg:sticky lg:top-6 rounded-2xl border border-[var(--line)] bg-white p-6 shadow-sm">
            <div className="mb-4">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--muted-2)]">Plans start from</span>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span className="text-[26px] font-black tracking-tight text-[var(--ink)]">{formatCurrency(getStartingPrice(batch))}</span>
              </div>
            </div>

            {activeBatches.length > 0 ? (
              <div className="flex flex-col gap-3">
                <span className="text-[12px] font-extrabold text-[var(--ink)]">Subscription Plans</span>
                {activeBatches.map((plan: Plan) => {
                  const owned = isSubscribedToPlanOrBatch(batch.plan_id, plan.batch_id);
                  const subKey = `${batch.plan_id}_${plan.batch_id}`;
                  const submitting = isSubmitting[subKey];
                  return (
                    <div key={plan.batch_id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <span className="text-[14px] font-bold text-slate-900">{plan.name}</span>
                        <div className="flex items-baseline gap-1.5 shrink-0">
                          {plan.discounted_price && (
                            <span className="text-[12px] font-semibold line-through text-slate-400">₹{plan.price}</span>
                          )}
                          <span className="text-[15px] font-black text-slate-800">₹{plan.discounted_price || plan.price}</span>
                        </div>
                      </div>
                      <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">/ {plan.days} Days</div>
                      {plan.description && (
                        <p className="text-[12px] font-medium leading-snug text-[var(--muted-2)] mb-3">{plan.description}</p>
                      )}
                      {owned ? (
                        <button
                          type="button"
                          disabled
                          className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-emerald-50 px-4 py-2.5 text-[12.5px] font-extrabold text-emerald-700 border border-emerald-200 cursor-default"
                        >
                          <Icon name="circleCheck" className="h-4 w-4" />
                          Active
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled={submitting}
                          onClick={() => startCheckout(plan)}
                          className="w-full rounded-xl bg-slate-900 px-5 py-2.5 text-[12.5px] font-bold text-white transition-all hover:bg-black hover:shadow-md disabled:opacity-50 active:scale-95"
                        >
                          {submitting ? "Processing..." : "Subscribe"}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                <div className="flex items-baseline gap-1">
                  <span className="text-[20px] font-black text-slate-900">{formatCurrency(batch.price)}</span>
                  <span className="text-[12.5px] font-bold text-slate-500">/ {batch.days} days</span>
                </div>
                {isSubscribedToPlanOrBatch(batch.plan_id) ? (
                  <button
                    type="button"
                    disabled
                    className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-emerald-50 px-5 py-3 text-[13px] font-extrabold text-emerald-700 border border-emerald-200 cursor-default"
                  >
                    <Icon name="circleCheck" className="h-4 w-4" />
                    Active
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={isSubmitting[batch.plan_id]}
                    onClick={() => startCheckout()}
                    className="w-full rounded-xl bg-slate-900 px-6 py-3 text-[13px] font-bold text-white transition-all hover:bg-black hover:shadow-md disabled:opacity-50 active:scale-95"
                  >
                    {isSubmitting[batch.plan_id] ? "Processing..." : "Subscribe"}
                  </button>
                )}
              </div>
            )}

            <p className="mt-4 text-[11px] font-medium text-[var(--muted-2)] text-center leading-relaxed">
              SEBI-registered advisory. Subscriptions auto-expire at the end of the term.
            </p>
          </aside>
        </div>
      </div>

      {/* Checkout modal */}
      {checkoutOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col">
            <div className="px-6 py-5 flex items-center justify-between border-b border-slate-100">
              <div>
                <h2 className="text-[17px] font-black text-slate-900 tracking-tight">Review &amp; Checkout</h2>
                <p className="text-[12px] font-medium text-slate-400 mt-0.5">Confirm your subscription details</p>
              </div>
              <button onClick={closeCheckout} className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 transition-colors">
                <Icon name="x" className="h-4 w-4" />
              </button>
            </div>

            <div className="px-6 py-5 flex flex-col gap-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex flex-col gap-0.5">
                  <h3 className="text-[15px] font-black text-slate-900 leading-snug">{batch.name}</h3>
                  <p className="text-[13px] font-medium text-slate-500">
                    {checkoutPlan ? checkoutPlan.name : "Monthly subscription"}
                    <span className="mx-1.5 text-slate-300">·</span>
                    {checkoutPlan ? checkoutPlan.days : batch.days} Days
                  </p>
                </div>
                <span className="shrink-0 inline-flex items-center rounded-full bg-blue-50 border border-blue-100 px-2.5 py-1 text-[11px] font-bold text-blue-700">
                  Advisory
                </span>
              </div>

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
                      onClick={() => {
                        setCouponSuccess(null);
                        setCouponCode("");
                        setFinalPrice(checkoutPlan ? checkoutPlan.discounted_price || checkoutPlan.price : batch.price);
                      }}
                      className="rounded-lg bg-red-50 px-4 py-2.5 text-[13px] font-bold text-red-600 hover:bg-red-100 transition-colors"
                    >
                      Remove
                    </button>
                  )}
                </div>
                {couponError && <p className="text-[12px] font-semibold text-red-500 mt-2">{couponError}</p>}
                {couponSuccess && <p className="text-[12px] font-semibold text-emerald-600 mt-2">✓ {couponSuccess}</p>}
              </div>

              <div className="flex items-center justify-between py-3 border-t border-slate-100">
                <span className="text-[14px] font-bold text-slate-600">Total Due</span>
                <div className="flex flex-col items-end">
                  {couponSuccess && (
                    <span className="text-[12px] font-bold text-slate-400 line-through mb-0.5">
                      {formatCurrency(checkoutPlan ? checkoutPlan.discounted_price || checkoutPlan.price : batch.price)}
                    </span>
                  )}
                  <span className="text-[22px] font-black text-slate-900 tracking-tight">{formatCurrency(finalPrice ?? 0)}</span>
                </div>
              </div>
            </div>

            <div className="px-6 pb-6">
              {(() => {
                const owned = isSubscribedToPlanOrBatch(batch.plan_id, checkoutPlan?.batch_id);
                const submitting = isSubmitting[checkoutPlan ? `${batch.plan_id}_${checkoutPlan.batch_id}` : batch.plan_id];
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

      {/* Success modal */}
      {successInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col">
            <div className="px-6 pt-8 pb-6 flex flex-col items-center text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 ring-8 ring-emerald-50/60">
                <Icon name="circleCheck" className="h-9 w-9 text-emerald-500" />
              </div>
              <h2 className="mt-5 text-[19px] font-black text-slate-900 tracking-tight">Payment Successful</h2>
              <p className="mt-1 text-[13px] font-medium text-slate-500">
                You&apos;re now subscribed to <span className="font-bold text-slate-700">{successInfo.batchName}</span>.
              </p>

              <div className="mt-6 w-full rounded-xl border border-slate-200 divide-y divide-slate-100">
                <div className="flex items-center justify-between px-4 py-3">
                  <span className="text-[12.5px] font-semibold text-slate-400">Batch</span>
                  <span className="text-[12.5px] font-bold text-slate-800">{successInfo.batchName} · {successInfo.tierName}</span>
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
