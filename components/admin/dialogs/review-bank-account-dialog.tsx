"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import { AlertTriangleIcon, BanknoteIcon, UserCheckIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { ConfirmDialog } from "./_confirm-dialog";
import { ProofDocumentViewer } from "./_proof-document-viewer";
import { adminFetch } from "@/lib/admin/client-api";
import type { ApiRecord } from "@/components/admin/api-admin-page";

/**
 * The five things a reviewer must personally confirm before money can be sent
 * to an account. Every one has to be ticked to approve — the backend rejects a
 * partial checklist — and the snapshot is stored as the audit evidence that a
 * human looked at the document.
 */
const CHECKLIST_ITEMS: { key: ChecklistKey; label: string; hint: string }[] = [
  {
    key: "nameMatches",
    label: "Name matches",
    hint: "Name on the document matches the account holder name and the PAN",
  },
  {
    key: "accountNumberMatches",
    label: "Account number matches",
    hint: "Digit-for-digit against the number the analyst typed",
  },
  {
    key: "ifscMatches",
    label: "IFSC matches",
    hint: "Same code, or at least the same bank and branch",
  },
  {
    key: "documentLegible",
    label: "Document is legible",
    hint: "Whole page, in focus, nothing cropped or covered",
  },
  {
    key: "documentUnaltered",
    label: "Document appears unaltered",
    hint: "No mismatched fonts, overlaid text, or edited regions",
  },
];

type ChecklistKey =
  | "nameMatches"
  | "accountNumberMatches"
  | "ifscMatches"
  | "documentLegible"
  | "documentUnaltered";

type Checklist = Record<ChecklistKey, boolean>;

const EMPTY_CHECKLIST: Checklist = {
  nameMatches: false,
  accountNumberMatches: false,
  ifscMatches: false,
  documentLegible: false,
  documentUnaltered: false,
};

const PROOF_LABELS: Record<string, string> = {
  cancelled_cheque: "Cancelled cheque",
  passbook: "Passbook front page",
  bank_statement: "Bank statement",
};

function DetailLine({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded border bg-background p-2">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-mono font-bold text-foreground">{value}</span>
    </div>
  );
}

type Props = {
  item: ApiRecord;
  mode: "APPROVE" | "REJECT";
  refresh: () => void;
  trigger: ReactNode;
};

