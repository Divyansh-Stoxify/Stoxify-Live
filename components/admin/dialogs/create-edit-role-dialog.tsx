"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FormDialog } from "./_form-dialog";
import { adminFetch } from "@/lib/admin/client-api";

type Power = { power_id: string; power_name?: string };

type Props = {
  mode: "create" | "edit";
  roleId?: string;
  currentName?: string;
  currentDescription?: string;
  currentPowerIds?: string[];
  isSystemRole?: boolean;
  refresh: () => void;
  trigger: ReactNode;
};

export function CreateEditRoleDialog({
  mode,
  roleId: initialRoleId = "",
  currentName = "",
  currentDescription = "",
  currentPowerIds = [],
  isSystemRole = false,
  refresh,
  trigger,
}: Props) {
  const [roleId, setRoleId] = useState(initialRoleId);
  const [name, setName] = useState(currentName);
  const [description, setDescription] = useState(currentDescription);
  const [selectedPowers, setSelectedPowers] = useState<string[]>(currentPowerIds);
  const [powers, setPowers] = useState<Power[]>([]);

  useEffect(() => {
    adminFetch("/api/admin/rbac/powers")
      .then((r) => r.json())
      .then((d: unknown) => {
        const data = d as Record<string, unknown>;
        const list = Array.isArray(data.powers) ? (data.powers as Power[]) : [];
        setPowers(list);
      })
      .catch(() => {});
  }, []);

  function togglePower(pid: string) {
    setSelectedPowers((prev) =>
      prev.includes(pid) ? prev.filter((p) => p !== pid) : [...prev, pid]
    );
  }

  return (
    <FormDialog
      trigger={trigger}
      title={mode === "create" ? "Create role" : "Edit role"}
      description={isSystemRole ? undefined : "Configure role ID, name, and assigned powers."}
      submitLabel={mode === "create" ? "Create role" : "Save changes"}
      disabled={isSystemRole}
      onSubmit={async () => {
        if (!roleId.trim())
          return { ok: false, message: "Role ID is required", code: "VALIDATION_ERROR" };
        if (!name.trim())
          return { ok: false, message: "Name is required", code: "VALIDATION_ERROR" };
        const body = { role_id: roleId, name, description, power_ids: selectedPowers };
        const res =
          mode === "create"
            ? await adminFetch("/api/admin/rbac/roles", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
              })
            : await adminFetch(`/api/admin/rbac/roles/${encodeURIComponent(initialRoleId)}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
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
        setRoleId(initialRoleId);
        setName(currentName);
        setDescription(currentDescription);
        setSelectedPowers(currentPowerIds);
      }}
      wide
    >
      {isSystemRole && (
        <p className="rounded-md bg-muted px-3 py-2 text-sm text-muted-foreground">
          System role — read only. Fields cannot be edited.
        </p>
      )}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium">Role ID</label>
        <Input
          value={roleId}
          onChange={(e) => setRoleId(e.target.value)}
          placeholder="ROLE_ID"
          disabled={mode === "edit" || isSystemRole}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium">Name</label>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Role name"
          disabled={isSystemRole}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium">Description</label>
        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Role description..."
          rows={2}
          disabled={isSystemRole}
        />
      </div>
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium">Powers ({selectedPowers.length} selected)</label>
        <div className="max-h-48 overflow-y-auto rounded-lg border border-input p-2 space-y-1">
          {powers.map((p) => (
            <label
              key={p.power_id}
              className="flex items-center gap-2 text-sm cursor-pointer py-0.5"
            >
              <input
                type="checkbox"
                checked={selectedPowers.includes(p.power_id)}
                onChange={() => togglePower(p.power_id)}
                disabled={isSystemRole}
                className="h-4 w-4 rounded border-input"
              />
              <span className="font-mono text-xs">{p.power_id}</span>
              {p.power_name && <span className="text-muted-foreground">{p.power_name}</span>}
            </label>
          ))}
          {powers.length === 0 && (
            <p className="text-xs text-muted-foreground">Loading powers...</p>
          )}
        </div>
      </div>
    </FormDialog>
  );
}
