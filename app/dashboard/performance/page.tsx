"use client";
import { Topbar } from "@/components/dashboard/topbar";

export default function PerformancePage() {
  return (
    <>
      <Topbar title="Performance" />
      <div className="flex-1 p-6">
        <div className="rounded-xl border border-[var(--line)] bg-white p-8 text-center text-[var(--muted-2)] text-[14px]">
          Performance Analytics page — coming soon
        </div>
      </div>
    </>
  );
}
