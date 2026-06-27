"use client";

import React, { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import { Topbar } from "@/components/dashboard/topbar";
import { MetricCard } from "@/components/dashboard/metric-card";
import { Icon } from "@/components/stoxify-icon";
import { useSubscriptionPlans } from "@/hooks/use-analyst-dashboard";
import type { Subscriber } from "@/lib/types/analyst";

// Helper to format currency in Indian numbering system (Lakh/Crore)
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

// Helper to format date
function formatDate(isoString?: string): string {
  if (!isoString) return "—";
  return new Date(isoString).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// Deterministic initials from full name
function getInitials(name?: string): string {
  if (!name || !name.trim()) return "S";
  return name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

// Deterministic avatar gradient background
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

// Helper to get billing cycle label
function getBillingLabel(cycle: string): string {
  switch (cycle) {
    case "WEEK":
      return "Weekly";
    case "MONTH":
      return "Monthly";
    case "QUARTER":
      return "Quarterly";
    case "YEAR":
      return "Yearly";
    default:
      return cycle;
  }
}

export default function SubscribersPage() {
  // Subscribers lists states
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);

  // Filters and search states
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPlan, setSelectedPlan] = useState("ALL");
  const [selectedStatus, setSelectedStatus] = useState("ALL");

  // Fetch plan names from plan-service using active hook
  const { plans, isLoading: isPlansLoading } = useSubscriptionPlans();

  // Fetch subscribers list
  const fetchSubscribers = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/analyst/subscribers?limit=1000", {
        credentials: "same-origin",
        cache: "no-store",
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      const list = json.subscriptions ?? json.data ?? json ?? [];
      setSubscribers(Array.isArray(list) ? list : []);
      setIsError(false);
    } catch (err) {
      console.error("Failed to load subscribers:", err);
      setSubscribers([]);
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void fetchSubscribers();
  }, []);

  // Compute overall subscriber statistics
  const stats = useMemo(() => {
    const total = subscribers.length;
    const active = subscribers.filter((s) => s.status === "ACTIVE").length;

    // Estimate MRR (normalizing active plan cycles to monthly)
    const mrr = subscribers
      .filter((s) => s.status === "ACTIVE")
      .reduce((sum, s) => {
        const amt = s.amount ?? 0;
        let monthlyEquivalent = amt;
        if (s.billing_cycle === "WEEK") {
          monthlyEquivalent = amt * 4.33;
        } else if (s.billing_cycle === "QUARTER") {
          monthlyEquivalent = amt / 3;
        } else if (s.billing_cycle === "YEAR") {
          monthlyEquivalent = amt / 12;
        }
        return sum + monthlyEquivalent;
      }, 0);

    return { total, active, mrr: Math.round(mrr) };
  }, [subscribers]);

  // Compute remaining days and formatted days left text
  const getValidityDetails = (sub: Subscriber) => {
    if (sub.status !== "ACTIVE" || !sub.end_date) {
      return {
        text: sub.status === "CANCELLED" ? "Cancelled" : "Expired",
        className: "text-[var(--muted-2)] font-medium",
      };
    }

    const endMs = new Date(sub.end_date).getTime();
    const nowMs = Date.now();
    const diffDays = Math.ceil((endMs - nowMs) / (1000 * 60 * 60 * 24));

    if (diffDays <= 0) {
      return { text: "Ends today", className: "text-[var(--orange)] font-bold" };
    }

    return {
      text: `${diffDays} day${diffDays !== 1 ? "s" : ""} left`,
      className: "text-[var(--ink)] font-semibold",
    };
  };

  // Filters logic
  const filteredSubscribers = useMemo(() => {
    return subscribers.filter((sub) => {
      // 1. Search Query mapping
      const term = searchQuery.toLowerCase().trim();
      const matchSearch =
        !term ||
        sub.user_name.toLowerCase().includes(term) ||
        (sub.user_email && sub.user_email.toLowerCase().includes(term)) ||
        sub.subscription_id.toLowerCase().includes(term);

      // 2. Plan filter mapping
      const matchPlan = selectedPlan === "ALL" || sub.plan_name === selectedPlan;

      // 3. Status filter mapping
      const matchStatus = selectedStatus === "ALL" || sub.status === selectedStatus;

      return matchSearch && matchPlan && matchStatus;
    });
  }, [subscribers, searchQuery, selectedPlan, selectedStatus]);

  // Plan colors helper
  const getPlanColor = (planName: string) => {
    switch (planName) {
      case "Premium":
        return "bg-purple-100 text-purple-700 border border-purple-200";
      case "Pro":
        return "bg-blue-100 text-blue-700 border border-blue-200";
      default:
        return "bg-gray-100 text-gray-700 border border-gray-200";
    }
  };

  // Status colors helper
  const getStatusBadge = (status?: string) => {
    switch (status) {
      case "ACTIVE":
        return "bg-[var(--green-light)] text-[var(--green)]";
      case "CANCELLED":
        return "bg-[var(--orange-light)] text-[var(--orange)]";
      default:
        return "bg-[var(--red-light)] text-[var(--red)]";
    }
  };

  return (
    <>
      <Topbar showUserProfile title="Subscribers" />

      <div className="flex-1 p-6 flex flex-col gap-6 overflow-y-auto">
        {/* ─── Metric Strip ─── */}
        <div className="grid grid-cols-3 gap-6 max-[860px]:grid-cols-1">
          {isLoading ? (
            <>
              <div className="h-[120px] rounded-xl border border-[var(--line)] bg-white animate-pulse" />
              <div className="h-[120px] rounded-xl border border-[var(--line)] bg-white animate-pulse" />
              <div className="h-[120px] rounded-xl border border-[var(--line)] bg-white animate-pulse" />
            </>
          ) : (
            <>
              <MetricCard
                icon="users"
                label="Total Subscribers"
                value={stats.total.toString()}
                changeLabel="subscribed traders"
              />
              <MetricCard
                icon="shieldCheck"
                label="Active Subscribers"
                value={stats.active.toString()}
                changeLabel="currently active"
              />
              <MetricCard
                icon="rupee"
                label="Monthly Revenue"
                value={formatCurrency(stats.mrr)}
                changeLabel="estimated monthly recurring"
              />
            </>
          )}
        </div>

        {/* ─── Filter & Search Row ─── */}
        <div className="flex flex-wrap gap-4 items-center justify-between bg-white p-4 rounded-xl border border-[var(--line)] shadow-[0_1px_4px_rgba(0,0,0,0.03)]">
          {/* Left search */}
          <div className="relative min-w-[280px] max-[640px]:w-full">
            <Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--muted-2)] h-4 w-4" name="search" />
            <input
              type="text"
              placeholder="Search by name, email or subscription ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-[var(--line)] rounded-lg outline-none focus:border-[var(--brand)] transition-colors text-[13px] font-medium"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted-2)] hover:text-[var(--ink)]"
              >
                <Icon className="h-3 w-3" name="x" />
              </button>
            )}
          </div>

          {/* Right filters */}
          <div className="flex items-center gap-3 max-[640px]:w-full max-[640px]:justify-between">
            {/* Plan filter */}
            <div className="flex items-center gap-2">
              <span className="text-[12.5px] font-bold text-[var(--muted)]">Plan:</span>
              <select
                value={selectedPlan}
                onChange={(e) => setSelectedPlan(e.target.value)}
                className="bg-[var(--line-2)] hover:bg-[var(--surface)] text-[12.5px] font-bold text-[var(--ink)] border border-[var(--line)] rounded-lg px-3 py-2 outline-none cursor-pointer transition-colors"
              >
                <option value="ALL">All Batches</option>
                {plans.map((p) => (
                  <option key={p.plan_id} value={p.name}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Status filter */}
            <div className="flex items-center gap-2">
              <span className="text-[12.5px] font-bold text-[var(--muted)]">Status:</span>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="bg-[var(--line-2)] hover:bg-[var(--surface)] text-[12.5px] font-bold text-[var(--ink)] border border-[var(--line)] rounded-lg px-3 py-2 outline-none cursor-pointer transition-colors"
              >
                <option value="ALL">All Statuses</option>
                <option value="ACTIVE">Active</option>
                <option value="CANCELLED">Cancelled</option>
                <option value="EXPIRED">Expired</option>
              </select>
            </div>
          </div>
        </div>

        {/* ─── Subscribers Table ─── */}
        <div className="rounded-xl border border-[var(--line)] bg-white shadow-[0_1px_4px_rgba(0,0,0,0.04)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[var(--line)] bg-[var(--line-2)]">
                  <th className="py-4.5 pl-6 pr-4 text-[11px] font-bold uppercase tracking-[0.06em] text-[var(--muted-2)]">
                    Subscriber
                  </th>
                  <th className="py-4.5 px-4 text-[11px] font-bold uppercase tracking-[0.06em] text-[var(--muted-2)]">
                    Plan Details
                  </th>
                  <th className="py-4.5 px-4 text-[11px] font-bold uppercase tracking-[0.06em] text-[var(--muted-2)]">
                    Amount Paid
                  </th>
                  <th className="py-4.5 px-4 text-[11px] font-bold uppercase tracking-[0.06em] text-[var(--muted-2)]">
                    Subscribed On
                  </th>
                  <th className="py-4.5 px-4 text-[11px] font-bold uppercase tracking-[0.06em] text-[var(--muted-2)]">
                    Valid Till
                  </th>
                  <th className="py-4.5 px-4 text-[11px] font-bold uppercase tracking-[0.06em] text-[var(--muted-2)]">
                    Remaining Time
                  </th>
                  <th className="py-4.5 pl-4 pr-6 text-[11px] font-bold uppercase tracking-[0.06em] text-[var(--muted-2)] text-center">
                    Status
                  </th>
                </tr>
              </thead>

              <tbody>
                {isLoading ? (
                  Array.from({ length: 4 }).map((_, idx) => (
                    <tr key={idx} className="border-b border-[var(--line)]">
                      <td className="py-5 pl-6 pr-4">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 shrink-0 animate-pulse rounded-full bg-[var(--line)]" />
                          <div className="space-y-1.5">
                            <div className="h-3 w-28 animate-pulse rounded bg-[var(--line)]" />
                            <div className="h-2.5 w-36 animate-pulse rounded bg-[var(--line)]" />
                          </div>
                        </div>
                      </td>
                      <td className="py-5 px-4">
                        <div className="h-4 w-16 animate-pulse rounded bg-[var(--line)]" />
                      </td>
                      <td className="py-5 px-4">
                        <div className="h-4 w-12 animate-pulse rounded bg-[var(--line)]" />
                      </td>
                      <td className="py-5 px-4">
                        <div className="h-4 w-20 animate-pulse rounded bg-[var(--line)]" />
                      </td>
                      <td className="py-5 px-4">
                        <div className="h-4 w-20 animate-pulse rounded bg-[var(--line)]" />
                      </td>
                      <td className="py-5 px-4">
                        <div className="h-4 w-20 animate-pulse rounded bg-[var(--line)]" />
                      </td>
                      <td className="py-5 pl-4 pr-6 text-center">
                        <div className="mx-auto h-5 w-16 animate-pulse rounded-full bg-[var(--line)]" />
                      </td>
                    </tr>
                  ))
                ) : isError ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center">
                      <div className="flex flex-col items-center gap-2 text-[var(--red)]">
                        <Icon className="h-8 w-8" name="x" />
                        <span className="text-[13px] font-bold">Failed to load subscribers. Check if subscription service is active.</span>
                        <button
                          onClick={() => void fetchSubscribers()}
                          className="mt-2 text-[12px] font-bold text-[var(--brand)] hover:underline flex items-center gap-1"
                        >
                          <Icon className="h-3 w-3" name="activity" /> Try Again
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : filteredSubscribers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-16 text-center">
                      <div className="flex flex-col items-center gap-2 text-[var(--muted-2)]">
                        <Icon className="h-10 w-10 text-[var(--line)] mb-1" name="users" />
                        <span className="text-[13.5px] font-bold text-[var(--ink)]">No subscribers found</span>
                        <span className="text-[12px] text-[var(--muted-2)]">
                          {subscribers.length === 0
                            ? "You do not have any subscription records yet."
                            : "No matching records found for active filters."}
                        </span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredSubscribers.map((sub) => {
                    const validity = getValidityDetails(sub);
                    return (
                      <tr
                        key={sub.subscription_id}
                        className="border-b border-[var(--line)] last:border-0 hover:bg-[var(--surface)] transition-colors"
                      >
                        {/* Subscriber User */}
                        <td className="py-4 pl-6 pr-4">
                          <div className="flex items-center gap-3">
                            {sub.user_avatar ? (
                              <Image
                                alt={sub.user_name}
                                className="h-9 w-9 shrink-0 rounded-full object-cover border border-[var(--line)]"
                                src={sub.user_avatar}
                                width={36}
                                height={36}
                              />
                            ) : (
                              <div
                                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[11.5px] font-extrabold text-white"
                                style={{ background: avatarGradient(sub.user_name) }}
                              >
                                {getInitials(sub.user_name)}
                              </div>
                            )}
                            <div className="min-w-0">
                              <div className="text-[13px] font-bold text-[var(--ink)] truncate">
                                {sub.user_name}
                              </div>
                              <div className="text-[11.5px] text-[var(--muted-2)] truncate mt-0.5">
                                {sub.user_email || "No email provided"}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Plan details */}
                        <td className="py-4 px-4">
                          <span className={`inline-flex rounded px-2.5 py-0.5 text-[11px] font-bold ${getPlanColor(sub.plan_name)}`}>
                            {sub.plan_name}
                          </span>
                          <div className="text-[11px] text-[var(--muted-2)] mt-1">
                            {getBillingLabel(sub.billing_cycle)}
                          </div>
                        </td>

                        {/* Amount */}
                        <td className="py-4 px-4 text-[13px] font-bold text-[var(--ink)]">
                          {formatCurrency(sub.amount ?? 0)}
                        </td>

                        {/* Start date */}
                        <td className="py-4 px-4 text-[12.5px] text-[var(--ink)] font-medium">
                          {formatDate(sub.subscribed_at)}
                        </td>

                        {/* End date */}
                        <td className="py-4 px-4 text-[12.5px] text-[var(--ink)] font-medium">
                          {formatDate(sub.end_date)}
                        </td>

                        {/* Validity remaining days */}
                        <td className="py-4 px-4 text-[12.5px]">
                          <span className={validity.className}>{validity.text}</span>
                        </td>

                        {/* Status Badge */}
                        <td className="py-4 pl-4 pr-6 text-center">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-[0.03em] ${getStatusBadge(
                              sub.status
                            )}`}
                          >
                            {sub.status || "UNKNOWN"}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}
