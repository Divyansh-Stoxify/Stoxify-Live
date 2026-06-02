"use client";

import { useState } from "react";
import type { ReactNode } from "react";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FormDialog } from "./_form-dialog";
import { adminFetch } from "@/lib/admin/client-api";

type Props = {
  subscriptionId: string;
  defaultAmount?: number;
  refresh: () => void;
  trigger: ReactNode;
};

export function RefundSubscriptionDialog({ subscriptionId, defaultAmount, refresh, trigger }: Props) {
  const [amount, setAmount] = useState(String(defaultAmount ?? ""));
  const [reason, setReason] = useState("");

  return (
    <FormDialog
      trigger={trigger}
      title="Refund subscription"
      description="Issue a refund for this subscription."
      submitLabel="Issue refund"
      onSubmit={async () => {
        const parsed = Number(amount);
        if (!amount || Number.isNaN(parsed) || parsed <= 0) {
          return { ok: false, message: "Enter a valid refund amount", code: "VALIDATION_ERROR" };
        }
        if (!reason.trim()) {
          return { ok: false, message: "Reason is required", code: "VALIDATION_ERROR" };
        }
        const res = await adminFetch(`/api/admin/subscriptions/${encodeURIComponent(subscriptionId)}/refund`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ amount: parsed, reason }),
        });
        const data = await res.json().catch(() => ({})) as Record<string, unknown>;
        return { ok: res.ok, message: data.message as string | undefined, code: data.code as string | undefined };
      }}
      onSuccess={refresh}
      onClose={() => { setAmount(String(defaultAmount ?? "")); setReason(""); }}
    >
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium">Refund amount (INR)</label>
        <Input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0"
          min={1}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium">Reason</label>
        <Textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Explain the reason for the refund..."
          rows={3}
        />
      </div>
    </FormDialog>
  );
}
