"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { Topbar } from "@/components/dashboard/topbar";
import { useAnalystProfile } from "@/hooks/use-analyst-dashboard";
import { useDashboard } from "@/components/dashboard/dashboard-context";
import { Icon } from "@/components/stoxify-icon";
import { realDocUrl } from "@/lib/utils";
import {
  INPUT_BASE,
  INPUT_LOCKED,
  BTN_GHOST,
  BTN_PRIMARY,
  HINT,
  SectionHead,
  SettingsRow,
  LockedField,
  DetailPair,
  StatusPill,
} from "@/components/dashboard/profile/ui";
import { BankPayoutsTab } from "@/components/dashboard/profile/bank-payouts-tab";

const TABS = [
  { name: "Profile Information", icon: "user" as const },
  { name: "SEBI Verification", icon: "shieldCheck" as const },
  { name: "Bank & Payouts", icon: "bank" as const },
  { name: "Delete Account", icon: "trash" as const },
];

// Accepted upload formats + client-side size cap (backend enforces 3 MB too).
const ACCEPTED_AVATAR_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_AVATAR_BYTES = 3 * 1024 * 1024;

// Verification documents (Aadhaar / PAN / SEBI certificate). The backend sniffs
// the byte header and rejects anything that isn't one of these, and caps at 10 MB.
const ACCEPTED_DOC_TYPES = ["application/pdf", "image/jpeg", "image/png"];
const MAX_DOC_BYTES = 10 * 1024 * 1024;

/** Formats a raw phone string as "+91 98765 08888"; falls back to the raw value. */
function formatPhone(phone?: string): string {
  if (!phone) return "";
  const digits = phone.replace(/\D/g, "");
  const ten = digits.length >= 10 ? digits.slice(-10) : digits;
  if (ten.length === 10) {
    return `+91 ${ten.slice(0, 5)} ${ten.slice(5)}`;
  }
  return phone;
}

/** Read a File as a base64 string (without the data: URL prefix). */
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

/**
 * Upload one verification document and return its hosted URL.
 * Mirrors the avatar flow: the bytes go to Azure Blob via the user-service, and
 * only the returned URL is persisted on the analyst profile.
 */
async function uploadVerificationDoc(
  file: File,
  docType: "aadhar" | "pan" | "sebi"
): Promise<string> {
  const document_base64 = await fileToBase64(file);
  const res = await fetch("/api/analyst/document", {
    method: "POST",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ document_base64, content_type: file.type, doc_type: docType }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.document_url) {
    throw new Error(data.error ?? data.message ?? `Unable to upload ${file.name}.`);
  }
  return data.document_url as string;
}

/** Distinguishes a document that is live on the server from one merely staged. */
function DocStatusBadge({ staged, saved }: { staged: boolean; saved: boolean }) {
  if (staged) {
    return (
      <span className="text-[11px] font-extrabold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
        Not saved yet
      </span>
    );
  }
  if (saved) {
    return (
      <span className="text-[11px] font-extrabold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
        Uploaded
      </span>
    );
  }
  return null;
}

// ── Delete Account Tab ────────────────────────────────────────────────────────

