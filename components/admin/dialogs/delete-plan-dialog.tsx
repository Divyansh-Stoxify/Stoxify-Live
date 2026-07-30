"use client";

import type { ReactNode } from "react";

import { ConfirmDialog } from "./_confirm-dialog";
import { adminFetch } from "@/lib/admin/client-api";

type Props = {
  planId: string;
  planName?: string;
  refresh: () => void;
  trigger: ReactNode;
};

/**
 * Hard-deletes a plan via DELETE /plans/:plan_id. The plan-service refuses
 * while the plan still has active subscriptions, so a failure here is usually
 * "someone is still paying for this" rather than a bug — surface the backend's
 * message instead of swallowing it.
 */
export function DeletePlanDialog({ planId, planName, refresh, trigger }: Props) {
  return (
    <ConfirmDialog
      trigger={trigger}
      title="Delete plan"
      description={`Permanently delete ${
        planName ? `"${planName}"` : "this plan"
      }? This cannot be undone, and it will fail if the plan still has active subscribers.`}
      confirmLabel="Delete plan"
      destructive
      requireConfirmText="DELETE"
      onConfirm={async () => {
        const res = await adminFetch(`/api/admin/plans/${encodeURIComponent(planId)}`, {
          method: "DELETE",
        });
        const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
        return {
          ok: res.ok,
          message: res.ok
            ? `Plan ${planName ?? planId} deleted`
            : ((data.message ?? data.error) as string | undefined),
          code: data.code as string | undefined,
        };
      }}
      onSuccess={refresh}
    />
  );
}
