"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";

import { Input } from "@/components/ui/input";
import { FormDialog } from "./_form-dialog";
import { adminFetch } from "@/lib/admin/client-api";

type Role = { role_id: string; role_name: string };

type Props = {
  refresh: () => void;
  trigger: ReactNode;
};

export function AssignRoleDialog({ refresh, trigger }: Props) {
  const [userId, setUserId] = useState("");
  const [roleId, setRoleId] = useState("");
  const [roles, setRoles] = useState<Role[]>([]);

  useEffect(() => {
    adminFetch("/api/admin/rbac/roles")
      .then((r) => r.json())
      .then((d: unknown) => {
        const data = d as Record<string, unknown>;
        const list = Array.isArray(data.roles) ? (data.roles as Role[]) : [];
        setRoles(list);
        if (list[0]) setRoleId(list[0].role_id);
      })
      .catch(() => {});
  }, []);

  return (
    <FormDialog
      trigger={trigger}
      title="Assign role"
      description="Assign an admin role to a user."
      submitLabel="Assign role"
      onSubmit={async () => {
        if (!userId.trim()) return { ok: false, message: "User ID is required", code: "VALIDATION_ERROR" };
        if (!roleId) return { ok: false, message: "Select a role", code: "VALIDATION_ERROR" };
        const res = await adminFetch("/api/admin/rbac/assign-role", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user_id: userId, role_id: roleId }),
        });
        const data = await res.json().catch(() => ({})) as Record<string, unknown>;
        return { ok: res.ok, message: data.message as string | undefined, code: data.code as string | undefined };
      }}
      onSuccess={refresh}
      onClose={() => { setUserId(""); setRoleId(roles[0]?.role_id ?? ""); }}
    >
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium">User ID</label>
        <Input value={userId} onChange={(e) => setUserId(e.target.value)} placeholder="user_id or email" />
      </div>
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium">Role</label>
        <select
          className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none focus-visible:border-ring"
          value={roleId}
          onChange={(e) => setRoleId(e.target.value)}
        >
          {roles.map((r) => (
            <option key={r.role_id} value={r.role_id}>{r.role_name ?? r.role_id}</option>
          ))}
        </select>
      </div>
    </FormDialog>
  );
}
