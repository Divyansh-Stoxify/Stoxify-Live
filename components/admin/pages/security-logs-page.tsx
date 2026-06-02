"use client";

import { RefreshCwIcon, Trash2Icon } from "lucide-react";

import {
  ApiAdminPage,
  countRows,
  field,
  formatDate,
  formatNumber,
  stateLabel,
  totalFrom,
  type ApiRecord,
  type FilterDef,
} from "@/components/admin/api-admin-page";
import type { AdminRow } from "@/components/admin/admin-page-layout";
import { Button } from "@/components/ui/button";
import { Gated } from "@/components/admin/admin-permissions-provider";
import { DeleteLogsDialog } from "@/components/admin/dialogs/delete-logs-dialog";

const FILTERS: FilterDef[] = [
  {
    key: "incident_type",
    label: "Incident type",
    options: [
      { label: "Failed login", value: "FAILED_LOGIN" },
      { label: "Rate limit", value: "RATE_LIMIT" },
      { label: "Suspicious activity", value: "SUSPICIOUS_ACTIVITY" },
      { label: "Blocked IP", value: "BLOCKED_IP" },
    ],
  },
  {
    key: "severity",
    label: "Severity",
    options: [
      { label: "Low", value: "LOW" },
      { label: "Medium", value: "MEDIUM" },
      { label: "High", value: "HIGH" },
      { label: "Critical", value: "CRITICAL" },
    ],
  },
];

function mapSecurityLog(log: ApiRecord): AdminRow {
  return {
    Incident: stateLabel(log.incident_type),
    Severity: stateLabel(log.severity),
    User: field(log, ["user_id"]),
    IP: field(log, ["ip_address"]),
    URL: field(log, ["request_url"]),
    Time: formatDate(log.timestamp),
  };
}

export function SecurityLogsPage() {
  return (
    <ApiAdminPage
      action="Refresh"
      actionIcon={<RefreshCwIcon />}
      collectionKeys={["logs"]}
      columns={["Incident", "Severity", "User", "IP", "URL", "Time"]}
      description="Security incident log stream from auth-service."
      emptyMessage="No security logs returned by the backend."
      endpoint="/api/admin/security/logs"
      eyebrow="Security logs"
      filters={FILTERS}
      mapRow={mapSecurityLog}
      metrics={(data, rows) => [
        {
          label: "Logs",
          value: formatNumber(totalFrom(data, rows.length)),
          detail: "Backend reported total",
        },
        {
          label: "Critical",
          value: formatNumber(countRows(rows, "Severity", /CRITICAL/i)),
          detail: "Loaded critical rows",
        },
        {
          label: "High",
          value: formatNumber(countRows(rows, "Severity", /HIGH/i)),
          detail: "Loaded high rows",
        },
        { label: "Loaded", value: formatNumber(rows.length), detail: "Visible logs" },
      ]}
      paginated
      primaryAction={(refresh) => (
        <Gated power="PWR_ADMIN_LOGS_DELETE">
          <DeleteLogsDialog
            refresh={refresh}
            trigger={
              <Button variant="destructive">
                <Trash2Icon />
                Purge logs
              </Button>
            }
          />
        </Gated>
      )}
      title="Security Logs"
      variant="security"
    />
  );
}
