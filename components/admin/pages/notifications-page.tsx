"use client";

import { MegaphoneIcon, RefreshCwIcon } from "lucide-react";

import {
  ApiAdminPage,
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
import { BroadcastNotificationDialog } from "@/components/admin/dialogs/broadcast-notification-dialog";

function mapNotification(notification: ApiRecord): AdminRow {
  return {
    Title: field(notification, ["title", "notification_id"]),
    User: field(notification, ["user_id"]),
    Type: stateLabel(notification.type),
    Channels: formatList(notification.channels),
    Status: notification.is_read ? "Read" : "Delivered",
    Sent: formatDate(notification.created_at),
  };
}

export function NotificationsPage() {
  return (
    <ApiAdminPage
      action="Refresh"
      actionIcon={<RefreshCwIcon />}
      collectionKeys={["notifications"]}
      columns={["Title", "User", "Type", "Channels", "Status", "Sent"]}
      description="Broadcast history and recently delivered notifications from notification-service."
      emptyMessage="No notifications returned by the backend."
      endpoint="/api/admin/notifications/history"
      eyebrow="Messaging"
      mapRow={mapNotification}
      metrics={(data, rows) => [
        {
          label: "Notifications",
          value: formatNumber(totalFrom(data, rows.length)),
          detail: "Backend reported total",
        },
        { label: "Loaded", value: formatNumber(rows.length), detail: "Visible notifications" },
        {
          label: "Unread",
          value: formatNumber(rows.filter((row) => row.Status !== "Read").length),
          detail: "Loaded delivered rows",
        },
        {
          label: "Types",
          value: formatNumber(new Set(rows.map((row) => row.Type)).size),
          detail: "Loaded notification types",
        },
      ]}
      paginated
      primaryAction={(refresh) => (
        <Gated power="PWR_NOTIFICATION_SEND_BROADCAST">
          <BroadcastNotificationDialog
            refresh={refresh}
            trigger={
              <Button>
                <MegaphoneIcon />
                New broadcast
              </Button>
            }
          />
        </Gated>
      )}
      title="Notifications"
      variant="ledger"
    />
  );
}
