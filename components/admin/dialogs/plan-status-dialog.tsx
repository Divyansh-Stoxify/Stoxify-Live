"use client";

import type { ReactNode } from "react";

import { ConfirmDialog } from "./_confirm-dialog";
import { adminFetch } from "@/lib/admin/client-api";

type Props = {
  planId: string;
  isActive: boolean;
  refresh: () => void;
  trigger: ReactNode;
};

export function PlanStatusDialog({ planId, isActive, refresh, trigger }: Props) {
  return (
    <ConfirmDialog
      trigger={trigger}
      title={isActive ? "Deactivate plan" : "Activate plan"}
      description={
        isActive
          ? "This plan will no longer be available for new subscriptions. Existing subscriptions are not affected."
          : "This plan will become available for new subscriptions."
      }
      confirmLabel={isActive ? "Deactivate" : "Activate"}
      destructive={isActive}
      onConfirm={async () => {
        const res = await adminFetch(`/api/admin/plans/${encodeURIComponent(planId)}/status`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ active: !isActive }),
        });
        const data = await res.json().catch(() => ({})) as Record<string, unknown>;
        return { ok: res.ok, message: data.message as string | undefined, code: data.code as string | undefined };
      }}
      onSuccess={refresh}
    />
  );
}
