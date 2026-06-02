"use client";

import { ShieldAlertIcon } from "lucide-react";

import {
  ApiAdminPage,
  field,
  formatDate,
  formatNumber,
  stateLabel,
  type ApiRecord,
  type FilterDef,
} from "@/components/admin/api-admin-page";
import type { AdminRow } from "@/components/admin/admin-page-layout";

const FILTERS: FilterDef[] = [
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

function threatBuckets(data: ApiRecord) {
  const byType = Array.isArray(data.by_type)
    ? data.by_type.map((item) => ({ ...(item as ApiRecord), bucket: "Incident type" }))
    : [];
  const topIps = Array.isArray(data.top_ips)
    ? data.top_ips.map((item) => ({ ...(item as ApiRecord), bucket: "IP address" }))
    : [];

  return [...byType, ...topIps];
}

function mapThreatBucket(item: ApiRecord): AdminRow {
  return {
    Signal: stateLabel(field(item, ["incident_type", "ip_address"])),
    Bucket: field(item, ["bucket"]),
    Count: formatNumber(item.count),
    Status: "Review",
  };
}

export function SecurityThreatsPage() {
  return (
    <ApiAdminPage
      action="Refresh"
      actionIcon={<ShieldAlertIcon />}
      columns={["Signal", "Bucket", "Count", "Status"]}
      description="Aggregated incident types and top IP sources from auth-service."
      emptyMessage="No threat buckets returned by the backend."
      endpoint="/api/admin/security/threats"
      eyebrow="Threats"
      filters={FILTERS}
      mapRow={mapThreatBucket}
      metrics={(data, rows) => [
        {
          label: "Incidents",
          value: formatNumber(data.total_incidents),
          detail: "Window total from auth-service",
        },
        {
          label: "Buckets",
          value: formatNumber(rows.length),
          detail: "Loaded type and IP buckets",
        },
        { label: "Since", value: formatDate(data.since), detail: "Threat window start" },
        { label: "Mode", value: "Live", detail: "No simulated threats" },
      ]}
      selectItems={threatBuckets}
      title="Security Threats"
      variant="security"
    />
  );
}
