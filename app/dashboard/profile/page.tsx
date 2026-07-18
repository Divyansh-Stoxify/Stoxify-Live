"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { Topbar } from "@/components/dashboard/topbar";
import { useAnalystProfile } from "@/hooks/use-analyst-dashboard";
import { useDashboard } from "@/components/dashboard/dashboard-context";
import { Icon } from "@/components/stoxify-icon";

const TABS = [
  { name: "Profile Information", icon: "user" as const },
  { name: "SEBI Verification", icon: "shieldCheck" as const },
  { name: "Notifications", icon: "bell" as const },
  { name: "Bank & Payouts", icon: "bank" as const },
  { name: "Delete Account", icon: "trash" as const },
];

// Accepted upload formats + client-side size cap (backend enforces 3 MB too).
const ACCEPTED_AVATAR_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_AVATAR_BYTES = 3 * 1024 * 1024;

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

// ─── Notifications Tab ────────────────────────────────────────────────────────

interface NotificationPreferences {
  channels: { email: boolean; push: boolean };
  categories: { trades: boolean; subscriptions: boolean; account: boolean };
}

const DEFAULT_PREFS: NotificationPreferences = {
  channels: { email: true, push: true },
  categories: { trades: true, subscriptions: true, account: true },
};

/** Small accessible toggle switch. */
function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
        checked ? "bg-[var(--brand)]" : "bg-slate-200"
      }`}
    >
      <span
        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform ${
          checked ? "translate-x-[22px]" : "translate-x-0.5"
        }`}
      />
    </button>
  );
}

function PrefRow({
  title,
  description,
  checked,
  onChange,
}: {
  title: string;
  description: string;
  checked: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-3.5">
      <div className="min-w-0">
        <div className="text-[13.5px] font-bold text-slate-800">{title}</div>
        <div className="text-[12px] text-slate-400 mt-0.5">{description}</div>
      </div>
      <Toggle checked={checked} onChange={onChange} label={title} />
    </div>
  );
}

