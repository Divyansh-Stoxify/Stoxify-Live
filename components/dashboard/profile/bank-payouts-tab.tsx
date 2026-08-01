"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";

import { Icon } from "@/components/stoxify-icon";
import { useDashboard } from "@/components/dashboard/dashboard-context";
import {
  INPUT_BASE,
  BTN_GHOST,
  BTN_PRIMARY,
  HINT,
  SectionHead,
  DetailPair,
  StatusPill,
} from "@/components/dashboard/profile/ui";

// ─── Types ────────────────────────────────────────────────────────────────────

type BankStatus = "PENDING_REVIEW" | "VERIFIED" | "REJECTED";

interface BankAccount {
  bank_account_id: string;
  account_holder_name: string;
  account_number_masked: string;
  account_number_last4: string;
  ifsc: string;
  bank_name: string | null;
  branch_name: string | null;
  account_type: "savings" | "current";
  pan: string;
  gst: string | null;
  proof_doc_type: ProofDocType;
  status: BankStatus;
  verification_method: string | null;
  rejection_reason: string | null;
  is_active: boolean;
  payouts_unlocked_at: string | null;
  submitted_at: string;
  reviewed_at: string | null;
}

interface BankAccountResponse {
  active_account: BankAccount | null;
  pending_account: BankAccount | null;
  rejected_account: BankAccount | null;
}

interface PayoutRow {
  payout_id: string;
  gross_amount: number;
  tds_amount: number;
  net_amount: number;
  utr: string | null;
  mode: string;
  status: "initiated" | "processing" | "processed" | "failed";
  failure_reason: string | null;
  initiated_at: string;
  processed_at: string | null;
  created_at: string;
}

type ProofDocType = "cancelled_cheque" | "passbook" | "bank_statement";

// ─── Constants ────────────────────────────────────────────────────────────────

const ACCEPTED_DOC_TYPES = ["application/pdf", "image/jpeg", "image/png"];
const MAX_DOC_BYTES = 10 * 1024 * 1024;

/**
 * A cancelled cheque is listed first deliberately — it is the strongest of the
 * three, and plenty of current-account holders have no passbook at all.
 */
