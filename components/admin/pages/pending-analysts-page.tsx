"use client";

import { CheckIcon, FileTextIcon, RefreshCwIcon, XIcon } from "lucide-react";

import {
  ApiAdminPage,
  countRows,
  field,
  formatDate,
  formatList,
  formatNumber,
  stateLabel,
  totalFrom,
  type ApiRecord,
} from "@/components/admin/api-admin-page";
import type { AdminRow } from "@/components/admin/admin-page-layout";
import { Button } from "@/components/ui/button";
import { Gated } from "@/components/admin/admin-permissions-provider";
import { VerifyAnalystDialog } from "@/components/admin/dialogs/verify-analyst-dialog";
import { RejectAnalystDialog } from "@/components/admin/dialogs/reject-analyst-dialog";
import { ViewAnalystDocumentsDialog } from "@/components/admin/dialogs/view-analyst-documents-dialog";
import { realDocUrl } from "@/lib/utils";

function formatDocumentsSummary(analyst: ApiRecord): string {
  const hasAadhaar = Boolean(realDocUrl(analyst.aadhar_doc_url));
  const hasPan = Boolean(realDocUrl(analyst.pan_doc_url));
  const hasSebi = Boolean(realDocUrl(analyst.sebi_license_doc_url));
  const count = [hasAadhaar, hasPan, hasSebi].filter(Boolean).length;
  if (count === 3) return "All 3 Uploaded (Aadhaar, PAN, SEBI)";
  if (count > 0) {
    const list = [];
    if (hasAadhaar) list.push("Aadhaar");
    if (hasPan) list.push("PAN");
    if (hasSebi) list.push("SEBI");
    return `${count}/3 (${list.join(", ")})`;
  }
  return "None Uploaded";
}

function mapPendingAnalyst(analyst: ApiRecord): AdminRow {
  return {
    Applicant: field(analyst, ["name", "email", "user_id"]),
    State: stateLabel(analyst.state),
    License: field(analyst, ["sebi_license_number"]),
    Documents: formatDocumentsSummary(analyst),
    Specialization: formatList(analyst.specialization),
    Submitted: formatDate(field(analyst, ["verification.submitted_at", "created_at"])),
  };
}

function PendingAnalystCardActions({ item, refresh }: { item: ApiRecord; refresh: () => void }) {
  const analystId = field(item, ["user_id", "_id"]);
  return (
    <div className="flex items-center gap-2 pt-1">
      <ViewAnalystDocumentsDialog
        analyst={item}
        trigger={
          <Button size="sm" variant="outline" className="flex-1 gap-1.5 border-slate-300">
            <FileTextIcon className="h-4 w-4 text-amber-600" />
            Docs
          </Button>
        }
      />
      <Gated power="PWR_ANALYST_VERIFY">
        <VerifyAnalystDialog
          analystId={analystId}
          item={item}
          refresh={refresh}
          trigger={
            <Button size="sm" className="flex-1 gap-1" variant="default">
              <CheckIcon className="h-4 w-4" />
              Approve
            </Button>
          }
        />
      </Gated>
      <Gated power="PWR_ANALYST_VERIFY">
        <RejectAnalystDialog
          analystId={analystId}
          refresh={refresh}
          trigger={
            <Button size="sm" className="flex-1 gap-1" variant="destructive">
              <XIcon className="h-4 w-4" />
              Reject
            </Button>
          }
        />
      </Gated>
    </div>
  );
}

export function PendingAnalystsPage() {
  return (
    <ApiAdminPage
      action="Refresh"
      actionIcon={<RefreshCwIcon />}
      collectionKeys={["analysts"]}
      columns={["Applicant", "State", "License", "Documents", "Specialization", "Submitted"]}
      description="Pending and ongoing analyst verification records from the admin verification queue. Inspect uploaded Aadhaar, PAN, and SEBI documents prior to approval."
      emptyMessage="No analyst applications are waiting for review."
      endpoint="/api/admin/analysts/pending"
      eyebrow="Verification queue"
      mapRow={mapPendingAnalyst}
      metrics={(data, rows) => [
        {
          label: "Queue total",
          value: formatNumber(totalFrom(data, rows.length)),
          detail: "Backend reported total",
        },
        {
          label: "Pending",
          value: formatNumber(countRows(rows, "State", /PENDING/i)),
          detail: "Loaded pending rows",
        },
        {
          label: "Ongoing",
          value: formatNumber(countRows(rows, "State", /ONGOING/i)),
          detail: "Loaded active reviews",
        },
        { label: "Loaded", value: formatNumber(rows.length), detail: "Visible applications" },
      ]}
      rowActions={(item, refresh) => <PendingAnalystCardActions item={item} refresh={refresh} />}
      title="Pending Reviews"
      variant="queue"
    />
  );
}
