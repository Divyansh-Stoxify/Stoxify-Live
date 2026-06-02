"use client";

import { useState } from "react";
import type { ReactNode } from "react";

import { Textarea } from "@/components/ui/textarea";
import { ConfirmDialog } from "./_confirm-dialog";
import { adminFetch } from "@/lib/admin/client-api";

const USER_STATES = ["UNVERIFIED", "KYC_PENDING", "ACTIVE", "SUSPENDED", "BLOCKED"] as const;

type Props = {
  userId: string;
  currentState: string;
  refresh: () => void;
  trigger: ReactNode;
};

export function ChangeUserStateDialog({ userId, currentState, refresh, trigger }: Props) {
  const [newState, setNewState] = useState(currentState ?? "ACTIVE");
  const [reason, setReason] = useState("");

  return (
    <ConfirmDialog
      trigger={trigger}
      title="Change user state"
      description="Update the lifecycle state for this user account."
      confirmLabel="Update state"
      onConfirm={async () => {
        const res = await adminFetch(`/api/admin/users/${encodeURIComponent(userId)}/state`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ state: newState, reason }),
        });
        const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
        return {
          ok: res.ok,
          message: data.message as string | undefined,
          code: data.code as string | undefined,
        };
      }}
      onSuccess={refresh}
      onClose={() => {
        setNewState(currentState ?? "ACTIVE");
        setReason("");
      }}
    >
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium">New state</label>
        <select
          className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none focus-visible:border-ring"
          value={newState}
          onChange={(e) => setNewState(e.target.value)}
        >
          {USER_STATES.map((s) => (
            <option key={s} value={s}>
              {s.replaceAll("_", " ")}
            </option>
          ))}
        </select>
      </div>
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium">Reason</label>
        <Textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Describe the reason for this state change..."
          rows={3}
        />
      </div>
    </ConfirmDialog>
  );
}
