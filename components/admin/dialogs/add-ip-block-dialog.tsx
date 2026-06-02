"use client";

import { useState } from "react";
import type { ReactNode } from "react";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FormDialog } from "./_form-dialog";
import { adminFetch } from "@/lib/admin/client-api";

type Props = {
  refresh: () => void;
  trigger: ReactNode;
};

export function AddIpBlockDialog({ refresh, trigger }: Props) {
  const [ipAddress, setIpAddress] = useState("");
  const [reason, setReason] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [notes, setNotes] = useState("");

  return (
    <FormDialog
      trigger={trigger}
      title="Block IP address"
      description="Block an IP from accessing the platform."
      submitLabel="Block IP"
      onSubmit={async () => {
        if (!ipAddress.trim()) return { ok: false, message: "IP address is required", code: "VALIDATION_ERROR" };
        if (!reason.trim()) return { ok: false, message: "Reason is required", code: "VALIDATION_ERROR" };
        const body: Record<string, unknown> = { ip_address: ipAddress, reason };
        if (expiresAt) body.expires_at = new Date(expiresAt).toISOString();
        if (notes) body.notes = notes;
        const res = await adminFetch("/api/admin/security/ip-blocks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        const data = await res.json().catch(() => ({})) as Record<string, unknown>;
        return { ok: res.ok, message: data.message as string | undefined, code: data.code as string | undefined };
      }}
      onSuccess={refresh}
      onClose={() => { setIpAddress(""); setReason(""); setExpiresAt(""); setNotes(""); }}
    >
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium">IP address</label>
        <Input value={ipAddress} onChange={(e) => setIpAddress(e.target.value)} placeholder="192.168.1.1" />
      </div>
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium">Reason</label>
        <Textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Why is this IP being blocked?" rows={2} />
      </div>
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium">Expires at (optional)</label>
        <Input type="datetime-local" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} />
      </div>
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium">Notes (optional)</label>
        <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Additional notes..." rows={2} />
      </div>
    </FormDialog>
  );
}
