import { RefreshCwIcon } from "lucide-react";

import {
  ApiAdminPage,
  countRows,
  field,
  formatNumber,
  type ApiRecord,
} from "@/components/admin/api-admin-page";
import type { AdminRow } from "@/components/admin/admin-page-layout";

function mapReferencePower(power: ApiRecord): AdminRow {
  return {
    Power: field(power, ["power_id"]),
    Name: field(power, ["power_name"]),
    Category: field(power, ["category"]),
    Type: power.is_system_power ? "System" : "Custom",
    Description: field(power, ["description"]),
  };
}

export function ApiReferencePage() {
  return (
    <ApiAdminPage
      action="Refresh"
      actionIcon={<RefreshCwIcon />}
      collectionKeys={["powers"]}
      columns={["Power", "Name", "Category", "Type", "Description"]}
      description="Live RBAC power catalog that documents which backend permissions admin APIs enforce."
      emptyMessage="No powers returned by the RBAC backend."
      endpoint="/api/admin/rbac/powers"
      eyebrow="Reference"
      mapRow={mapReferencePower}
      metrics={(data, rows) => [
        { label: "Powers", value: formatNumber(data.total ?? rows.length), detail: "RBAC catalog total" },
        { label: "System", value: formatNumber(countRows(rows, "Type", /System/i)), detail: "Seeded backend powers" },
        { label: "Custom", value: formatNumber(countRows(rows, "Type", /Custom/i)), detail: "Admin-created powers" },
        { label: "Categories", value: formatNumber(new Set(rows.map((row) => row.Category)).size), detail: "Power groups" },
      ]}
      title="API Reference"
      variant="reference"
    />
  );
}
