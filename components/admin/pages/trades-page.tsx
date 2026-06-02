"use client";

import { RefreshCwIcon } from "lucide-react";

import {
  ApiAdminPage,
  countRows,
  field,
  formatDate,
  formatNumber,
  formatPercent,
  numberField,
  stateLabel,
  totalFrom,
  type ApiRecord,
  type FilterDef,
} from "@/components/admin/api-admin-page";
import type { AdminRow } from "@/components/admin/admin-page-layout";

const FILTERS: FilterDef[] = [
  {
    key: "status",
    label: "Status",
    options: [
      { label: "Live", value: "LIVE" },
      { label: "Closed by SL", value: "CLOSED_BY_SL" },
      { label: "Closed by target", value: "CLOSED_BY_TARGET" },
      { label: "Closed manually", value: "CLOSED_BY_MANUAL" },
    ],
  },
];

function tradeName(trade: ApiRecord) {
  if (trade.trade_type === "PAIR") {
    return `${field(trade, ["leg1.symbol"])} / ${field(trade, ["leg2.symbol"])}`;
  }
  return field(trade, ["symbol", "name", "trade_id"]);
}

function mapTrade(trade: ApiRecord): AdminRow {
  return {
    Trade: tradeName(trade),
    Analyst: field(trade, ["analyst_name", "analyst_id"]),
    Segment: field(trade, ["segment"]),
    Type: field(trade, ["trade_type"]),
    Status: stateLabel(trade.status),
    PnL: formatPercent(numberField(trade, ["pnl_percent", "combined_pnl_percent"])),
    Entry: formatDate(trade.entry_timestamp),
  };
}

export function TradesPage() {
  return (
    <ApiAdminPage
      action="Refresh"
      actionIcon={<RefreshCwIcon />}
      collectionKeys={["trades"]}
      columns={["Trade", "Analyst", "Segment", "Type", "Status", "PnL", "Entry"]}
      description="Read-only trade supervision from trade-service. Trade delete is intentionally not part of this platform."
      emptyMessage="No trades returned by the backend."
      endpoint="/api/admin/trades"
      eyebrow="Trade supervision"
      filters={FILTERS}
      mapRow={mapTrade}
      metrics={(data, rows) => [
        {
          label: "Total trades",
          value: formatNumber(totalFrom(data, rows.length)),
          detail: "Backend reported total",
        },
        {
          label: "Live",
          value: formatNumber(countRows(rows, "Status", /LIVE/i)),
          detail: "Loaded live trades",
        },
        {
          label: "Closed",
          value: formatNumber(countRows(rows, "Status", /CLOSED/i)),
          detail: "Loaded closed trades",
        },
        {
          label: "Segments",
          value: formatNumber(new Set(rows.map((row) => row.Segment)).size),
          detail: "Loaded segment count",
        },
      ]}
      paginated
      title="Trades"
      variant="trades"
    />
  );
}
