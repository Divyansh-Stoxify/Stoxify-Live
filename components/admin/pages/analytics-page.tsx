import { RefreshCwIcon } from "lucide-react";

import {
  ApiAdminPage,
  field,
  formatDate,
  formatNumber,
  formatPercent,
  nested,
  type ApiRecord,
} from "@/components/admin/api-admin-page";
import type { AdminRow } from "@/components/admin/admin-page-layout";

function analyticsRows(data: ApiRecord) {
  const notifications = Array.isArray(data.notifications)
    ? data.notifications.map((item) => ({ ...(item as ApiRecord), section: "Notification" }))
    : [];

  return [
    {
      section: "Growth",
      metric: "New users",
      value: nested(data, "growth.new_users"),
      detail: "End users",
    },
    {
      section: "Growth",
      metric: "New analysts",
      value: nested(data, "growth.new_analysts"),
      detail: "Analyst signups",
    },
    {
      section: "Growth",
      metric: "New subscriptions",
      value: nested(data, "growth.new_subscriptions"),
      detail: "Subscription starts",
    },
    {
      section: "Trades",
      metric: "Created",
      value: nested(data, "trades.created"),
      detail: "Trades opened",
    },
    {
      section: "Trades",
      metric: "Closed",
      value: nested(data, "trades.closed"),
      detail: "Trades closed",
    },
    {
      section: "Security",
      metric: "Incidents",
      value: nested(data, "security.incidents"),
      detail: "Security logs",
    },
    ...notifications,
  ];
}

function mapAnalyticsRow(item: ApiRecord): AdminRow {
  return {
    Section: field(item, ["section"]),
    Metric: field(item, ["metric", "type"]),
    Value: formatNumber(field(item, ["value", "count"])),
    Detail: field(item, ["detail"]),
    Window: "Live",
  };
}

export function AnalyticsPage() {
  return (
    <ApiAdminPage
      action="Refresh"
      actionIcon={<RefreshCwIcon />}
      columns={["Section", "Metric", "Value", "Detail", "Window"]}
      description="Growth, subscription, trade, notification, and security metrics from backend overview APIs."
      emptyMessage="No analytics metrics returned by the backend."
      endpoint="/api/admin/analytics"
      eyebrow="Admin analytics"
      insights={(data) => [
        {
          label: "Window",
          value: `${formatNumber(data.window_days)} days`,
          detail: `Since ${formatDate(data.since)}`,
        },
        {
          label: "Average PnL",
          value: formatPercent(nested(data, "trades.avg_pnl_percent")),
          detail: "Closed trades in window",
        },
        {
          label: "Win rate",
          value: formatPercent(nested(data, "trades.win_rate")),
          detail: "Closed trade success rate",
        },
      ]}
      mapRow={mapAnalyticsRow}
      metrics={(data) => [
        {
          label: "New users",
          value: formatNumber(nested(data, "growth.new_users")),
          detail: "Window growth",
        },
        {
          label: "New analysts",
          value: formatNumber(nested(data, "growth.new_analysts")),
          detail: "Window growth",
        },
        {
          label: "Trades created",
          value: formatNumber(nested(data, "trades.created")),
          detail: "Window trade activity",
        },
        {
          label: "Security incidents",
          value: formatNumber(nested(data, "security.incidents")),
          detail: "Window security logs",
        },
      ]}
      selectItems={analyticsRows}
      title="Platform Analytics"
      variant="analytics"
    />
  );
}
