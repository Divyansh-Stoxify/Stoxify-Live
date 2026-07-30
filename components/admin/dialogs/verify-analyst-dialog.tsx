"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import { CreditCardIcon, FileTextIcon, ShieldCheckIcon, UserCheckIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "./_confirm-dialog";
import { adminFetch } from "@/lib/admin/client-api";
import { ViewAnalystDocumentsDialog } from "./view-analyst-documents-dialog";
import { realDocUrl } from "@/lib/utils";
import type { ApiRecord } from "@/components/admin/api-admin-page";

/** Whether a given verification document is actually on file. */
function DocStatus({ uploaded }: { uploaded: boolean }) {
  return uploaded ? (
    <span className="font-semibold text-emerald-600 dark:text-emerald-400">Uploaded</span>
  ) : (
    <span className="font-semibold text-amber-600 dark:text-amber-400">Not uploaded</span>
  );
}

type Props = {
  analystId: string;
  analystName?: string;
  sebiLicenseNumber?: string;
  refresh: () => void;
  trigger: ReactNode;
  item?: ApiRecord;
};

export function VerifyAnalystDialog({
  analystId,
  analystName = "Analyst",
  sebiLicenseNumber,
  refresh,
  trigger,
  item,
}: Props) {
  const [notes, setNotes] = useState("");
  const [showDocsModal, setShowDocsModal] = useState(false);

  const hasAadhaar = Boolean(realDocUrl(item?.aadhar_doc_url));
  const hasPan = Boolean(realDocUrl(item?.pan_doc_url));
  const hasSebi = Boolean(realDocUrl(item?.sebi_license_doc_url));
  const sebiLicense =
    String(item?.sebi_license_number || item?.sebi_registration_number || "") ||
    sebiLicenseNumber ||
    "—";

  return (
    <ConfirmDialog
      trigger={trigger}
      title={`Approve SEBI Verification for ${analystName}`}
      description="Approve this analyst's SEBI license and submitted KYC onboarding documents."
      confirmLabel="Approve Verification"
      onConfirm={async () => {
        // No optimistic success here: reporting an approval that never reached
        // the backend leaves an analyst stuck in VERIFICATION_PENDING while the
        // reviewer believes they are live.
        const res = await adminFetch(
          `/api/admin/analysts/${encodeURIComponent(analystId)}/verify`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ decision: "APPROVE", notes: notes || undefined }),
          }
        );
        const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
        return {
          ok: res.ok,
          message: res.ok
            ? (data.message as string) || "Analyst SEBI license verified successfully"
            : ((data.message ?? data.error) as string | undefined),
          code: data.code as string | undefined,
        };
      }}
      onSuccess={refresh}
      onClose={() => setNotes("")}
    >
      <div className="space-y-4">
        {/* Verification Summary Box */}
        <div className="rounded-lg border bg-muted/20 p-3.5 space-y-2.5 text-xs">
          <div className="flex items-center justify-between border-b pb-2">
            <div className="flex items-center gap-2 font-bold text-foreground">
              <ShieldCheckIcon className="size-4 text-emerald-600 dark:text-emerald-400" />
              <span>Submitted Verification Credentials</span>
            </div>
            <Badge variant="outline" className="text-[10px] font-mono">
              KYC & SEBI
            </Badge>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex items-center justify-between bg-background p-2 rounded border col-span-2">
              <span className="text-muted-foreground flex items-center gap-1.5">
                <FileTextIcon className="size-3 text-emerald-500" /> SEBI Reg:
              </span>
              <span className="font-mono font-bold text-foreground">{sebiLicense}</span>
            </div>

            <div className="flex items-center justify-between bg-background p-2 rounded border">
              <span className="text-muted-foreground flex items-center gap-1.5">
                <UserCheckIcon className="size-3 text-blue-500" /> Aadhaar:
              </span>
              <DocStatus uploaded={hasAadhaar} />
            </div>

            <div className="flex items-center justify-between bg-background p-2 rounded border">
              <span className="text-muted-foreground flex items-center gap-1.5">
                <CreditCardIcon className="size-3 text-purple-500" /> PAN Card:
              </span>
              <DocStatus uploaded={hasPan} />
            </div>

            <div className="flex items-center justify-between bg-background p-2 rounded border col-span-2">
              <span className="text-muted-foreground flex items-center gap-1.5">
                <FileTextIcon className="size-3 text-emerald-500" /> SEBI Certificate:
              </span>
              <DocStatus uploaded={hasSebi} />
            </div>
          </div>

          {/* Open the real uploaded files before deciding. */}
          {item && (
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="w-full gap-1.5 text-xs"
              onClick={() => setShowDocsModal(true)}
            >
              <FileTextIcon className="size-3.5" /> View uploaded documents
            </Button>
          )}
        </div>

        {item && (
          <ViewAnalystDocumentsDialog
            analyst={item}
            isOpen={showDocsModal}
            onOpenChange={setShowDocsModal}
          />
        )}

        {/* Reviewer Notes Field */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Reviewer Approval Notes (optional)
          </label>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add approval notes or SEBI license verification reference..."
            rows={3}
            className="text-xs"
          />
        </div>
      </div>
    </ConfirmDialog>
  );
}