function NotificationsTab() {
  const { showSuccessToast } = useDashboard();
  const [prefs, setPrefs] = useState<NotificationPreferences>(DEFAULT_PREFS);
  const [initial, setInitial] = useState<NotificationPreferences>(DEFAULT_PREFS);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/analyst/notifications/preferences", {
          credentials: "same-origin",
          cache: "no-store",
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        const loaded: NotificationPreferences = {
          channels: {
            email: data?.channels?.email ?? DEFAULT_PREFS.channels.email,
            push: data?.channels?.push ?? DEFAULT_PREFS.channels.push,
          },
          categories: {
            trades: data?.categories?.trades ?? DEFAULT_PREFS.categories.trades,
            subscriptions:
              data?.categories?.subscriptions ?? DEFAULT_PREFS.categories.subscriptions,
            account: data?.categories?.account ?? DEFAULT_PREFS.categories.account,
          },
        };
        if (!cancelled) {
          setPrefs(loaded);
          setInitial(loaded);
          setIsError(false);
        }
      } catch {
        if (!cancelled) setIsError(true);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const isDirty = JSON.stringify(prefs) !== JSON.stringify(initial);

  const setChannel = (key: keyof NotificationPreferences["channels"], next: boolean) =>
    setPrefs((p) => ({ ...p, channels: { ...p.channels, [key]: next } }));

  const setCategory = (key: keyof NotificationPreferences["categories"], next: boolean) =>
    setPrefs((p) => ({ ...p, categories: { ...p.categories, [key]: next } }));

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await fetch("/api/analyst/notifications/preferences", {
        method: "PATCH",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(prefs),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        showSuccessToast("Save Failed", err.error ?? "Unable to save notification preferences.");
        return;
      }
      const saved = await res.json();
      const next: NotificationPreferences = {
        channels: { ...prefs.channels, ...(saved?.channels ?? {}) },
        categories: { ...prefs.categories, ...(saved?.categories ?? {}) },
      };
      setPrefs(next);
      setInitial(next);
      showSuccessToast("Preferences Saved", "Your notification settings have been updated.");
    } catch {
      showSuccessToast("Network Error", "Unable to reach the server. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      role="tabpanel"
      id="panel-notifications"
      aria-labelledby="tab-notifications"
      className="flex flex-col gap-6 outline-none"
    >
      {/* Header */}
      <div>
        <h2 className="text-[17px] font-bold text-slate-800 leading-tight">Notifications</h2>
        <p className="text-[13px] text-slate-400 mt-1">
          Choose how and what you want to be notified about. In-app alerts are always on.
        </p>
      </div>

      <hr className="border-slate-100" />

      {isError ? (
        <div className="rounded-lg border border-red-100 bg-red-50 p-4 text-[13px] text-red-600">
          Unable to load your notification preferences. Make sure the notification service is
          running.
        </div>
      ) : isLoading ? (
        <div className="flex flex-col gap-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center justify-between py-2">
              <div className="space-y-1.5">
                <div className="h-3.5 w-40 animate-pulse rounded bg-slate-100" />
                <div className="h-2.5 w-56 animate-pulse rounded bg-slate-100" />
              </div>
              <div className="h-6 w-11 animate-pulse rounded-full bg-slate-100" />
            </div>
          ))}
        </div>
      ) : (
        <>
          {/* Delivery channels */}
          <div>
            <h3 className="text-[13px] font-bold uppercase tracking-[0.04em] text-slate-400">
              Delivery Channels
            </h3>
            <div className="mt-1 divide-y divide-slate-100">
              <PrefRow
                title="Email"
                description="Receive notifications at your registered email address."
                checked={prefs.channels.email}
                onChange={(v) => setChannel("email", v)}
              />
              <PrefRow
                title="Push Notifications"
                description="Get push alerts on your devices."
                checked={prefs.channels.push}
                onChange={(v) => setChannel("push", v)}
              />
            </div>
          </div>

          {/* Categories */}
          <div>
            <h3 className="text-[13px] font-bold uppercase tracking-[0.04em] text-slate-400">
              What to notify me about
            </h3>
            <div className="mt-1 divide-y divide-slate-100">
              <PrefRow
                title="Trade Alerts"
                description="New trades, modifications and closures."
                checked={prefs.categories.trades}
                onChange={(v) => setCategory("trades", v)}
              />
              <PrefRow
                title="Subscriptions"
                description="Subscription activations, renewals and cancellations."
                checked={prefs.categories.subscriptions}
                onChange={(v) => setCategory("subscriptions", v)}
              />
              <PrefRow
                title="Account & Security"
                description="Account approval and important account updates."
                checked={prefs.categories.account}
                onChange={(v) => setCategory("account", v)}
              />
            </div>
          </div>

          <hr className="border-slate-100" />

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setPrefs(initial)}
              disabled={!isDirty || isSaving}
              className="px-4 py-2 border border-slate-200 rounded-lg text-[13px] font-bold text-slate-700 hover:bg-slate-50 transition-colors shadow-sm cursor-pointer bg-white disabled:opacity-50 disabled:cursor-not-allowed"
              type="button"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!isDirty || isSaving}
              className="px-4 py-2 bg-[var(--brand)] hover:bg-[var(--brand-dark)] rounded-lg text-[13px] font-bold text-white transition-colors cursor-pointer shadow-sm shadow-[var(--brand)]/15 disabled:opacity-50 disabled:cursor-not-allowed"
              type="button"
            >
              {isSaving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </>
      )}
    </div>
  );
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
      {/* Header */}
      <div>
        <h2 className="text-[17px] font-bold text-red-600 leading-tight flex items-center gap-2">
          <Icon name="trash" className="h-4.5 w-4.5" />
          Delete Account
        </h2>
        <p className="text-[13px] text-slate-400 mt-1">
          Permanently remove your Stoxify analyst account and all associated data.
        </p>
      </div>

      <hr className="border-slate-100" />

      {/* Warning card */}
      <div className="rounded-xl border border-red-100 bg-red-50/50 p-5">
        <div className="flex items-start gap-3.5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-red-100 text-red-600 mt-0.5">
            <Icon name="x" className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-[13.5px] font-bold text-red-800 mb-1.5">What happens when you delete your account?</h4>
            <ul className="text-[12.5px] text-red-700 space-y-1.5 list-disc ml-4 leading-relaxed">
              <li>All your subscription plans will be deactivated</li>
              <li>Active subscriber access to your trades will be revoked</li>
              <li>Your published trade history will be archived</li>
              <li>All sessions will be terminated across every device</li>
              <li>Your SEBI verification status and profile will be removed</li>
              <li>Pending payouts may still be processed per compliance requirements</li>
            </ul>
          </div>
        </div>
      </div>

      <hr className="border-slate-100" />

      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => setShowModal(true)}
          className="px-5 py-2.5 bg-red-600 hover:bg-red-700 rounded-lg text-[13px] font-bold text-white transition-colors cursor-pointer shadow-sm active:scale-[0.98]"
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
                    className="flex-1 px-4 py-2.5 border border-slate-200 rounded-lg text-[13px] font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={sendingOtp || confirmText !== "DELETE"}
                    onClick={handleRequestOtp}
                    className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 rounded-lg text-[13px] font-bold text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98]"
                  >
                    {sendingOtp ? "Sending code..." : "Continue"}
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
                    className="flex-1 px-4 py-2.5 border border-slate-200 rounded-lg text-[13px] font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    disabled={deleting || otp.length !== 6}
                    onClick={handleDelete}
                    className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 rounded-lg text-[13px] font-bold text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98]"
                  >
                    {deleting ? "Deleting..." : "Permanently Delete"}
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
  const [telegramChannelId, setTelegramChannelId] = useState("");

  // SEBI Document Upload State
  const [sebiDocFile, setSebiDocFile] = useState<File | null>(null);
  const [isDraggingDoc, setIsDraggingDoc] = useState(false);
  const sebiDocInputRef = useRef<HTMLInputElement>(null);
  const [removedExistingDoc, setRemovedExistingDoc] = useState(false);

  // Check if existing document is a mock/placeholder
  const hasExistingDoc = React.useMemo(() => {
    const docUrl = profile?.sebi_license_doc_url;
    if (!docUrl) return false;
    return !docUrl.includes("placeholder-doc.pdf") && !docUrl.includes("example.com");
  }, [profile?.sebi_license_doc_url]);

  const handleSebiDocChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        showSuccessToast("File Too Large", "Please upload a document smaller than 10MB.");
        return;
      }
      setSebiDocFile(file);
      showSuccessToast("Document Added", "Your SEBI document has been selected successfully.");
    }
  };

  const handleDragOverDoc = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingDoc(true);
  };

  const handleDragLeaveDoc = () => {
    setIsDraggingDoc(false);
  };

  const handleDropDoc = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingDoc(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        showSuccessToast("File Too Large", "Please upload a document smaller than 10MB.");
        return;
      }
      setSebiDocFile(file);
      showSuccessToast("Document Added", "Your SEBI document has been selected successfully.");
    }
  };
  const [usernameStatus, setUsernameStatus] = useState<"idle" | "checking" | "available" | "taken">("idle");
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
      setTelegramChannelId(profile.telegram_channel_id || "");
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
      setTelegramChannelId(profile.telegram_channel_id || "");
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
    let parsedTelegramId = telegramChannelId.trim();
    if (parsedTelegramId) {
      // If it's a t.me link, extract the username and prepend @
      const tMeMatch = parsedTelegramId.match(/(?:https?:\/\/)?(?:www\.)?t\.me\/(?!joinchat)(?!c\/)(?![\+])([a-zA-Z0-9_]+)/i);
      if (tMeMatch) {
        parsedTelegramId = "@" + tMeMatch[1];
      } else if (!parsedTelegramId.startsWith('@') && !/^-?\d+$/.test(parsedTelegramId)) {
        // Automatically add @ if the user just typed the username
        parsedTelegramId = "@" + parsedTelegramId;
      }
    }

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
          telegram_channel_id: parsedTelegramId === "" ? null : parsedTelegramId,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        showSuccessToast("Save Failed", err.error ?? err.message ?? "Unable to save profile changes.");
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

      <div className="flex-1 p-8 bg-[#fafbfc] flex flex-col md:flex-row gap-8 overflow-y-auto">
        {/* ─── Left Sidebar Tabs (With icons) ─── */}
        <div
          className="flex flex-col gap-1 w-full md:w-[220px] shrink-0"
          role="tablist"
          aria-label="Settings Tab list"
        >
          {TABS.map((tab) => {
            const isActive = activeTab === tab.name;
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
                className={`flex items-center gap-3 rounded-lg px-4 py-2.5 text-[13.5px] font-semibold transition-all duration-150 text-left ${
                  isActive
                    ? "bg-[#eef2f6] text-slate-800"
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
                }`}
                type="button"
              >
                <Icon className="h-4 w-4 shrink-0" name={tab.icon} />
                {tab.name}
              </button>
            );
          })}
        </div>

        {/* ─── Right Content Card ─── */}
        <div className="flex-1 max-w-4xl bg-white rounded-xl border border-slate-100 shadow-sm p-8">
          {activeTab === "Profile Information" && (
            <div
              role="tabpanel"
              id="panel-profile-information"
              aria-labelledby="tab-profile-information"
              className="outline-none"
            >
              <form onSubmit={handleSave} className="flex flex-col gap-6">
                {/* Header */}
                <div>
                  <h2 className="text-[17px] font-bold text-slate-800 leading-tight">
                    Profile Information
                  </h2>
                  <p className="text-[13px] text-slate-400 mt-1">
                    Update your photo and personal details here.
                  </p>
                </div>

                <hr className="border-slate-100" />

                {/* Avatar section */}
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full overflow-hidden bg-[var(--brand)] flex items-center justify-center text-white text-[18px] font-bold shadow-sm border border-slate-100">
                    {avatarUrl ? (
                      <Image
                        src={avatarUrl}
                        alt="Avatar"
                        width={56}
                        height={56}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      initials
                    )}
                  </div>

                  <div className="flex gap-2">
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
                      className="px-4 py-1.5 border border-slate-200 rounded-lg text-[12.5px] font-bold text-slate-700 bg-white hover:bg-slate-50 transition-colors shadow-sm cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                      type="button"
                    >
                      {uploadingAvatar ? "Uploading…" : "Upload Photo"}
                    </button>
                    <button
                      onClick={handleRemoveAvatar}
                      disabled={uploadingAvatar}
                      className="px-3 py-1.5 text-red-500 text-[12.5px] font-bold hover:text-red-600 transition-colors cursor-pointer bg-transparent border-none disabled:opacity-60"
                      type="button"
                    >
                      Remove
                    </button>
                  </div>
                </div>

                {/* Form Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* First Name */}
                  <div>
                    <label
                      htmlFor="firstName"
                      className="text-[12.5px] font-bold text-slate-700 mb-1.5 block"
                    >
                      First Name
                    </label>
                    <input
                      id="firstName"
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-[13.5px] text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[var(--brand)] transition-colors shadow-sm"
                    />
                  </div>

                  {/* Last Name */}
                  <div>
                    <label
                      htmlFor="lastName"
                      className="text-[12.5px] font-bold text-slate-700 mb-1.5 block"
                    >
                      Last Name
                    </label>
                    <input
                      id="lastName"
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-[13.5px] text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[var(--brand)] transition-colors shadow-sm"
                    />
                  </div>
                </div>

                {/* Username */}
                <div>
                  <label
                    htmlFor="username"
                    className="text-[12.5px] font-bold text-slate-700 mb-1.5 flex items-center justify-between"
                  >
                    <span>Unique Username</span>
                    {usernameStatus === "checking" && <span className="text-slate-400 font-normal">Checking...</span>}
                    {usernameStatus === "available" && <span className="text-green-500 font-normal">Available</span>}
                    {usernameStatus === "taken" && <span className="text-red-500 font-normal">Taken</span>}
                  </label>
                  <div className="relative flex items-center">
                    <span className="absolute left-3 text-slate-400 text-[13.5px]">stoxify.in/profiles/</span>
                    <input
                      id="username"
                      type="text"
                      value={username}
                      disabled={isUsernameSet}
                      onChange={(e) => {
                        setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_.-]+/g, ""));
                        setUsernameStatus("idle");
                      }}
                      className={`w-full pl-[135px] pr-3 py-2 border rounded-lg text-[13.5px] text-slate-800 placeholder-slate-400 focus:outline-none transition-colors shadow-sm ${
                        isUsernameSet
                          ? "bg-slate-50 text-slate-500 cursor-not-allowed"
                          : usernameStatus === "taken"
                          ? "border-red-300 focus:border-red-500 text-red-600 bg-red-50"
                          : usernameStatus === "available"
                          ? "border-green-300 focus:border-green-500 text-green-700 bg-green-50"
                          : "border-slate-200 focus:border-[var(--brand)]"
                      }`}
                      placeholder="username"
                    />
                  </div>
                  {isUsernameSet ? (
                    <span className="text-[11px] text-slate-400 mt-1 block">
                      Your unique username has been permanently claimed.
                    </span>
                  ) : (
                    <span className="text-[11px] text-slate-400 mt-1 block">
                      Choose a unique username to claim your public profile URL.
                    </span>
                  )}
                </div>

                {/* Email Address */}
                <div>
                  <label
                    htmlFor="email"
                    className="text-[12.5px] font-bold text-slate-700 mb-1.5 block"
                  >
                    Email Address
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={profile?.email || ""}
                    disabled
                    className="w-full px-3 py-2 border border-slate-100 bg-[#f8fafc] rounded-lg text-[13.5px] text-slate-400 cursor-not-allowed focus:outline-none"
                  />
                  <span className="text-[11px] text-slate-400 mt-1 block">
                    Email cannot be changed. Contact support for assistance.
                  </span>
                </div>

                {/* Phone Number */}
                <div>
                  <label
                    htmlFor="phone"
                    className="text-[12.5px] font-bold text-slate-700 mb-1.5 block"
                  >
                    Phone Number
                  </label>
                  <input
                    id="phone"
                    type="text"
                    value={formatPhone(profile?.phone)}
                    disabled
                    className="w-full px-3 py-2 border border-slate-100 bg-[#f8fafc] rounded-lg text-[13.5px] text-slate-400 cursor-not-allowed focus:outline-none"
                  />
                  <span className="text-[11px] text-slate-400 mt-1 block">
                    Your phone number is your login and cannot be changed here.
                  </span>
                </div>

                {/* Bio */}
                <div>
                  <label
                    htmlFor="bio"
                    className="text-[12.5px] font-bold text-slate-700 mb-1.5 block"
                  >
                    Professional Bio
                  </label>
                  <textarea
                    id="bio"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    className="w-full h-24 px-3 py-2 border border-slate-200 rounded-lg text-[13.5px] text-slate-800 focus:outline-none focus:border-[var(--brand)] transition-colors shadow-sm resize-none"
                    placeholder="Describe your credentials and approach..."
                  />
                </div>

                {/* Social URLs Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Twitter */}
                  <div>
                    <label
                      htmlFor="twitter"
                      className="text-[12.5px] font-bold text-slate-700 mb-1.5 block"
                    >
                      Twitter/X Profile URL
                    </label>
                    <input
                      id="twitter"
                      type="text"
                      value={twitterUrl}
                      onChange={(e) => setTwitterUrl(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-[13.5px] text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[var(--brand)] transition-colors shadow-sm"
                      placeholder="https://twitter.com/..."
                    />
                  </div>

                  {/* LinkedIn */}
                  <div>
                    <label
                      htmlFor="linkedin"
                      className="text-[12.5px] font-bold text-slate-700 mb-1.5 block"
                    >
                      LinkedIn Profile URL
                    </label>
                    <input
                      id="linkedin"
                      type="text"
                      value={linkedinUrl}
                      onChange={(e) => setLinkedinUrl(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-[13.5px] text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[var(--brand)] transition-colors shadow-sm"
                      placeholder="https://linkedin.com/in/..."
                    />
                  </div>
                </div>

                {/* Public Landing Page */}
                <div className="mt-2">
                  <label className="text-[12.5px] font-bold text-slate-700 mb-1.5 block">
                    Public Landing Page
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={username ? `stoxify.in/profiles/${username}` : "Set a username above to claim your link"}
                      readOnly
                      className="w-full px-3 py-2 border border-slate-200 bg-[#f8fafc] rounded-lg text-[13.5px] text-slate-500 focus:outline-none"
                    />
                    <button
                      onClick={() => {
                        const savedUsername = profile?.username;
                        if (savedUsername) {
                          navigator.clipboard.writeText(`stoxify.in/profiles/${savedUsername}`);
                          showSuccessToast("Link Copied", "Your landing page link has been copied to clipboard.");
                        } else {
                          showSuccessToast("Error", "Please set and save a unique username first.");
                        }
                      }}
                      className="px-4 py-2 border border-slate-200 rounded-lg text-[12.5px] font-bold text-slate-700 bg-white hover:bg-slate-50 transition-colors shadow-sm cursor-pointer whitespace-nowrap"
                      type="button"
                    >
                      Copy Link
                    </button>
                    {profile?.username && (
                      <Link
                        href={`/profiles/${profile.username}`}
                        target="_blank"
                        className="px-4 py-2 border border-transparent rounded-lg text-[12.5px] font-bold text-white bg-[var(--brand)] hover:bg-[var(--brand-dark)] transition-colors shadow-sm cursor-pointer whitespace-nowrap"
                      >
                        Visit Page
                      </Link>
                    )}
                  </div>
                  <span className="text-[11px] text-slate-400 mt-1 block">
                    Share this unique link with potential subscribers to showcase your profile and plans.
                  </span>
                </div>

                {/* Telegram Integration */}
                <div className="mt-2 rounded-xl border border-slate-100 bg-slate-50/60 p-5">
                  <div className="flex items-center gap-2.5 mb-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#229ED9]/10">
                      <svg className="h-4 w-4 text-[#229ED9]" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L8.32 13.617l-2.96-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.194 1.006.131.828.942z"/>
                      </svg>
                    </div>
                    <div>
                      <div className="text-[13.5px] font-bold text-slate-800">Telegram Integration</div>
                      <div className="text-[11.5px] text-slate-400">Broadcast trades to your Telegram channel</div>
                    </div>
                  </div>
                  <div>
                    <label
                      htmlFor="telegramChannelId"
                      className="text-[12.5px] font-bold text-slate-700 mb-1.5 block"
                    >
                      Telegram Channel Link or ID
                    </label>
                    <input
                      id="telegramChannelId"
                      type="text"
                      value={telegramChannelId}
                      onChange={(e) => setTelegramChannelId(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-[13.5px] text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#229ED9] transition-colors shadow-sm bg-white"
                      placeholder="e.g. https://t.me/MyChannel, @MyChannel, or -100..."
                    />
                    <span className="text-[11px] text-slate-400 mt-1 block">
                      @<b>StoXifyTradebot</b>&nbsp;must be added as an admin to this channel. Trades published with the &ldquo;Publish to Telegram&rdquo; option will be broadcasted here.
                    </span>
                  </div>
                </div>

                <hr className="border-slate-100 mt-2" />

                {/* Actions */}
                <div className="flex justify-end gap-3">
                  <button
                    onClick={handleCancel}
                    className="px-4 py-2 border border-slate-200 rounded-lg text-[13px] font-bold text-slate-700 hover:bg-slate-50 transition-colors shadow-sm cursor-pointer bg-white"
                    type="button"
                  >
                    Cancel
                  </button>
                  <button
                    className="px-4 py-2 bg-[var(--brand)] hover:bg-[var(--brand-dark)] rounded-lg text-[13px] font-bold text-white transition-colors cursor-pointer shadow-sm shadow-[var(--brand)]/15"
                    type="submit"
                  >
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
              {/* Header */}
              <div>
                <div className="flex items-center justify-between">
                  <h2 className="text-[17px] font-bold text-slate-800 leading-tight flex items-center gap-2">
                    SEBI Verification
                    {isSebiVerified ? (
                      <span className="inline-flex items-center gap-1 rounded-full border border-green-200 bg-green-50 px-2.5 py-0.5 text-[10.5px] font-bold text-green-600">
                        <Icon className="h-3 w-3" name="circleCheck" />
                        Verified
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-[10.5px] font-bold text-amber-600">
                        <Icon className="h-3 w-3" name="lock" />
                        {profile?.state ? profile.state.replace(/_/g, " ") : "Pending"}
                      </span>
                    )}
                  </h2>
                </div>
                <p className="text-[13px] text-slate-400 mt-1">
                  Manage your SEBI registration details and compliance documents.
                </p>
              </div>

              <hr className="border-slate-100" />

              {/* Fields */}
              <div className="flex flex-col gap-5">
                {/* Registration Number */}
                <div>
                  <label className="text-[12.5px] font-bold text-slate-700 mb-1.5 block">
                    SEBI Registration Number
                  </label>
                  <input
                    type="text"
                    value={profile?.sebi_license_number || profile?.sebi_registration_number || "—"}
                    disabled
                    className="w-full px-3 py-2 border border-slate-100 bg-[#f8fafc] rounded-lg text-[13.5px] text-slate-500 cursor-not-allowed focus:outline-none"
                  />
                </div>

                {/* Date Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="text-[12.5px] font-bold text-slate-700 mb-1.5 block">
                      Registration Date
                    </label>
                    <input
                      type="text"
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
                      disabled
                      className="w-full px-3 py-2 border border-slate-100 bg-[#f8fafc] rounded-lg text-[13.5px] text-slate-500 cursor-not-allowed focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[12.5px] font-bold text-slate-700 mb-1.5 block">
                      Valid Until
                    </label>
                    <input
                      type="text"
                      value="—"
                      disabled
                      className="w-full px-3 py-2 border border-slate-100 bg-[#f8fafc] rounded-lg text-[13.5px] text-slate-500 cursor-not-allowed focus:outline-none"
                    />
                  </div>
                </div>

                {/* Registered Name & Entity Type */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="text-[12.5px] font-bold text-slate-700 mb-1.5 block">
                      Registered Name
                    </label>
                    <input
                      type="text"
                      value={profile?.name || "Rohan Mehta"}
                      disabled
                      className="w-full px-3 py-2 border border-slate-100 bg-[#f8fafc] rounded-lg text-[13.5px] text-slate-500 cursor-not-allowed focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[12.5px] font-bold text-slate-700 mb-1.5 block">
                      Entity Type
                    </label>
                    <input
                      type="text"
                      value={entityTypeLabel}
                      disabled
                      className="w-full px-3 py-2 border border-slate-100 bg-[#f8fafc] rounded-lg text-[13.5px] text-slate-500 cursor-not-allowed focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <hr className="border-slate-100 mt-2" />

              {/* Uploaded Documents */}
              <div>
                <h3 className="text-[14px] font-bold text-slate-800">Uploaded Documents</h3>
                <p className="text-[12px] text-slate-400 mt-0.5">
                  Copies of your official registration certificates on file.
                </p>

                {sebiDocFile ? (
                  <div className="border border-slate-100 rounded-lg p-4 bg-[#f8fafc] flex items-center justify-between mt-3 animate-fade-in">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-500 shrink-0">
                        <Icon className="h-5 w-5" name="fileText" />
                      </div>
                      <div>
                        <div className="text-[13.5px] font-bold text-slate-800 leading-tight truncate max-w-[200px] sm:max-w-[320px]">
                          {sebiDocFile.name}
                        </div>
                        <div className="text-[11.5px] text-slate-400 mt-0.5">
                          {(sebiDocFile.size / 1024).toFixed(1)} KB • Selected to upload
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          const url = URL.createObjectURL(sebiDocFile);
                          const a = document.createElement("a");
                          a.href = url;
                          a.download = sebiDocFile.name;
                          a.click();
                          URL.revokeObjectURL(url);
                        }}
                        className="flex items-center gap-2 px-3 py-1.5 border border-slate-200 rounded-lg text-[12.5px] font-bold text-slate-700 bg-white hover:bg-slate-50 transition-colors shadow-sm cursor-pointer"
                        type="button"
                      >
                        <Icon className="h-3.5 w-3.5" name="download" />
                        Download
                      </button>
                      <button
                        onClick={() => {
                          setSebiDocFile(null);
                          showSuccessToast("File Removed", "Selected document has been removed.");
                        }}
                        className="flex items-center justify-center w-8 h-8 border border-red-100 rounded-lg text-red-500 bg-white hover:bg-red-50 hover:border-red-200 transition-colors shadow-sm cursor-pointer"
                        type="button"
                        title="Remove file"
                      >
                        <Icon className="h-4 w-4" name="trash" />
                      </button>
                    </div>
                  </div>
                ) : hasExistingDoc && !removedExistingDoc && profile?.sebi_license_doc_url ? (
                  <div className="border border-slate-100 rounded-lg p-4 bg-[#f8fafc] flex items-center justify-between mt-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-500 shrink-0">
                        <Icon className="h-5 w-5" name="fileText" />
                      </div>
                      <div>
                        <div className="text-[13.5px] font-bold text-slate-800 leading-tight">
                          SEBI Registration Document
                        </div>
                        <div className="text-[11.5px] text-slate-400 mt-0.5">
                          {profile.verification?.submitted_at
                            ? `Uploaded on ${new Date(profile.verification.submitted_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}`
                            : "Uploaded"}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <a
                        href={profile.sebi_license_doc_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-3 py-1.5 border border-slate-200 rounded-lg text-[12.5px] font-bold text-slate-700 bg-white hover:bg-slate-50 transition-colors shadow-sm cursor-pointer"
                      >
                        <Icon className="h-3.5 w-3.5" name="download" />
                        View / Download
                      </a>
                      <button
                        onClick={() => {
                          setRemovedExistingDoc(true);
                          showSuccessToast("File Removed", "Existing document removed.");
                        }}
                        className="flex items-center justify-center w-8 h-8 border border-red-100 rounded-lg text-red-500 bg-white hover:bg-red-50 hover:border-red-200 transition-colors shadow-sm cursor-pointer"
                        type="button"
                        title="Remove file"
                      >
                        <Icon className="h-4 w-4" name="trash" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    onDragOver={handleDragOverDoc}
                    onDragLeave={handleDragLeaveDoc}
                    onDrop={handleDropDoc}
                    onClick={() => sebiDocInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-xl p-8 mt-3 flex flex-col items-center justify-center cursor-pointer transition-all duration-200 ${
                      isDraggingDoc
                        ? "border-[var(--brand)] bg-[var(--brand)]/5 scale-[0.99]"
                        : "border-slate-200 hover:border-slate-300 hover:bg-slate-50/50 bg-[#f8fafc]"
                    }`}
                  >
                    <input
                      ref={sebiDocInputRef}
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={handleSebiDocChange}
                      className="hidden"
                    />
                    <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-3 transition-transform duration-200">
                      <Icon className="h-6 w-6 text-slate-400" name="plus" />
                    </div>
                    <div className="text-[13.5px] font-bold text-slate-700 text-center">
                      Drag & drop your SEBI document here, or <span className="text-[var(--brand)] hover:underline">browse</span>
                    </div>
                    <div className="text-[11.5px] text-slate-400 mt-1 text-center">
                      Supports PDF, JPEG, or PNG (Max 10MB)
                    </div>
                  </div>
                )}
              </div>

              {/* Bottom Actions */}
              <div className="flex mt-2">
                <button
                  onClick={() =>
                    showSuccessToast(
                      "Request Submitted",
                      "Your request to update registration details has been received by support."
                    )
                  }
                  className="px-4 py-2 border border-slate-200 rounded-lg text-[13px] font-bold text-slate-700 hover:bg-slate-50 transition-colors shadow-sm cursor-pointer bg-white"
                  type="button"
                >
                  Request Detail Update
                </button>
              </div>
            </div>
          )}

          {activeTab === "Bank & Payouts" && (
            <div
              role="tabpanel"
              id="panel-bank-payouts"
              aria-labelledby="tab-bank-payouts"
              className="flex flex-col gap-6 outline-none"
            >
              {/* Header */}
              <div>
                <h2 className="text-[17px] font-bold text-slate-800 leading-tight">
                  Bank & Payouts
                </h2>
                <p className="text-[13px] text-slate-400 mt-1">
                  Manage your bank accounts and track your earnings payouts.
                </p>
              </div>

              <hr className="border-slate-100" />

              {/* Bank Account Details Card */}
              <div className="border border-slate-100 rounded-xl p-6 bg-white shadow-sm flex flex-col gap-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-slate-50 flex items-center justify-center text-slate-500 shrink-0 border border-slate-100">
                      <Icon className="h-5 w-5" name="bank" />
                    </div>
                    <div>
                      <div className="text-[14px] font-bold text-slate-800 leading-tight">
                        HDFC Bank Ltd.
                      </div>
                      <div className="text-[11.5px] text-slate-400 mt-0.5">
                        Primary Receiving Account
                      </div>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1 rounded-full border border-green-200 bg-green-50 px-2.5 py-0.5 text-[10.5px] font-bold text-green-600">
                    <Icon className="h-3 w-3" name="circleCheck" />
                    Verified
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8 text-[13px]">
                  <div>
                    <span className="text-slate-400 block mb-0.5">Account Holder Name</span>
                    <span className="font-bold text-slate-800">
                      {profile?.name || "Rohan Mehta"}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5">Account Number</span>
                    <span className="font-bold text-slate-800">•••• •••• 9382</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5">IFSC Code</span>
                    <span className="font-bold text-slate-800">HDFC0001234</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5">Account Type</span>
                    <span className="font-bold text-slate-800">Savings Account</span>
                  </div>
                </div>

                <hr className="border-slate-100" />

                <div className="flex items-center gap-2">
                  <button
                    onClick={() =>
                      showSuccessToast(
                        "Request Initiated",
                        "Bank details update request sent to compliance support."
                      )
                    }
                    className="px-3 py-1.5 border border-slate-200 rounded-lg text-[12.5px] font-bold text-slate-700 bg-white hover:bg-slate-50 transition-colors shadow-sm cursor-pointer"
                    type="button"
                  >
                    Update Bank Details
                  </button>
                  <button
                    onClick={() =>
                      showSuccessToast(
                        "Request Sent",
                        "Account removal request submitted to support."
                      )
                    }
                    className="px-3 py-1.5 text-red-500 text-[12.5px] font-bold hover:text-red-600 transition-colors cursor-pointer bg-transparent border-none"
                    type="button"
                  >
                    Remove Account
                  </button>
                </div>
              </div>

              {/* Tax Information Card */}
              <div className="border border-slate-100 rounded-xl p-6 bg-white shadow-sm flex flex-col gap-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-slate-50 flex items-center justify-center text-slate-500 shrink-0 border border-slate-100">
                      <Icon className="h-5 w-5" name="fileText" />
                    </div>
                    <div>
                      <div className="text-[14px] font-bold text-slate-800 leading-tight">
                        Tax Information
                      </div>
                      <div className="text-[11.5px] text-slate-400 mt-0.5">
                        PAN & TDS Details for statutory compliance
                      </div>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1 rounded-full border border-green-200 bg-green-50 px-2.5 py-0.5 text-[10.5px] font-bold text-green-600">
                    <Icon className="h-3 w-3" name="circleCheck" />
                    Verified
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8 text-[13px]">
                  <div>
                    <span className="text-slate-400 block mb-0.5">PAN Number</span>
                    <span className="font-bold text-slate-800">ABCDE1234F</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5">Name on PAN</span>
                    <span className="font-bold text-slate-800">
                      {profile?.name || "Rohan Mehta"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Recent Payouts Table */}
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-[14.5px] font-bold text-slate-800">Recent Payouts</h3>
                  <button
                    onClick={() =>
                      showSuccessToast("Export Started", "Downloading payouts history CSV...")
                    }
                    className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 rounded-lg text-[12px] font-bold text-slate-700 bg-white hover:bg-slate-50 transition-colors shadow-sm cursor-pointer"
                    type="button"
                  >
                    <Icon className="h-3.5 w-3.5" name="download" />
                    Export CSV
                  </button>
                </div>

                <div className="overflow-hidden border border-slate-100 rounded-lg">
                  <table className="w-full border-collapse text-left">
                    <thead>
                      <tr className="bg-[#122238] text-white text-[12px] font-bold">
                        <th className="px-4 py-3 font-semibold">Date</th>
                        <th className="px-4 py-3 font-semibold">Transaction ID</th>
                        <th className="px-4 py-3 font-semibold">Amount</th>
                        <th className="px-4 py-3 font-semibold">Status</th>
                      </tr>
                    </thead>
                    <tbody className="text-[13px] text-slate-700 divide-y divide-slate-100">
                      <tr className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3 text-slate-500">Oct 15, 2023</td>
                        <td className="px-4 py-3 text-slate-400 font-mono">TXN-84729104</td>
                        <td className="px-4 py-3 font-bold text-slate-800">₹45,200</td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center gap-1 text-green-600 font-semibold text-[12.5px]">
                            <Icon className="h-3 w-3" name="circleCheck" />
                            Processed
                          </span>
                        </td>
                      </tr>
                      <tr className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3 text-slate-500">Oct 01, 2023</td>
                        <td className="px-4 py-3 text-slate-400 font-mono">TXN-73920183</td>
                        <td className="px-4 py-3 font-bold text-slate-800">₹38,500</td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center gap-1 text-green-600 font-semibold text-[12.5px]">
                            <Icon className="h-3 w-3" name="circleCheck" />
                            Processed
                          </span>
                        </td>
                      </tr>
                      <tr className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3 text-slate-500">Sep 15, 2023</td>
                        <td className="px-4 py-3 text-slate-400 font-mono">TXN-64829102</td>
                        <td className="px-4 py-3 font-bold text-slate-800">₹41,100</td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center gap-1 text-green-600 font-semibold text-[12.5px]">
                            <Icon className="h-3 w-3" name="circleCheck" />
                            Processed
                          </span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === "Notifications" && <NotificationsTab />}

          {activeTab === "Delete Account" && <DeleteAccountTab />}
        </div>
      </div>
    </>
  );
}
