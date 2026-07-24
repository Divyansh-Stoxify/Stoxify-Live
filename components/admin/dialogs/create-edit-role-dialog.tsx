"use client";

import { useState } from "react";
import type { ReactNode } from "react";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FormDialog, readFormResult } from "./_form-dialog";
import { CONSOLE_ENTRY_POWER, POWER_PRESETS, PowerPicker, usePowerCatalog } from "./_power-picker";
import { adminFetch } from "@/lib/admin/client-api";

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
  roleId = "",
  currentName = "",
  currentDescription = "",
  currentPowerIds = [],
  isSystemRole = false,
  refresh,
  trigger,
}: Props) {
  const [name, setName] = useState(currentName);
  const [description, setDescription] = useState(currentDescription);
  const [selectedPowers, setSelectedPowers] = useState<string[]>(
    mode === "create" ? [CONSOLE_ENTRY_POWER] : currentPowerIds
  );

  const { powers, error: catalogError } = usePowerCatalog();

  return (
    <FormDialog
      trigger={trigger}
      title={mode === "create" ? "Create role" : "Edit role"}
      description={
        isSystemRole
          ? undefined
          : "Name the role and pick the permissions everyone holding it gets."
      }
      submitLabel={mode === "create" ? "Create role" : "Save changes"}
      disabled={isSystemRole}
      onSubmit={async () => {
        if (!name.trim())
          return { ok: false, message: "Role name is required", code: "VALIDATION_ERROR" };
        if (selectedPowers.length === 0)
          return { ok: false, message: "Select at least one permission", code: "VALIDATION_ERROR" };

        const body = {
          role_name: name,
          description: description || name,
          power_ids: selectedPowers,
        };

        const response =
          mode === "create"
            ? await adminFetch("/api/admin/rbac/roles", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
              })
            : await adminFetch(`/api/admin/rbac/roles/${encodeURIComponent(roleId)}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
              });

        return readFormResult(response);
      }}
      onSuccess={refresh}
      onClose={() => {
        setName(currentName);
        setDescription(currentDescription);
        setSelectedPowers(mode === "create" ? [CONSOLE_ENTRY_POWER] : currentPowerIds);
      }}
      wide
    >
      {isSystemRole && (
        <p className="rounded-md bg-muted px-3 py-2 text-sm text-muted-foreground">
          System role — read only. Create a custom role instead to grant a narrower set of
          permissions.
        </p>
      )}

      {mode === "create" && !isSystemRole && (
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium">Start from a template</label>
          <div className="flex flex-wrap gap-1.5">
            {POWER_PRESETS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                title={preset.hint}
                onClick={() => {
                  setSelectedPowers(preset.powers);
                  if (!name.trim()) setName(preset.label.toUpperCase().replace(/[\s-]+/g, "_"));
                  if (!description.trim()) setDescription(preset.hint);
                }}
                className="rounded-full border border-input px-3 py-1 text-xs hover:bg-muted"
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium">Role name</label>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="SUPPORT_L1"
          disabled={isSystemRole}
        />
        <p className="text-xs text-muted-foreground">
          {mode === "edit" ? (
            <>
              Role ID <span className="font-mono">{roleId}</span> stays the same — existing
              assignments are unaffected.
            </>
          ) : (
            "Uppercased automatically; spaces become underscores."
          )}
        </p>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium">Description</label>
        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What this role is responsible for..."
          rows={2}
          disabled={isSystemRole}
        />
      </div>

      <PowerPicker
        powers={powers}
        selected={selectedPowers}
        onChange={setSelectedPowers}
        disabled={isSystemRole}
      />
      {catalogError && <p className="text-xs text-destructive">{catalogError}</p>}
    </FormDialog>
  );
}
