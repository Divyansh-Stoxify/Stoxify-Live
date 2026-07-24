"use client";

import type { ReactNode } from "react";

import { ConfirmDialog } from "./_confirm-dialog";
import { readFormResult } from "./_form-dialog";
import { adminFetch } from "@/lib/admin/client-api";

type Props = {
  roleId: string;
  roleName?: string;
  refresh: () => void;
  trigger: ReactNode;
};

/**
 * Deletes a custom role. The backend refuses while anyone still holds it, so the
 * usual order is: revoke from every member, then delete.
 */
export function DeleteRoleDialog({ roleId, roleName, refresh, trigger }: Props) {
  const label = roleName ?? roleId;

  return (
    <ConfirmDialog
      trigger={trigger}
      title="Delete role"
      description={`Permanently delete "${label}". Anyone still holding it must be revoked first.`}
      confirmLabel="Delete role"
      destructive
      requireConfirmText={label}
      onConfirm={async () => {
        const response = await adminFetch(`/api/admin/rbac/roles/${encodeURIComponent(roleId)}`, {
          method: "DELETE",
        });
        const result = await readFormResult(response);
        return result.ok ? { ok: true, message: `Deleted ${label}` } : result;
      }}
      onSuccess={refresh}
    />
  );
}
