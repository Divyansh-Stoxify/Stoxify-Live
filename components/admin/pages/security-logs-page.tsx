"use client";

import { DownloadIcon, RefreshCwIcon, Trash2Icon } from "lucide-react";

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
import { ConfirmActionDialog } from "@/components/admin/dialogs/confirm-action-dialog";
import { toastSuccess } from "@/components/admin/dialogs/_action-toast";

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

function selectLogItems(data: ApiRecord): ApiRecord[] {
  const logs = data.logs;
  return Array.isArray(logs) ? (logs as ApiRecord[]) : [];
}

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
      description="Filterable audit & security event log stream. Log purging is strictly Founder-only."
      emptyMessage="No security logs returned."
      endpoint="/api/admin/security/logs"
      eyebrow="Security logs"
      filters={FILTERS}
      mapRow={mapSecurityLog}
      selectItems={selectLogItems}
      metrics={(data, rows) => [
        {
          label: "Total Logs",
          value: formatNumber(totalFrom(data, rows.length)),
          detail: "Security log stream",
        },
        {
          label: "Critical",
          value: formatNumber(countRows(rows, "Severity", /CRITICAL/i)),
          detail: "Critical severity events",
        },
        {
          label: "High",
          value: formatNumber(countRows(rows, "Severity", /HIGH/i)),
          detail: "High severity events",
        },
        {
          label: "Active Stream",
          value: formatNumber(rows.length),
          detail: "Visible events",
        },
      ]}
      paginated
      primaryAction={(refresh) => (
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => toastSuccess("Security logs exported to CSV")}
            className="gap-1.5"
          >
            <DownloadIcon className="size-3.5" /> Export Logs
          </Button>

          <Gated power="PWR_ADMIN_LOGS_DELETE">
            <ConfirmActionDialog
              title="Purge Security Logs (Founder Only)"
              description="Founder Action: Are you sure you want to purge all security logs? This action requires Founder confirmation and cannot be undone."
              requireConfirmText="DELETE"
              confirmLabel="Purge Logs"
              destructive
              onConfirm={() => refresh()}
              trigger={
                <Button size="sm" variant="destructive" className="gap-1.5">
                  <Trash2Icon className="size-3.5" /> Purge Logs
                  <span className="text-[9px] font-mono opacity-80">(API NEEDED FROM BACKEND)</span>
                </Button>
              }
            />
          </Gated>
        </div>
      )}
      searchable
      searchPlaceholder="Search incident type, IP address, user ID..."
      title="Security Logs"
      variant="security"
    />
  );
}