const PROOF_DOC_OPTIONS: { value: ProofDocType; label: string; hint: string }[] = [
  {
    value: "cancelled_cheque",
    label: "Cancelled cheque",
    hint: "Printed with your name, account number and IFSC",
  },
  {
    value: "passbook",
    label: "Passbook front page",
    hint: "The page showing your name, account number and IFSC",
  },
  {
    value: "bank_statement",
    label: "Bank statement (first page)",
    hint: "Recent statement header showing all three details",
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.includes(",") ? result.split(",")[1] : result);
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function formatDate(value?: string | null): string {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatDateTime(value?: string | null): string {
  if (!value) return "—";
  return new Date(value).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Payout amounts are stored in whole rupees, matching the withdrawal minimum. */
function formatRupees(rupees: number): string {
  return `₹${Number(rupees ?? 0).toLocaleString("en-IN")}`;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const ACCOUNT_TYPE_LABEL: Record<string, string> = {
  savings: "Savings Account",
  current: "Current Account",
};

// ─── Bank account card ────────────────────────────────────────────────────────

function BankAccountCard({
  account,
  variant,
  footer,
}: {
  account: BankAccount;
  variant: "active" | "pending" | "rejected";
  footer?: React.ReactNode;
}) {
  const pill =
    variant === "active" ? (
      <StatusPill tone="ok" icon="circleCheck">
        Verified
      </StatusPill>
    ) : variant === "pending" ? (
      <StatusPill tone="pending" icon="timer">
        Under review
      </StatusPill>
    ) : (
      <StatusPill tone="danger" icon="ban">
        Rejected
      </StatusPill>
    );

  const border =
    variant === "active"
      ? "border-slate-200/70"
      : variant === "pending"
        ? "border-amber-200"
        : "border-red-200";

  const header =
    variant === "active"
      ? "border-slate-100 bg-slate-50/60"
      : variant === "pending"
        ? "border-amber-100 bg-amber-50/50"
        : "border-red-100 bg-red-50/50";

  const subtitle =
    variant === "active"
      ? "Primary receiving account"
      : variant === "pending"
        ? `Submitted ${formatDate(account.submitted_at)} — awaiting verification`
        : `Reviewed ${formatDate(account.reviewed_at)}`;

  return (
    <div className={`overflow-hidden rounded-2xl border ${border}`}>
      <div className={`flex flex-wrap items-center justify-between gap-3 border-b px-5 py-4 ${header}`}>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500">
            <Icon className="h-5 w-5" name="bank" />
          </div>
          <div>
            <div className="text-[14px] font-bold leading-tight text-slate-800">
              {account.bank_name ?? "Bank account"}
            </div>
            <div className="mt-0.5 text-[11.5px] text-slate-400">{subtitle}</div>
          </div>
        </div>
        {pill}
      </div>

      <div className="grid grid-cols-1 gap-x-8 gap-y-5 bg-white p-5 sm:grid-cols-2">
        <DetailPair label="Account Holder Name" value={account.account_holder_name} />
        <DetailPair label="Account Number" value={account.account_number_masked} />
        <DetailPair label="IFSC Code" value={account.ifsc} />
        <DetailPair
          label="Account Type"
          value={ACCOUNT_TYPE_LABEL[account.account_type] ?? account.account_type}
        />
        {account.branch_name && <DetailPair label="Branch" value={account.branch_name} />}
        <DetailPair
          label="Proof Submitted"
          value={
            PROOF_DOC_OPTIONS.find((o) => o.value === account.proof_doc_type)?.label ??
            account.proof_doc_type
          }
        />
      </div>

      {footer}
    </div>
  );
}

// ─── Submit form ──────────────────────────────────────────────────────────────

function BankAccountFormModal({
  defaultHolderName,
  onClose,
  onSubmitted,
}: {
  defaultHolderName: string;
  onClose: () => void;
  onSubmitted: () => void;
}) {
  const { showSuccessToast } = useDashboard();

  const [step, setStep] = useState<1 | 2>(1);
  const [holderName, setHolderName] = useState(defaultHolderName);
  const [accountNumber, setAccountNumber] = useState("");
  const [accountNumberConfirm, setAccountNumberConfirm] = useState("");
  const [ifsc, setIfsc] = useState("");
  const [accountType, setAccountType] = useState<"savings" | "current">("savings");
  const [pan, setPan] = useState("");
  const [gst, setGst] = useState("");

  const [ifscLookup, setIfscLookup] = useState<{
    state: "idle" | "loading" | "found" | "notfound";
    bank?: string;
    branch?: string;
  }>({ state: "idle" });

  const [docType, setDocType] = useState<ProofDocType>("cancelled_cheque");
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const ifscTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Bumped per keystroke so a slow response for an older code can't overwrite
  // the result for what's currently typed.
  const ifscRequest = useRef(0);

  useEffect(() => () => {
    if (ifscTimer.current) clearTimeout(ifscTimer.current);
  }, []);

  /**
   * Resolve bank + branch as soon as the IFSC is well-formed. A typo surfaces
   * here immediately instead of as a failed transfer weeks later.
   */
  const handleIfscChange = (raw: string) => {
    const code = raw.toUpperCase().slice(0, 11);
    setIfsc(code);

    if (ifscTimer.current) clearTimeout(ifscTimer.current);
    const requestId = ++ifscRequest.current;

    if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(code)) {
      setIfscLookup({ state: "idle" });
      return;
    }

    setIfscLookup({ state: "loading" });
    ifscTimer.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/ifsc/${code}`, { credentials: "same-origin" });
        if (requestId !== ifscRequest.current) return;
        if (!res.ok) {
          setIfscLookup({ state: "notfound" });
          return;
        }
        const data = await res.json();
        setIfscLookup({ state: "found", bank: data.bank, branch: data.branch });
      } catch {
        if (requestId === ifscRequest.current) setIfscLookup({ state: "notfound" });
      }
    }, 350);
  };

  const digitsOnly = (s: string) => s.replace(/[^0-9]/g, "");
  const accountNumberValid = /^\d{9,18}$/.test(accountNumber);
  const confirmMismatch = accountNumberConfirm.length > 0 && accountNumber !== accountNumberConfirm;
  const panValid = /^[A-Z]{5}[0-9]{4}[A-Z]$/.test(pan.toUpperCase());
  const ifscValid = /^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifsc.toUpperCase());

  const step1Valid =
    holderName.trim().length >= 2 &&
    accountNumberValid &&
    accountNumber === accountNumberConfirm &&
    ifscValid &&
    panValid;

  const handleFile = (chosen: File | null) => {
    if (!chosen) {
      setFile(null);
      return;
    }
    if (!ACCEPTED_DOC_TYPES.includes(chosen.type)) {
      showSuccessToast("Unsupported File", "Please choose a PDF, JPEG, or PNG file.");
      return;
    }
    if (chosen.size > MAX_DOC_BYTES) {
      showSuccessToast("File Too Large", "Please choose a file under 10 MB.");
      return;
    }
    setFile(chosen);
  };

  const handleSubmit = async () => {
    if (!file || !step1Valid) return;

    setSubmitting(true);
    try {
      const proof_doc_base64 = await fileToBase64(file);
      const res = await fetch("/api/analyst/bank-account", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          account_holder_name: holderName.trim(),
          account_number: accountNumber,
          account_number_confirm: accountNumberConfirm,
          ifsc: ifsc.toUpperCase(),
          account_type: accountType,
          pan: pan.toUpperCase(),
          gst: gst.trim() ? gst.trim().toUpperCase() : undefined,
          proof_doc_base64,
          proof_doc_content_type: file.type,
          proof_doc_type: docType,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.message ?? data.error ?? "Unable to submit bank details.");
      }

      showSuccessToast(
        "Submitted for verification",
        "We'll review your document within 1–2 business days. Payouts continue to your current account until then."
      );
      onSubmitted();
      onClose();
    } catch (err) {
      showSuccessToast("Submission Failed", err instanceof Error ? err.message : String(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="bank-form-title"
    >
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div>
            <h3 id="bank-form-title" className="text-[16px] font-extrabold text-slate-900">
              {step === 1 ? "Bank details" : "Proof of account"}
            </h3>
            <p className="mt-0.5 text-[12px] text-slate-400">Step {step} of 2</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
          >
            <Icon className="h-4 w-4" name="x" />
          </button>
        </div>

        {step === 1 ? (
          <div className="flex flex-col gap-5 px-6 py-6">
            <div>
              <label htmlFor="bank-holder" className="mb-1.5 block text-[13px] font-bold text-slate-800">
                Account holder name
              </label>
              <input
                id="bank-holder"
                className={INPUT_BASE}
                value={holderName}
                onChange={(e) => setHolderName(e.target.value)}
                placeholder="As printed on your bank record"
              />
              <p className={HINT}>
                Must match the name on your PAN. A mismatch is the most common reason a transfer
                bounces.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="bank-account-number"
                  className="mb-1.5 block text-[13px] font-bold text-slate-800"
                >
                  Account number
                </label>
                <input
                  id="bank-account-number"
                  className={INPUT_BASE}
                  inputMode="numeric"
                  autoComplete="off"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(digitsOnly(e.target.value).slice(0, 18))}
                  placeholder="9–18 digits"
                />
              </div>

              <div>
                <label
                  htmlFor="bank-account-confirm"
                  className="mb-1.5 block text-[13px] font-bold text-slate-800"
                >
                  Confirm account number
                </label>
                <input
                  id="bank-account-confirm"
                  className={`${INPUT_BASE} ${confirmMismatch ? "border-red-300 focus:border-red-400 focus:ring-red-100" : ""}`}
                  inputMode="numeric"
                  autoComplete="off"
                  aria-invalid={confirmMismatch}
                  value={accountNumberConfirm}
                  // Pasting here would just duplicate a wrong number — re-typing
                  // is the entire point of the field.
                  onPaste={(e) => e.preventDefault()}
                  onChange={(e) => setAccountNumberConfirm(digitsOnly(e.target.value).slice(0, 18))}
                  placeholder="Re-type, don't paste"
                />
                {confirmMismatch && (
                  <p className="mt-1.5 text-[11.5px] font-semibold text-red-500">
                    Account numbers don&apos;t match.
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <label htmlFor="bank-ifsc" className="mb-1.5 block text-[13px] font-bold text-slate-800">
                  IFSC code
                </label>
                <input
                  id="bank-ifsc"
                  className={INPUT_BASE}
                  value={ifsc}
                  autoCapitalize="characters"
                  onChange={(e) => handleIfscChange(e.target.value)}
                  placeholder="HDFC0001234"
                />
                {ifscLookup.state === "loading" && (
                  <p className={HINT}>Looking up branch…</p>
                )}
                {ifscLookup.state === "found" && (
                  <p className="mt-1.5 text-[11.5px] font-semibold text-emerald-600">
                    {ifscLookup.bank} — {ifscLookup.branch}
                  </p>
                )}
                {ifscLookup.state === "notfound" && (
                  <p className="mt-1.5 text-[11.5px] font-semibold text-amber-600">
                    We couldn&apos;t confirm this branch. Double-check the code on your document.
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="bank-type" className="mb-1.5 block text-[13px] font-bold text-slate-800">
                  Account type
                </label>
                <select
                  id="bank-type"
                  className={INPUT_BASE}
                  value={accountType}
                  onChange={(e) => setAccountType(e.target.value as "savings" | "current")}
                >
                  <option value="savings">Savings Account</option>
                  <option value="current">Current Account</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <label htmlFor="bank-pan" className="mb-1.5 block text-[13px] font-bold text-slate-800">
                  PAN
                </label>
                <input
                  id="bank-pan"
                  className={INPUT_BASE}
                  value={pan}
                  autoCapitalize="characters"
                  onChange={(e) => setPan(e.target.value.toUpperCase().slice(0, 10))}
                  placeholder="ABCDE1234F"
                />
                <p className={HINT}>Used for TDS reporting on your payouts.</p>
              </div>

              <div>
                <label htmlFor="bank-gst" className="mb-1.5 block text-[13px] font-bold text-slate-800">
                  GSTIN <span className="font-medium text-slate-400">(optional)</span>
                </label>
                <input
                  id="bank-gst"
                  className={INPUT_BASE}
                  value={gst}
                  autoCapitalize="characters"
                  onChange={(e) => setGst(e.target.value.toUpperCase().slice(0, 15))}
                  placeholder="If you're GST registered"
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-5 px-6 py-6">
            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
              <p className="text-[12.5px] font-bold text-slate-700">
                Your document must clearly show all three:
              </p>
              <ul className="mt-2 flex flex-col gap-1 text-[12.5px] text-slate-500">
                {["Account holder name", "Full account number", "IFSC code"].map((item) => (
                  <li key={item} className="flex items-center gap-2">
                    <Icon className="h-3.5 w-3.5 text-emerald-500" name="check" />
                    {item}
                  </li>
                ))}
              </ul>
              <p className="mt-2.5 text-[11.5px] text-slate-400">
                PDF, JPG or PNG · up to 10 MB · the whole page, uncropped and in focus
              </p>
            </div>

            <div>
              <span className="mb-2 block text-[13px] font-bold text-slate-800">Document type</span>
              <div className="flex flex-col gap-2">
                {PROOF_DOC_OPTIONS.map((option) => (
                  <label
                    key={option.value}
                    className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3.5 transition-colors ${
                      docType === option.value
                        ? "border-[var(--brand)] bg-[var(--brand)]/5"
                        : "border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    <input
                      type="radio"
                      name="proof-doc-type"
                      className="mt-0.5 accent-[var(--brand)]"
                      checked={docType === option.value}
                      onChange={() => setDocType(option.value)}
                    />
                    <span>
                      <span className="block text-[13px] font-bold text-slate-800">
                        {option.label}
                      </span>
                      <span className="mt-0.5 block text-[11.5px] text-slate-400">{option.hint}</span>
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <span className="mb-2 block text-[13px] font-bold text-slate-800">Upload</span>
              {file ? (
                <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3.5">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                      <Icon className="h-4 w-4" name="fileText" />
                    </div>
                    <div className="min-w-0">
                      <div className="truncate text-[13px] font-bold text-slate-800">{file.name}</div>
                      <div className="text-[11.5px] text-slate-400">{formatBytes(file.size)}</div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFile(null)}
                    className="shrink-0 cursor-pointer rounded-lg p-2 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-500"
                    aria-label="Remove file"
                  >
                    <Icon className="h-4 w-4" name="trash" />
                  </button>
                </div>
              ) : (
                <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 bg-slate-50/50 px-4 py-8 text-center transition-colors hover:border-[var(--brand)] hover:bg-[var(--brand)]/5">
                  <Icon className="h-6 w-6 text-slate-400" name="download" />
                  <span className="text-[13px] font-bold text-slate-700">Choose a file</span>
                  <span className="text-[11.5px] text-slate-400">PDF, JPG or PNG · max 10 MB</span>
                  <input
                    type="file"
                    className="hidden"
                    accept={ACCEPTED_DOC_TYPES.join(",")}
                    onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
                  />
                </label>
              )}
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="mb-3 text-[12.5px] font-bold text-slate-700">You&apos;re submitting</p>
              <div className="grid grid-cols-1 gap-x-8 gap-y-3 sm:grid-cols-2">
                <DetailPair label="Account Holder" value={holderName} />
                <DetailPair label="Account Number" value={`•••• ${accountNumber.slice(-4)}`} />
                <DetailPair label="IFSC" value={ifsc.toUpperCase()} />
                <DetailPair
                  label="Bank"
                  value={ifscLookup.bank ?? "Unconfirmed"}
                />
              </div>
            </div>

            <p className="text-[11.5px] leading-relaxed text-slate-400">
              A reviewer checks this against your typed details. Your current payout account keeps
              receiving settlements until the new one is approved.
            </p>
          </div>
        )}

        <div className="flex items-center justify-between gap-3 border-t border-slate-100 px-6 py-4">
          {step === 2 ? (
            <button type="button" className={BTN_GHOST} onClick={() => setStep(1)}>
              <Icon className="h-3.5 w-3.5" name="arrowLeft" />
              Back
            </button>
          ) : (
            <button type="button" className={BTN_GHOST} onClick={onClose}>
              Cancel
            </button>
          )}

          {step === 1 ? (
            <button
              type="button"
              className={BTN_PRIMARY}
              disabled={!step1Valid}
              onClick={() => setStep(2)}
            >
              Continue
              <Icon className="h-3.5 w-3.5" name="arrowRight" />
            </button>
          ) : (
            <button
              type="button"
              className={BTN_PRIMARY}
              disabled={!file || submitting}
              onClick={handleSubmit}
            >
              {submitting ? "Submitting…" : "Submit for verification"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Payouts table ────────────────────────────────────────────────────────────

const PAYOUT_STATUS_SKIN: Record<string, string> = {
  processed: "bg-emerald-50 text-emerald-600",
  processing: "bg-amber-50 text-amber-600",
  initiated: "bg-slate-100 text-slate-500",
  failed: "bg-red-50 text-red-600",
};

function PayoutsTable({ payouts }: { payouts: PayoutRow[] }) {
  const exportCsv = () => {
    const header = ["Date", "UTR", "Gross", "TDS", "Net", "Mode", "Status"];
    const rows = payouts.map((p) => [
      formatDate(p.processed_at ?? p.created_at),
      p.utr ?? "",
      p.gross_amount,
      p.tds_amount,
      p.net_amount,
      p.mode,
      p.status,
    ]);
    const csv = [header, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");

    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `stoxify-payouts-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col gap-3 border-t border-slate-100 pt-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-[14.5px] font-bold text-slate-800">Recent Payouts</h3>
          <p className="mt-0.5 text-[12px] text-slate-400">
            Settlements credited to your primary account.
          </p>
        </div>
        <button
          onClick={exportCsv}
          className={BTN_GHOST}
          type="button"
          disabled={payouts.length === 0}
        >
          <Icon className="h-3.5 w-3.5" name="download" />
          Export CSV
        </button>
      </div>

      {payouts.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 px-5 py-10 text-center">
          <p className="text-[13px] font-bold text-slate-600">No payouts yet</p>
          <p className="mt-1 text-[12px] text-slate-400">
            Settlements appear here once your earnings are paid out.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200/70">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/70">
                {["Date", "UTR", "Gross", "TDS", "Net", "Status"].map((head) => (
                  <th
                    key={head}
                    className="whitespace-nowrap px-4 py-3 text-[10.5px] font-extrabold uppercase tracking-[0.06em] text-slate-400"
                  >
                    {head}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-[13px] text-slate-700">
              {payouts.map((row) => (
                <tr key={row.payout_id} className="transition-colors hover:bg-slate-50/70">
                  <td className="whitespace-nowrap px-4 py-3.5 text-slate-500">
                    {formatDate(row.processed_at ?? row.created_at)}
                  </td>
                  {/* The UTR is the first thing an analyst needs when money hasn't landed. */}
                  <td className="whitespace-nowrap px-4 py-3.5 font-mono text-[12.5px] text-slate-400">
                    {row.utr ?? "—"}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3.5 text-slate-500">
                    {formatRupees(row.gross_amount)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3.5 text-slate-500">
                    {row.tds_amount > 0 ? `−${formatRupees(row.tds_amount)}` : "—"}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3.5 font-bold text-slate-800">
                    {formatRupees(row.net_amount)}
                  </td>
                  <td className="px-4 py-3.5">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11.5px] font-bold capitalize ${
                        PAYOUT_STATUS_SKIN[row.status] ?? "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {row.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── Tab ──────────────────────────────────────────────────────────────────────

export function BankPayoutsTab() {
  const [bank, setBank] = useState<BankAccountResponse | null>(null);
  const [payouts, setPayouts] = useState<PayoutRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [profileName, setProfileName] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [bankRes, payoutRes, profileRes] = await Promise.all([
        fetch("/api/analyst/bank-account", { credentials: "same-origin", cache: "no-store" }),
        fetch("/api/analyst/payouts", { credentials: "same-origin", cache: "no-store" }),
        fetch("/api/analyst/profile", { credentials: "same-origin", cache: "no-store" }),
      ]);

      if (bankRes.ok) setBank(await bankRes.json());
      if (payoutRes.ok) {
        const data = await payoutRes.json();
        setPayouts(data.items ?? []);
      }
      if (profileRes.ok) {
        const data = await profileRes.json();
        setProfileName(data?.name ?? "");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    /* eslint-disable-next-line react-hooks/set-state-in-effect */
    void load();
  }, [load]);

  const active = bank?.active_account ?? null;
  const pending = bank?.pending_account ?? null;
  const rejected = bank?.rejected_account ?? null;

  const coolingOff =
    active?.payouts_unlocked_at && new Date(active.payouts_unlocked_at) > new Date()
      ? active.payouts_unlocked_at
      : null;

  return (
    <div
      role="tabpanel"
      id="panel-bank-payouts"
      aria-labelledby="tab-bank-payouts"
      className="flex flex-col gap-6 outline-none"
    >
      <SectionHead
        title="Bank & Payouts"
        subtitle="Manage your payout account and track your earnings settlements."
      />

      {loading ? (
        <div className="rounded-2xl border border-slate-200/70 bg-slate-50/50 px-5 py-12 text-center text-[13px] text-slate-400">
          Loading your payout details…
        </div>
      ) : (
        <>
          {/* No account on file at all */}
          {!active && !pending && !rejected && (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/50 px-5 py-12 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-400">
                <Icon className="h-5 w-5" name="bank" />
              </div>
              <p className="mt-3 text-[14px] font-bold text-slate-800">No payout account yet</p>
              <p className="mx-auto mt-1 max-w-md text-[12.5px] leading-relaxed text-slate-400">
                Add the bank account where you want your earnings settled. We verify it against a
                cancelled cheque, passbook page, or bank statement before the first payout.
              </p>
              <button className={`${BTN_PRIMARY} mt-5`} type="button" onClick={() => setShowForm(true)}>
                <Icon className="h-3.5 w-3.5" name="plus" />
                Add payout account
              </button>
            </div>
          )}

          {/* Live payout destination */}
          {active && (
            <BankAccountCard
              account={active}
              variant="active"
              footer={
                <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 bg-white px-5 py-4">
                  <button
                    type="button"
                    className={BTN_GHOST}
                    disabled={Boolean(pending)}
                    onClick={() => setShowForm(true)}
                  >
                    Change bank account
                  </button>
                  {pending && (
                    <span className="text-[11.5px] text-slate-400">
                      A change is already under review.
                    </span>
                  )}
                </div>
              }
            />
          )}

          {/* Cooling-off notice — the account is verified but not yet drainable */}
          {coolingOff && (
            <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50/60 px-4 py-3.5">
              <Icon className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" name="lock" />
              <p className="text-[12.5px] leading-relaxed text-amber-800">
                <span className="font-bold">Withdrawals unlock {formatDateTime(coolingOff)}.</span>{" "}
                We hold withdrawals for a short window after any payout-account change. If you
                didn&apos;t make this change, contact support now.
              </p>
            </div>
          )}

          {/* Submission awaiting review */}
          {pending && (
            <BankAccountCard
              account={pending}
              variant="pending"
              footer={
                <div className="border-t border-amber-100 bg-amber-50/40 px-5 py-4">
                  <p className="text-[12.5px] leading-relaxed text-amber-800">
                    {active ? (
                      <>
                        Payouts continue to your account ending{" "}
                        <span className="font-bold">{active.account_number_last4}</span> until this
                        one is approved. Reviews take 1–2 business days.
                      </>
                    ) : (
                      <>
                        We&apos;re verifying your document against the details you entered. This
                        usually takes 1–2 business days.
                      </>
                    )}
                  </p>
                  <button
                    type="button"
                    className={`${BTN_GHOST} mt-3`}
                    onClick={() => setShowForm(true)}
                  >
                    Replace this submission
                  </button>
                </div>
              }
            />
          )}

          {/* Rejected, nothing else on file */}
          {rejected && (
            <BankAccountCard
              account={rejected}
              variant="rejected"
              footer={
                <div className="border-t border-red-100 bg-red-50/40 px-5 py-4">
                  <p className="text-[12.5px] font-bold text-red-700">Why this was rejected</p>
                  <p className="mt-1 text-[12.5px] leading-relaxed text-red-600">
                    {rejected.rejection_reason ??
                      "The document didn't match the details you entered."}
                  </p>
                  <button
                    type="button"
                    className={`${BTN_PRIMARY} mt-3`}
                    onClick={() => setShowForm(true)}
                  >
                    Submit corrected details
                  </button>
                </div>
              }
            />
          )}

          {/* Tax details, sourced from the verified account rather than invented */}
          {(active ?? pending ?? rejected) && (
            <div className="overflow-hidden rounded-2xl border border-slate-200/70">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 bg-slate-50/60 px-5 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500">
                    <Icon className="h-5 w-5" name="fileText" />
                  </div>
                  <div>
                    <div className="text-[14px] font-bold leading-tight text-slate-800">
                      Tax Information
                    </div>
                    <div className="mt-0.5 text-[11.5px] text-slate-400">
                      PAN &amp; GST details for statutory compliance
                    </div>
                  </div>
                </div>
                {active ? (
                  <StatusPill tone="ok" icon="circleCheck">
                    On file
                  </StatusPill>
                ) : (
                  <StatusPill tone="pending" icon="timer">
                    Pending
                  </StatusPill>
                )}
              </div>

              <div className="grid grid-cols-1 gap-x-8 gap-y-5 bg-white p-5 sm:grid-cols-2">
                <DetailPair label="PAN Number" value={(active ?? pending ?? rejected)!.pan} />
                <DetailPair
                  label="Name on Account"
                  value={(active ?? pending ?? rejected)!.account_holder_name}
                />
                <DetailPair
                  label="GSTIN"
                  value={(active ?? pending ?? rejected)!.gst ?? "Not registered"}
                />
              </div>
            </div>
          )}

          <PayoutsTable payouts={payouts} />
        </>
      )}

      {showForm && (
        <BankAccountFormModal
          defaultHolderName={active?.account_holder_name ?? profileName}
          onClose={() => setShowForm(false)}
          onSubmitted={load}
        />
      )}
    </div>
  );
}
