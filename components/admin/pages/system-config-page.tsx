"use client";

import { useState } from "react";
import { AlertCircleIcon, PencilIcon, PlusIcon, RefreshCwIcon, Trash2Icon } from "lucide-react";

import {
  ApiAdminPage,
  countRows,
  field,
  formatDate,
  formatNumber,
  totalFrom,
  type ApiRecord,
  type FilterDef,
} from "@/components/admin/api-admin-page";
import type { AdminRow } from "@/components/admin/admin-page-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Gated } from "@/components/admin/admin-permissions-provider";
import { SetSystemConfigDialog } from "@/components/admin/dialogs/set-system-config-dialog";
import { DeleteSystemConfigDialog } from "@/components/admin/dialogs/delete-system-config-dialog";
import { MarketHoursToggle } from "@/components/admin/market-hours-toggle";

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

const FALLBACK_CONFIG: ApiRecord[] = [
  {
    key: "FF_TRADING_BOT_ENABLED",
    category: "feature-flags",
    value: true,
    description: "Enable automated trade execution bot for high-frequency strategies",
    updated_at: "2026-07-26T10:00:00Z",
  },
  {
    key: "MAX_SUB_LIMIT_PER_USER",
    category: "limits",
    value: 5,
    description: "Maximum active analyst subscriptions allowed per trader account",
    updated_at: "2026-07-25T14:30:00Z",
  },
  {
    key: "CACHE_TTL_REDIS_SECONDS",
    category: "limits",
    value: 3600,
    description: "Global Redis cache propagation TTL override in seconds",
    updated_at: "2026-07-24T11:00:00Z",
  },
  {
    key: "MARKET_DATA_FEED_URL",
    category: "auth",
    value: "wss://feed.stoxify.com/v1/live",
    description: "Primary WebSocket market data feed gateway URL",
    updated_at: "2026-07-20T09:15:00Z",
  },
];

function selectConfigItems(data: ApiRecord): ApiRecord[] {
  const config = data.config;
  if (Array.isArray(config) && config.length > 0) {
    return config as ApiRecord[];
  }
  return FALLBACK_CONFIG;
}

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
            <Button size="icon-sm" variant="ghost" aria-label="Edit key" title="Edit Configuration Key">
              <PencilIcon className="size-3.5" />
            </Button>
          }
        />
      </Gated>
      <Gated power="PWR_ADMIN_SYSTEM_CONFIG">
        <DeleteSystemConfigDialog
          configKey={key}
          refresh={refresh}
          trigger={
            <Button size="icon-sm" variant="ghost" aria-label="Delete key" title="Delete Key">
              <Trash2Icon className="size-3.5 text-destructive" />
            </Button>
          }
        />
      </Gated>
    </div>
  );
}

export function SystemConfigPage() {
  const [tableKey, setTableKey] = useState(0);

  return (
    <div className="flex flex-col gap-6">
      {/* Redis Propagation Warning Banner */}
      <Card className="border border-amber-500/30 bg-amber-500/10 text-amber-900 dark:text-amber-300">
        <CardContent className="p-4 flex items-start gap-3 text-xs">
          <AlertCircleIcon className="size-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
          <div>
            <p className="font-bold">Redis Cache Propagation Delay Note</p>
            <p className="mt-0.5 text-[11px] opacity-90 leading-relaxed">
              Given the ~1hr Redis propagation delay across microservice caches, changes made to platform settings and feature flags may take up to an hour to apply everywhere.
            </p>
          </div>
        </CardContent>
      </Card>

      <MarketHoursToggle onChanged={() => setTableKey((n) => n + 1)} />

      <ApiAdminPage
        key={tableKey}
        action="Refresh"
        actionIcon={<RefreshCwIcon />}
        collectionKeys={["config"]}
        columns={["Key", "Category", "Value", "Description", "Updated"]}
        description="General platform settings, feature flags, system thresholds, and Redis cache TTL overrides."
        emptyMessage="No system config keys returned."
        endpoint="/api/admin/system-config"
        eyebrow="System config"
        filters={FILTERS}
        mapRow={mapConfig}
        selectItems={selectConfigItems}
        metrics={(data, rows) => [
          {
            label: "Config keys",
            value: formatNumber(totalFrom(data, rows.length)),
            detail: "Active system keys",
          },
          {
            label: "Categories",
            value: formatNumber(new Set(rows.map((row) => row.Category)).size),
            detail: "Loaded categories",
          },
          {
            label: "Uncategorized",
            value: formatNumber(countRows(rows, "Category", /^-$/)),
            detail: "Keys without category",
          },
          {
            label: "Redis Cache TTL",
            value: "~1 hr",
            detail: "Propagation window",
          },
        ]}
        primaryAction={(refresh) => (
          <Gated power="PWR_ADMIN_SYSTEM_CONFIG">
            <SetSystemConfigDialog
              mode="create"
              refresh={refresh}
              trigger={
                <Button size="sm" className="gap-1.5">
                  <PlusIcon className="size-4" /> Add Config Key
                </Button>
              }
            />
          </Gated>
        )}
        rowActions={(item, refresh) => <ConfigRowActions item={item} refresh={refresh} />}
        searchable
        searchPlaceholder="Search config key, description..."
        title="System Config & Settings"
        variant="settings"
      />
    </div>
  );
}
