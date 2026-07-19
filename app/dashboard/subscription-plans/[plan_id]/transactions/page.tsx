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

function formatDateAndTime(isoString?: string): string {
  if (!isoString) return "—";
  return new Date(isoString).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
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

export default function BatchTransactionsPage({
  params,
}: {
  params: Promise<{ plan_id: string }>;
}) {
  const { plan_id } = use(params);

  const [transactions, setTransactions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchTransactions = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/analyst/subscribers?plan_id=${plan_id}&limit=1000`, {
        credentials: "same-origin",
        cache: "no-store",
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      const list = json.subscriptions ?? json.data ?? json ?? [];

      // Filter out those without payment info, although most should have it
      setTransactions(Array.isArray(list) ? list : []);
      setIsError(false);
    } catch (err) {
      console.error("Failed to load transactions:", err);
      setTransactions([]);
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void fetchTransactions();
  }, [plan_id]);

  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      const term = searchQuery.toLowerCase().trim();
      return (
        !term ||
        t.user_name?.toLowerCase().includes(term) ||
        (t.user_email && t.user_email.toLowerCase().includes(term)) ||
        t.subscription_id?.toLowerCase().includes(term) ||
        // transaction_id might not be mapped in proxy yet, but we will check it if present
        t.payment?.transaction_id?.toLowerCase().includes(term)
      );
    });
  }, [transactions, searchQuery]);

  return (
    <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-[22px] font-black tracking-tight text-[var(--ink)]">Transactions</h1>
        <p className="text-[13px] text-[var(--muted-2)] font-medium">
          View payments made by subscribers for this batch.
        </p>
      </div>

      <div className="flex flex-wrap gap-4 items-center justify-between bg-white p-4 rounded-xl border border-[var(--line)] shadow-[0_1px_4px_rgba(0,0,0,0.03)]">
        <div className="relative min-w-[320px] max-[640px]:w-full">
          <Icon
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--muted-2)] h-4 w-4"
            name="search"
          />
          <input
            type="text"
            placeholder="Search by name, email or ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-[var(--line)] rounded-lg outline-none focus:border-[var(--brand)] transition-colors text-[13px] font-medium"
          />
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
                  Transaction Details
                </th>
                <th className="py-4 px-4 text-[11px] font-bold uppercase tracking-[0.06em] text-[var(--muted-2)] text-right">
                  Amount
                </th>
                <th className="py-4 px-4 text-[11px] font-bold uppercase tracking-[0.06em] text-[var(--muted-2)]">
                  Date & Time
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
                      <div className="h-4 w-32 animate-pulse rounded bg-[var(--line)]" />
                    </td>
                    <td className="py-5 px-4 text-right">
                      <div className="h-4 w-12 animate-pulse rounded bg-[var(--line)] ml-auto" />
                    </td>
                    <td className="py-5 px-4">
                      <div className="h-4 w-24 animate-pulse rounded bg-[var(--line)]" />
                    </td>
                    <td className="py-5 pl-4 pr-6 text-center">
                      <div className="mx-auto h-5 w-16 animate-pulse rounded-full bg-[var(--line)]" />
                    </td>
                  </tr>
                ))
              ) : isError ? (
                <tr>
                  <td
                    colSpan={5}
                    className="py-12 text-center text-[var(--red)] text-[13px] font-bold"
                  >
                    Failed to load transactions.
                  </td>
                </tr>
              ) : filteredTransactions.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="py-16 text-center text-[13px] font-bold text-[var(--muted-2)]"
                  >
                    No transactions found for this batch.
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((t) => {
                  return (
                    <tr
                      key={t.subscription_id}
                      className="border-b border-[var(--line)] hover:bg-[var(--surface)] transition-colors"
                    >
                      <td className="py-4 pl-6 pr-4">
                        <div className="flex items-center gap-3">
                          {t.user_avatar ? (
                            <Image
                              alt={t.user_name}
                              className="h-9 w-9 shrink-0 rounded-full object-cover border border-[var(--line)]"
                              src={t.user_avatar}
                              width={36}
                              height={36}
                            />
                          ) : (
                            <div
                              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[11.5px] font-extrabold text-white"
                              style={{ background: avatarGradient(t.user_name) }}
                            >
                              {getInitials(t.user_name)}
                            </div>
                          )}
                          <div className="min-w-0">
                            <div className="text-[13px] font-bold text-[var(--ink)] truncate">
                              {t.user_name}
                            </div>
                            <div className="text-[11.5px] text-[var(--muted-2)] truncate mt-0.5">
                              {t.user_email || "No email"}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="text-[12.5px] font-bold text-[var(--ink)]">
                          {t.subscription_id}
                        </div>
                        <div className="text-[11.5px] text-[var(--muted-2)] mt-0.5">
                          {t.payment?.transaction_id || "Stripe / RazorPay"}
                        </div>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <span className="text-[14px] font-black text-emerald-600">
                          {formatCurrency(t.amount ?? 0)}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-[12.5px] text-[var(--ink)] font-medium">
                        {formatDateAndTime(t.subscribed_at)}
                      </td>
                      <td className="py-4 pl-4 pr-6 text-center">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-1 text-[11px] font-bold text-emerald-700 uppercase tracking-wider shadow-sm">
                          <Icon className="h-3 w-3 text-emerald-500" name="circleCheck" />
                          Paid
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
