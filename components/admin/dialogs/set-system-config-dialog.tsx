"use client";

import { useState } from "react";
import type { ReactNode } from "react";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FormDialog } from "./_form-dialog";
import { adminFetch } from "@/lib/admin/client-api";

type Props = {
  mode: "create" | "edit";
  currentKey?: string;
  currentValue?: unknown;
  currentDescription?: string;
  currentCategory?: string;
  refresh: () => void;
  trigger: ReactNode;
};

export function SetSystemConfigDialog({
  mode,
  currentKey = "",
  currentValue,
  currentDescription = "",
  currentCategory = "",
  refresh,
  trigger,
}: Props) {
  const [key, setKey] = useState(currentKey);
  const [value, setValue] = useState(
    currentValue !== undefined ? JSON.stringify(currentValue, null, 2) : ""
  );
  const [description, setDescription] = useState(currentDescription);
  const [category, setCategory] = useState(currentCategory);
  const [parseError, setParseError] = useState<string | null>(null);

  return (
    <FormDialog
      trigger={trigger}
      title={mode === "create" ? "Add config key" : "Edit config key"}
      description="Value must be valid JSON."
      submitLabel={mode === "create" ? "Add key" : "Save changes"}
      onSubmit={async () => {
        if (!key.trim()) return { ok: false, message: "Key is required", code: "VALIDATION_ERROR" };
        let parsed: unknown;
        try {
          parsed = JSON.parse(value);
          setParseError(null);
        } catch {
          setParseError("Value is not valid JSON");
          return { ok: false, message: "Value must be valid JSON", code: "VALIDATION_ERROR" };
        }
        const res = await adminFetch("/api/admin/system-config", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ key, value: parsed, description, category }),
        });
        const data = await res.json().catch(() => ({})) as Record<string, unknown>;
        return { ok: res.ok, message: data.message as string | undefined, code: data.code as string | undefined };
      }}
      onSuccess={refresh}
      onClose={() => {
        setKey(currentKey);
        setValue(currentValue !== undefined ? JSON.stringify(currentValue, null, 2) : "");
        setDescription(currentDescription); setCategory(currentCategory); setParseError(null);
      }}
    >
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium">Key</label>
        <Input value={key} onChange={(e) => setKey(e.target.value)} placeholder="feature.flag.name" disabled={mode === "edit"} />
      </div>
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium">Value (JSON)</label>
        <Textarea
          value={value}
          onChange={(e) => { setValue(e.target.value); setParseError(null); }}
          placeholder='"string" or 42 or true or {"key":"val"}'
          rows={4}
          className={parseError ? "aria-invalid" : ""}
        />
        {parseError && <p className="text-xs text-destructive">{parseError}</p>}
      </div>
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium">Category (optional)</label>
        <Input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="feature-flags" />
      </div>
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium">Description (optional)</label>
        <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What does this key control?" rows={2} />
      </div>
    </FormDialog>
  );
}
