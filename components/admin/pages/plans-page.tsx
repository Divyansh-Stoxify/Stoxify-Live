"use client";

import { PencilIcon, PowerIcon, RefreshCwIcon, Trash2Icon } from "lucide-react";

import {
  ApiAdminPage,
  countRows,
  field,
  formatCurrency,
  formatNumber,
  totalFrom,
  type ApiRecord,
  type FilterDef,
} from "@/components/admin/api-admin-page";
import type { AdminRow } from "@/components/admin/admin-page-layout";
import { Button } from "@/components/ui/button";
import { Gated } from "@/components/admin/admin-permissions-provider";
import { PlanStatusDialog } from "@/components/admin/dialogs/plan-status-dialog";
import { EditPlanDialog } from "@/components/admin/dialogs/edit-plan-dialog";
import { DeletePlanDialog } from "@/components/admin/dialogs/delete-plan-dialog";

const FILTERS: FilterDef[] = [
  {
    key: "is_active",
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

function mapPlan(plan: ApiRecord): AdminRow {
  return {
    Plan: field(plan, ["name", "plan_id"]),
    Analyst: field(plan, ["analyst_name", "analyst_id"]),
    Segment: field(plan, ["segment"]),
    Price: formatCurrency(plan.price),
    Status: plan.is_active ? "Active" : "Inactive",
  };
}

function PlanRowActions({ item, refresh }: { item: ApiRecord; refresh: () => void }) {
  const planId = field(item, ["plan_id", "_id"]);
  const isActive = Boolean(item.is_active);

  return (
    <div className="flex items-center justify-end gap-1">
      <Gated power="PWR_PLAN_ACTIVATE_DEACTIVATE">
        <PlanStatusDialog
          planId={planId}
          isActive={isActive}
          refresh={refresh}
          trigger={
            <Button
              size="icon-sm"
              variant="ghost"
              aria-label={isActive ? "Deactivate" : "Activate"}
            >
              <PowerIcon />
            </Button>
          }
        />
      </Gated>
      <Gated power="PWR_PLAN_MODIFY_ALL">
        <EditPlanDialog
          planId={planId}
          currentName={field(item, ["name"])}
          currentDays={typeof item.days === "number" ? item.days : undefined}
          currentPrice={typeof item.price === "number" ? item.price : undefined}
          currentSegment={field(item, ["segment"])}
          currentDescription={field(item, ["description"])}
          refresh={refresh}
          trigger={
            <Button size="icon-sm" variant="ghost" aria-label="Edit plan">
              <PencilIcon />
            </Button>
          }
        />
      </Gated>
      <Gated power="PWR_PLAN_DELETE">
        <DeletePlanDialog
          planId={planId}
          refresh={refresh}
          trigger={
            <Button size="icon-sm" variant="ghost" aria-label="Delete plan">
              <Trash2Icon />
            </Button>
          }
        />
      </Gated>
    </div>
  );
}

export function PlansPage() {
  return (
    <ApiAdminPage
      action="Refresh"
      actionIcon={<RefreshCwIcon />}
      collectionKeys={["plans"]}
      columns={["Plan", "Analyst", "Segment", "Price", "Status"]}
      description="Plan catalog, price, segment, and availability from plan-service."
      emptyMessage="No plans returned by the backend."
      endpoint="/api/admin/plans"
      eyebrow="Plan catalog"
      filters={FILTERS}
      mapRow={mapPlan}
      metrics={(data, rows) => [
        {
          label: "Total plans",
          value: formatNumber(totalFrom(data, rows.length)),
          detail: "Backend reported total",
        },
        {
          label: "Active",
          value: formatNumber(countRows(rows, "Status", /Active/i)),
          detail: "Loaded active plans",
        },
        {
          label: "Inactive",
          value: formatNumber(countRows(rows, "Status", /Inactive/i)),
          detail: "Loaded inactive plans",
        },
        {
          label: "Segments",
          value: formatNumber(new Set(rows.map((row) => row.Segment)).size),
          detail: "Loaded segment count",
        },
      ]}
      paginated
      rowActions={(item, refresh) => <PlanRowActions item={item} refresh={refresh} />}
      searchable
      searchPlaceholder="Search by plan name or ID"
      title="Plans"
      variant="catalog"
    />
  );
}
