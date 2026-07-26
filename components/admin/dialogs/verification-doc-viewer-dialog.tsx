"use client";

import { useState, type ReactNode } from "react";
import {
  CheckIcon,
  EyeIcon,
  FileTextIcon,
  ShieldCheckIcon,
  XIcon,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { toastSuccess } from "./_action-toast";

type Props = {
  applicantName: string;
  sebiLicenseNumber?: string;
  submittedAt?: string;
  trigger?: ReactNode;
  onApprove?: (reason: string) => void;
  onReject?: (reason: string) => void;
};

export function VerificationDocViewerDialog({
  applicantName,
  sebiLicenseNumber = "INH000001234",
  submittedAt = "Recent",
  trigger,
  onApprove,
  onReject,
}: Props) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [activeDoc, setActiveDoc] = useState<"sebi" | "pan" | "identity">("sebi");

  const handleAction = (action: "approve" | "reject") => {
    if (!reason.trim()) {
      alert("A mandatory reason is required to process verification reviews.");
      return;
    }
    if (action === "approve") {
      onApprove?.(reason);
      toastSuccess(`Verification approved for ${applicantName}`);
    } else {
      onReject?.(reason);
      toastSuccess(`Verification rejected for ${applicantName}`);
    }
    setOpen(false);
    setReason("");
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
        {trigger || (
          <Button size="sm" variant="outline" className="gap-1 text-xs">
            <EyeIcon className="size-3.5" /> Inspect Docs
          </Button>
        )}
      </span>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent className="w-full max-w-2xl overflow-y-auto sm:max-w-2xl">
          <SheetHeader className="border-b pb-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <SheetTitle className="text-lg font-bold flex items-center gap-2">
                  <span>Applicant Verification Viewer</span>
                  <Badge variant="outline" className="text-[10px] font-mono">
                    SEBI Review
                  </Badge>
                </SheetTitle>
                <SheetDescription className="text-xs text-muted-foreground mt-0.5">
                  Applicant: <strong>{applicantName}</strong> &bull; SEBI License: <code className="font-mono">{sebiLicenseNumber}</code>
                </SheetDescription>
              </div>
            </div>
          </SheetHeader>

          <div className="space-y-6 py-6 text-sm">
            {/* Document Switcher */}
            <div className="flex items-center gap-2 border-b pb-2">
              <button
                type="button"
                onClick={() => setActiveDoc("sebi")}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                  activeDoc === "sebi"
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                SEBI License Certificate
              </button>
              <button
                type="button"
                onClick={() => setActiveDoc("pan")}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                  activeDoc === "pan"
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                PAN & Identity Document
              </button>
              <button
                type="button"
                onClick={() => setActiveDoc("identity")}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                  activeDoc === "identity"
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Address Proof Document
              </button>
            </div>

            {/* Document Viewer Frame Placeholder */}
            <div className="rounded-lg border bg-muted/20 p-8 text-center space-y-4">
              <div className="size-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <FileTextIcon className="size-8" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-foreground capitalize">
                  {activeDoc === "sebi" ? "SEBI Registration Certificate (PDF)" : activeDoc === "pan" ? "PAN Card Copy (JPG)" : "Aadhaar / Address Proof (PDF)"}
                </h4>
                <p className="text-xs text-muted-foreground mt-1">
                  Submitted on {submittedAt} &bull; Document Reference #{sebiLicenseNumber}_DOC
                </p>
              </div>

              {/* Document Preview Box */}
              <div className="mx-auto max-w-md rounded-md border border-dashed bg-background p-6 text-xs text-muted-foreground space-y-2">
                <p className="font-semibold text-foreground">Document Document Preview Placeholder</p>
                <p className="text-[11px] leading-relaxed">
                  Verified against NSDL/SEBI public registry. License Number <span className="font-mono font-bold text-foreground">{sebiLicenseNumber}</span> matches applicant identity.
                </p>
              </div>
            </div>

            {/* Mandatory Reason Input */}
            <div className="space-y-2 border-t pt-4">
              <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <span>Reviewer Decision Reason *</span>
                <span className="text-[10px] font-normal text-muted-foreground">(Mandatory for audit log)</span>
              </label>
              <Input
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. SEBI License number verified against registry. All documents valid."
                className="text-xs h-9"
              />
            </div>

            {/* Decision Buttons */}
            <div className="flex items-center gap-3 border-t pt-4">
              <Button
                size="sm"
                onClick={() => handleAction("approve")}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
              >
                <CheckIcon className="size-4" /> Approve Application
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => handleAction("reject")}
                className="flex-1 gap-1.5"
              >
                <XIcon className="size-4" /> Reject Application
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
