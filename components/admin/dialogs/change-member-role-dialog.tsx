"use client";

import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";

import { FormDialog, readFormResult } from "./_form-dialog";
import { CONSOLE_ENTRY_POWER } from "./_power-picker";
import { adminFetch } from "@/lib/admin/client-api";

type Role = {
  role_id: string;
  role_name?: string;
  description?: string;
  powers?: string[];
  is_system_role?: boolean;
};

type Props = {
  userId: string;
  userLabel?: string;
  currentRole?: string;
  refresh: () => void;
  trigger: ReactNode;
};

/**
 * Re-points an existing internal account at a different role, optionally
 * dropping the old one so the member ends up with exactly the new permissions.
 */
export function ChangeMemberRoleDialog({
  userId,
  userLabel,
  currentRole,
  refresh,
  trigger,
}: Props) {
  const [roles, setRoles] = useState<Role[]>([]);
  const [roleId, setRoleId] = useState("");
  const [revokeCurrent, setRevokeCurrent] = useState(true);

  useEffect(() => {
    let cancelled = false;
    adminFetch("/api/admin/rbac/roles")
      .then((r) => r.json())
      .then((d: unknown) => {
        if (cancelled) return;
        const data = d as Record<string, unknown>;
        const list = Array.isArray(data.roles) ? (data.roles as Role[]) : [];
        setRoles(list);
        if (list[0]) setRoleId(list[0].role_id);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  // The member's existing role, matched by name (that's what the user record
  // stores) so we can offer to revoke it alongside the new grant.
  const currentRoleEntry = useMemo(() => {
    if (!currentRole) return undefined;
    const normalized = currentRole.trim().toUpperCase();
    return roles.find(
      (r) => r.role_name?.toUpperCase() === normalized || r.role_id === currentRole
    );
  }, [roles, currentRole]);

  const selectedRole = useMemo(() => roles.find((r) => r.role_id === roleId), [roles, roleId]);
  const grantsConsole = Boolean(selectedRole?.powers?.includes(CONSOLE_ENTRY_POWER));

  return (
    <FormDialog
      trigger={trigger}
      title="Change role"
      description={`Update what ${userLabel ?? userId} is allowed to do in the console.`}
      submitLabel="Update role"
      onSubmit={async () => {
        if (!roleId) return { ok: false, message: "Select a role", code: "VALIDATION_ERROR" };
        if (currentRoleEntry?.role_id === roleId)
          return { ok: false, message: "That is already their role", code: "VALIDATION_ERROR" };

        const assignResponse = await adminFetch("/api/admin/rbac/assign-role", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ target_user_id: userId, role_id: roleId }),
        });
        const assignResult = await readFormResult(assignResponse);
        if (!assignResult.ok) return assignResult;

        if (revokeCurrent && currentRoleEntry && currentRoleEntry.role_id !== roleId) {
          const revokeResponse = await adminFetch("/api/admin/rbac/revoke-role", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ user_id: userId, role_id: currentRoleEntry.role_id }),
          });
          const revokeResult = await readFormResult(revokeResponse);
          if (!revokeResult.ok) {
            return {
              ok: false,
              message: `New role granted, but the old one (${currentRoleEntry.role_name ?? currentRoleEntry.role_id}) could not be revoked: ${revokeResult.message ?? revokeResult.code ?? "unknown error"}`,
              code: revokeResult.code,
            };
          }
        }

        return { ok: true, message: "Role updated" };
      }}
      onSuccess={refresh}
      onClose={() => {
        setRoleId(roles[0]?.role_id ?? "");
        setRevokeCurrent(true);
      }}
    >
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium">New role</label>
        <p className="text-xs text-muted-foreground">Current: {currentRole ?? "unknown"}</p>
        <select
          className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none focus-visible:border-ring"
          value={roleId}
          onChange={(e) => setRoleId(e.target.value)}
        >
          {roles.map((role) => (
            <option key={role.role_id} value={role.role_id}>
              {role.role_name ?? role.role_id}
              {role.is_system_role ? " (system)" : ""}
            </option>
          ))}
        </select>
        {selectedRole && (
          <p className="text-xs text-muted-foreground">
            {selectedRole.description ?? "No description"} · {selectedRole.powers?.length ?? 0}{" "}
            permissions
          </p>
        )}
        {selectedRole && !grantsConsole && (
          <p className="rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-700 dark:text-amber-400">
            This role has no <span className="font-mono">ADMIN_DASHBOARD_VIEW</span> — the member
            will lose access to the admin console.
          </p>
        )}
      </div>

      {currentRoleEntry && currentRoleEntry.role_id !== roleId && (
        <label className="flex cursor-pointer items-start gap-2 text-sm">
          <input
            type="checkbox"
            checked={revokeCurrent}
            onChange={(e) => setRevokeCurrent(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-input"
          />
          <span>
            Revoke {currentRoleEntry.role_name ?? currentRoleEntry.role_id}
            <span className="block text-xs text-muted-foreground">
              Leave unchecked to keep both roles — permissions are the union of every role held.
            </span>
          </span>
        </label>
      )}
    </FormDialog>
  );
}
