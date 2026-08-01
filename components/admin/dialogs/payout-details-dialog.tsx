"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import {
  AlertTriangleIcon,
  BanknoteIcon,
  CheckIcon,
  CopyIcon,
  EyeIcon,
  LoaderIcon,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ProofDocumentViewer } from "./_proof-document-viewer";
import { adminFetch } from "@/lib/admin/client-api";
import type { ApiRecord } from "@/components/admin/api-admin-page";

const PROOF_LABELS: Record<string, string> = {
  cancelled_cheque: "Cancelled cheque",
  passbook: "Passbook front page",
  bank_statement: "Bank statement",
};

function formatDate(value?: unknown): string {
  if (!value) return "—";
  const d = new Date(String(value));
  return Number.isNaN(d.getTime())
    ? "—"
    : d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

type Revealed = {
  account_holder_name: string;
  account_number: string;
  ifsc: string;
  bank_name: string | null;
  branch_name: string | null;
  account_type: string;
  pan: string;
  status: string;
};

/** Copy-to-clipboard row. The whole point of this dialog is transcription. */
function CopyRow({ label, value, mono = true }: { label: string; value: string; mono?: boolean }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* Clipboard blocked (insecure origin) — the value is on screen anyway. */
    }
  };

  return (
    <div className="flex items-center justify-between gap-3 rounded border bg-background p-2.5">
      <span className="shrink-0 text-xs text-muted-foreground">{label}</span>
      <div className="flex min-w-0 items-center gap-2">
        <span
          className={`truncate text-sm font-bold text-foreground ${mono ? "font-mono tracking-wide" : ""}`}
        >
          {value}
        </span>
        <Button
          type="button"
          size="icon"
          variant="ghost"
          className="size-7 shrink-0"
          onClick={copy}
          aria-label={`Copy ${label}`}
        >
          {copied ? (
            <CheckIcon className="size-3.5 text-emerald-600" />
          ) : (
            <CopyIcon className="size-3.5" />
          )}
        </Button>
      </div>
    </div>
  );
}

type Props = {
  item: ApiRecord;
  trigger: ReactNode;
};

/**
 * Shows the full account number so someone can execute a payout by hand.
 *
 * Nothing is fetched until the reviewer explicitly asks — opening the dialog is
 * not the same as revealing, so an idle open tab isn't leaving a bank account
 * number on screen.
 */
export function PayoutDetailsDialog({ item, trigger }: Props) {
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [data, setData] = useState<Revealed | null>(null);
  const [error, setError] = useState("");

  const bankAccountId = String(item.bank_account_id ?? item._id ?? "");
  const analyst = (item.analyst ?? {}) as Record<string, string>;

  const reset = () => {
    setState("idle");
    setData(null);
    setError("");
  };

  const reveal = async () => {
    setState("loading");
    try {
      const res = await adminFetch(
        `/api/admin/bank-accounts/${encodeURIComponent(bankAccountId)}/reveal`
      );
      const body = (await res.json().catch(() => ({}))) as Record<string, unknown>;
      if (!res.ok) {
        setError((body.message as string) ?? (body.error as string) ?? "Unable to reveal details");
        setState("error");
        return;
      }
      setData(body as unknown as Revealed);
      setState("ready");
    } catch {
      setError("Service unavailable");
      setState("error");
    }
  };

  return (
    <>
      <span
        style={{ display: "contents" }}
        onClick={(e) => {
          e.stopPropagation();
          setOpen(true);
        }}
      >
        {trigger}
      </span>

      <Dialog
        open={open}
        onOpenChange={(v) => {
          setOpen(v);
          // Drop the number from memory as soon as the dialog closes; reopening
          // re-reveals, which also means a second audit-log line.
          if (!v) reset();
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Payout details — {analyst.name ?? "analyst"}</DialogTitle>
            <DialogDescription>
              Use these to make the transfer from your bank. Every reveal is logged against your
              account.
            </DialogDescription>
          </DialogHeader>

          {item.status !== "VERIFIED" && (
            <div className="flex items-start gap-2 rounded-lg border border-amber-300 bg-amber-50 p-3 text-xs dark:border-amber-700 dark:bg-amber-950/40">
              <AlertTriangleIcon className="mt-0.5 size-4 shrink-0 text-amber-600 dark:text-amber-400" />
              <p className="text-amber-800 dark:text-amber-200">
                <span className="font-bold">This account is {String(item.status)}.</span> Do not pay
                to an account that hasn&apos;t been verified.
              </p>
            </div>
          )}

          {state === "ready" && data ? (
            <div className="flex flex-col gap-2">
              <CopyRow label="Account holder" value={data.account_holder_name} mono={false} />
              <CopyRow label="Account number" value={data.account_number} />
              <CopyRow label="IFSC" value={data.ifsc} />
              <CopyRow
                label="Bank"
                value={
                  data.bank_name
                    ? `${data.bank_name}${data.branch_name ? ` — ${data.branch_name}` : ""}`
                    : "Unresolved"
                }
                mono={false}
              />
              <CopyRow label="PAN" value={data.pan} />

              <p className="mt-1 text-[11px] text-muted-foreground">
                Closing this dialog clears these from the page. Don&apos;t paste them into chat,
                email, or a spreadsheet.
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3 rounded-lg border bg-muted/20 px-4 py-8 text-center">
              <BanknoteIcon className="size-6 text-muted-foreground" />
              <div>
                <p className="text-sm font-bold text-foreground">
                  Account ending {String(item.account_number_last4 ?? "••••")}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  The full number stays encrypted until you ask for it.
                </p>
              </div>
              <Button type="button" size="sm" onClick={reveal} disabled={state === "loading"}>
                {state === "loading" ? (
                  <LoaderIcon className="size-3.5 animate-spin" />
                ) : (
                  <EyeIcon className="size-3.5" />
                )}
                Reveal account number
              </Button>
              {state === "error" && (
                <p className="text-xs font-semibold text-red-600 dark:text-red-400">{error}</p>
              )}
            </div>
          )}

          {/* What the approval was based on. Kept alongside the payment details
              so the transfer can be checked against the document itself, not
              just against the form someone typed. */}
          <div className="space-y-3 border-t pt-3">
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="rounded border bg-background p-2.5">
                <span className="block text-muted-foreground">Document on file</span>
                <span className="mt-0.5 block font-bold text-foreground">
                  {PROOF_LABELS[String(item.proof_doc_type)] ?? String(item.proof_doc_type ?? "—")}
                </span>
              </div>
              <div className="rounded border bg-background p-2.5">
                <span className="block text-muted-foreground">Account type</span>
                <span className="mt-0.5 block font-bold capitalize text-foreground">
                  {String(item.account_type ?? "—")}
                </span>
              </div>
              <div className="rounded border bg-background p-2.5">
                <span className="block text-muted-foreground">Submitted</span>
                <span className="mt-0.5 block font-bold text-foreground">
                  {formatDate(item.submitted_at)}
                </span>
              </div>
              <div className="rounded border bg-background p-2.5">
                <span className="block text-muted-foreground">Verified</span>
                <span className="mt-0.5 block font-bold text-foreground">
                  {formatDate(item.reviewed_at)}
                </span>
              </div>
            </div>

            <ProofDocumentViewer bankAccountId={bankAccountId} label="View attached document" />
          </div>

          <DialogFooter>
            <Badge variant="outline" className="mr-auto font-mono text-[10px]">
              {String(item.status)}
            </Badge>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
