"use client";

import { PlusIcon, RefreshCwIcon, Trash2Icon } from "lucide-react";

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
import { AddIpBlockDialog } from "@/components/admin/dialogs/add-ip-block-dialog";
import { RemoveIpBlockDialog } from "@/components/admin/dialogs/remove-ip-block-dialog";

const FILTERS: FilterDef[] = [
  {
    key: "active",
    label: "Status",
    options: [
      { label: "Active", value: "true" },
      { label: "Expired", value: "false" },
    ],
  },
];

function selectIpBlockItems(data: ApiRecord): ApiRecord[] {
  const blocks = data.ip_blocks;
  return Array.isArray(blocks) ? (blocks as ApiRecord[]) : [];
}

function mapIpBlock(block: ApiRecord): AdminRow {
  return {
    IP: field(block, ["ip_address"]),
    Status: block.is_active ? "Active" : "Expired",
    Reason: field(block, ["reason"]),
    "Blocked by": field(block, ["blocked_by"]),
    Expires: formatDate(block.expires_at),
  };
}

function IpBlockRowActions({ item, refresh }: { item: ApiRecord; refresh: () => void }) {
  const ip = field(item, ["ip_address"]);
  return (
    <Gated power="PWR_SECURITY_IP_BLOCK">
      <RemoveIpBlockDialog
        ipAddress={ip}
        refresh={refresh}
        trigger={
          <Button size="icon-sm" variant="ghost" aria-label="Remove block" title="Remove IP Block">
            <Trash2Icon className="size-3.5 text-destructive" />
          </Button>
        }
      />
    </Gated>
  );
}

export function IpBlocksPage() {
  return (
    <ApiAdminPage
      action="Refresh"
      actionIcon={<RefreshCwIcon />}
      collectionKeys={["ip_blocks"]}
      columns={["IP", "Status", "Reason", "Blocked by", "Expires"]}
      description="IP blocklist table with add/remove forms to block abusive IP addresses and sessions."
      emptyMessage="No IP blocks returned."
      endpoint="/api/admin/security/ip-blocks"
      eyebrow="IP Blocklist"
      filters={FILTERS}
      mapRow={mapIpBlock}
      selectItems={selectIpBlockItems}
      metrics={(data, rows) => [
        {
          label: "Total IP Blocks",
          value: formatNumber(totalFrom(data, rows.length)),
          detail: "Platform IP blocklist",
        },
        {
          label: "Active Blocks",
          value: formatNumber(countRows(rows, "Status", /Active/i)),
          detail: "Enforced active blocks",
        },
        {
          label: "Expired Blocks",
          value: formatNumber(countRows(rows, "Status", /Expired/i)),
          detail: "Past expired blocks",
        },
        {
          label: "Active Enforcers",
          value: formatNumber(new Set(rows.map((r) => r["Blocked by"])).size),
          detail: "Security rule enforcers",
        },
      ]}
      paginated
      primaryAction={(refresh) => (
        <Gated power="PWR_SECURITY_IP_BLOCK">
          <AddIpBlockDialog
            refresh={refresh}
            trigger={
              <Button size="sm" className="gap-1.5">
                <PlusIcon className="size-4" /> Block IP Address
              </Button>
            }
          />
        </Gated>
      )}
      rowActions={(item, refresh) => <IpBlockRowActions item={item} refresh={refresh} />}
      searchable
      searchPlaceholder="Search IP address, reason, enforcer..."
      title="IP Blocklist"
      variant="security"
    />
  );
}
