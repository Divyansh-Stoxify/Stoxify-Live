"use client";

import { useState } from "react";
import type { ReactNode } from "react";

import { Input } from "@/components/ui/input";
import { ConfirmDialog } from "./_confirm-dialog";
import { adminFetch } from "@/lib/admin/client-api";

type Mode = "date" | "ip";

type Props = {
  refresh: () => void;
  trigger: ReactNode;
};

export function DeleteLogsDialog({ refresh, trigger }: Props) {
  const [mode, setMode] = useState<Mode>("date");
  const [beforeDate, setBeforeDate] = useState("");
  const [ipAddress, setIpAddress] = useState("");

  return (
    <ConfirmDialog
      trigger={trigger}
      title="Purge security logs"
      description="This permanently deletes matching log entries. This action cannot be undone."
      confirmLabel="Delete logs"
      destructive
      requireConfirmText="DELETE LOGS"
      onConfirm={async () => {
        if (mode === "date" && !beforeDate) {
          return { ok: false, message: "Select a date", code: "VALIDATION_ERROR" };
        }
        if (mode === "ip" && !ipAddress.trim()) {
          return { ok: false, message: "Enter an IP address", code: "VALIDATION_ERROR" };
        }
        const param =
          mode === "date"
            ? `before=${new Date(beforeDate).getTime()}`
            : `ip_address=${encodeURIComponent(ipAddress)}`;
        const res = await adminFetch(`/api/admin/security/logs?${param}`, { method: "DELETE" });
        const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
        return {
          ok: res.ok,
          message: data.message as string | undefined,
          code: data.code as string | undefined,
        };
      }}
      onSuccess={refresh}
      onClose={() => {
        setMode("date");
        setBeforeDate("");
        setIpAddress("");
      }}
    >
      <div className="flex gap-4 text-sm">
        <label className="flex items-center gap-1.5 cursor-pointer">
          <input type="radio" checked={mode === "date"} onChange={() => setMode("date")} />
          Older than date
        </label>
        <label className="flex items-center gap-1.5 cursor-pointer">
          <input type="radio" checked={mode === "ip"} onChange={() => setMode("ip")} />
          By IP address
        </label>
      </div>
      {mode === "date" ? (
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium">Delete logs before</label>
          <Input
            type="datetime-local"
            value={beforeDate}
            onChange={(e) => setBeforeDate(e.target.value)}
          />
        </div>
      ) : (
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium">IP address</label>
          <Input
            value={ipAddress}
            onChange={(e) => setIpAddress(e.target.value)}
            placeholder="192.168.1.1"
          />
        </div>
      )}
    </ConfirmDialog>
  );
}
