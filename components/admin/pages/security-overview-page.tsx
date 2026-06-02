import { RefreshCwIcon } from "lucide-react";

import {
  ApiAdminPage,
  field,
  formatDate,
  formatNumber,
  nested,
  stateLabel,
  type ApiRecord,
} from "@/components/admin/api-admin-page";
import type { AdminRow } from "@/components/admin/admin-page-layout";

function recentThreats(data: ApiRecord) {
  return Array.isArray(data.recent) ? data.recent : [];
}

function mapThreatLog(log: ApiRecord): AdminRow {
  return {
    Signal: stateLabel(log.incident_type),
    Severity: stateLabel(log.severity),
    Source: field(log, ["request_url", "ip_address"]),
    IP: field(log, ["ip_address"]),
    Time: formatDate(log.timestamp),
  };
}

export function SecurityOverviewPage() {
  return (
    <ApiAdminPage
      action="Refresh"
      actionIcon={<RefreshCwIcon />}
      columns={["Signal", "Severity", "Source", "IP", "Time"]}
      description="Threat summary from auth-service security aggregation."
      emptyMessage="No recent security incidents returned by the backend."
      endpoint="/api/admin/security/threats"
      eyebrow="Security"
      mapRow={mapThreatLog}
      metrics={(data, rows) => {
        const severity = Array.isArray(data.by_severity) ? data.by_severity : [];
        const high = severity.find((item) => field(item as ApiRecord, ["severity"]).match(/HIGH|CRITICAL/i));

        return [
          { label: "Incidents", value: formatNumber(data.total_incidents), detail: "Window total from auth-service" },
          { label: "High severity", value: formatNumber(nested((high ?? {}) as ApiRecord, "count")), detail: "High or critical bucket" },
          { label: "Recent", value: formatNumber(rows.length), detail: "Loaded investigation rows" },
          { label: "Since", value: formatDate(data.since), detail: "Threat window start" },
        ];
      }}
      selectItems={recentThreats}
      title="Security Overview"
      variant="security"
    />
  );
}
