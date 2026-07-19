"use client";

import React, { useState, useEffect, useMemo, use } from "react";
import Image from "next/image";
import { Icon } from "@/components/stoxify-icon";
import type { Subscriber } from "@/lib/types/analyst";

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(isoString?: string): string {
  if (!isoString) return "—";
  return new Date(isoString).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

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

export default function BatchMembersPage({ params }: { params: Promise<{ plan_id: string }> }) {
  const { plan_id } = use(params);

  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("ALL");

  const fetchSubscribers = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/analyst/subscribers?plan_id=${plan_id}&limit=1000`, {
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
  }, [plan_id]);

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

  const filteredSubscribers = useMemo(() => {
    return subscribers.filter((sub) => {
      const term = searchQuery.toLowerCase().trim();
      const matchSearch =
        !term ||
        sub.user_name.toLowerCase().includes(term) ||
        (sub.user_email && sub.user_email.toLowerCase().includes(term)) ||
        sub.subscription_id.toLowerCase().includes(term);

      const matchStatus = selectedStatus === "ALL" || sub.status === selectedStatus;

      return matchSearch && matchStatus;
    });
  }, [subscribers, searchQuery, selectedStatus]);

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
    <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-[22px] font-black tracking-tight text-[var(--ink)]">Members</h1>
        <p className="text-[13px] text-[var(--muted-2)] font-medium">
          Manage subscribers for this batch.
        </p>
      </div>

      <div className="flex flex-wrap gap-4 items-center justify-between bg-white p-4 rounded-xl border border-[var(--line)] shadow-[0_1px_4px_rgba(0,0,0,0.03)]">
        <div className="relative min-w-[280px] max-[640px]:w-full">
          <Icon
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--muted-2)] h-4 w-4"
            name="search"
          />
          <input
            type="text"
            placeholder="Search by name, email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-[var(--line)] rounded-lg outline-none focus:border-[var(--brand)] transition-colors text-[13px] font-medium"
          />
        </div>

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

      <div className="rounded-xl border border-[var(--line)] bg-white shadow-[0_1px_4px_rgba(0,0,0,0.04)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[var(--line)] bg-[var(--line-2)]">
                <th className="py-4 pl-6 pr-4 text-[11px] font-bold uppercase tracking-[0.06em] text-[var(--muted-2)]">
                  Subscriber
                </th>
                <th className="py-4 px-4 text-[11px] font-bold uppercase tracking-[0.06em] text-[var(--muted-2)]">
                  Billing Cycle
                </th>
                <th className="py-4 px-4 text-[11px] font-bold uppercase tracking-[0.06em] text-[var(--muted-2)]">
                  Amount Paid
                </th>
                <th className="py-4 px-4 text-[11px] font-bold uppercase tracking-[0.06em] text-[var(--muted-2)]">
                  Subscribed On
                </th>
                <th className="py-4 px-4 text-[11px] font-bold uppercase tracking-[0.06em] text-[var(--muted-2)]">
                  Valid Till
                </th>
                <th className="py-4 px-4 text-[11px] font-bold uppercase tracking-[0.06em] text-[var(--muted-2)]">
                  Remaining
                </th>
                <th className="py-4 pl-4 pr-6 text-[11px] font-bold uppercase tracking-[0.06em] text-[var(--muted-2)] text-center">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 3 }).map((_, idx) => (
                  <tr key={idx} className="border-b border-[var(--line)]">
                    <td className="py-5 pl-6 pr-4">
                      <div className="h-9 w-32 animate-pulse rounded bg-[var(--line)]" />
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
                  <td
                    colSpan={7}
                    className="py-12 text-center text-[var(--red)] text-[13px] font-bold"
                  >
                    Failed to load subscribers.
                  </td>
                </tr>
              ) : filteredSubscribers.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="py-16 text-center text-[13px] font-bold text-[var(--muted-2)]"
                  >
                    No subscribers found in this batch.
                  </td>
                </tr>
              ) : (
                filteredSubscribers.map((sub) => {
                  const validity = getValidityDetails(sub);
                  return (
                    <tr
                      key={sub.subscription_id}
                      className="border-b border-[var(--line)] hover:bg-[var(--surface)] transition-colors"
                    >
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
                              {sub.user_email || "No email"}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-[12.5px] font-medium text-[var(--muted-2)]">
                        {getBillingLabel(sub.billing_cycle)}
                      </td>
                      <td className="py-4 px-4 text-[13px] font-bold text-[var(--ink)]">
                        {formatCurrency(sub.amount ?? 0)}
                      </td>
                      <td className="py-4 px-4 text-[12.5px] text-[var(--ink)] font-medium">
                        {formatDate(sub.subscribed_at)}
                      </td>
                      <td className="py-4 px-4 text-[12.5px] text-[var(--ink)] font-medium">
                        {formatDate(sub.end_date)}
                      </td>
                      <td className="py-4 px-4 text-[12.5px]">
                        <span className={validity.className}>{validity.text}</span>
                      </td>
                      <td className="py-4 pl-4 pr-6 text-center">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-[0.03em] ${getStatusBadge(sub.status)}`}
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
  );
}
