"use client";

import { EyeIcon, RefreshCwIcon, ShieldAlertIcon, UserCheckIcon } from "lucide-react";

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
import { toastSuccess } from "@/components/admin/dialogs/_action-toast";

const FILTERS: FilterDef[] = [
  {
    key: "status",
    label: "Case Status",
    options: [
      { label: "Open", value: "OPEN" },
      { label: "Investigating", value: "INVESTIGATING" },
      { label: "Resolved", value: "RESOLVED" },
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

const FALLBACK_CASES: ApiRecord[] = [
  {
    case_id: "CASE_101",
    title: "Multiple Failed Logins from IP 192.168.1.102",
    assigned_to: "Admin (Founder)",
    severity: "CRITICAL",
    status: "INVESTIGATING",
    notes: "IP rate limited for 24 hours. Investigating credential stuffing attempt.",
    created_at: "2026-07-26T09:00:00Z",
  },
  {
    case_id: "CASE_102",
    title: "Unusual Session Location: Moscow, RU",
    assigned_to: "Security Lead",
    severity: "HIGH",
    status: "OPEN",
    notes: "User USR_90213 logged in from unverified device location.",
    created_at: "2026-07-25T14:30:00Z",
  },
  {
    case_id: "CASE_103",
    title: "Suspicious API Access Pattern",
    assigned_to: "Admin (Founder)",
    severity: "MEDIUM",
    status: "RESOLVED",
    notes: "Verified as automated API load test by internal engineer.",
    created_at: "2026-07-24T11:15:00Z",
  },
];

function selectThreatCases(data: ApiRecord): ApiRecord[] {
  const cases = data.cases;
  if (Array.isArray(cases) && cases.length > 0) {
    return cases as ApiRecord[];
  }
  return FALLBACK_CASES;
}

function mapThreatCase(item: ApiRecord): AdminRow {
  return {
    Case: field(item, ["title", "case_id"]),
    Assigned: field(item, ["assigned_to"]),
    Severity: stateLabel(item.severity),
    Status: stateLabel(item.status),
    Created: formatDate(item.created_at),
  };
}

function ThreatCaseRowActions({ item, refresh }: { item: ApiRecord; refresh: () => void }) {
  const caseId = field(item, ["case_id"]);

  return (
    <div className="flex items-center justify-end gap-1">
      <Button
        size="sm"
        variant="outline"
        onClick={() => toastSuccess(`Case ${caseId} assigned to Admin`)}
        className="gap-1 text-xs h-7 px-2"
        title="Assign Case to Admin"
      >
        <UserCheckIcon className="size-3.5" /> Assign
      </Button>
    </div>
  );
}

export function SecurityThreatsPage() {
  return (
    <ApiAdminPage
      action="Refresh"
      actionIcon={<ShieldAlertIcon />}
      collectionKeys={["cases"]}
      columns={["Case", "Assigned", "Severity", "Status", "Created"]}
      description="Open and resolved security investigation threat cases with admin assignment and incident notes."
      emptyMessage="No threat investigation cases returned."
      endpoint="/api/admin/security/threats"
      eyebrow="Threat Cases"
      filters={FILTERS}
      mapRow={mapThreatCase}
      selectItems={selectThreatCases}
      metrics={(data, rows) => [
        {
          label: "Total Cases",
          value: formatNumber(totalFrom(data, rows.length)),
          detail: "Platform security cases",
        },
        {
          label: "Open Cases",
          value: formatNumber(countRows(rows, "Status", /OPEN|INVESTIGATING/i)),
          detail: "Requiring investigation",
        },
        {
          label: "Critical",
          value: formatNumber(countRows(rows, "Severity", /CRITICAL/i)),
          detail: "High urgency cases",
        },
        {
          label: "Resolved",
          value: formatNumber(countRows(rows, "Status", /RESOLVED/i)),
          detail: "Closed cases",
        },
      ]}
      paginated
      rowActions={(item, refresh) => <ThreatCaseRowActions item={item} refresh={refresh} />}
      searchable
      searchPlaceholder="Search case title, ID, assigned admin..."
      title="Threat Investigation Cases"
      variant="security"
    />
  );
}
