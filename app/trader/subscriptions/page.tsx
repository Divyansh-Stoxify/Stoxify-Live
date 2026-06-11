"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function SubscriptionsPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/trader/profile?tab=subscriptions");
  }, [router]);

  return (
    <div className="flex h-screen items-center justify-center bg-[var(--surface)]">
      <div className="flex flex-col items-center gap-3">
        <span className="h-8 w-8 animate-spin rounded-full border-4 border-[var(--brand)] border-t-transparent" />
        <p className="text-[14px] font-semibold text-[var(--muted)]">
          Redirecting to profile subscriptions...
        </p>
      </div>
    </div>
  );
}
