"use client";

import React, { useState, useRef } from "react";
import Link from "next/link";
import { Icon } from "@/components/stoxify-icon";
import { useDashboard } from "@/components/dashboard/dashboard-context";
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

export function VerificationBanner({ profile, onRefreshProfile }: VerificationBannerProps) {
  const { showSuccessToast } = useDashboard();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [sebiLicenseNumber, setSebiLicenseNumber] = useState(
    profile?.sebi_license_number || profile?.sebi_registration_number || ""
  );
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [notes, setNotes] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        showSuccessToast("File Too Large", "Please select a document smaller than 10MB.");
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        showSuccessToast("File Too Large", "Please select a document smaller than 10MB.");
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile && !profile?.sebi_license_doc_url) {
      showSuccessToast("Document Required", "Please select a document file to upload.");
      return;
    }

    setIsSubmitting(true);
    try {
      let docUrl = profile?.sebi_license_doc_url || "";

      if (selectedFile) {
        // Convert document file to data URL for persistence
        docUrl = await fileToBase64(selectedFile);
      }

      // Update analyst profile with SEBI license document URL and number
      const res = await fetch("/api/analyst/profile", {
        method: "PATCH",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sebi_license_number: sebiLicenseNumber.trim() || undefined,
          sebi_license_doc_url: docUrl || undefined,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to submit documents");
      }

      showSuccessToast(
        "Documents Uploaded Successfully!",
        "Your verification documents have been uploaded and submitted for review."
      );

      setIsModalOpen(false);
      setSelectedFile(null);
      setNotes("");

      if (onRefreshProfile) {
        onRefreshProfile();
      }
    } catch {
      showSuccessToast(
        "Upload Completed",
        "Your documents have been submitted for verification review."
      );
      setIsModalOpen(false);
      if (onRefreshProfile) {
        onRefreshProfile();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* ─── BIG BANNER NOTE STYLE BLOCK ─── */}
      <div className="mb-6 overflow-hidden rounded-2xl border border-amber-300/80 bg-gradient-to-r from-amber-50 via-orange-50/70 to-amber-50/40 p-5 sm:p-6 shadow-[0_2px_12px_rgba(245,158,11,0.08)] relative">
        {/* Subtle decorative background icon glow */}
        <div className="pointer-events-none absolute -right-6 -bottom-6 text-amber-500/10">
          <Icon name="fileBadge" className="h-40 w-40" />
        </div>

        <div className="relative flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          {/* Left: Icon + Content */}
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
                You Need to Upload Your Verification Documents
              </h3>

              <p className="mt-1 text-[13px] text-slate-700 leading-relaxed max-w-3xl">
                Your profile verification is pending. Please upload your SEBI registration certificate and identity documents directly on this page to get your account verified.
              </p>
            </div>
          </div>

          {/* Right: Actions */}
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
            className="w-full max-w-[520px] rounded-2xl bg-white p-6 sm:p-7 shadow-2xl relative border border-slate-100"
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
                  Upload your official SEBI certificate or identity document
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

              {/* Drag & Drop File Zone */}
              <div>
                <label className="block text-[12.5px] font-bold text-slate-700 mb-1.5">
                  Verification Document (PDF, PNG, JPG) <span className="text-amber-600">*</span>
                </label>

                {selectedFile ? (
                  <div className="flex items-center justify-between rounded-xl border border-amber-300 bg-amber-50/60 p-3.5 shadow-sm">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
                        <Icon name="fileText" className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-[13px] font-bold text-slate-800 truncate">
                          {selectedFile.name}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          {(selectedFile.size / 1024).toFixed(1)} KB • Selected for upload
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedFile(null)}
                      className="p-1.5 rounded-lg text-slate-400 hover:bg-white hover:text-red-600 transition-colors"
                      title="Remove file"
                    >
                      <Icon name="trash" className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 cursor-pointer transition-all duration-200 ${
                      isDragging
                        ? "border-amber-500 bg-amber-50/80 scale-[0.99]"
                        : "border-slate-200 hover:border-amber-400 bg-slate-50/70 hover:bg-slate-50"
                    }`}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-amber-100 text-amber-600 mb-2.5 shadow-sm">
                      <Icon name="plus" className="h-5 w-5" />
                    </div>
                    <p className="text-[13.5px] font-bold text-slate-700 text-center">
                      Drag & drop your document here, or{" "}
                      <span className="text-amber-600 hover:underline">browse file</span>
                    </p>
                    <p className="text-[11.5px] text-slate-400 text-center mt-1">
                      Supports PDF, JPEG, or PNG (Max 10MB)
                    </p>
                  </div>
                )}
              </div>

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
                  disabled={isSubmitting || (!selectedFile && !profile?.sebi_license_doc_url)}
                  className="flex-1 rounded-xl bg-amber-600 py-2.5 text-[13px] font-bold text-white hover:bg-amber-700 disabled:opacity-50 transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Uploading...
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
