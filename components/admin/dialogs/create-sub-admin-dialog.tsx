"use client";

import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FormDialog, readFormResult, type FormResult } from "./_form-dialog";
import {
  CONSOLE_ENTRY_POWER,
  POWER_PRESETS,
  PowerPicker,
  usePowerCatalog,
} from "./_power-picker";
import { adminFetch } from "@/lib/admin/client-api";

type Role = {
  role_id: string;
  role_name?: string;
  description?: string;
  powers?: string[];
  is_system_role?: boolean;
};

type Mode = "new-role" | "existing-role";

type Props = {
  refresh: () => void;
  trigger: ReactNode;
};

/**
 * Provisions a sub-admin in one pass: define (or pick) the role that limits what
 * they can do, then create the INTERNAL_TEAM account bound to it.
 *
 * The new account signs in at /admin/login with its email — the console is
 * email-OTP, so there is no password to set or hand over.
 */
export function CreateSubAdminDialog({ refresh, trigger }: Props) {
  const [mode, setMode] = useState<Mode>("new-role");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  const [roleName, setRoleName] = useState("");
  const [roleDescription, setRoleDescription] = useState("");
  const [selectedPowers, setSelectedPowers] = useState<string[]>([CONSOLE_ENTRY_POWER]);

  const [roles, setRoles] = useState<Role[]>([]);
  const [existingRoleId, setExistingRoleId] = useState("");

  const { powers, error: catalogError } = usePowerCatalog();

  useEffect(() => {
    let cancelled = false;
    adminFetch("/api/admin/rbac/roles")
      .then((r) => r.json())
      .then((d: unknown) => {
        if (cancelled) return;
        const data = d as Record<string, unknown>;
        const list = Array.isArray(data.roles) ? (data.roles as Role[]) : [];
        setRoles(list);
        // Default to a custom role when one exists — system roles like FOUNDER
        // are rarely what you want for a new sub-admin.
        const preferred = list.find((r) => !r.is_system_role) ?? list[0];
        if (preferred) setExistingRoleId(preferred.role_id);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const selectedExistingRole = useMemo(
    () => roles.find((r) => r.role_id === existingRoleId),
    [roles, existingRoleId]
  );

  function reset() {
    setMode("new-role");
    setName("");
    setEmail("");
    setPhone("");
    setRoleName("");
    setRoleDescription("");
    setSelectedPowers([CONSOLE_ENTRY_POWER]);
    setExistingRoleId(roles.find((r) => !r.is_system_role)?.role_id ?? roles[0]?.role_id ?? "");
  }

  function applyPreset(presetId: string) {
    const preset = POWER_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;
    setSelectedPowers(preset.powers);
    if (!roleName.trim())
      setRoleName(preset.label.toUpperCase().replace(/[^A-Z0-9]+/g, "_").replace(/_+$/, ""));
    if (!roleDescription.trim()) setRoleDescription(preset.hint);
  }

  /**
   * System roles are backend-immutable, so a system role missing console entry
   * is a dead end. Switch to new-role mode seeded with its powers plus the entry
   * power — the copy is a custom role and can be created straight away.
   */
  function copyRoleWithConsoleAccess(role: Role) {
    setMode("new-role");
    setSelectedPowers([...new Set([...(role.powers ?? []), CONSOLE_ENTRY_POWER])]);
    setRoleName(`${role.role_name ?? role.role_id}_CONSOLE`.toUpperCase());
    setRoleDescription(role.description ?? `${role.role_name ?? role.role_id} with console access`);
  }

  async function submit(): Promise<FormResult> {
    if (!name.trim()) return { ok: false, message: "Name is required", code: "VALIDATION_ERROR" };
    if (!email.trim()) return { ok: false, message: "Email is required", code: "VALIDATION_ERROR" };

    let roleId = existingRoleId;
    // Set only when this submit minted the role, so a later failure can undo it
    // rather than leaving an unused role behind.
    let createdRoleId: string | null = null;

    if (mode === "new-role") {
      if (!roleName.trim())
        return { ok: false, message: "Role name is required", code: "VALIDATION_ERROR" };
      if (selectedPowers.length === 0)
        return { ok: false, message: "Select at least one permission", code: "VALIDATION_ERROR" };

      const roleResponse = await adminFetch("/api/admin/rbac/roles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role_name: roleName,
          description: roleDescription || `Sub-admin role: ${roleName}`,
          power_ids: selectedPowers,
        }),
      });

      const roleData = (await roleResponse.json().catch(() => ({}))) as Record<string, unknown>;

      if (roleResponse.ok) {
        const created = roleData.role as { role_id?: string } | undefined;
        if (!created?.role_id) {
          return { ok: false, message: "Role was created but returned no id", code: "BAD_RESPONSE" };
        }
        roleId = created.role_id;
        createdRoleId = created.role_id;
      } else if (roleData.code === "CONFLICT") {
        // A role by this name already exists — usually the leftover of an earlier
        // failed run. Reuse it rather than dead-ending on the conflict. Match on
        // the backend's own id derivation (ROLE_<lowercased name>). Not marked as
        // createdRoleId, so a later failure won't delete a role we didn't make.
        const normalized = roleName.trim().toUpperCase().replace(/[\s-]+/g, "_");
        const derivedId = `ROLE_${normalized.toLowerCase()}`;
        const existing = roles.find(
          (r) => r.role_id === derivedId || r.role_name?.toUpperCase() === normalized
        );
        if (!existing) {
          // The list may be stale — refetch once before giving up.
          const fresh = (await adminFetch("/api/admin/rbac/roles")
            .then((r) => r.json())
            .catch(() => ({}))) as Record<string, unknown>;
          const freshList = Array.isArray(fresh.roles) ? (fresh.roles as Role[]) : [];
          const match = freshList.find(
            (r) => r.role_id === derivedId || r.role_name?.toUpperCase() === normalized
          );
          if (!match) {
            return {
              ok: false,
              message: `A role named ${normalized} already exists. Switch to "Use an existing role" to pick it.`,
              code: "CONFLICT",
            };
          }
          roleId = match.role_id;
        } else {
          roleId = existing.role_id;
        }
      } else {
        return {
          ok: false,
          message: (roleData.message ?? roleData.error) as string | undefined,
          code: roleData.code as string | undefined,
        };
      }
    } else if (!roleId) {
      return { ok: false, message: "Select a role", code: "VALIDATION_ERROR" };
    }

    const response = await adminFetch("/api/admin/internal-team", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        ...(phone.trim() ? { phone: phone.trim() } : {}),
        role_id: roleId,
      }),
    });

    const result = await readFormResult(response);

    if (!result.ok) {
      // Nobody holds the role yet, so this delete is safe and keeps a failed
      // attempt (duplicate email, say) from littering the role list.
      if (createdRoleId) {
        await adminFetch(`/api/admin/rbac/roles/${encodeURIComponent(createdRoleId)}`, {
          method: "DELETE",
        }).catch(() => undefined);
      }
      return result;
    }

    return {
      ok: true,
      message: `${name.trim()} can now sign in at /admin/login with ${email.trim()}`,
    };
  }

  const existingRolePowerCount = selectedExistingRole?.powers?.length ?? 0;
  const existingRoleGrantsConsole = Boolean(
    selectedExistingRole?.powers?.includes(CONSOLE_ENTRY_POWER)
  );

  return (
    <FormDialog
      trigger={trigger}
      title="New sub-admin"
      description="Create an internal account limited to the permissions you pick."
      submitLabel="Create sub-admin"
      onSubmit={submit}
      onSuccess={refresh}
      onClose={reset}
      wide
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium">Full name</label>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Asha Menon" />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium">Email</label>
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="asha@stoxify.com"
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium">
          Phone <span className="font-normal text-muted-foreground">(optional)</span>
        </label>
        <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+919876543210" />
      </div>

      <p className="rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground">
        Sign-in is email OTP — the code goes to the address above. No password is set.
      </p>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium">Access</label>
        <div className="flex gap-1 rounded-lg border border-input p-1">
          <button
            type="button"
            onClick={() => setMode("new-role")}
            className={`flex-1 rounded-md px-3 py-1.5 text-sm transition-colors ${
              mode === "new-role" ? "bg-primary text-primary-foreground" : "hover:bg-muted"
            }`}
          >
            Define a new sub-role
          </button>
          <button
            type="button"
            onClick={() => setMode("existing-role")}
            className={`flex-1 rounded-md px-3 py-1.5 text-sm transition-colors ${
              mode === "existing-role" ? "bg-primary text-primary-foreground" : "hover:bg-muted"
            }`}
          >
            Use an existing role
          </button>
        </div>
      </div>

      {mode === "new-role" ? (
        <>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium">Start from a template</label>
            <div className="flex flex-wrap gap-1.5">
              {POWER_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  title={preset.hint}
                  onClick={() => applyPreset(preset.id)}
                  className="rounded-full border border-input px-3 py-1 text-xs hover:bg-muted"
                >
                  {preset.label}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setSelectedPowers([])}
                className="rounded-full border border-input px-3 py-1 text-xs hover:bg-muted"
              >
                Start empty
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium">Sub-role name</label>
            <Input
              value={roleName}
              onChange={(e) => setRoleName(e.target.value)}
              placeholder="SUPPORT_L1"
            />
            <p className="text-xs text-muted-foreground">
              Uppercased automatically; spaces become underscores.
            </p>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium">Description</label>
            <Textarea
              value={roleDescription}
              onChange={(e) => setRoleDescription(e.target.value)}
              placeholder="What this sub-admin is responsible for..."
              rows={2}
            />
          </div>

          <PowerPicker powers={powers} selected={selectedPowers} onChange={setSelectedPowers} />
          {catalogError && <p className="text-xs text-destructive">{catalogError}</p>}
        </>
      ) : (
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium">Role</label>
          <select
            className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none focus-visible:border-ring"
            value={existingRoleId}
            onChange={(e) => setExistingRoleId(e.target.value)}
          >
            {roles.map((role) => (
              <option key={role.role_id} value={role.role_id}>
                {role.role_name ?? role.role_id}
                {role.is_system_role ? " (system)" : ""}
              </option>
            ))}
          </select>
          {selectedExistingRole && (
            <p className="text-xs text-muted-foreground">
              {selectedExistingRole.description ?? "No description"} · {existingRolePowerCount}{" "}
              permission{existingRolePowerCount === 1 ? "" : "s"}
            </p>
          )}
          {selectedExistingRole && !existingRoleGrantsConsole && (
            <div className="flex flex-col items-start gap-2 rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-700 dark:text-amber-400">
              <p>
                This role has no <span className="font-mono">ADMIN_DASHBOARD_VIEW</span>, so the
                account will not be able to open the admin console.
                {selectedExistingRole.is_system_role &&
                  " System roles cannot be edited, so copy it instead."}
              </p>
              <button
                type="button"
                onClick={() => copyRoleWithConsoleAccess(selectedExistingRole)}
                className="rounded-md border border-amber-500/40 px-2 py-1 font-medium hover:bg-amber-500/20"
              >
                Copy to a new role with console access
              </button>
            </div>
          )}
        </div>
      )}
    </FormDialog>
  );
}
