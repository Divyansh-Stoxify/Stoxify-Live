"use client";

import { useState } from "react";
import type { ReactNode } from "react";

import { Textarea } from "@/components/ui/textarea";
import { ConfirmDialog } from "./_confirm-dialog";
import { adminFetch } from "@/lib/admin/client-api";

// Analyst lifecycle state transitions allowed from the admin panel.
// Mirrors the backend user-service state machine for ANALYST accounts.
const ANALYST_STATE_TRANSITIONS: Record<string, readonly string[]> = {
  VERIFICATION_PENDING: ["ACTIVE", "BLOCKED"],
  PENDING: ["ACTIVE", "BLOCKED"],
  ACTIVE: ["SUSPENDED", "BLOCKED"],
  SUSPENDED: ["ACTIVE", "BLOCKED"],
  BLOCKED: ["ACTIVE"],
  SUSPICIOUS: ["ACTIVE", "BLOCKED", "SUSPENDED"],
};

type Props = {
  analystId: string;
  currentState: string;
  refresh: () => void;
  trigger: ReactNode;
};

export function ChangeAnalystStateDialog({ analystId, currentState, refresh, trigger }: Props) {
  const normalizedCurrentState = currentState.trim().toUpperCase();
  const allowedStates = ANALYST_STATE_TRANSITIONS[normalizedCurrentState] ?? [];
  const [newState, setNewState] = useState("");
  const [reason, setReason] = useState("");

  return (
    <ConfirmDialog
      trigger={trigger}
      title="Change analyst state"
      description="Update the lifecycle state for this analyst account."
      confirmLabel="Update state"
      onConfirm={async () => {
        const trimmedReason = reason.trim();

        if (!newState) {
          return {
            ok: false,
            message:
              allowedStates.length > 0
                ? "Select a valid next state"
                : `No supported admin transition from ${normalizedCurrentState || "this state"}`,
            code: "VALIDATION_ERROR",
          };
        }

        if (!trimmedReason) {
          return { ok: false, message: "Reason is required", code: "VALIDATION_ERROR" };
        }

        const res = await adminFetch(`/api/admin/analysts/${encodeURIComponent(analystId)}/state`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ new_state: newState, reason: trimmedReason }),
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
        setNewState("");
        setReason("");
      }}
    >
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium">New state</label>
        <p className="text-xs text-muted-foreground">
          Current state: {normalizedCurrentState || "UNKNOWN"}
        </p>
        <select
          className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none focus-visible:border-ring"
          value={newState}
          onChange={(e) => setNewState(e.target.value)}
          disabled={allowedStates.length === 0}
        >
          <option value="" disabled>
            {allowedStates.length > 0 ? "Select next state" : "No valid transitions available"}
          </option>
          {allowedStates.map((s) => (
            <option key={s} value={s}>
              {s.replaceAll("_", " ")}
            </option>
          ))}
        </select>
      </div>
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium">Reason</label>
        <p className="text-xs text-muted-foreground">A reason is required for this change.</p>
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
