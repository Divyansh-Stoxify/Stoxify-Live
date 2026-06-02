"use client";

import { PencilIcon, RefreshCwIcon, ShieldOffIcon } from "lucide-react";

import {
  ApiAdminPage,
  countRows,
  field,
  formatList,
  formatNumber,
  formatPercent,
  numberField,
  stateLabel,
  totalFrom,
  type ApiRecord,
  type FilterDef,
} from "@/components/admin/api-admin-page";
import type { AdminRow } from "@/components/admin/admin-page-layout";
import { Button } from "@/components/ui/button";
import { Gated } from "@/components/admin/admin-permissions-provider";
import { BlockAnalystDialog } from "@/components/admin/dialogs/block-analyst-dialog";
import { EditAnalystProfileDialog } from "@/components/admin/dialogs/edit-analyst-profile-dialog";

const FILTERS: FilterDef[] = [
  {
    key: "state",
    label: "State",
    options: [
      { label: "Active", value: "ACTIVE" },
      { label: "Pending", value: "PENDING" },
      { label: "Blocked", value: "BLOCKED" },
      { label: "Suspended", value: "SUSPENDED" },
    ],
  },
];

function mapAnalyst(analyst: ApiRecord): AdminRow {
  return {
    Analyst: field(analyst, ["name", "email", "user_id"]),
    State: stateLabel(analyst.state),
    "SEBI license": field(analyst, ["sebi_license_number"]),
    Specialization: formatList(analyst.specialization),
    "Avg PnL": formatPercent(numberField(analyst, ["performance.average_pnl_percent"])),
  };
}

function AnalystRowActions({ item, refresh }: { item: ApiRecord; refresh: () => void }) {
  const analystId = field(item, ["user_id", "_id"]);
  const state = String(item.state ?? "");
  const spec = Array.isArray(item.specialization) ? (item.specialization as string[]) : [];

  return (
    <div className="flex items-center justify-end gap-1">
      <Gated power="PWR_ANALYST_BLOCK">
        <BlockAnalystDialog analystId={analystId} currentState={state} refresh={refresh}
          trigger={
            <Button size="icon-sm" variant="ghost" aria-label={/BLOCKED/i.test(state) ? "Unblock" : "Block"}>
              <ShieldOffIcon />
            </Button>
          }
        />
      </Gated>
      <Gated power="PWR_ANALYST_PROFILE_EDIT_ALL">
        <EditAnalystProfileDialog
          analystId={analystId}
          currentName={field(item, ["name"])}
          currentPhone={field(item, ["phone"])}
          currentProfilePicUrl={field(item, ["profile_pic_url"])}
          currentExperienceYears={typeof item.experience_years === "number" ? item.experience_years : undefined}
          currentSpecialization={spec}
          refresh={refresh}
          trigger={
            <Button size="icon-sm" variant="ghost" aria-label="Edit profile">
              <PencilIcon />
            </Button>
          }
        />
      </Gated>
    </div>
  );
}

export function AnalystsPage() {
  return (
    <ApiAdminPage
      action="Refresh"
      actionIcon={<RefreshCwIcon />}
      collectionKeys={["analysts"]}
      columns={["Analyst", "State", "SEBI license", "Specialization", "Avg PnL"]}
      description="Review analyst profiles, verification state, performance, and blocking controls from user-service."
      emptyMessage="No analysts returned by the backend."
      endpoint="/api/admin/analysts"
      eyebrow="Analyst operations"
      filters={FILTERS}
      mapRow={mapAnalyst}
      metrics={(data, rows) => [
        { label: "Total analysts", value: formatNumber(totalFrom(data, rows.length)), detail: "Backend reported total" },
        { label: "Active", value: formatNumber(countRows(rows, "State", /ACTIVE/i)), detail: "Loaded active analysts" },
        { label: "Pending", value: formatNumber(countRows(rows, "State", /PENDING|ONGOING/i)), detail: "Loaded verification queue" },
        { label: "Blocked", value: formatNumber(countRows(rows, "State", /BLOCKED/i)), detail: "Loaded blocked analysts" },
      ]}
      paginated
      rowActions={(item, refresh) => <AnalystRowActions item={item} refresh={refresh} />}
      searchable
      searchPlaceholder="Search by name, email, SEBI license"
      title="Analysts"
      variant="people"
    />
  );
}