export function ReviewBankAccountDialog({ item, mode, refresh, trigger }: Props) {
  const [checklist, setChecklist] = useState<Checklist>(EMPTY_CHECKLIST);
  const [reason, setReason] = useState("");

  const bankAccountId = String(item.bank_account_id ?? item._id ?? "");
  const analyst = (item.analyst ?? {}) as Record<string, string>;
  const nameMatchScore = item.name_match_score as number | null;
  const duplicateHolders = Number(item.duplicate_holder_count ?? 1);

  const allChecked = CHECKLIST_ITEMS.every((entry) => checklist[entry.key]);
  const approving = mode === "APPROVE";

  // Approval needs the full checklist; rejection needs a reason the analyst can
  // act on, because it's the only thing they'll see. This gates the confirm
  // button only — the dialog must still open, since it's where the checklist
  // and the reason field live.
  const confirmDisabled = approving ? !allChecked : reason.trim().length === 0;

  return (
    <ConfirmDialog
      trigger={trigger}
      destructive={!approving}
      confirmDisabled={confirmDisabled}
      title={
        approving
          ? `Approve payout account for ${analyst.name ?? "analyst"}`
          : `Reject payout account for ${analyst.name ?? "analyst"}`
      }
      description={
        approving
          ? "Approving makes this the account that receives all future settlements. Withdrawals stay locked for a short cooling-off window."
          : "The analyst sees this reason verbatim and can re-submit corrected details."
      }
      confirmLabel={approving ? "Approve account" : "Reject submission"}
      onConfirm={async () => {
        const res = await adminFetch(
          `/api/admin/bank-accounts/${encodeURIComponent(bankAccountId)}/review`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action: mode,
              checklist,
              rejection_reason: approving ? undefined : reason.trim(),
            }),
          }
        );
        const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
        return {
          ok: res.ok,
          message: res.ok
            ? approving
              ? "Payout account verified"
              : "Submission rejected — the analyst has been notified"
            : ((data.message ?? data.error) as string | undefined),
          code: data.code as string | undefined,
        };
      }}
      onSuccess={refresh}
      onClose={() => {
        setChecklist(EMPTY_CHECKLIST);
        setReason("");
      }}
    >
      <div className="space-y-4">
        {duplicateHolders > 1 && (
          <div className="flex items-start gap-2 rounded-lg border border-amber-300 bg-amber-50 p-3 text-xs dark:border-amber-700 dark:bg-amber-950/40">
            <AlertTriangleIcon className="mt-0.5 size-4 shrink-0 text-amber-600 dark:text-amber-400" />
            <p className="text-amber-800 dark:text-amber-200">
              <span className="font-bold">
                This bank account is linked to {duplicateHolders} different analysts.
              </span>{" "}
              Confirm this is legitimate before approving.
            </p>
          </div>
        )}

        <div className="space-y-2.5 rounded-lg border bg-muted/20 p-3.5 text-xs">
          <div className="flex items-center justify-between border-b pb-2">
            <div className="flex items-center gap-2 font-bold text-foreground">
              <BanknoteIcon className="size-4 text-emerald-600 dark:text-emerald-400" />
              <span>Submitted details</span>
            </div>
            <Badge variant="outline" className="font-mono text-[10px]">
              {PROOF_LABELS[String(item.proof_doc_type)] ?? String(item.proof_doc_type)}
            </Badge>
          </div>

          <div className="grid grid-cols-1 gap-2">
            <DetailLine label="Account holder" value={String(item.account_holder_name ?? "—")} />
            <DetailLine label="Account number" value={String(item.account_number_masked ?? "—")} />
            <DetailLine label="IFSC" value={String(item.ifsc ?? "—")} />
            <DetailLine
              label="Bank / branch"
              value={
                item.bank_name
                  ? `${item.bank_name}${item.branch_name ? ` — ${item.branch_name}` : ""}`
                  : "Unresolved"
              }
            />
            <DetailLine label="PAN" value={String(item.pan ?? "—")} />
          </div>

          {/* Advisory only — Indian names legitimately differ between records. */}
          {typeof nameMatchScore === "number" && (
            <div className="flex items-center justify-between rounded border bg-background p-2">
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <UserCheckIcon className="size-3 text-blue-500" /> Name vs profile
              </span>
              <span
                className={`font-bold ${
                  nameMatchScore >= 80
                    ? "text-emerald-600 dark:text-emerald-400"
                    : nameMatchScore >= 50
                      ? "text-amber-600 dark:text-amber-400"
                      : "text-red-600 dark:text-red-400"
                }`}
              >
                {nameMatchScore}% similar
              </span>
            </div>
          )}

          <ProofDocumentViewer bankAccountId={bankAccountId} />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Verification checklist
          </label>
          <div className="space-y-1.5">
            {CHECKLIST_ITEMS.map((entry) => (
              <label
                key={entry.key}
                className="flex cursor-pointer items-start gap-2.5 rounded-lg border bg-background p-2.5 text-xs transition-colors hover:bg-muted/40"
              >
                <input
                  type="checkbox"
                  className="mt-0.5 size-3.5 accent-emerald-600"
                  checked={checklist[entry.key]}
                  onChange={(e) =>
                    setChecklist((prev) => ({ ...prev, [entry.key]: e.target.checked }))
                  }
                />
                <span>
                  <span className="block font-bold text-foreground">{entry.label}</span>
                  <span className="block text-[11px] text-muted-foreground">{entry.hint}</span>
                </span>
              </label>
            ))}
          </div>
          {approving && !allChecked && (
            <p className="text-[11px] text-muted-foreground">
              All five must be confirmed to approve. If you can&apos;t confirm one, reject with a
              reason instead.
            </p>
          )}
        </div>

        {!approving && (
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Reason (shown to the analyst)
            </label>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. The account number on the passbook doesn't match the number entered. Please re-submit with a clearer image."
              rows={3}
              className="text-xs"
            />
          </div>
        )}
      </div>
    </ConfirmDialog>
  );
}
