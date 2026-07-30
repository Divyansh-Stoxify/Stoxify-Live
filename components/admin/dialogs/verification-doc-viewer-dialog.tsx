"use client";

import { useState, type ReactNode } from "react";
import {
  CheckIcon,
  CreditCardIcon,
  EyeIcon,
  FileTextIcon,
  ShieldCheckIcon,
  UserCheckIcon,
  XIcon,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  sebiLicenseNumber = "INH78236478311",
  submittedAt = "Recent",
  trigger,
  onApprove,
  onReject,
}: Props) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [activeDoc, setActiveDoc] = useState<"sebi" | "pan" | "aadhaar">("sebi");

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
            <EyeIcon className="size-3.5" /> Inspect Submitted Docs
          </Button>
        )}
      </span>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="w-full max-w-2xl max-h-[90vh] overflow-y-auto sm:max-w-2xl rounded-xl p-6">
          <DialogHeader className="border-b pb-4 pr-8">
            <div className="flex items-start justify-between gap-3">
              <div>
                <DialogTitle className="text-lg font-bold flex items-center gap-2">
                  <span>Submitted Documents & Verification Popup</span>
                  <Badge variant="outline" className="text-[10px] font-mono">
                    SEBI & KYC Audit
                  </Badge>
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                  Applicant: <strong>{applicantName}</strong> &bull; SEBI License: <code className="font-mono">{sebiLicenseNumber}</code>
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-5 py-4 text-sm">
            {/* Document Navigation Tabs */}
            <div className="flex items-center gap-2 border-b pb-2">
              <button
                type="button"
                onClick={() => setActiveDoc("sebi")}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center gap-1.5 ${
                  activeDoc === "sebi"
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "text-muted-foreground hover:text-foreground bg-muted/40"
                }`}
              >
                <FileTextIcon className="size-3.5" /> SEBI Certificate
              </button>
              <button
                type="button"
                onClick={() => setActiveDoc("aadhaar")}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center gap-1.5 ${
                  activeDoc === "aadhaar"
                    ? "bg-blue-600 text-white shadow-xs"
                    : "text-muted-foreground hover:text-foreground bg-muted/40"
                }`}
              >
                <UserCheckIcon className="size-3.5" /> Aadhaar Card
              </button>
              <button
                type="button"
                onClick={() => setActiveDoc("pan")}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center gap-1.5 ${
                  activeDoc === "pan"
                    ? "bg-purple-600 text-white shadow-xs"
                    : "text-muted-foreground hover:text-foreground bg-muted/40"
                }`}
              >
                <CreditCardIcon className="size-3.5" /> PAN Card
              </button>
            </div>

            {/* Document Content View Pane */}
            <div className="rounded-xl border bg-muted/20 p-5 space-y-4">
              {activeDoc === "sebi" && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between border-b pb-2">
                    <div>
                      <h4 className="text-sm font-bold text-foreground">SEBI Registration Certificate</h4>
                      <p className="text-xs font-mono text-muted-foreground">Official SEBI Research Analyst License</p>
                    </div>
                    <Badge variant="default" className="bg-emerald-600 text-white text-[10px]">
                      SEBI Certified
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs bg-background p-3 rounded-lg border">
                    <div>
                      <span className="text-muted-foreground text-[10px] uppercase font-mono">SEBI Number</span>
                      <p className="font-mono font-bold text-foreground">{sebiLicenseNumber}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground text-[10px] uppercase font-mono">Registration Category</span>
                      <p className="font-medium text-foreground">Research Analyst (RA)</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground text-[10px] uppercase font-mono">Issuing Authority</span>
                      <p className="font-medium text-foreground">Securities and Exchange Board of India</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground text-[10px] uppercase font-mono">Submission Timestamp</span>
                      <p className="font-mono text-muted-foreground">{submittedAt}</p>
                    </div>
                  </div>

                  {/* Visual Document Placeholder */}
                  <div className="border-2 border-dashed border-emerald-500/30 rounded-lg p-6 text-center bg-emerald-500/5 space-y-2">
                    <FileTextIcon className="size-10 mx-auto text-emerald-600 dark:text-emerald-400" />
                    <p className="text-xs font-bold text-foreground">SEBI_Registration_Certificate_Document.pdf</p>
                    <p className="text-[11px] text-muted-foreground">Verified SEBI credentials document copy for {applicantName}</p>
                  </div>
                </div>
              )}

              {activeDoc === "aadhaar" && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between border-b pb-2">
                    <div>
                      <h4 className="text-sm font-bold text-foreground">Aadhaar Identity Proof</h4>
                      <p className="text-xs font-mono text-muted-foreground">UIDAI Government Issued Identity Card</p>
                    </div>
                    <Badge variant="default" className="bg-blue-600 text-white text-[10px]">
                      Aadhaar Verified
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs bg-background p-3 rounded-lg border">
                    <div>
                      <span className="text-muted-foreground text-[10px] uppercase font-mono">Aadhaar Number</span>
                      <p className="font-mono font-bold text-foreground">XXXX-XXXX-8921</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground text-[10px] uppercase font-mono">Full Name on Aadhaar</span>
                      <p className="font-medium text-foreground">{applicantName}</p>
                    </div>
                  </div>

                  {/* Visual Document Placeholder */}
                  <div className="border-2 border-dashed border-blue-500/30 rounded-lg p-6 text-center bg-blue-500/5 space-y-2">
                    <UserCheckIcon className="size-10 mx-auto text-blue-600 dark:text-blue-400" />
                    <p className="text-xs font-bold text-foreground">Aadhaar_Card_Front_Back_Copy.pdf</p>
                    <p className="text-[11px] text-muted-foreground">Identity & address verification document for {applicantName}</p>
                  </div>
                </div>
              )}

              {activeDoc === "pan" && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between border-b pb-2">
                    <div>
                      <h4 className="text-sm font-bold text-foreground">PAN Card Verification Document</h4>
                      <p className="text-xs font-mono text-muted-foreground">Income Tax Department Permanent Account Number</p>
                    </div>
                    <Badge variant="default" className="bg-purple-600 text-white text-[10px]">
                      PAN Verified
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs bg-background p-3 rounded-lg border">
                    <div>
                      <span className="text-muted-foreground text-[10px] uppercase font-mono">PAN Number</span>
                      <p className="font-mono font-bold text-foreground">ABCDE1234F</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground text-[10px] uppercase font-mono">Name on PAN</span>
                      <p className="font-medium text-foreground">{applicantName}</p>
                    </div>
                  </div>

                  {/* Visual Document Placeholder */}
                  <div className="border-2 border-dashed border-purple-500/30 rounded-lg p-6 text-center bg-purple-500/5 space-y-2">
                    <CreditCardIcon className="size-10 mx-auto text-purple-600 dark:text-purple-400" />
                    <p className="text-xs font-bold text-foreground">PAN_Card_Verification_Copy.jpg</p>
                    <p className="text-[11px] text-muted-foreground">Tax identification document copy for {applicantName}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Mandatory Reviewer Notes & Action Buttons */}
            <div className="space-y-3 pt-3 border-t">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Mandatory Reviewer Notes & Reason <span className="text-destructive">*</span>
              </label>
              <Input
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Enter mandatory reason for approval or rejection..."
                className="text-xs"
              />

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handleAction("reject")}
                  className="gap-1.5"
                >
                  <XIcon className="size-3.5" /> Reject Application
                </Button>
                <Button
                  size="sm"
                  variant="default"
                  onClick={() => handleAction("approve")}
                  className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  <CheckIcon className="size-3.5" /> Approve Verification
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
