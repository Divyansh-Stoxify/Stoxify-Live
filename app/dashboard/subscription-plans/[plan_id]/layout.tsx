"use client";

import React, { use, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Topbar } from "@/components/dashboard/topbar";
import { Icon, type IconName } from "@/components/stoxify-icon";
import type { SubscriptionPlan } from "@/lib/types/analyst";

interface NavItem {
  href: string;
  label: string;
  icon: IconName;
  disabled?: boolean;
}

const BATCH_NAV_ITEMS: NavItem[] = [
  { href: "/overview", label: "Overview", icon: "layoutDashboard" },
  { href: "/landing-page", label: "Landing Page", icon: "fileText" },
  { href: "/members", label: "Members", icon: "users" },
  { href: "/transactions", label: "Transactions", icon: "receipt" },
  { href: "/discounts", label: "Discounts", icon: "ticket" },
  { href: "/insights", label: "Insights", icon: "barChart" },
  { href: "/edit", label: "Settings", icon: "gear" },
];

export default function BatchLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ plan_id: string }>;
}) {
  const { plan_id } = use(params);
  const pathname = usePathname();
  const [plan, setPlan] = useState<SubscriptionPlan | null>(null);

  useEffect(() => {
    const fetchPlan = async () => {
      try {
        const res = await fetch(`/api/analyst/plans/${plan_id}`);
        if (res.ok) {
          const data = await res.json();
          setPlan(data);
        }
      } catch (err) {
        console.error("Failed to fetch plan in layout", err);
      }
    };
    fetchPlan();
  }, [plan_id]);

  const isActive = (pathSuffix: string) => {
    return pathname.includes(`/dashboard/subscription-plans/${plan_id}${pathSuffix}`);
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#F9FAFB]">
      <Topbar title="Plans" showUserProfile={true} />

      <div className="flex flex-1 overflow-hidden relative">
        {/* Secondary Sidebar for the Batch */}
        <aside className="w-[240px] flex-shrink-0 bg-white border-r border-[var(--line)] flex flex-col h-full z-10 shadow-[2px_0_8px_rgba(0,0,0,0.01)]">
          {/* Back button & Title area */}
          <div className="p-5 border-b border-[var(--line)]/50">
            <Link
              href="/dashboard/subscription-plans"
              className="group inline-flex items-center gap-1.5 text-[12px] font-bold text-[var(--muted-2)] hover:text-[var(--ink)] transition-colors mb-3"
            >
              <Icon className="h-3 w-3 transition-transform group-hover:-translate-x-0.5 duration-200" name="arrowRight" style={{ transform: "rotate(180deg)" }} />
              Back to Plans
            </Link>
            <h2 className="text-[15px] font-bold text-[var(--ink)] tracking-tight truncate" title={plan?.name || "Loading..."}>
              {plan ? plan.name : "Loading..."}
            </h2>
            <p className="text-[10px] font-bold text-[var(--muted-2)] uppercase tracking-wider mt-0.5">
              Plan Workspace
            </p>
          </div>

          <nav className="flex-1 overflow-y-auto p-3">
            <ul className="space-y-1">
              {BATCH_NAV_ITEMS.map((item) => {
                const active = isActive(item.href);
                
                if (item.disabled) {
                  return (
                    <li key={item.href}>
                      <div className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-semibold text-[var(--muted)] opacity-40 cursor-not-allowed">
                        <Icon className="h-4 w-4 shrink-0" name={item.icon} />
                        <span className="flex-1">{item.label}</span>
                      </div>
                    </li>
                  );
                }

                return (
                  <li key={item.href}>
                    <Link
                      href={`/dashboard/subscription-plans/${plan_id}${item.href}`}
                      className={`
                        flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-semibold transition-all duration-200
                        ${
                          active
                            ? "bg-[var(--brand-light)] text-[var(--brand)] shadow-sm border border-[var(--brand)]/10 translate-x-1"
                            : "text-[var(--muted-2)] hover:bg-[var(--surface)] hover:text-[var(--ink)] hover:translate-x-0.5"
                        }
                      `}
                    >
                      <Icon className={`h-4 w-4 shrink-0 transition-transform duration-200 ${active ? "scale-105" : ""}`} name={item.icon} />
                      <span className="flex-1">{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col h-full overflow-hidden bg-[#F9FAFB] relative">
          {children}
        </main>
      </div>
    </div>
  );
}
