"use client";

import { RefreshCwIcon, ShieldOffIcon } from "lucide-react";

import {
  ApiAdminPage,
  countRows,
  field,
  formatDate,
  formatNumber,
  totalFrom,
  type ApiRecord,
  type FilterDef,
} from "@/components/admin/api-admin-page";
import type { AdminRow } from "@/components/admin/admin-page-layout";
import { Button } from "@/components/ui/button";
import { Gated } from "@/components/admin/admin-permissions-provider";
import { RevokeSessionDialog } from "@/components/admin/dialogs/revoke-session-dialog";

const FILTERS: FilterDef[] = [
  {
    key: "is_revoked",
    label: "Status",
    options: [
      { label: "Active", value: "false" },
      { label: "Revoked", value: "true" },
    ],
  },
];

function mapSession(session: ApiRecord): AdminRow {
  return {
    Session: field(session, ["session_id"]),
    User: field(session, ["user_id"]),
    Device: field(session, ["device_name", "device_type", "device_id"]),
    IP: field(session, ["ip_address"]),
    Status: session.is_revoked ? "Revoked" : "Active",
    "Last active": formatDate(session.last_active),
  };
}

function SessionRowActions({ item, refresh }: { item: ApiRecord; refresh: () => void }) {
  const sessionId = field(item, ["session_id", "_id"]);
  const isRevoked = Boolean(item.is_revoked);

  if (isRevoked) return null;

  return (
    <Gated power="PWR_SECURITY_DEVICE_REVOKE">
      <RevokeSessionDialog sessionId={sessionId} refresh={refresh}
        trigger={
          <Button size="icon-sm" variant="ghost" aria-label="Revoke session">
            <ShieldOffIcon />
          </Button>
        }
      />
    </Gated>
  );
}

export function SecuritySessionsPage() {
  return (
    <ApiAdminPage
      action="Refresh"
      actionIcon={<RefreshCwIcon />}
      collectionKeys={["sessions"]}
      columns={["Session", "User", "Device", "IP", "Status", "Last active"]}
      description="Active admin-visible sessions from auth-service with revoke support."
      emptyMessage="No sessions returned by the backend."
      endpoint="/api/admin/security/sessions"
      eyebrow="Sessions"
      filters={FILTERS}
      mapRow={mapSession}
      metrics={(data, rows) => [
        { label: "Sessions", value: formatNumber(totalFrom(data, rows.length)), detail: "Backend reported total" },
        { label: "Active", value: formatNumber(countRows(rows, "Status", /Active/i)), detail: "Loaded active sessions" },
        { label: "Revoked", value: formatNumber(countRows(rows, "Status", /Revoked/i)), detail: "Loaded revoked sessions" },
        { label: "Loaded", value: formatNumber(rows.length), detail: "Visible sessions" },
      ]}
      paginated
      rowActions={(item, refresh) => <SessionRowActions item={item} refresh={refresh} />}
      title="Security Sessions"
      variant="security"
    />
  );
}
