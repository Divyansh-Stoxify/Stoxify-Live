"use client";

import { PencilIcon, PlusIcon, RefreshCwIcon, Trash2Icon } from "lucide-react";

import {
  ApiAdminPage,
  countRows,
  field,
  formatDate,
  formatNumber,
  type ApiRecord,
  type FilterDef,
} from "@/components/admin/api-admin-page";
import type { AdminRow } from "@/components/admin/admin-page-layout";
import { Button } from "@/components/ui/button";
import { Gated } from "@/components/admin/admin-permissions-provider";
import { SetSystemConfigDialog } from "@/components/admin/dialogs/set-system-config-dialog";
import { DeleteSystemConfigDialog } from "@/components/admin/dialogs/delete-system-config-dialog";

const FILTERS: FilterDef[] = [
  {
    key: "category",
    label: "Category",
    options: [
      { label: "Feature flags", value: "feature-flags" },
      { label: "Limits", value: "limits" },
      { label: "Auth", value: "auth" },
      { label: "Payment", value: "payment" },
    ],
  },
];

function stringifyValue(value: unknown) {
  if (value === null || value === undefined) return "-";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

function mapConfig(item: ApiRecord): AdminRow {
  return {
    Key: field(item, ["key"]),
    Category: field(item, ["category"]),
    Value: stringifyValue(item.value),
    Description: field(item, ["description"]),
    Updated: formatDate(item.updated_at),
  };
}

function ConfigRowActions({ item, refresh }: { item: ApiRecord; refresh: () => void }) {
  const key = field(item, ["key"]);
  return (
    <div className="flex items-center justify-end gap-1">
      <Gated power="PWR_ADMIN_SYSTEM_CONFIG">
        <SetSystemConfigDialog
          mode="edit"
          currentKey={key}
          currentValue={item.value}
          currentDescription={field(item, ["description"])}
          currentCategory={field(item, ["category"])}
          refresh={refresh}
          trigger={
            <Button size="icon-sm" variant="ghost" aria-label="Edit key">
              <PencilIcon />
            </Button>
          }
        />
      </Gated>
      <Gated power="PWR_ADMIN_SYSTEM_CONFIG">
        <DeleteSystemConfigDialog configKey={key} refresh={refresh}
          trigger={
            <Button size="icon-sm" variant="ghost" aria-label="Delete key">
              <Trash2Icon />
            </Button>
          }
        />
      </Gated>
    </div>
  );
}

export function SystemConfigPage() {
  return (
    <ApiAdminPage
      action="Refresh"
      actionIcon={<RefreshCwIcon />}
      collectionKeys={["config"]}
      columns={["Key", "Category", "Value", "Description", "Updated"]}
      description="Runtime configuration keys from user-service admin config APIs."
      emptyMessage="No system config keys returned by the backend."
      endpoint="/api/admin/system-config"
      eyebrow="System config"
      filters={FILTERS}
      insights={(data, rows) => [
        { label: "Config keys", value: formatNumber(data.total ?? rows.length), detail: "Backend reported total" },
        { label: "Categories", value: formatNumber(new Set(rows.map((row) => row.Category)).size), detail: "Loaded categories" },
        { label: "Uncategorized", value: formatNumber(countRows(rows, "Category", /^-$/)), detail: "Keys without category" },
      ]}
      mapRow={mapConfig}
      metrics={(data, rows) => [
        { label: "Config keys", value: formatNumber(data.total ?? rows.length), detail: "Backend reported total" },
        { label: "Loaded", value: formatNumber(rows.length), detail: "Visible keys" },
        { label: "Categories", value: formatNumber(new Set(rows.map((row) => row.Category)).size), detail: "Loaded categories" },
        { label: "Mode", value: "Live", detail: "Backend keys only" },
      ]}
      primaryAction={(refresh) => (
        <Gated power="PWR_ADMIN_SYSTEM_CONFIG">
          <SetSystemConfigDialog mode="create" refresh={refresh}
            trigger={
              <Button>
                <PlusIcon />
                Add key
              </Button>
            }
          />
        </Gated>
      )}
      rowActions={(item, refresh) => <ConfigRowActions item={item} refresh={refresh} />}
      searchable
      title="System Config"
      variant="settings"
    />
  );
}
