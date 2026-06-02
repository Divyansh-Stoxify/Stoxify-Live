"use client";

import { useState } from "react";
import type { ReactNode } from "react";

import { Textarea } from "@/components/ui/textarea";
import { ConfirmDialog } from "./_confirm-dialog";
import { adminFetch } from "@/lib/admin/client-api";

type Props = {
  analystId: string;
  refresh: () => void;
  trigger: ReactNode;
};

export function RejectAnalystDialog({ analystId, refresh, trigger }: Props) {
  const [reason, setReason] = useState("");

  return (
    <ConfirmDialog
      trigger={trigger}
      title="Reject analyst application"
      description="Reject this analyst's verification application. A reason is required."
      confirmLabel="Reject"
      destructive
      onConfirm={async () => {
        if (!reason.trim()) {
          return { ok: false, message: "Reason is required", code: "VALIDATION_ERROR" };
        }
        const res = await adminFetch(
          `/api/admin/analysts/${encodeURIComponent(analystId)}/verify`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ decision: "REJECT", reason }),
          }
        );
        const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
        return {
          ok: res.ok,
          message: data.message as string | undefined,
          code: data.code as string | undefined,
        };
      }}
      onSuccess={refresh}
      onClose={() => setReason("")}
    >
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium">Rejection reason</label>
        <Textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Explain why this application is being rejected..."
          rows={3}
        />
      </div>
    </ConfirmDialog>
  );
}
