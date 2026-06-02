"use client";

import { BanIcon, RefreshCwIcon, RotateCcwIcon } from "lucide-react";

import {
  ApiAdminPage,
  countRows,
  field,
  formatCurrency,
  formatDate,
  formatNumber,
  nested,
  stateLabel,
  totalFrom,
  type ApiRecord,
  type FilterDef,
} from "@/components/admin/api-admin-page";
import type { AdminRow } from "@/components/admin/admin-page-layout";
import { Button } from "@/components/ui/button";
import { Gated } from "@/components/admin/admin-permissions-provider";
import { CancelSubscriptionDialog } from "@/components/admin/dialogs/cancel-subscription-dialog";
import { RefundSubscriptionDialog } from "@/components/admin/dialogs/refund-subscription-dialog";

const FILTERS: FilterDef[] = [
  {
    key: "status",
    label: "Status",
    options: [
      { label: "Active", value: "ACTIVE" },
      { label: "Cancelled", value: "CANCELLED" },
      { label: "Expired", value: "EXPIRED" },
    ],
  },
];

function mapSubscription(subscription: ApiRecord): AdminRow {
  return {
    Subscription: field(subscription, ["subscription_id"]),
    User: field(subscription, ["user_id"]),
    Analyst: field(subscription, ["analyst_name", "analyst_id"]),
    Status: stateLabel(subscription.status),
    Amount: formatCurrency(nested(subscription, "payment.amount")),
    Ends: formatDate(subscription.end_date),
  };
}

function SubscriptionRowActions({ item, refresh }: { item: ApiRecord; refresh: () => void }) {
  const subId = field(item, ["subscription_id", "_id"]);
  const status = String(item.status ?? "");
  const isActive = /ACTIVE/i.test(status);
  const amount =
    typeof nested(item, "payment.amount") === "number"
      ? (nested(item, "payment.amount") as number)
      : undefined;

  return (
    <div className="flex items-center justify-end gap-1">
      {isActive && (
        <Gated power="PWR_SUBSCRIPTION_CANCEL_ALL">
          <CancelSubscriptionDialog
            subscriptionId={subId}
            refresh={refresh}
            trigger={
              <Button size="icon-sm" variant="ghost" aria-label="Cancel subscription">
                <BanIcon />
              </Button>
            }
          />
        </Gated>
      )}
      <Gated power="PWR_SUBSCRIPTION_REFUND">
        <RefundSubscriptionDialog
          subscriptionId={subId}
          defaultAmount={amount}
          refresh={refresh}
          trigger={
            <Button size="icon-sm" variant="ghost" aria-label="Refund">
              <RotateCcwIcon />
            </Button>
          }
        />
      </Gated>
    </div>
  );
}

export function SubscriptionsPage() {
  return (
    <ApiAdminPage
      action="Refresh"
      actionIcon={<RefreshCwIcon />}
      collectionKeys={["subscriptions"]}
      columns={["Subscription", "User", "Analyst", "Status", "Amount", "Ends"]}
      description="Subscription ledger with cancel/refund admin actions from subscription-service."
      emptyMessage="No subscriptions returned by the backend."
      endpoint="/api/admin/subscriptions"
      eyebrow="Subscription ledger"
      filters={FILTERS}
      mapRow={mapSubscription}
      metrics={(data, rows) => [
        {
          label: "Total subscriptions",
          value: formatNumber(totalFrom(data, rows.length)),
          detail: "Backend reported total",
        },
        {
          label: "Active",
          value: formatNumber(countRows(rows, "Status", /ACTIVE/i)),
          detail: "Loaded active rows",
        },
        {
          label: "Cancelled",
          value: formatNumber(countRows(rows, "Status", /CANCELLED/i)),
          detail: "Loaded cancelled rows",
        },
        {
          label: "Refunded",
          value: formatNumber(countRows(rows, "Status", /REFUNDED/i)),
          detail: "Loaded refunded rows",
        },
      ]}
      paginated
      rowActions={(item, refresh) => <SubscriptionRowActions item={item} refresh={refresh} />}
      searchable
      searchPlaceholder="Search by subscription ID, user, analyst, plan"
      title="Subscriptions"
      variant="ledger"
    />
  );
}
