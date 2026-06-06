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

function mapIpBlock(block: ApiRecord): AdminRow {
  return {
    IP: field(block, ["ip_address"]),
    Status: block.is_active ? "Active" : "Inactive",
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
          <Button size="icon-sm" variant="ghost" aria-label="Remove block">
            <Trash2Icon />
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
      description="IP block list from auth-service, used to stop abusive sessions."
      emptyMessage="No IP blocks returned by the backend."
      endpoint="/api/admin/security/ip-blocks"
      eyebrow="IP blocks"
      filters={FILTERS}
      mapRow={mapIpBlock}
      metrics={(data, rows) => [
        {
          label: "IP blocks",
          value: formatNumber(totalFrom(data, rows.length)),
          detail: "Backend reported total",
        },
        {
          label: "Active",
          value: formatNumber(countRows(rows, "Status", /Active/i)),
          detail: "Loaded active blocks",
        },
        {
          label: "Inactive",
          value: formatNumber(countRows(rows, "Status", /Inactive/i)),
          detail: "Loaded inactive blocks",
        },
        { label: "Loaded", value: formatNumber(rows.length), detail: "Visible IP blocks" },
      ]}
      paginated
      primaryAction={(refresh) => (
        <Gated power="PWR_SECURITY_IP_BLOCK">
          <AddIpBlockDialog
            refresh={refresh}
            trigger={
              <Button>
                <PlusIcon />
                Block IP
              </Button>
            }
          />
        </Gated>
      )}
      rowActions={(item, refresh) => <IpBlockRowActions item={item} refresh={refresh} />}
      title="IP Blocks"
      variant="security"
    />
  );
}
