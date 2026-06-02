"use client";

import type { ReactNode } from "react";

import { ConfirmDialog } from "./_confirm-dialog";
import { adminFetch } from "@/lib/admin/client-api";

type Props = {
  planId: string;
  refresh: () => void;
  trigger: ReactNode;
};

export function DeletePlanDialog({ planId, refresh, trigger }: Props) {
  return (
    <ConfirmDialog
      trigger={trigger}
      title="Delete plan"
      description="This action is permanent and cannot be undone. All associated data will be lost."
      confirmLabel="Delete"
      destructive
      requireConfirmText={planId}
      onConfirm={async () => {
        const res = await adminFetch(`/api/admin/plans/${encodeURIComponent(planId)}`, {
          method: "DELETE",
        });
        const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
        return {
          ok: res.ok,
          message: data.message as string | undefined,
          code: data.code as string | undefined,
        };
      }}
      onSuccess={refresh}
    />
  );
}
