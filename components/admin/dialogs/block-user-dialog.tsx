"use client";

import { useState } from "react";
import type { ReactNode } from "react";

import { Textarea } from "@/components/ui/textarea";
import { ConfirmDialog } from "./_confirm-dialog";
import { adminFetch } from "@/lib/admin/client-api";

type Props = {
  userId: string;
  currentState: string;
  refresh: () => void;
  trigger: ReactNode;
};

export function BlockUserDialog({ userId, currentState, refresh, trigger }: Props) {
  const [reason, setReason] = useState("");
  const isBlocked = /BLOCKED/i.test(currentState);
  const action = isBlocked ? "UNBLOCK" : "BLOCK";

  return (
    <ConfirmDialog
      trigger={trigger}
      title={isBlocked ? "Unblock user" : "Block user"}
      description={
        isBlocked
          ? "Remove the block on this user account."
          : "This will prevent the user from accessing the platform."
      }
      confirmLabel={action}
      destructive={!isBlocked}
      onConfirm={async () => {
        const res = await adminFetch(`/api/admin/users/${encodeURIComponent(userId)}/block`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action, reason }),
        });
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
        <label className="text-sm font-medium">Reason</label>
        <Textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Describe the reason for this action..."
          rows={3}
        />
      </div>
    </ConfirmDialog>
  );
}
