import { RefreshCwIcon } from "lucide-react";

import {
  ApiAdminPage,
  formatDate,
  formatNumber,
  nested,
  stateLabel,
  type ApiRecord,
} from "@/components/admin/api-admin-page";
import type { AdminRow } from "@/components/admin/admin-page-layout";

function dashboardSections(data: ApiRecord) {
  return ["users", "analysts", "trades", "plans", "subscriptions"].map((section) => ({
    section,
    ...(nested(data, section) as ApiRecord),
  }));
}

function mapDashboardSection(item: ApiRecord): AdminRow {
  return {
    Area: stateLabel(item.section),
    Total: formatNumber(item.total),
    Active: formatNumber(item.active ?? item.live),
    Pending: formatNumber(item.kyc_pending ?? item.pending_verification),
    Source: "/api/admin/dashboard",
  };
}

export function AdminHelpPage() {
  return (
    <ApiAdminPage
      action="Refresh"
      actionIcon={<RefreshCwIcon />}
      columns={["Area", "Total", "Active", "Pending", "Source"]}
      description="Live admin overview to confirm which backend modules are available in the console."
      emptyMessage="Dashboard overview did not return module totals."
      endpoint="/api/admin/dashboard"
      eyebrow="Admin help"
      mapRow={mapDashboardSection}
      metrics={(data, rows) => [
        {
          label: "Modules",
          value: formatNumber(rows.length),
          detail: "Overview sections returned",
        },
        { label: "Generated", value: formatDate(data.generated_at), detail: "Backend timestamp" },
        { label: "Endpoint", value: "Live", detail: "/api/admin/dashboard" },
        { label: "Mode", value: "API", detail: "Backend overview context" },
      ]}
      selectItems={dashboardSections}
      title="Admin Help"
      variant="reference"
    />
  );
}
