"use client";

import { useState, useEffect } from "react";
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
  Loader2Icon,
  RefreshCwIcon,
  ZoomInIcon,
  ZoomOutIcon,
  RotateCwIcon,
  RotateCcwIcon,
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

/** Convert a base64 data URI (data:image/... or data:application/pdf...) into a Blob */
function dataUriToBlob(dataURI: string): Blob {
  const parts = dataURI.split(",");
  const mimeMatch = parts[0].match(/:(.*?);/);
  const mime = mimeMatch ? mimeMatch[1] : "application/octet-stream";
  const rawBase64 = parts[1] || parts[0];
  const bstr = atob(rawBase64.trim());
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new Blob([u8arr], { type: mime });
}

export function ViewAnalystDocumentsDialog({
  analyst,
  trigger,
  isOpen: externalOpen,
  onOpenChange: externalOnOpenChange,
}: Props) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [activeDocId, setActiveDocId] = useState<string | null>(null);

  // Document loading & processing state
  const [displayUrl, setDisplayUrl] = useState<string | null>(null);
  const [isPdfDoc, setIsPdfDoc] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [hasError, setHasError] = useState<boolean>(false);
  const [usingProxy, setUsingProxy] = useState<boolean>(false);

  // Image manipulation controls (Zoom & Rotation)
  const [zoom, setZoom] = useState<number>(1);
  const [rotation, setRotation] = useState<number>(0);

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

  // Reset zoom & rotation when active document changes
  useEffect(() => {
    setZoom(1);
    setRotation(0);
    setUsingProxy(false);
  }, [activeDocId, currentDoc?.url]);

  // Prepare and resolve display URL (handles base64 blob conversion and type detection)
  useEffect(() => {
    let active = true;
    let createdBlobUrl: string | null = null;

    async function prepare() {
      if (!currentDoc?.url) {
        setDisplayUrl(null);
        setIsLoading(false);
        setHasError(false);
        return;
      }

      setIsLoading(true);
      setHasError(false);

      const raw = currentDoc.url.trim();

      // Check if URL is base64 string (data URI or raw base64)
      const isDataUri = raw.startsWith("data:");
      const isRawBase64 = !isDataUri && !raw.startsWith("http://") && !raw.startsWith("https://") && !raw.startsWith("blob:");

      if (isDataUri || isRawBase64) {
        try {
          let formattedUri = raw;
          if (isRawBase64) {
            if (raw.startsWith("JVBERi")) {
              formattedUri = `data:application/pdf;base64,${raw}`;
            } else if (raw.startsWith("/9j/")) {
              formattedUri = `data:image/jpeg;base64,${raw}`;
            } else if (raw.startsWith("iVBORw")) {
              formattedUri = `data:image/png;base64,${raw}`;
            } else {
              formattedUri = `data:image/png;base64,${raw}`;
            }
          }

          const blob = dataUriToBlob(formattedUri);
          const blobUrl = URL.createObjectURL(blob);
          createdBlobUrl = blobUrl;

          const isPdf = blob.type.includes("pdf") || formattedUri.startsWith("data:application/pdf");

          if (active) {
            setIsPdfDoc(isPdf);
            setDisplayUrl(blobUrl);
            setIsLoading(false);
          }
          return;
        } catch (err) {
          console.warn("[ViewAnalystDocuments] Base64 conversion failed:", err);
        }
      }

      // Check if standard URL is PDF
      const lower = raw.toLowerCase();
      const isPdfUrl = lower.includes("application/pdf") || lower.endsWith(".pdf") || lower.includes(".pdf?");

      if (active) {
        setIsPdfDoc(isPdfUrl);
        setDisplayUrl(raw);
        setIsLoading(false);
      }
    }

    prepare();

    return () => {
      active = false;
      if (createdBlobUrl) {
        URL.revokeObjectURL(createdBlobUrl);
      }
    };
  }, [currentDoc?.url, activeDocId]);

  // Handle image load error: fall back to Next.js server-side proxy
  const handleMediaError = () => {
    if (!currentDoc?.url) {
      setHasError(true);
      setIsLoading(false);
      return;
    }

    const raw = currentDoc.url.trim();

    // If direct HTTP load failed and we haven't tried proxying yet, try proxy URL
    if ((raw.startsWith("http://") || raw.startsWith("https://")) && !usingProxy) {
      setUsingProxy(true);
      const proxiedUrl = `/api/admin/document-proxy?url=${encodeURIComponent(raw)}`;
      setDisplayUrl(proxiedUrl);
      setIsLoading(true);
      return;
    }

    // Proxy also failed or base64 failed
    setHasError(true);
    setIsLoading(false);
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
              <div className="rounded-xl border border-slate-200 bg-slate-900/5 overflow-hidden flex flex-col shadow-xs">
                {/* Preview Toolbar */}
                <div className="bg-slate-100 px-4 py-2.5 border-b border-slate-200 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <currentDoc.icon className="h-4 w-4 text-slate-600" />
                    <span className="text-xs font-bold text-slate-800">
                      Preview: {currentDoc.label}
                    </span>
                    {usingProxy && (
                      <span className="text-[10px] font-medium bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded border border-amber-200">
                        Proxied View
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Image Controls (Zoom / Rotate) */}
                    {!isPdfDoc && !hasError && displayUrl && (
                      <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-md p-0.5 mr-2">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          className="h-6 w-6 text-slate-600"
                          title="Zoom In"
                          onClick={() => setZoom((z) => Math.min(z + 0.25, 3))}
                        >
                          <ZoomInIcon className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          className="h-6 w-6 text-slate-600"
                          title="Zoom Out"
                          onClick={() => setZoom((z) => Math.max(z - 0.25, 0.5))}
                        >
                          <ZoomOutIcon className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          className="h-6 w-6 text-slate-600"
                          title="Rotate Right"
                          onClick={() => setRotation((r) => (r + 90) % 360)}
                        >
                          <RotateCwIcon className="h-3.5 w-3.5" />
                        </Button>
                        {(zoom !== 1 || rotation !== 0) && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            className="h-6 w-6 text-slate-600 text-[10px] font-bold"
                            title="Reset View"
                            onClick={() => {
                              setZoom(1);
                              setRotation(0);
                            }}
                          >
                            <RotateCcwIcon className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    )}

                    <a
                      href={currentDoc.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-700 hover:text-amber-800 bg-white px-2.5 py-1 rounded-md border border-slate-200 shadow-2xs transition-colors"
                    >
                      <ExternalLinkIcon className="h-3.5 w-3.5" /> Open Full Screen
                    </a>
                  </div>
                </div>

                {/* Preview Canvas Area */}
                <div className="min-h-[420px] max-h-[550px] flex items-center justify-center p-4 bg-slate-950/5 relative overflow-auto">
                  {isLoading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-slate-50/70 backdrop-blur-[1px] rounded-lg z-20">
                      <div className="flex flex-col items-center gap-2">
                        <Loader2Icon className="h-7 w-7 animate-spin text-amber-600" />
                        <span className="text-xs font-semibold text-slate-600">Loading document preview...</span>
                      </div>
                    </div>
                  )}

                  {hasError ? (
                    <div className="text-center p-8 bg-white rounded-xl border border-slate-200 max-w-md shadow-sm">
                      <FileTextIcon className="h-12 w-12 text-amber-500 mx-auto mb-3" />
                      <h4 className="text-sm font-bold text-slate-800 mb-1">
                        Inline Preview Blocked by Provider
                      </h4>
                      <p className="text-xs text-slate-500 mb-4">
                        This document cannot be rendered inside the embedded frame (due to domain CORS security rules or mock file format), but can be opened directly in full resolution.
                      </p>
                      <div className="flex items-center justify-center gap-2">
                        <a
                          href={currentDoc.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-lg transition-colors shadow-sm"
                        >
                          <ExternalLinkIcon className="h-4 w-4" /> Open Full Screen Document
                        </a>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="text-xs"
                          onClick={() => {
                            setHasError(false);
                            setIsLoading(true);
                            setUsingProxy(true);
                            if (currentDoc.url) {
                              setDisplayUrl(`/api/admin/document-proxy?url=${encodeURIComponent(currentDoc.url)}`);
                            }
                          }}
                        >
                          <RefreshCwIcon className="h-3.5 w-3.5 mr-1" /> Retry Proxy
                        </Button>
                      </div>
                    </div>
                  ) : isPdfDoc && displayUrl ? (
                    <iframe
                      src={displayUrl}
                      className="w-full h-[480px] rounded-lg border border-slate-200 shadow-sm bg-white"
                      title={currentDoc.label}
                      onLoad={() => setIsLoading(false)}
                      onError={handleMediaError}
                    />
                  ) : displayUrl ? (
                    <div className="relative flex items-center justify-center w-full h-full min-h-[400px] overflow-auto">
                      <img
                        src={displayUrl}
                        alt={currentDoc.label}
                        referrerPolicy="no-referrer"
                        onLoad={() => setIsLoading(false)}
                        onError={handleMediaError}
                        style={{
                          transform: `scale(${zoom}) rotate(${rotation}deg)`,
                          transition: "transform 0.2s ease-in-out",
                        }}
                        className="max-h-[480px] max-w-full object-contain rounded-lg shadow-md bg-white p-2.5 border border-slate-200"
                      />
                    </div>
                  ) : (
                    <div className="text-center p-8 bg-white rounded-xl border border-slate-200 max-w-md shadow-sm">
                      <FileTextIcon className="h-12 w-12 text-amber-500 mx-auto mb-3" />
                      <h4 className="text-sm font-bold text-slate-800 mb-1">
                        Document Available via Link
                      </h4>
                      <p className="text-xs text-slate-500 mb-4">
                        This document file can be viewed in full high resolution by opening it in a new window.
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
