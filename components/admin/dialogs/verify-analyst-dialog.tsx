"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import { FileTextIcon, ShieldCheckIcon, CheckCircle2Icon, AlertCircleIcon } from "lucide-react";

import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "./_confirm-dialog";
import { adminFetch } from "@/lib/admin/client-api";
import { ViewAnalystDocumentsDialog } from "./view-analyst-documents-dialog";
import type { ApiRecord } from "@/components/admin/api-admin-page";

type Props = {
  analystId: string;
  refresh: () => void;
  trigger: ReactNode;
  item?: ApiRecord;
};

export function VerifyAnalystDialog({ analystId, refresh, trigger, item }: Props) {
  const [notes, setNotes] = useState("");
  const [showDocsModal, setShowDocsModal] = useState(false);

  const hasAadhaar = Boolean(item?.aadhar_doc_url);
  const hasPan = Boolean(item?.pan_doc_url);
  const hasSebi = Boolean(item?.sebi_license_doc_url);
  const sebiLicense = String(item?.sebi_license_number || item?.sebi_registration_number || "");

  return (
    <>
      <ConfirmDialog
        trigger={trigger}
        title="Approve analyst verification"
        description="Approve this analyst's SEBI license and onboarding application."
        confirmLabel="Approve Analyst"
        onConfirm={async () => {
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
            message: data.message as string | undefined,
            code: data.code as string | undefined,
          };
        }}
        onSuccess={refresh}
        onClose={() => setNotes("")}
      >
        <div className="space-y-4">
          {/* Document Verification Box */}
          {item && (
            <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3.5 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheckIcon className="h-4 w-4 text-amber-600" />
                  <span className="text-xs font-bold text-slate-800">
                    SEBI Reg: <span className="font-mono text-slate-900">{sebiLicense || "Not specified"}</span>
                  </span>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs gap-1.5 border-amber-300 text-amber-800 hover:bg-amber-50"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowDocsModal(true);
                  }}
                >
                  <FileTextIcon className="h-3.5 w-3.5" /> View Uploaded Docs
                </Button>
              </div>

              {/* Document Status Badges */}
              <div className="grid grid-cols-3 gap-2 pt-1 border-t border-slate-200/60">
                <div className="flex items-center gap-1.5 text-[11px]">
                  {hasAadhaar ? (
                    <CheckCircle2Icon className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertCircleIcon className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                  )}
                  <span className={hasAadhaar ? "font-medium text-slate-700" : "text-slate-400"}>
                    Aadhaar
                  </span>
                </div>

                <div className="flex items-center gap-1.5 text-[11px]">
                  {hasPan ? (
                    <CheckCircle2Icon className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertCircleIcon className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                  )}
                  <span className={hasPan ? "font-medium text-slate-700" : "text-slate-400"}>
                    PAN Card
                  </span>
                </div>

                <div className="flex items-center gap-1.5 text-[11px]">
                  {hasSebi ? (
                    <CheckCircle2Icon className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertCircleIcon className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                  )}
                  <span className={hasSebi ? "font-medium text-slate-700" : "text-slate-400"}>
                    SEBI Cert
                  </span>
                </div>
              </div>
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-700">Approval Notes (optional)</label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional verification or audit notes..."
              rows={3}
            />
          </div>
        </div>
      </ConfirmDialog>

      {item && showDocsModal && (
        <ViewAnalystDocumentsDialog
          analyst={item}
          isOpen={showDocsModal}
          onOpenChange={setShowDocsModal}
        />
      )}
    </>
  );
}