function DeleteAccountTab() {
  const { showSuccessToast } = useDashboard();
  const [showModal, setShowModal] = useState(false);
  const [reason, setReason] = useState("");
  const [confirmText, setConfirmText] = useState("");
  // "confirm" → reason + type DELETE; "otp" → enter the code sent to the phone
  const [step, setStep] = useState<"confirm" | "otp">("confirm");
  const [otp, setOtp] = useState("");
  const [phoneMasked, setPhoneMasked] = useState("");
  const [sendingOtp, setSendingOtp] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const closeModal = () => {
    setShowModal(false);
    setStep("confirm");
    setConfirmText("");
    setReason("");
    setOtp("");
  };

  const handleRequestOtp = async () => {
    if (confirmText !== "DELETE") return;

    setSendingOtp(true);
    try {
      const res = await fetch("/api/user/delete/request-otp", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || "Failed to send verification code.");
      }
      setPhoneMasked(data.phone_masked || "");
      setOtp("");
      setStep("otp");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong.";
      showSuccessToast("Error", msg);
    } finally {
      setSendingOtp(false);
    }
  };

  const handleDelete = async () => {
    if (otp.length !== 6) return;

    setDeleting(true);
    try {
      const res = await fetch("/api/user/deactivate", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ otp, reason: reason.trim() || undefined }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || "Failed to delete account.");
      }
      showSuccessToast("Account Deleted", "Your account has been permanently deleted.");
      setTimeout(() => {
        window.location.href = "/";
      }, 1500);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong.";
      showSuccessToast("Error", msg);
      setDeleting(false);
    }
  };

  return (
    <div
      role="tabpanel"
      id="panel-delete-account"
      aria-labelledby="tab-delete-account"
      className="flex flex-col gap-6 outline-none"
    >
      <SectionHead
        title="Delete Account"
        tone="danger"
        subtitle="Permanently remove your Stoxify analyst account and all associated data."
        badge={
          <StatusPill tone="danger" icon="ban">
            Irreversible
          </StatusPill>
        }
      />

      {/* Warning card */}
      <div className="overflow-hidden rounded-2xl border border-red-100">
        <div className="flex items-center gap-3 border-b border-red-100 bg-red-50/70 px-5 py-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-100 text-red-600">
            <Icon name="trash" className="h-4.5 w-4.5" />
          </div>
          <h4 className="text-[13.5px] font-extrabold text-red-800">
            What happens when you delete your account?
          </h4>
        </div>
        <ul className="grid grid-cols-1 gap-x-8 gap-y-2.5 bg-white p-5 text-[12.5px] leading-relaxed text-slate-600 sm:grid-cols-2">
          {[
            "All your subscription plans will be deactivated",
            "Active subscriber access to your trades will be revoked",
            "Your published trade history will be archived",
            "All sessions will be terminated across every device",
            "Your SEBI verification status and profile will be removed",
            "Pending payouts may still be processed per compliance requirements",
          ].map((line) => (
            <li key={line} className="flex items-start gap-2.5">
              <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-red-400" />
              {line}
            </li>
          ))}
        </ul>
      </div>

      <div className="flex justify-end border-t border-slate-100 pt-6">
        <button
          type="button"
          onClick={() => setShowModal(true)}
          className="inline-flex h-10 cursor-pointer items-center justify-center rounded-xl bg-red-600 px-5 text-[13px] font-bold text-white shadow-sm shadow-red-600/25 transition-all hover:bg-red-700 active:scale-[0.98]"
        >
          Delete My Account
        </button>
      </div>

      {/* Confirmation Modal */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
          onClick={() => !deleting && !sendingOtp && closeModal()}
        >
          <div
            className="w-full max-w-[460px] rounded-2xl bg-white p-7 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center gap-3 mb-5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-100 text-red-600">
                <Icon name="trash" className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-[17px] font-extrabold text-slate-800">
                  {step === "confirm" ? "Confirm Account Deletion" : "Verify It's You"}
                </h3>
                <p className="text-[12px] text-slate-400">
                  {step === "confirm"
                    ? "This action is permanent and cannot be reversed."
                    : `Enter the 6-digit code sent to ${phoneMasked || "your registered phone"}.`}
                </p>
              </div>
            </div>

            {step === "confirm" ? (
              <>
                {/* Reason */}
                <div className="mb-4">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                    Why are you leaving? (optional)
                  </label>
                  <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    disabled={sendingOtp}
                    placeholder="Your feedback helps us improve..."
                    className="w-full h-20 rounded-xl border border-slate-200 bg-white py-3 px-4 text-[13px] text-slate-800 placeholder:text-slate-400 outline-none focus:border-red-400 transition-colors resize-none"
                  />
                </div>

                {/* Type DELETE */}
                <div className="mb-6">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                    Type <span className="text-red-600 font-extrabold">DELETE</span> to confirm
                  </label>
                  <input
                    type="text"
                    value={confirmText}
                    onChange={(e) => setConfirmText(e.target.value.toUpperCase())}
                    disabled={sendingOtp}
                    placeholder="DELETE"
                    className="w-full rounded-xl border border-slate-200 bg-white py-3 px-4 text-[13.5px] font-mono tracking-wider text-slate-800 placeholder:text-slate-300 outline-none focus:border-red-400 transition-colors"
                  />
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  <button
                    type="button"
                    disabled={sendingOtp}
                    onClick={closeModal}
                    className="h-11 flex-1 rounded-xl border border-slate-200 text-[13px] font-bold text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={sendingOtp || confirmText !== "DELETE"}
                    onClick={handleRequestOtp}
                    className="h-11 flex-1 rounded-xl bg-red-600 text-[13px] font-bold text-white shadow-sm shadow-red-600/25 transition-all hover:bg-red-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
                  >
                    {sendingOtp ? "Sending code…" : "Continue"}
                  </button>
                </div>
              </>
            ) : (
              <>
                {/* OTP input */}
                <div className="mb-6">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                    Verification code
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    disabled={deleting}
                    placeholder="••••••"
                    className="w-full rounded-xl border border-slate-200 bg-white py-3 px-4 text-[17px] font-mono tracking-[0.5em] text-center text-slate-800 placeholder:text-slate-300 outline-none focus:border-red-400 transition-colors"
                  />
                  <button
                    type="button"
                    disabled={sendingOtp || deleting}
                    onClick={handleRequestOtp}
                    className="mt-2 text-[12px] font-bold text-red-600 hover:text-red-700 disabled:opacity-40 transition-colors"
                  >
                    {sendingOtp ? "Resending..." : "Resend code"}
                  </button>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  <button
                    type="button"
                    disabled={deleting}
                    onClick={() => {
                      setStep("confirm");
                      setOtp("");
                    }}
                    className="h-11 flex-1 rounded-xl border border-slate-200 text-[13px] font-bold text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-50"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    disabled={deleting || otp.length !== 6}
                    onClick={handleDelete}
                    className="h-11 flex-1 rounded-xl bg-red-600 text-[13px] font-bold text-white shadow-sm shadow-red-600/25 transition-all hover:bg-red-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
                  >
                    {deleting ? "Deleting…" : "Permanently Delete"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function ProfilePage() {
  const { profile, mutate } = useAnalystProfile();
  const { showSuccessToast } = useDashboard();

  // Derive SEBI verification status from the analyst's state
  const isSebiVerified = profile?.state ? /^ACTIVE$/i.test(profile.state) : false;

  // Documents genuinely on file — the onboarding placeholder doesn't count.
  const aadharOnFile = realDocUrl(profile?.aadhar_doc_url);
  const panOnFile = realDocUrl(profile?.pan_doc_url);
  const sebiOnFile = realDocUrl(profile?.sebi_license_doc_url);

  // Human-readable registration type
  const entityTypeLabel = profile?.registration_type
    ? profile.registration_type === "research_analyst"
      ? "Research Analyst"
      : profile.registration_type === "investment_advisors"
        ? "Investment Advisor"
        : profile.registration_type
    : "Individual";

  // Tab State
  const [activeTab, setActiveTab] = useState("Profile Information");

  // Form Fields State
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [bio, setBio] = useState("");
  const [twitterUrl, setTwitterUrl] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [username, setUsername] = useState("");

  // Document Upload States
  const [sebiDocFile, setSebiDocFile] = useState<File | null>(null);
  const [aadharDocFile, setAadharDocFile] = useState<File | null>(null);
  const [panDocFile, setPanDocFile] = useState<File | null>(null);

  const [removedSebiDoc, setRemovedSebiDoc] = useState(false);
  const [removedAadharDoc, setRemovedAadharDoc] = useState(false);
  const [removedPanDoc, setRemovedPanDoc] = useState(false);

  const [savingDocs, setSavingDocs] = useState(false);

  const sebiDocInputRef = useRef<HTMLInputElement>(null);
  const aadharDocInputRef = useRef<HTMLInputElement>(null);
  const panDocInputRef = useRef<HTMLInputElement>(null);
  const [usernameStatus, setUsernameStatus] = useState<"idle" | "checking" | "available" | "taken">(
    "idle"
  );
  const isUsernameSet = Boolean(profile?.username);

  // Debounce username checking
  useEffect(() => {
    if (!username || username === profile?.username) {
      setUsernameStatus("idle");
      return;
    }
    const timer = setTimeout(() => {
      checkUsernameAvailability(username);
    }, 500);
    return () => clearTimeout(timer);
  }, [username, profile?.username]);

  // Sync state from server data — runs once on initial load and again after
  // mutate() resolves following a successful save.
  const hasInitialized = useRef(false);
  useEffect(() => {
    if (profile && !hasInitialized.current) {
      hasInitialized.current = true;
      const parts = profile.name.split(" ");
      /* eslint-disable react-hooks/set-state-in-effect */
      setFirstName(parts[0] || "");
      setLastName(parts.slice(1).join(" ") || "");
      setBio(profile.bio || "");
      setTwitterUrl(profile.twitter_url || "");
      setLinkedinUrl(profile.linkedin_url || "");
      setAvatarUrl(profile.profile_pic_url || "");
      setUsername(profile.username || "");
      setUsernameStatus("idle");
      /* eslint-enable react-hooks/set-state-in-effect */
    }
  }, [profile]);

  // Cancel edit — reset values to cached server-side values
  const handleCancel = () => {
    if (profile) {
      const parts = profile.name.split(" ");
      setFirstName(parts[0] || "");
      setLastName(parts.slice(1).join(" ") || "");
      setBio(profile.bio || "");
      setTwitterUrl(profile.twitter_url || "");
      setLinkedinUrl(profile.linkedin_url || "");
      setAvatarUrl(profile.profile_pic_url || "");
      setUsername(profile.username || "");
      setUsernameStatus("idle");
    }
  };

  const checkUsernameAvailability = async (value: string) => {
    if (!value) {
      setUsernameStatus("idle");
      return;
    }
    if (value === profile?.username) {
      setUsernameStatus("available");
      return;
    }
    setUsernameStatus("checking");
    try {
      const res = await fetch(`/api/public/analysts/check-username?username=${value}`);
      if (res.ok) {
        const data = await res.json();
        setUsernameStatus(data.available ? "available" : "taken");
      } else {
        setUsernameStatus("idle");
      }
    } catch {
      setUsernameStatus("idle");
    }
  };

  // Save changes via real API and trigger refresh
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!firstName.trim()) {
      showSuccessToast("Error", "First name is required.");
      return;
    }

    const updatedName = `${firstName.trim()} ${lastName.trim()}`.trim();

    try {
      const res = await fetch("/api/analyst/profile", {
        method: "PATCH",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: updatedName,
          username: username.trim() || undefined,
          bio: bio.trim(),
          twitter_url: twitterUrl.trim(),
          linkedin_url: linkedinUrl.trim(),
          profile_pic_url: avatarUrl || undefined,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        showSuccessToast(
          "Save Failed",
          err.error ?? err.message ?? "Unable to save profile changes."
        );
        return;
      }

      // Allow the useEffect to re-sync with the freshly-fetched server data
      hasInitialized.current = false;
      // Refresh cached profile so sidebar/topbar update instantly
      await mutate();

      showSuccessToast(
        "Profile Updated",
        "Your professional profile details have been saved successfully."
      );
    } catch (err) {
      console.error("Profile save error:", err);
      showSuccessToast("Network Error", String(err));
    }
  };

  // Upload a chosen image file → host it → set it in the form (Save persists it).
  const handleAvatarFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    // Reset the input so selecting the same file again re-fires onChange.
    e.target.value = "";
    if (!file) return;

    if (!ACCEPTED_AVATAR_TYPES.includes(file.type)) {
      showSuccessToast("Unsupported File", "Please choose a JPEG, PNG, or WebP image.");
      return;
    }
    if (file.size > MAX_AVATAR_BYTES) {
      showSuccessToast("Image Too Large", "Please choose an image under 3 MB.");
      return;
    }

    setUploadingAvatar(true);
    try {
      const image_base64 = await fileToBase64(file);
      const res = await fetch("/api/analyst/avatar", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image_base64, content_type: file.type }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.profile_pic_url) {
        showSuccessToast("Upload Failed", data.error ?? "Unable to upload the image.");
        return;
      }

      setAvatarUrl(data.profile_pic_url);
      showSuccessToast("Photo Uploaded", "Click Save to apply your new profile picture.");
    } catch {
      showSuccessToast("Network Error", "Unable to upload the image. Please try again.");
    } finally {
      setUploadingAvatar(false);
    }
  };

  // Remove avatar
  const handleRemoveAvatar = () => {
    setAvatarUrl("");
    showSuccessToast("Avatar Removed", "Avatar removed. Initials will be displayed.");
  };

  // ─── Verification documents ───────────────────────────────────────────────
  // Validate a picked document before staging it. Save uploads it.
  const handleDocFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    setFile: (file: File | null) => void,
    clearRemoved: () => void
  ) => {
    const file = e.target.files?.[0];
    // Reset the input so re-picking the same file still fires onChange.
    e.target.value = "";
    if (!file) return;

    if (!ACCEPTED_DOC_TYPES.includes(file.type)) {
      showSuccessToast("Unsupported File", "Please choose a PDF, JPEG, or PNG file.");
      return;
    }
    if (file.size > MAX_DOC_BYTES) {
      showSuccessToast("File Too Large", "Please choose a file under 10 MB.");
      return;
    }

    clearRemoved();
    setFile(file);
  };

  // True when there is something to persist — drives the Save button's state.
  const hasDocChanges =
    Boolean(aadharDocFile || panDocFile || sebiDocFile) ||
    (removedAadharDoc && Boolean(aadharOnFile)) ||
    (removedPanDoc && Boolean(panOnFile)) ||
    (removedSebiDoc && Boolean(sebiOnFile));

  // Discard staged document changes and fall back to what's on the server.
  const handleResetDocs = () => {
    setAadharDocFile(null);
    setPanDocFile(null);
    setSebiDocFile(null);
    setRemovedAadharDoc(false);
    setRemovedPanDoc(false);
    setRemovedSebiDoc(false);
  };

  // Upload any newly picked documents, then persist the resulting URLs on the
  // analyst profile. A removed document is cleared by saving an empty URL.
  const handleSaveDocs = async () => {
    if (!hasDocChanges || savingDocs) return;

    setSavingDocs(true);
    try {
      const resolve = async (
        file: File | null,
        removed: boolean,
        existing: string | undefined,
        docType: "aadhar" | "pan" | "sebi"
      ) => {
        if (file) return uploadVerificationDoc(file, docType);
        if (removed) return "";
        return existing ?? "";
      };

      const [aadharUrl, panUrl, sebiUrl] = await Promise.all([
        resolve(aadharDocFile, removedAadharDoc, profile?.aadhar_doc_url, "aadhar"),
        resolve(panDocFile, removedPanDoc, profile?.pan_doc_url, "pan"),
        resolve(sebiDocFile, removedSebiDoc, profile?.sebi_license_doc_url, "sebi"),
      ]);

      const res = await fetch("/api/analyst/profile", {
        method: "PATCH",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          aadhar_doc_url: aadharUrl,
          pan_doc_url: panUrl,
          sebi_license_doc_url: sebiUrl,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        showSuccessToast(
          "Save Failed",
          err.error ?? err.message ?? "Unable to save your verification documents."
        );
        return;
      }

      // Refresh first, then drop the staged files — clearing them before the
      // fresh profile lands would flash an empty slot for a saved document.
      await mutate();
      handleResetDocs();

      showSuccessToast(
        "Documents Saved",
        "Your verification documents have been submitted for review."
      );
    } catch (err) {
      console.error("Document save error:", err);
      showSuccessToast(
        "Upload Failed",
        err instanceof Error ? err.message : "Unable to upload your documents. Please try again."
      );
    } finally {
      setSavingDocs(false);
    }
  };

  // Calculate initials fallback
  const initials = profile?.name
    ? profile.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "?";

  return (
    <>
      <Topbar title="Settings" showUserProfile={true} />

      <div className="flex-1 overflow-y-auto bg-white">
        {/* ─── Settings Navbar ─── */}
        <div className="sticky top-0 z-10 border-b border-slate-100 bg-white/95 px-5 backdrop-blur-sm md:px-10">
          <div
            className="-mb-px flex gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            role="tablist"
            aria-label="Settings Tab list"
          >
            {TABS.map((tab) => {
              const isActive = activeTab === tab.name;
              const isDanger = tab.name === "Delete Account";
              const tabId = `tab-${tab.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
              const panelId = `panel-${tab.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
              return (
                <button
                  key={tab.name}
                  id={tabId}
                  role="tab"
                  aria-selected={isActive}
                  aria-controls={panelId}
                  onClick={() => setActiveTab(tab.name)}
                  className={`flex shrink-0 cursor-pointer items-center gap-2 whitespace-nowrap border-b-2 px-3 py-4 text-[13.5px] font-semibold transition-colors duration-150 ${
                    isActive
                      ? isDanger
                        ? "border-red-500 text-red-600"
                        : "border-[var(--brand)] text-[var(--brand)]"
                      : isDanger
                        ? "border-transparent text-slate-400 hover:text-red-500"
                        : "border-transparent text-slate-400 hover:text-slate-700"
                  }`}
                  type="button"
                >
                  <Icon className="h-4 w-4 shrink-0" name={tab.icon} />
                  {tab.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* ─── Active Panel ─── */}
        <div className="px-5 py-7 md:px-10 md:py-9">
          {activeTab === "Profile Information" && (
            <div
              role="tabpanel"
              id="panel-profile-information"
              aria-labelledby="tab-profile-information"
              className="outline-none"
            >
              <form onSubmit={handleSave} className="flex flex-col">
                <SectionHead
                  title="Profile Details"
                  subtitle="You can change your profile details here seamlessly."
                />

                <div className="mt-6">
                  {/* Profile Picture */}
                  <SettingsRow
                    label="Profile Picture"
                    description="This is what subscribers see beside every trade you publish."
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                      <div className="flex flex-col items-center gap-2">
                        <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full border border-slate-200 bg-[var(--brand)] text-[19px] font-bold text-white shadow-sm">
                          {avatarUrl ? (
                            <Image
                              src={avatarUrl}
                              alt="Avatar"
                              width={64}
                              height={64}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            initials
                          )}
                        </div>
                        {avatarUrl && (
                          <button
                            onClick={handleRemoveAvatar}
                            disabled={uploadingAvatar}
                            className="cursor-pointer text-[11.5px] font-bold text-red-500 transition-colors hover:text-red-600 disabled:opacity-60"
                            type="button"
                          >
                            Remove
                          </button>
                        )}
                      </div>

                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={handleAvatarFileChange}
                        className="hidden"
                      />
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploadingAvatar}
                        className="flex flex-1 cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/60 px-4 py-5 text-center transition-colors hover:border-[var(--brand)] hover:bg-[var(--brand-light)]/50 disabled:cursor-not-allowed disabled:opacity-60"
                        type="button"
                      >
                        <span className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-100 bg-white text-[var(--brand)] shadow-sm">
                          <Icon name="plus" className="h-4 w-4" />
                        </span>
                        <span className="text-[12.5px] font-bold text-slate-600">
                          {uploadingAvatar ? (
                            "Uploading…"
                          ) : (
                            <>
                              <span className="text-[var(--brand)]">Click here</span> to upload your
                              photo
                            </>
                          )}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          Supported formats: JPG, PNG, WebP (3 MB max)
                        </span>
                      </button>
                    </div>
                  </SettingsRow>

                  {/* Full Name */}
                  <SettingsRow
                    label="Full Name"
                    description="The name shown on your public profile and trade alerts."
                  >
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div>
                        <label
                          htmlFor="firstName"
                          className="mb-1.5 block text-[11.5px] font-semibold text-slate-500"
                        >
                          First name
                        </label>
                        <input
                          id="firstName"
                          type="text"
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          className={INPUT_BASE}
                          placeholder="First name"
                        />
                      </div>
                      <div>
                        <label
                          htmlFor="lastName"
                          className="mb-1.5 block text-[11.5px] font-semibold text-slate-500"
                        >
                          Last name
                        </label>
                        <input
                          id="lastName"
                          type="text"
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                          className={INPUT_BASE}
                          placeholder="Last name"
                        />
                      </div>
                    </div>
                  </SettingsRow>

                  {/* Public Profile URL */}
                  <SettingsRow
                    label="Public Profile"
                    description="This is the main profile that will be visible to everyone."
                    htmlFor="username"
                  >
                    <div
                      className={`flex h-11 w-full items-stretch overflow-hidden rounded-xl border transition-all ${
                        isUsernameSet
                          ? "border-slate-200/70 bg-slate-50"
                          : usernameStatus === "taken"
                            ? "border-red-300 bg-white focus-within:ring-4 focus-within:ring-red-500/10"
                            : usernameStatus === "available"
                              ? "border-emerald-300 bg-white focus-within:ring-4 focus-within:ring-emerald-500/10"
                              : "border-slate-200 bg-white focus-within:border-[var(--brand)] focus-within:ring-4 focus-within:ring-[var(--brand)]/10"
                      }`}
                    >
                      <span className="flex select-none items-center whitespace-nowrap border-r border-slate-200 bg-slate-50 px-3.5 text-[12.5px] font-semibold text-slate-400">
                        stoxify.in/profiles/
                      </span>
                      <input
                        id="username"
                        type="text"
                        value={username}
                        disabled={isUsernameSet}
                        onChange={(e) => {
                          setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_.-]+/g, ""));
                          setUsernameStatus("idle");
                        }}
                        className={`min-w-0 flex-1 bg-transparent px-3.5 text-[13.5px] outline-none placeholder:text-slate-300 ${
                          isUsernameSet
                            ? "cursor-not-allowed text-slate-500"
                            : usernameStatus === "taken"
                              ? "text-red-600"
                              : usernameStatus === "available"
                                ? "text-emerald-700"
                                : "text-slate-800"
                        }`}
                        placeholder="username"
                      />
                      {isUsernameSet ? (
                        <span className="flex items-center pr-3.5 text-slate-300">
                          <Icon name="lock" className="h-3.5 w-3.5" />
                        </span>
                      ) : (
                        usernameStatus !== "idle" && (
                          <span
                            className={`flex items-center gap-1 whitespace-nowrap pr-3.5 text-[11.5px] font-bold ${
                              usernameStatus === "checking"
                                ? "text-slate-400"
                                : usernameStatus === "available"
                                  ? "text-emerald-600"
                                  : "text-red-500"
                            }`}
                          >
                            {usernameStatus === "available" && (
                              <Icon name="circleCheck" className="h-3.5 w-3.5" />
                            )}
                            {usernameStatus === "taken" && (
                              <Icon name="x" className="h-3.5 w-3.5" />
                            )}
                            {usernameStatus === "checking"
                              ? "Checking…"
                              : usernameStatus === "available"
                                ? "Available"
                                : "Taken"}
                          </span>
                        )
                      )}
                    </div>
                    <p className={HINT}>
                      {isUsernameSet
                        ? "Your unique username has been permanently claimed."
                        : "Choose a unique username to claim your public profile URL."}
                    </p>
                  </SettingsRow>

                  {/* Email Address */}
                  <SettingsRow
                    label="Email Address"
                    description="Where account and payout receipts are sent."
                  >
                    <LockedField icon="mail" value={profile?.email || ""} />
                    <p className={HINT}>Email cannot be changed. Contact support for assistance.</p>
                  </SettingsRow>

                  {/* Phone Number */}
                  <SettingsRow
                    label="Phone Number"
                    description="Used to sign in and to verify sensitive actions."
                  >
                    <LockedField icon="phone" value={formatPhone(profile?.phone)} />
                    <p className={HINT}>
                      Your phone number is your login and cannot be changed here.
                    </p>
                  </SettingsRow>

                  {/* Bio */}
                  <SettingsRow
                    label="Bio Description"
                    description="This will be your main story. Keep it credible and to the point."
                    htmlFor="bio"
                  >
                    <textarea
                      id="bio"
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      className="h-28 w-full resize-none rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-[13.5px] leading-relaxed text-slate-800 outline-none transition-all placeholder:text-slate-300 focus:border-[var(--brand)] focus:ring-4 focus:ring-[var(--brand)]/10"
                      placeholder="Describe your credentials and approach..."
                    />
                    <div className="mt-1.5 flex items-center justify-between">
                      <span className="text-[11.5px] text-slate-400">
                        Shown at the top of your public profile.
                      </span>
                      <span className="text-[11.5px] font-semibold text-slate-400">
                        {bio.length} characters
                      </span>
                    </div>
                  </SettingsRow>

                  {/* Social Links */}
                  <SettingsRow
                    label="Social Links"
                    description="Optional. Helps subscribers verify who you are."
                  >
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div>
                        <label
                          htmlFor="twitter"
                          className="mb-1.5 block text-[11.5px] font-semibold text-slate-500"
                        >
                          Twitter / X
                        </label>
                        <div className="relative">
                          <Icon
                            name="link"
                            className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-300"
                          />
                          <input
                            id="twitter"
                            type="text"
                            value={twitterUrl}
                            onChange={(e) => setTwitterUrl(e.target.value)}
                            className={`${INPUT_BASE} pl-10`}
                            placeholder="https://twitter.com/..."
                          />
                        </div>
                      </div>
                      <div>
                        <label
                          htmlFor="linkedin"
                          className="mb-1.5 block text-[11.5px] font-semibold text-slate-500"
                        >
                          LinkedIn
                        </label>
                        <div className="relative">
                          <Icon
                            name="link"
                            className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-300"
                          />
                          <input
                            id="linkedin"
                            type="text"
                            value={linkedinUrl}
                            onChange={(e) => setLinkedinUrl(e.target.value)}
                            className={`${INPUT_BASE} pl-10`}
                            placeholder="https://linkedin.com/in/..."
                          />
                        </div>
                      </div>
                    </div>
                  </SettingsRow>

                  {/* Public Landing Page */}
                  <SettingsRow
                    label="Landing Page"
                    description="Share this link with potential subscribers to showcase your profile and plans."
                  >
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                      <div className="relative min-w-0 flex-1">
                        <Icon
                          name="link"
                          className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-300"
                        />
                        <input
                          type="text"
                          value={
                            username
                              ? `stoxify.in/profiles/${username}`
                              : "Set a username above to claim your link"
                          }
                          readOnly
                          className={`${INPUT_LOCKED} cursor-default pl-10`}
                        />
                      </div>
                      <div className="flex shrink-0 gap-2">
                        <button
                          onClick={() => {
                            const savedUsername = profile?.username;
                            if (savedUsername) {
                              navigator.clipboard.writeText(`stoxify.in/profiles/${savedUsername}`);
                              showSuccessToast(
                                "Link Copied",
                                "Your landing page link has been copied to clipboard."
                              );
                            } else {
                              showSuccessToast(
                                "Error",
                                "Please set and save a unique username first."
                              );
                            }
                          }}
                          className={BTN_GHOST}
                          type="button"
                        >
                          Copy Link
                        </button>
                        {profile?.username && (
                          <Link
                            href={`/profiles/${profile.username}`}
                            target="_blank"
                            className={BTN_PRIMARY}
                          >
                            Visit Page
                            <Icon name="arrowRight" className="h-3.5 w-3.5" />
                          </Link>
                        )}
                      </div>
                    </div>
                  </SettingsRow>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3 border-t border-slate-100 pt-6">
                  <button onClick={handleCancel} className={BTN_GHOST} type="button">
                    Cancel
                  </button>
                  <button className={BTN_PRIMARY} type="submit">
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          )}

          {activeTab === "SEBI Verification" && (
            <div
              role="tabpanel"
              id="panel-sebi-verification"
              aria-labelledby="tab-sebi-verification"
              className="flex flex-col gap-6 outline-none"
            >
              <SectionHead
                title="SEBI Verification"
                subtitle="Manage your SEBI registration details and compliance documents."
                badge={
                  isSebiVerified ? (
                    <StatusPill tone="ok" icon="circleCheck">
                      Verified
                    </StatusPill>
                  ) : (
                    <StatusPill tone="pending" icon="lock">
                      {profile?.state ? profile.state.replace(/_/g, " ") : "Pending"}
                    </StatusPill>
                  )
                }
              />

              <div>
                {/* Registration details */}
                <SettingsRow
                  label="Registration Details"
                  description="Held on record by compliance. Contact support to change any of these."
                >
                  <div className="grid grid-cols-1 gap-x-8 gap-y-5 rounded-2xl border border-slate-200/70 bg-slate-50/60 p-5 sm:grid-cols-2">
                    <DetailPair
                      label="SEBI Registration No."
                      value={
                        profile?.sebi_license_number || profile?.sebi_registration_number || "—"
                      }
                    />
                    <DetailPair label="Entity Type" value={entityTypeLabel} />
                    <DetailPair label="Registered Name" value={profile?.name || "—"} />
                    <DetailPair
                      label="Registration Date"
                      value={
                        profile?.verification?.submitted_at
                          ? new Date(profile.verification.submitted_at).toLocaleDateString(
                              "en-IN",
                              {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              }
                            )
                          : "—"
                      }
                    />
                    <DetailPair label="Valid Until" value="—" />
                  </div>
                </SettingsRow>

                {/* Uploaded Documents */}
                <SettingsRow
                  label="Verification Documents"
                  description="Aadhaar, PAN and your SEBI registration certificate — all three are required."
                >
                  <div className="grid grid-cols-1 gap-3">
                    {/* 1. Aadhaar Card */}
                    <div className="rounded-xl border border-slate-200/70 bg-white p-4">
                      <div className="mb-2.5 flex items-center justify-between gap-3 text-[12.5px] font-bold text-slate-700">
                        <span>1. Aadhaar Card Document</span>
                        <DocStatusBadge
                          staged={Boolean(aadharDocFile)}
                          saved={Boolean(aadharOnFile) && !removedAadharDoc}
                        />
                      </div>

                      {aadharDocFile ? (
                        <div className="flex items-center justify-between gap-3 rounded-lg border border-amber-200 bg-amber-50/50 p-3">
                          <div className="flex items-center gap-2.5 truncate">
                            <Icon name="fileText" className="h-5 w-5 shrink-0 text-amber-600" />
                            <span className="text-[13px] font-bold text-slate-800 truncate">
                              {aadharDocFile.name}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setAadharDocFile(null)}
                            className="text-red-500 hover:text-red-700 p-1"
                          >
                            <Icon name="trash" className="h-4 w-4" />
                          </button>
                        </div>
                      ) : aadharOnFile && !removedAadharDoc ? (
                        <div className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50/70 p-3">
                          <div className="flex items-center gap-2.5 truncate">
                            <Icon name="fileText" className="h-5 w-5 shrink-0 text-emerald-600" />
                            <span className="text-[13px] font-bold text-slate-800 truncate">
                              Aadhaar Card Document
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <a
                              href={aadharOnFile}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="rounded-md border border-slate-200 bg-white px-2.5 py-1 text-[12px] font-bold text-[var(--brand)] transition-colors hover:bg-[var(--brand-light)]"
                            >
                              View
                            </a>
                            <button
                              type="button"
                              onClick={() => setRemovedAadharDoc(true)}
                              className="text-slate-400 hover:text-red-600 p-1"
                            >
                              <Icon name="trash" className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div
                          onClick={() => aadharDocInputRef.current?.click()}
                          className="group flex cursor-pointer items-center justify-between gap-3 rounded-lg border-2 border-dashed border-slate-200 bg-slate-50/50 p-4 transition-colors hover:border-[var(--brand)] hover:bg-[var(--brand-light)]/50"
                        >
                          <input
                            ref={aadharDocInputRef}
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png"
                            onChange={(e) =>
                              handleDocFileChange(e, setAadharDocFile, () =>
                                setRemovedAadharDoc(false)
                              )
                            }
                            className="hidden"
                          />
                          <span className="min-w-0 truncate text-[12.5px] font-bold text-slate-600">
                            Select Aadhaar Card (PDF, PNG, JPG)
                          </span>
                          <span className="shrink-0 text-[12px] font-bold text-[var(--brand)] group-hover:underline">
                            Browse
                          </span>
                        </div>
                      )}
                    </div>

                    {/* 2. PAN Card */}
                    <div className="rounded-xl border border-slate-200/70 bg-white p-4">
                      <div className="mb-2.5 flex items-center justify-between gap-3 text-[12.5px] font-bold text-slate-700">
                        <span>2. PAN Card Document</span>
                        <DocStatusBadge
                          staged={Boolean(panDocFile)}
                          saved={Boolean(panOnFile) && !removedPanDoc}
                        />
                      </div>

                      {panDocFile ? (
                        <div className="flex items-center justify-between gap-3 rounded-lg border border-amber-200 bg-amber-50/50 p-3">
                          <div className="flex items-center gap-2.5 truncate">
                            <Icon name="fileText" className="h-5 w-5 shrink-0 text-amber-600" />
                            <span className="text-[13px] font-bold text-slate-800 truncate">
                              {panDocFile.name}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setPanDocFile(null)}
                            className="text-red-500 hover:text-red-700 p-1"
                          >
                            <Icon name="trash" className="h-4 w-4" />
                          </button>
                        </div>
                      ) : panOnFile && !removedPanDoc ? (
                        <div className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50/70 p-3">
                          <div className="flex items-center gap-2.5 truncate">
                            <Icon name="fileText" className="h-5 w-5 shrink-0 text-emerald-600" />
                            <span className="text-[13px] font-bold text-slate-800 truncate">
                              PAN Card Document
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <a
                              href={panOnFile}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="rounded-md border border-slate-200 bg-white px-2.5 py-1 text-[12px] font-bold text-[var(--brand)] transition-colors hover:bg-[var(--brand-light)]"
                            >
                              View
                            </a>
                            <button
                              type="button"
                              onClick={() => setRemovedPanDoc(true)}
                              className="text-slate-400 hover:text-red-600 p-1"
                            >
                              <Icon name="trash" className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div
                          onClick={() => panDocInputRef.current?.click()}
                          className="group flex cursor-pointer items-center justify-between gap-3 rounded-lg border-2 border-dashed border-slate-200 bg-slate-50/50 p-4 transition-colors hover:border-[var(--brand)] hover:bg-[var(--brand-light)]/50"
                        >
                          <input
                            ref={panDocInputRef}
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png"
                            onChange={(e) =>
                              handleDocFileChange(e, setPanDocFile, () => setRemovedPanDoc(false))
                            }
                            className="hidden"
                          />
                          <span className="min-w-0 truncate text-[12.5px] font-bold text-slate-600">
                            Select PAN Card (PDF, PNG, JPG)
                          </span>
                          <span className="shrink-0 text-[12px] font-bold text-[var(--brand)] group-hover:underline">
                            Browse
                          </span>
                        </div>
                      )}
                    </div>

                    {/* 3. SEBI Certificate */}
                    <div className="rounded-xl border border-slate-200/70 bg-white p-4">
                      <div className="mb-2.5 flex items-center justify-between gap-3 text-[12.5px] font-bold text-slate-700">
                        <span>3. SEBI Registration Certificate</span>
                        <DocStatusBadge
                          staged={Boolean(sebiDocFile)}
                          saved={Boolean(sebiOnFile) && !removedSebiDoc}
                        />
                      </div>

                      {sebiDocFile ? (
                        <div className="flex items-center justify-between gap-3 rounded-lg border border-amber-200 bg-amber-50/50 p-3">
                          <div className="flex items-center gap-2.5 truncate">
                            <Icon name="fileText" className="h-5 w-5 shrink-0 text-amber-600" />
                            <span className="text-[13px] font-bold text-slate-800 truncate">
                              {sebiDocFile.name}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setSebiDocFile(null)}
                            className="text-red-500 hover:text-red-700 p-1"
                          >
                            <Icon name="trash" className="h-4 w-4" />
                          </button>
                        </div>
                      ) : sebiOnFile && !removedSebiDoc ? (
                        <div className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50/70 p-3">
                          <div className="flex items-center gap-2.5 truncate">
                            <Icon name="fileText" className="h-5 w-5 shrink-0 text-emerald-600" />
                            <span className="text-[13px] font-bold text-slate-800 truncate">
                              SEBI Registration Certificate
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <a
                              href={sebiOnFile}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="rounded-md border border-slate-200 bg-white px-2.5 py-1 text-[12px] font-bold text-[var(--brand)] transition-colors hover:bg-[var(--brand-light)]"
                            >
                              View
                            </a>
                            <button
                              type="button"
                              onClick={() => setRemovedSebiDoc(true)}
                              className="text-slate-400 hover:text-red-600 p-1"
                            >
                              <Icon name="trash" className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div
                          onClick={() => sebiDocInputRef.current?.click()}
                          className="group flex cursor-pointer items-center justify-between gap-3 rounded-lg border-2 border-dashed border-slate-200 bg-slate-50/50 p-4 transition-colors hover:border-[var(--brand)] hover:bg-[var(--brand-light)]/50"
                        >
                          <input
                            ref={sebiDocInputRef}
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png"
                            onChange={(e) =>
                              handleDocFileChange(e, setSebiDocFile, () => setRemovedSebiDoc(false))
                            }
                            className="hidden"
                          />
                          <span className="min-w-0 truncate text-[12.5px] font-bold text-slate-600">
                            Select SEBI Certificate (PDF, PNG, JPG)
                          </span>
                          <span className="shrink-0 text-[12px] font-bold text-[var(--brand)] group-hover:underline">
                            Browse
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </SettingsRow>
              </div>

              {/* Bottom Actions */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-6">
                <button
                  onClick={() =>
                    showSuccessToast(
                      "Request Submitted",
                      "Your request to update registration details has been received by support."
                    )
                  }
                  className={BTN_GHOST}
                  type="button"
                >
                  Request Detail Update
                </button>

                <div className="flex flex-wrap items-center gap-3">
                  {hasDocChanges && !savingDocs && (
                    <span className="text-[12px] font-semibold text-amber-600">
                      You have unsaved document changes.
                    </span>
                  )}
                  {hasDocChanges && !savingDocs && (
                    <button onClick={handleResetDocs} className={BTN_GHOST} type="button">
                      Discard
                    </button>
                  )}
                  <button
                    onClick={handleSaveDocs}
                    disabled={!hasDocChanges || savingDocs}
                    className={BTN_PRIMARY}
                    type="button"
                  >
                    {savingDocs ? "Saving…" : "Save Documents"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === "Bank & Payouts" && <BankPayoutsTab />}
          {activeTab === "Delete Account" && <DeleteAccountTab />}
        </div>
      </div>
    </>
  );
}
