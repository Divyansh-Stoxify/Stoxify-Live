"use client";

import { RefreshCwIcon } from "lucide-react";

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

const FILTERS: FilterDef[] = [
  {
    key: "state",
    label: "State",
    options: [
      { label: "Active", value: "ACTIVE" },
      { label: "Suspended", value: "SUSPENDED" },
      { label: "Blocked", value: "BLOCKED" },
    ],
  },
];

function mapMember(member: ApiRecord): AdminRow {
  return {
    Member: field(member, ["name", "email", "user_id"]),
    Role: field(member, ["assigned_role", "role_id"]),
    State: stateLabel(member.state),
    Phone: field(member, ["phone"]),
    Created: formatDate(member.created_at),
  };
}

export function InternalTeamPage() {
  return (
    <ApiAdminPage
      action="Refresh"
      actionIcon={<RefreshCwIcon />}
      collectionKeys={["members"]}
      columns={["Member", "Role", "State", "Phone", "Created"]}
      description="Internal team accounts, assigned admin role, and lifecycle state from user-service."
      emptyMessage="No internal team members returned by the backend."
      endpoint="/api/admin/internal-team"
      eyebrow="Internal access"
      filters={FILTERS}
      mapRow={mapMember}
      metrics={(data, rows) => [
        { label: "Team members", value: formatNumber(totalFrom(data, rows.length)), detail: "Backend reported total" },
        { label: "Active", value: formatNumber(countRows(rows, "State", /ACTIVE/i)), detail: "Loaded active members" },
        { label: "Blocked", value: formatNumber(countRows(rows, "State", /BLOCKED/i)), detail: "Loaded blocked members" },
        { label: "Loaded", value: formatNumber(rows.length), detail: "Visible rows" },
      ]}
      paginated
      title="Internal Team"
      variant="people"
    />
  );
}
