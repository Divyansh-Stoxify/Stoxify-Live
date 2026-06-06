"use client";

import { CheckIcon, RefreshCwIcon, XIcon } from "lucide-react";

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

function mapPendingAnalyst(analyst: ApiRecord): AdminRow {
  return {
    Applicant: field(analyst, ["name", "email", "user_id"]),
    State: stateLabel(analyst.state),
    License: field(analyst, ["sebi_license_number"]),
    Specialization: formatList(analyst.specialization),
    Submitted: formatDate(field(analyst, ["verification.submitted_at", "created_at"])),
  };
}

function PendingAnalystCardActions({ item, refresh }: { item: ApiRecord; refresh: () => void }) {
  const analystId = field(item, ["user_id", "_id"]);
  return (
    <div className="flex gap-2 pt-1">
      <Gated power="PWR_ANALYST_VERIFY">
        <VerifyAnalystDialog
          analystId={analystId}
          refresh={refresh}
          trigger={
            <Button size="sm" className="flex-1" variant="default">
              <CheckIcon />
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
            <Button size="sm" className="flex-1" variant="destructive">
              <XIcon />
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
      columns={["Applicant", "State", "License", "Specialization", "Submitted"]}
      description="Pending and ongoing analyst verification records from the admin verification queue."
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
