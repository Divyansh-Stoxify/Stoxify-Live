"use client";

import { BanknoteIcon, CheckIcon, RefreshCwIcon, XIcon } from "lucide-react";

import {
  ApiAdminPage,
  countRows,
  field,
  formatDate,
  formatNumber,
  totalFrom,
  type ApiRecord,
} from "@/components/admin/api-admin-page";
import type { AdminRow, FilterDef } from "@/components/admin/admin-page-layout";
import { Button } from "@/components/ui/button";
import { Gated } from "@/components/admin/admin-permissions-provider";
import { ReviewBankAccountDialog } from "@/components/admin/dialogs/review-bank-account-dialog";
import { PayoutDetailsDialog } from "@/components/admin/dialogs/payout-details-dialog";

// Reviewers live on PENDING_REVIEW; whoever runs payouts switches to VERIFIED
// to get the list of accounts they can actually pay.
const FILTERS: FilterDef[] = [
  {
    key: "status",
    label: "Status",
    options: [
      { label: "Pending review", value: "PENDING_REVIEW" },
      { label: "Verified", value: "VERIFIED" },
      { label: "Rejected", value: "REJECTED" },
    ],
  },
];

const PROOF_LABELS: Record<string, string> = {
  cancelled_cheque: "Cancelled cheque",
  passbook: "Passbook",
  bank_statement: "Statement",
};

function mapBankAccount(account: ApiRecord): AdminRow {
  const analyst = (account.analyst ?? {}) as Record<string, string>;
  const score = account.name_match_score as number | null;
  const duplicates = Number(account.duplicate_holder_count ?? 1);

  return {
    Analyst: analyst.name || analyst.email || String(account.raId ?? "—"),
    Bank: [account.bank_name, account.branch_name].filter(Boolean).join(" — ") || "Unresolved",
    Account: String(account.account_number_masked ?? "—"),
    IFSC: String(account.ifsc ?? "—"),
    Proof: PROOF_LABELS[String(account.proof_doc_type)] ?? String(account.proof_doc_type ?? "—"),
    // Surfaced in the table so an obviously-wrong name is visible before opening
    // the row, and a shared account is impossible to miss.
    "Name match": typeof score === "number" ? `${score}%` : "—",
    Flags: duplicates > 1 ? `Shared with ${duplicates - 1} other` : "—",
    Status: String(account.status ?? "—"),
    Submitted: formatDate(field(account, ["submitted_at", "createdAt"])),
  };
}

function BankAccountRowActions({ item, refresh }: { item: ApiRecord; refresh: () => void }) {
  // A verified account isn't reviewable any more — what you do with it is pay
  // it, which needs the full number.
  if (item.status === "VERIFIED") {
    return (
      <div className="flex items-center gap-2 pt-1">
        <Gated power="PWR_BANK_VERIFY">
          <PayoutDetailsDialog
            item={item}
            trigger={
              <Button size="sm" variant="outline" className="w-full gap-1.5 border-slate-300">
                <BanknoteIcon className="h-4 w-4 text-emerald-600" />
                Payout details
              </Button>
            }
          />
        </Gated>
      </div>
    );
  }

  // Rejected rows are read-only history.
  if (item.status !== "PENDING_REVIEW") {
    return null;
  }

  return (
    <div className="flex items-center gap-2 pt-1">
      <Gated power="PWR_BANK_VERIFY">
        <ReviewBankAccountDialog
          item={item}
          mode="APPROVE"
          refresh={refresh}
          trigger={
            <Button size="sm" className="flex-1 gap-1" variant="default">
              <CheckIcon className="h-4 w-4" />
              Review &amp; approve
            </Button>
          }
        />
      </Gated>
      <Gated power="PWR_BANK_VERIFY">
        <ReviewBankAccountDialog
          item={item}
          mode="REJECT"
          refresh={refresh}
          trigger={
            <Button size="sm" className="flex-1 gap-1" variant="destructive">
              <XIcon className="h-4 w-4" />
              Reject
            </Button>
          }
        />
      </Gated>
    </div>
  );
}

export function BankAccountsPage() {
  return (
    <ApiAdminPage
      action="Refresh"
      actionIcon={<RefreshCwIcon />}
      collectionKeys={["items"]}
      columns={[
        "Analyst",
        "Bank",
        "Account",
        "IFSC",
        "Proof",
        "Name match",
        "Flags",
        "Status",
        "Submitted",
      ]}
      description="Payout accounts awaiting manual verification. Open each submission, compare the proof document against the typed details, and approve only when every checklist item holds."
      emptyMessage="No payout accounts are waiting for review."
      endpoint="/api/admin/bank-accounts"
      eyebrow="Payout verification"
      filters={FILTERS}
      mapRow={mapBankAccount}
      metrics={(data, rows) => [
        {
          label: "Queue total",
          value: formatNumber(totalFrom(data, rows.length)),
          detail: "Backend reported total",
        },
        {
          label: "Pending",
          value: formatNumber(countRows(rows, "Status", /PENDING/i)),
          detail: "Awaiting a decision",
        },
        {
          label: "Flagged",
          value: formatNumber(countRows(rows, "Flags", /Shared/i)),
          detail: "Account shared across analysts",
        },
        { label: "Loaded", value: formatNumber(rows.length), detail: "Visible submissions" },
      ]}
      rowActions={(item, refresh) => <BankAccountRowActions item={item} refresh={refresh} />}
      title="Payout Accounts"
      variant="queue"
    />
  );
}
