"use client";

import { RefreshCwIcon } from "lucide-react";

import {
  ApiAdminPage,
  countRows,
  field,
  formatNumber,
  type ApiRecord,
  type FilterDef,
} from "@/components/admin/api-admin-page";
import type { AdminRow } from "@/components/admin/admin-page-layout";

const FILTERS: FilterDef[] = [
  {
    key: "category",
    label: "Category",
    options: [
      { label: "User", value: "USER" },
      { label: "Analyst", value: "ANALYST" },
      { label: "Plan", value: "PLAN" },
      { label: "Subscription", value: "SUBSCRIPTION" },
      { label: "Trade", value: "TRADE" },
      { label: "Security", value: "SECURITY" },
      { label: "Admin", value: "ADMIN" },
      { label: "Notification", value: "NOTIFICATION" },
    ],
  },
];

function mapPower(power: ApiRecord): AdminRow {
  return {
    Power: field(power, ["power_name", "power_id"]),
    ID: field(power, ["power_id"]),
    Category: field(power, ["category"]),
    Type: power.is_system_power ? "System" : "Custom",
    Description: field(power, ["description"]),
  };
}

export function PowersPage() {
  return (
    <ApiAdminPage
      action="Refresh"
      actionIcon={<RefreshCwIcon />}
      collectionKeys={["powers"]}
      columns={["Power", "ID", "Category", "Type", "Description"]}
      description="Defined backend powers used by RBAC checks across admin services."
      emptyMessage="No powers returned by the backend."
      endpoint="/api/admin/rbac/powers"
      eyebrow="RBAC"
      filters={FILTERS}
      mapRow={mapPower}
      metrics={(data, rows) => [
        { label: "Powers", value: formatNumber(data.total ?? rows.length), detail: "Backend reported total" },
        { label: "System", value: formatNumber(countRows(rows, "Type", /System/i)), detail: "Loaded system powers" },
        { label: "Custom", value: formatNumber(countRows(rows, "Type", /Custom/i)), detail: "Loaded custom powers" },
        { label: "Categories", value: formatNumber(new Set(rows.map((row) => row.Category)).size), detail: "Loaded categories" },
      ]}
      title="Powers"
      variant="access"
    />
  );
}
