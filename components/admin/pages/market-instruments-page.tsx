"use client";

import { RefreshCwIcon } from "lucide-react";

import {
  ApiAdminPage,
  field,
  formatNumber,
  totalFrom,
  type ApiRecord,
  type FilterDef,
} from "@/components/admin/api-admin-page";
import type { AdminRow } from "@/components/admin/admin-page-layout";

const FILTERS: FilterDef[] = [
  {
    key: "active",
    label: "Status",
    options: [
      { label: "Active", value: "true" },
      { label: "Inactive", value: "false" },
    ],
  },
  {
    key: "segment",
    label: "Segment",
    options: [
      { label: "Equity", value: "EQUITY" },
      { label: "Derivatives", value: "DERIVATIVES" },
      { label: "Crypto", value: "CRYPTO" },
      { label: "Commodity", value: "COMMODITY" },
    ],
  },
];

function mapInstrument(instrument: ApiRecord): AdminRow {
  return {
    Symbol: field(instrument, ["symbol", "value"]),
    Status: "Active",
    Source: "market-data-service",
    Action: "Tracked",
  };
}

export function MarketInstrumentsPage() {
  return (
    <ApiAdminPage
      action="Refresh"
      actionIcon={<RefreshCwIcon />}
      collectionKeys={["instruments"]}
      columns={["Symbol", "Status", "Source", "Action"]}
      description="Symbols currently tracked by market-data-service for price feeds and trade auto-close checks."
      emptyMessage="No market instruments returned by the backend."
      endpoint="/api/admin/market-instruments"
      eyebrow="Market data"
      filters={FILTERS}
      mapRow={mapInstrument}
      metrics={(data, rows) => [
        { label: "Tracked symbols", value: formatNumber(totalFrom(data, rows.length)), detail: "Backend reported count" },
        { label: "Loaded", value: formatNumber(rows.length), detail: "Visible symbols" },
        { label: "Source", value: "Live", detail: "market-data-service" },
        { label: "Mode", value: "Tracked", detail: "Active instruments" },
      ]}
      paginated
      searchable
      title="Market Instruments"
      variant="catalog"
    />
  );
}
