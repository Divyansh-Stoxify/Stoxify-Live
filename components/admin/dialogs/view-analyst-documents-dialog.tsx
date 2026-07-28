"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import {
  FileTextIcon,
  EyeIcon,
  ExternalLinkIcon,
  CheckCircle2Icon,
  AlertCircleIcon,
  DownloadIcon,
  ShieldCheckIcon,
  CreditCardIcon,
  UserCheckIcon,
  XIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { ApiRecord } from "@/components/admin/api-admin-page";

type Props = {
  analyst: ApiRecord;
  trigger?: ReactNode;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
};

interface DocumentItem {
  id: string;
  type: string;
  label: string;
  icon: typeof FileTextIcon;
  url?: string;
  uploadedAt?: string;
  description: string;
}

export function ViewAnalystDocumentsDialog({
  analyst,
  trigger,
  isOpen: externalOpen,
  onOpenChange: externalOnOpenChange,
}: Props) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [activeDocId, setActiveDocId] = useState<string | null>(null);

  const open = externalOpen !== undefined ? externalOpen : internalOpen;
  const setOpen = (val: boolean) => {
    if (externalOnOpenChange) {
      externalOnOpenChange(val);
    } else {
      setInternalOpen(val);
    }
  };

  const name = String(analyst.name || analyst.user_id || "Analyst");
  const sebiLicense = String(analyst.sebi_license_number || analyst.sebi_registration_number || "Not provided");
  const email = String(analyst.email || "");
  const state = String(analyst.state || "VERIFICATION_PENDING");

  // Extract uploaded documents from analyst record
  const documents: DocumentItem[] = [
    {
      id: "aadhaar",
      type: "Aadhaar Card",
      label: "Aadhaar Card Document",
      icon: UserCheckIcon,
      url: (analyst.aadhar_doc_url as string) || undefined,
      description: "Government Issued Aadhaar Identity Proof",
    },
    {
      id: "pan",
      type: "PAN Card",
      label: "PAN Card Document",
      icon: CreditCardIcon,
      url: (analyst.pan_doc_url as string) || undefined,
      description: "Permanent Account Number Tax Verification Card",
    },
    {
      id: "sebi",
      type: "SEBI Certificate",
      label: "SEBI Registration Certificate",
      icon: ShieldCheckIcon,
      url: (analyst.sebi_license_doc_url as string) || undefined,
      description: "Official SEBI Research Analyst License Certificate",
    },
  ];

  // Include any extra documents from verification.documents array if present
  const verDocs = (analyst.verification as Record<string, unknown> | undefined)?.documents;
  if (Array.isArray(verDocs)) {
    verDocs.forEach((doc, idx) => {
      const docType = String(doc.type || `doc_${idx}`);
      if (!documents.some((d) => d.id === docType || d.type.toLowerCase() === docType.toLowerCase())) {
        documents.push({
          id: `extra_${idx}`,
          type: docType.toUpperCase(),
          label: `${docType.toUpperCase()} Document`,
          icon: FileTextIcon,
          url: doc.url as string,
          uploadedAt: doc.uploaded_at as string,
          description: "Additional Uploaded Verification Document",
        });
      }
    });
  }

  const uploadedCount = documents.filter((d) => Boolean(d.url)).length;
  const currentDoc = documents.find((d) => d.id === activeDocId) || documents.find((d) => Boolean(d.url));

  const isPdf = (url?: string) => {
    if (!url) return false;
    return url.includes("application/pdf") || url.toLowerCase().endsWith(".pdf");
  };

  const isImage = (url?: string) => {
    if (!url) return false;
    return (
      url.startsWith("data:image/") ||
      /\.(jpg|jpeg|png|webp|gif|svg)($|\?)/i.test(url)
    );
  };

  return (
    <>
      {trigger && (
        <span
          style={{ display: "contents" }}
          onClick={(e) => {
            e.stopPropagation();
            setOpen(true);
          }}
        >
          {trigger}
        </span>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-4xl max-h-[92vh] overflow-hidden flex flex-col p-0 gap-0 border-slate-200 shadow-2xl">
          {/* Dialog Header */}
          <DialogHeader className="p-5 pb-4 border-b bg-slate-50/80">
            <div className="flex items-start justify-between gap-4 pr-6">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="outline" className="font-mono text-[11px] bg-white">
                    SEBI: {sebiLicense}
                  </Badge>
                  <Badge variant={state === "ACTIVE" ? "default" : "outline"} className="text-[11px]">
                    {state}
                  </Badge>
                </div>
                <DialogTitle className="text-lg font-bold text-slate-900">
                  Verification Documents — {name}
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-500 mt-0.5">
                  {email ? `${email} • ` : ""}Review uploaded Aadhaar, PAN Card, and SEBI Certificate ({uploadedCount} of 3 uploaded).
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {/* Dialog Body */}
          <div className="flex-1 overflow-y-auto p-5 space-y-5">
            {/* Document Selector Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {documents.map((doc) => {
                const IconComp = doc.icon;
                const isUploaded = Boolean(doc.url);
                const isSelected = currentDoc?.id === doc.id;

                return (
                  <div
                    key={doc.id}
                    onClick={() => isUploaded && setActiveDocId(doc.id)}
                    className={`rounded-xl border p-3.5 transition-all flex flex-col justify-between ${
                      isSelected
                        ? "border-amber-500 bg-amber-50/40 ring-2 ring-amber-500/20"
                        : isUploaded
                        ? "border-slate-200 bg-white hover:border-slate-300 cursor-pointer shadow-sm"
                        : "border-dashed border-slate-200 bg-slate-50/60 opacity-75"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div
                          className={`h-8 w-8 rounded-lg flex items-center justify-center ${
                            isUploaded
                              ? "bg-amber-100 text-amber-700"
                              : "bg-slate-100 text-slate-400"
                          }`}
                        >
                          <IconComp className="h-4 w-4" />
                        </div>
                        {isUploaded ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                            <CheckCircle2Icon className="h-3 w-3" /> Uploaded
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                            <AlertCircleIcon className="h-3 w-3" /> Missing
                          </span>
                        )}
                      </div>
                      <h4 className="text-[13px] font-bold text-slate-800">{doc.type}</h4>
                      <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">
                        {doc.description}
                      </p>
                    </div>

                    {isUploaded && (
                      <div className="flex items-center gap-2 mt-3 pt-2 border-t border-slate-100">
                        <Button
                          type="button"
                          size="sm"
                          variant={isSelected ? "default" : "outline"}
                          className="h-7 text-xs flex-1 gap-1"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveDocId(doc.id);
                          }}
                        >
                          <EyeIcon className="h-3 w-3" /> Preview
                        </Button>
                        {doc.url && (
                          <a
                            href={doc.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="h-7 px-2 flex items-center justify-center text-xs font-semibold rounded-md border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition-colors"
                            title="Open in new tab"
                          >
                            <ExternalLinkIcon className="h-3 w-3" />
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Document Preview Panel */}
            {currentDoc && currentDoc.url ? (
              <div className="rounded-xl border border-slate-200 bg-slate-900/5 overflow-hidden flex flex-col">
                <div className="bg-slate-100 px-4 py-2.5 border-b border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <currentDoc.icon className="h-4 w-4 text-slate-600" />
                    <span className="text-xs font-bold text-slate-800">
                      Preview: {currentDoc.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <a
                      href={currentDoc.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-700 hover:text-amber-800 bg-white px-2.5 py-1 rounded-md border border-slate-200 shadow-2xs"
                    >
                      <ExternalLinkIcon className="h-3.5 w-3.5" /> Open Full Screen
                    </a>
                  </div>
                </div>

                <div className="min-h-[380px] max-h-[500px] flex items-center justify-center p-4 bg-slate-950/5">
                  {isImage(currentDoc.url) ? (
                    <img
                      src={currentDoc.url}
                      alt={currentDoc.label}
                      className="max-h-[460px] max-w-full object-contain rounded-lg shadow-md bg-white p-2"
                    />
                  ) : isPdf(currentDoc.url) ? (
                    <iframe
                      src={currentDoc.url}
                      className="w-full h-[460px] rounded-lg border border-slate-200 shadow-sm bg-white"
                      title={currentDoc.label}
                    />
                  ) : (
                    <div className="text-center p-8 bg-white rounded-xl border border-slate-200 max-w-md shadow-sm">
                      <FileTextIcon className="h-12 w-12 text-amber-500 mx-auto mb-3" />
                      <h4 className="text-sm font-bold text-slate-800 mb-1">
                        Inline Preview Available via Link
                      </h4>
                      <p className="text-xs text-slate-500 mb-4">
                        This document file can be viewed in full high resolution by opening it in a new window or downloading it.
                      </p>
                      <a
                        href={currentDoc.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-lg transition-colors shadow-sm"
                      >
                        <DownloadIcon className="h-4 w-4" /> Open / Download Document
                      </a>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-amber-300 bg-amber-50/30 p-8 text-center">
                <AlertCircleIcon className="h-10 w-10 text-amber-500 mx-auto mb-2" />
                <h4 className="text-sm font-bold text-slate-800">No Documents Uploaded</h4>
                <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                  The analyst has not yet uploaded their Aadhaar Card, PAN Card, or SEBI Certificate to the platform.
                </p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
