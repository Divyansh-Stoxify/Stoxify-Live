"use client";

import type { ReactNode } from "react";

import { ConfirmDialog } from "./_confirm-dialog";
import { adminFetch } from "@/lib/admin/client-api";

type Props = {
  configKey: string;
  refresh: () => void;
  trigger: ReactNode;
};

export function DeleteSystemConfigDialog({ configKey, refresh, trigger }: Props) {
  return (
    <ConfirmDialog
      trigger={trigger}
      title="Delete config key"
      description={`Permanently remove the key "${configKey}" from system configuration.`}
      confirmLabel="Delete"
      destructive
      requireConfirmText={configKey}
      onConfirm={async () => {
        const res = await adminFetch(`/api/admin/system-config/${encodeURIComponent(configKey)}`, {
          method: "DELETE",
        });
        const data = await res.json().catch(() => ({})) as Record<string, unknown>;
        return { ok: res.ok, message: data.message as string | undefined, code: data.code as string | undefined };
      }}
      onSuccess={refresh}
    />
  );
}
