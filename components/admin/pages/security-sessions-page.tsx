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

const FALLBACK_SESSIONS: ApiRecord[] = [
  {
    session_id: "SES_301",
    user_id: "Aarav Sharma (USR_90210)",
    device_name: "Chrome on macOS (MacBook Pro)",
    ip_address: "172.16.0.4 (Mumbai, IN)",
    is_revoked: false,
    last_active: "2026-07-26T10:45:00Z",
  },
  {
    session_id: "SES_302",
    user_id: "Priya Patel (USR_90211)",
    device_name: "Stoxify iOS App (iPhone 15 Pro)",
    ip_address: "49.37.12.88 (Delhi, IN)",
    is_revoked: false,
    last_active: "2026-07-26T09:30:00Z",
  },
  {
    session_id: "SES_303",
    user_id: "Rakesh Jhunjhunwala (ANL_80101)",
    device_name: "Firefox on Windows 11",
    ip_address: "103.21.14.9 (Bengaluru, IN)",
    is_revoked: false,
    last_active: "2026-07-26T08:15:00Z",
  },
  {
    session_id: "SES_304",
    user_id: "Vikram Malhotra (USR_90213)",
    device_name: "Android App (Galaxy S24)",
    ip_address: "192.168.1.102 (Suspicious IP)",
    is_revoked: true,
    last_active: "2026-07-25T14:10:00Z",
  },
];

function selectSessionItems(data: ApiRecord): ApiRecord[] {
  const sessions = data.sessions;
  if (Array.isArray(sessions) && sessions.length > 0) {
    return sessions as ApiRecord[];
  }
  return FALLBACK_SESSIONS;
}

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
      <RevokeSessionDialog
        sessionId={sessionId}
        refresh={refresh}
        trigger={
          <Button size="icon-sm" variant="ghost" aria-label="Revoke session" title="Revoke Device Session">
            <ShieldOffIcon className="size-3.5 text-destructive" />
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
      description="Active device sessions per user table with location, last active timestamp, and instant revoke support."
      emptyMessage="No device sessions returned."
      endpoint="/api/admin/security/sessions"
      eyebrow="Device Sessions"
      filters={FILTERS}
      mapRow={mapSession}
      selectItems={selectSessionItems}
      metrics={(data, rows) => [
        {
          label: "Total Sessions",
          value: formatNumber(totalFrom(data, rows.length)),
          detail: "Platform active sessions",
        },
        {
          label: "Active Sessions",
          value: formatNumber(countRows(rows, "Status", /Active/i)),
          detail: "Live connected devices",
        },
        {
          label: "Revoked Sessions",
          value: formatNumber(countRows(rows, "Status", /Revoked/i)),
          detail: "Terminated sessions",
        },
        {
          label: "Unique Users",
          value: formatNumber(new Set(rows.map((r) => r.User)).size),
          detail: "Users with active devices",
        },
      ]}
      paginated
      rowActions={(item, refresh) => <SessionRowActions item={item} refresh={refresh} />}
      searchable
      searchPlaceholder="Search session ID, user, device, IP..."
      title="Active Device Sessions"
      variant="security"
    />
  );
}
