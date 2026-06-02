"use client";

import { useState } from "react";
import type { ReactNode } from "react";

import { Textarea } from "@/components/ui/textarea";
import { ConfirmDialog } from "./_confirm-dialog";
import { adminFetch } from "@/lib/admin/client-api";

type Props = {
  sessionId: string;
  refresh: () => void;
  trigger: ReactNode;
};

export function RevokeSessionDialog({ sessionId, refresh, trigger }: Props) {
  const [reason, setReason] = useState("");

  return (
    <ConfirmDialog
      trigger={trigger}
      title="Revoke session"
      description="This session will be immediately invalidated. The user will be logged out."
      confirmLabel="Revoke"
      destructive
      onConfirm={async () => {
        const res = await adminFetch(`/api/admin/security/sessions/${encodeURIComponent(sessionId)}/revoke`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reason: reason || undefined }),
        });
        const data = await res.json().catch(() => ({})) as Record<string, unknown>;
        return { ok: res.ok, message: data.message as string | undefined, code: data.code as string | undefined };
      }}
      onSuccess={refresh}
      onClose={() => setReason("")}
    >
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium">Reason (optional)</label>
        <Textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Why are you revoking this session?" rows={3} />
      </div>
    </ConfirmDialog>
  );
}
