"use client";

import { useState } from "react";
import type { ReactNode } from "react";

import { Input } from "@/components/ui/input";
import { ConfirmDialog } from "./_confirm-dialog";
import { readFormResult } from "./_form-dialog";
import { adminFetch } from "@/lib/admin/client-api";

type Props = {
  roleId: string;
  roleName?: string;
  refresh: () => void;
  trigger: ReactNode;
};

export function RevokeRoleDialog({ roleId, roleName, refresh, trigger }: Props) {
  const [userId, setUserId] = useState("");

  return (
    <ConfirmDialog
      trigger={trigger}
      title="Revoke role assignment"
      description={`Remove the role "${roleName ?? roleId}" from a user.`}
      confirmLabel="Revoke"
      destructive
      onConfirm={async () => {
        if (!userId.trim())
          return { ok: false, message: "User ID is required", code: "VALIDATION_ERROR" };
        const response = await adminFetch("/api/admin/rbac/revoke-role", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user_id: userId.trim(), role_id: roleId }),
        });
        const result = await readFormResult(response);
        return result.ok ? { ok: true, message: "Role revoked" } : result;
      }}
      onSuccess={refresh}
      onClose={() => setUserId("")}
    >
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium">User ID to revoke from</label>
        <Input value={userId} onChange={(e) => setUserId(e.target.value)} placeholder="user_id" />
      </div>
    </ConfirmDialog>
  );
}
