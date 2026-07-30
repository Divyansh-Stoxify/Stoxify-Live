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

function selectThreatCases(data: ApiRecord): ApiRecord[] {
  const cases = data.cases;
  return Array.isArray(cases) ? (cases as ApiRecord[]) : [];
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
      title="Threat Investigation Cases (API NEEDED FROM BACKEND)"
      variant="security"
    />
  );
}
