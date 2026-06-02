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

export function VerifyAnalystDialog({ analystId, refresh, trigger }: Props) {
  const [notes, setNotes] = useState("");

  return (
    <ConfirmDialog
      trigger={trigger}
      title="Approve analyst verification"
      description="Approve this analyst's SEBI license and onboarding application."
      confirmLabel="Approve"
      onConfirm={async () => {
        const res = await adminFetch(
          `/api/admin/analysts/${encodeURIComponent(analystId)}/verify`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ decision: "APPROVE", notes: notes || undefined }),
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
      onClose={() => setNotes("")}
    >
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium">Notes (optional)</label>
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Additional notes for approval..."
          rows={3}
        />
      </div>
    </ConfirmDialog>
  );
}
