"use client";

import React, { useState, useRef } from "react";
import Link from "next/link";
import { Icon } from "@/components/stoxify-icon";
import { useDashboard } from "@/components/dashboard/dashboard-context";
import { realDocUrl } from "@/lib/utils";
import type { AnalystProfile } from "@/lib/types/analyst";

interface VerificationBannerProps {
  profile: AnalystProfile | null;
  onRefreshProfile?: () => void;
}

/** Converts a file to base64 string */
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result);
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

/** Helper to upload a single document file to Azure via /api/analyst/document */
async function uploadDocumentFile(file: File, docType: string): Promise<string> {
  const base64Data = await fileToBase64(file);
  const res = await fetch("/api/analyst/document", {
    method: "POST",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      document_base64: base64Data,
      content_type: file.type || "application/pdf",
      doc_type: docType,
    }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.document_url) {
    throw new Error(data.error ?? data.message ?? `Unable to upload ${file.name}.`);
  }
  return data.document_url as string;
}

export function VerificationBanner({ profile, onRefreshProfile }: VerificationBannerProps) {
  const { showSuccessToast } = useDashboard();
  const [isModalOpen, setIsModalOpen] = useState(false);

  // SEBI Reg Number
  const [sebiLicenseNumber, setSebiLicenseNumber] = useState(
    profile?.sebi_license_number || profile?.sebi_registration_number || ""
  );

  // 3 Document Files State
  const [aadharFile, setAadharFile] = useState<File | null>(null);
  const [panFile, setPanFile] = useState<File | null>(null);
  const [sebiDocFile, setSebiDocFile] = useState<File | null>(null);

  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Input Refs
  const aadharInputRef = useRef<HTMLInputElement>(null);
  const panInputRef = useRef<HTMLInputElement>(null);
  const sebiDocInputRef = useRef<HTMLInputElement>(null);

  // Derive status label & colors based on profile state
  const state = profile?.state || "VERIFICATION_PENDING";
  const statusLabel =
    state === "VERIFICATION_PENDING"
      ? "Verification Pending"
      : state === "VERIFICATION_ONGOING"
      ? "Verification In Review"
      : state === "VERIFICATION_REJECTED"
      ? "Verification Rejected"
      : state === "UNVERIFIED"
      ? "Unverified Account"
      : "Verification Required";

  const handleFileSelect = (
    file: File | undefined,
    setFile: React.Dispatch<React.SetStateAction<File | null>>,
    docName: string
  ) => {
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        showSuccessToast("File Too Large", `${docName} must be smaller than 10MB.`);
        return;
      }
      setFile(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const hasAadhar = aadharFile || realDocUrl(profile?.aadhar_doc_url);
    const hasPan = panFile || realDocUrl(profile?.pan_doc_url);
    const hasSebi = sebiDocFile || realDocUrl(profile?.sebi_license_doc_url);

    if (!hasAadhar && !hasPan && !hasSebi) {
      showSuccessToast("Documents Required", "Please select at least one verification document to upload.");
      return;
    }

    setIsSubmitting(true);
    try {
      let aadharUrl = profile?.aadhar_doc_url || "";
      let panUrl = profile?.pan_doc_url || "";
      let sebiUrl = profile?.sebi_license_doc_url || "";

      if (aadharFile) {
        aadharUrl = await uploadDocumentFile(aadharFile, "aadhar");
      }
      if (panFile) {
        panUrl = await uploadDocumentFile(panFile, "pan");
      }
      if (sebiDocFile) {
        sebiUrl = await uploadDocumentFile(sebiDocFile, "sebi");
      }

      // Update analyst profile with all document URLs and SEBI number
      const res = await fetch("/api/analyst/profile", {
        method: "PATCH",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sebi_license_number: sebiLicenseNumber.trim() || undefined,
          sebi_license_doc_url: sebiUrl || undefined,
          aadhar_doc_url: aadharUrl || undefined,
          pan_doc_url: panUrl || undefined,
        }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.message || "Failed to submit documents");
      }

      showSuccessToast(
        "Documents Uploaded Successfully!",
        "Your Aadhaar, PAN, and SEBI verification documents have been uploaded and submitted for review."
      );

      setIsModalOpen(false);
      setAadharFile(null);
      setPanFile(null);
      setSebiDocFile(null);
      setNotes("");

      if (onRefreshProfile) {
        onRefreshProfile();
      }
    } catch (err) {
      // Keep the modal open with the picked files intact so the analyst can retry
      // — reporting a success we didn't get is how uploads silently went missing.
      console.error("Submission error:", err);
      showSuccessToast(
        "Upload Failed",
        err instanceof Error ? err.message : "Unable to submit your documents. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderSingleFilePicker = (
    label: string,
    file: File | null,
    setFile: React.Dispatch<React.SetStateAction<File | null>>,
    existingUrl: string | undefined,
    inputRef: React.RefObject<HTMLInputElement | null>,
    docType: string
  ) => {
    return (
      <div>
        <label className="block text-[12.5px] font-bold text-slate-700 mb-1.5 flex items-center justify-between">
          <span>{label}</span>
          {existingUrl && !file && (
            <span className="text-[11px] font-semibold text-emerald-600 flex items-center gap-1">
              <Icon name="circleCheck" className="h-3.5 w-3.5" /> On File
            </span>
          )}
        </label>

        {file ? (
          <div className="flex items-center justify-between rounded-xl border border-amber-300 bg-amber-50/60 p-3 shadow-sm">
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
                <Icon name="fileText" className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <div className="text-[13px] font-bold text-slate-800 truncate">{file.name}</div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  {(file.size / 1024).toFixed(1)} KB • Ready to upload
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setFile(null)}
              className="p-1.5 rounded-lg text-slate-400 hover:bg-white hover:text-red-600 transition-colors"
              title="Remove file"
            >
              <Icon name="trash" className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div
            onClick={() => inputRef.current?.click()}
            className="flex items-center justify-between rounded-xl border border-dashed border-slate-200 bg-slate-50/70 p-3.5 cursor-pointer hover:border-amber-400 hover:bg-amber-50/30 transition-all"
          >
            <input
              ref={inputRef}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={(e) => handleFileSelect(e.target.files?.[0], setFile, label)}
              className="hidden"
            />
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100/80 text-amber-700">
                <Icon name="plus" className="h-4 w-4" />
              </div>
              <div>
                <p className="text-[12.5px] font-bold text-slate-700">
                  {existingUrl ? "Replace Document" : `Upload ${docType}`}
                </p>
                <p className="text-[11px] text-slate-400">PDF, JPEG, or PNG (Max 10MB)</p>
              </div>
            </div>
            <span className="text-[12px] font-bold text-amber-600 hover:underline shrink-0">Browse</span>
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      {/* ─── BIG BANNER NOTE STYLE BLOCK ─── */}
      <div className="mb-6 overflow-hidden rounded-2xl border border-amber-300/80 bg-gradient-to-r from-amber-50 via-orange-50/70 to-amber-50/40 p-5 sm:p-6 shadow-[0_2px_12px_rgba(245,158,11,0.08)] relative">
        <div className="pointer-events-none absolute -right-6 -bottom-6 text-amber-500/10">
          <Icon name="fileBadge" className="h-40 w-40" />
        </div>

        <div className="relative flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-amber-500/15 text-amber-700 border border-amber-300/60 shadow-sm">
              <Icon name="timer" className="h-6 w-6" />
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100/90 px-3 py-0.5 text-[11px] font-extrabold uppercase tracking-wider text-amber-800 border border-amber-300/70">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-600 animate-pulse" />
                  {statusLabel}
                </span>

                {sebiLicenseNumber && (
                  <span className="text-[12px] font-semibold text-amber-900/80">
                    SEBI Reg: <span className="font-mono">{sebiLicenseNumber}</span>
                  </span>
                )}
              </div>

              <h3 className="text-[16.5px] font-extrabold text-slate-900 leading-snug">
                Upload Aadhaar, PAN & SEBI Verification Documents
              </h3>

              <p className="mt-1 text-[13px] text-slate-700 leading-relaxed max-w-3xl">
                Complete your identity and compliance verification by submitting copies of your Aadhaar Card, PAN Card, and official SEBI registration certificate.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0 self-start lg:self-center pt-2 lg:pt-0">
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-amber-600 px-4 py-2.5 text-[13px] font-bold text-white transition-all hover:bg-amber-700 shadow-sm hover:shadow-md active:scale-[0.98] cursor-pointer"
            >
              <Icon name="fileText" className="h-4 w-4" />
              Upload Documents Now
            </button>

            <Link
              href="/dashboard/profile?tab=sebi"
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300/80 bg-white/90 px-3.5 py-2.5 text-[13px] font-bold text-slate-700 transition-all hover:bg-white hover:border-slate-400 shadow-sm cursor-pointer"
            >
              SEBI Settings
              <Icon name="chevronRight" className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* ─── UPLOAD DOCUMENTS MODAL ─── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-fade-in">
          <div
            className="w-full max-w-[560px] max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-6 sm:p-7 shadow-2xl relative border border-slate-100"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="absolute right-5 top-5 rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
            >
              <Icon name="x" className="h-5 w-5" />
            </button>

            {/* Modal Header */}
            <div className="flex items-center gap-3.5 mb-5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700 border border-amber-200">
                <Icon name="fileText" className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-[17px] font-extrabold text-slate-800">
                  Upload Verification Documents
                </h3>
                <p className="text-[12px] text-slate-400">
                  Upload Aadhaar Card, PAN Card, and SEBI Certificate
                </p>
              </div>
            </div>

            {/* Upload Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* SEBI Reg Number */}
              <div>
                <label className="block text-[12.5px] font-bold text-slate-700 mb-1.5">
                  SEBI Registration Number
                </label>
                <input
                  type="text"
                  value={sebiLicenseNumber}
                  onChange={(e) => setSebiLicenseNumber(e.target.value)}
                  placeholder="e.g. INH000012345"
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-[13.5px] font-mono text-slate-800 placeholder-slate-400 focus:border-amber-500 focus:outline-none transition-colors shadow-sm"
                />
              </div>

              {/* 1. Aadhaar Card Upload */}
              {renderSingleFilePicker(
                "Aadhaar Card Document (PDF, PNG, JPG)",
                aadharFile,
                setAadharFile,
                realDocUrl(profile?.aadhar_doc_url),
                aadharInputRef,
                "Aadhaar Card"
              )}

              {/* 2. PAN Card Upload */}
              {renderSingleFilePicker(
                "PAN Card Document (PDF, PNG, JPG)",
                panFile,
                setPanFile,
                realDocUrl(profile?.pan_doc_url),
                panInputRef,
                "PAN Card"
              )}

              {/* 3. SEBI Certificate Upload */}
              {renderSingleFilePicker(
                "SEBI Verification Document (PDF, PNG, JPG)",
                sebiDocFile,
                setSebiDocFile,
                realDocUrl(profile?.sebi_license_doc_url),
                sebiDocInputRef,
                "SEBI Certificate"
              )}

              {/* Notes */}
              <div>
                <label className="block text-[12.5px] font-bold text-slate-700 mb-1.5">
                  Additional Notes (Optional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Include any instructions or details for the reviewer..."
                  className="w-full h-20 rounded-xl border border-slate-200 p-3 text-[13px] text-slate-800 placeholder-slate-400 focus:border-amber-500 focus:outline-none transition-colors resize-none shadow-sm"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 rounded-xl border border-slate-200 py-2.5 text-[13px] font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 rounded-xl bg-amber-600 py-2.5 text-[13px] font-bold text-white hover:bg-amber-700 disabled:opacity-50 transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Uploading Documents...
                    </>
                  ) : (
                    "Submit for Verification"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
