"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Toaster, toast } from "sonner";

import { Icon } from "@/components/stoxify-icon";
import { LogoutButton } from "@/components/logout-button";
import { cleanErrorMessage, formatStatus } from "@/lib/utils";

type ProfileUser = {
  user_id: string;
  name: string;
  email: string;
  phone: string;
  state: string;
};

type Subscription = {
  subscription_id: string;
  plan_id: string;
  plan_name?: string;
  batch_name?: string;
  analyst_name?: string;
  analyst_id?: string;
  status: string;
  start_date: string;
  end_date: string;
  days_remaining?: number;
  payment?: {
    amount?: number;
    payment_method?: string;
  };
};

type Transaction = {
  transaction_id: string;
  type: "PAYMENT" | "REFUND";
  status: "CREATED" | "CAPTURED" | "FAILED" | "REFUNDED";
  subscription_id: string;
  plan_name?: string;
  analyst_name?: string;
  amount: number;
  currency?: string;
  razorpay_payment_id?: string;
  razorpay_order_id?: string;
  coupon_applied?: string;
  discount_amount?: number;
  reason?: string;
  created_at: string;
};

const gradients = [
  "linear-gradient(135deg,#3B82F6,#2D5BE3)",
  "linear-gradient(135deg,#8B5CF6,#6D28D9)",
  "linear-gradient(135deg,#F59E0B,#D97706)",
  "linear-gradient(135deg,#10B981,#059669)",
  "linear-gradient(135deg,#EF4444,#DC2626)",
];

function getGradient(id: string): string {
  let hash = 0;
  for (let i = 0; i < (id || "x").length; i++) {
    hash = (id || "x").charCodeAt(i) + ((hash << 5) - hash);
  }
  return gradients[Math.abs(hash) % gradients.length];
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "U";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return parts
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function daysRemaining(endDate: string): number {
  const diff = new Date(endDate).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

function formatCurrency(amount: number, currency = "INR"): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(amount);
}

function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// Visual status mapping for the transactions list / receipt.
const TXN_STATUS: Record<Transaction["status"], { label: string; cls: string }> = {
  CAPTURED: { label: "Paid", cls: "bg-[var(--green-light)] text-[var(--green)]" },
  CREATED: { label: "Pending", cls: "bg-[var(--orange-light)] text-[var(--orange)]" },
  FAILED: { label: "Failed", cls: "bg-[var(--red-light)] text-[var(--red)]" },
  REFUNDED: { label: "Refunded", cls: "bg-slate-200 text-slate-600" },
};

function SubscriptionCard({ sub }: { sub: Subscription }) {
  const isActive = sub.status === "ACTIVE";
  const days = sub.days_remaining ?? daysRemaining(sub.end_date);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 transition-all hover:shadow-[0_8px_24px_rgba(0,0,0,0.06)] hover:border-slate-300">
      <div className="flex items-start gap-4 mb-4">
        <div
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[12px] text-[14px] font-extrabold text-white"
          style={{ background: getGradient(sub.analyst_id || sub.plan_id) }}
        >
          {getInitials(sub.analyst_name || "A")}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-[14px] font-extrabold text-[var(--ink)] truncate">
            {sub.analyst_name || "Analyst"}
          </h3>
          <p className="text-[12px] text-[var(--muted)] truncate">
            {sub.plan_name
              ? `${sub.plan_name}${sub.batch_name ? ` • ${sub.batch_name}` : ""}`
              : sub.plan_id}
          </p>
        </div>
        <span
          className={[
            "shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-bold",
            isActive
              ? "bg-[var(--green-light)] text-[var(--green)]"
              : sub.status === "EXPIRED"
                ? "bg-[var(--orange-light)] text-[var(--orange)]"
                : "bg-[var(--red-light)] text-[var(--red)]",
          ].join(" ")}
        >
          {formatStatus(sub.status)}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-3 rounded-xl bg-slate-50 border border-slate-100 p-3 mb-4">
        <div className="text-center">
          <div className="text-[10px] text-[var(--muted)] font-bold uppercase tracking-wider mb-0.5">
            Started
          </div>
          <div className="text-[12px] font-extrabold text-[var(--ink)]">
            {formatDate(sub.start_date)}
          </div>
        </div>
        <div className="text-center">
          <div className="text-[10px] text-[var(--muted)] font-bold uppercase tracking-wider mb-0.5">
            Expires
          </div>
          <div className="text-[12px] font-extrabold text-[var(--ink)]">
            {formatDate(sub.end_date)}
          </div>
        </div>
        <div className="text-center">
          <div className="text-[10px] text-[var(--muted)] font-bold uppercase tracking-wider mb-0.5">
            Remaining
          </div>
          <div
            className={`text-[12px] font-extrabold ${
              isActive && days <= 3
                ? "text-[var(--red)]"
                : isActive
                  ? "text-[var(--green)]"
                  : "text-[var(--muted)]"
            }`}
          >
            {isActive ? `${days} days` : "—"}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {isActive && sub.analyst_id && (
          <Link
            href={`/trader/analyst/${sub.analyst_id}`}
            className="flex-1 rounded-full border border-slate-200 bg-white px-3 py-2 text-center text-[12px] font-bold text-[var(--muted)] transition-colors hover:border-slate-400 hover:text-[var(--ink)]"
          >
            View Analyst
          </Link>
        )}
        {!isActive && (
          <Link
            href="/trader/discover"
            className="flex-1 rounded-full bg-emerald-700 px-3 py-2 text-center text-[12px] font-bold text-white transition-colors hover:bg-emerald-800"
          >
            Renew Batch
          </Link>
        )}
      </div>
    </div>
  );
}

export function TraderProfile({ user }: { user: ProfileUser }) {
  // Local User State
  const [userData, setUserData] = useState<ProfileUser>(user);

  // Navigation Tabs (Settings / Subscriptions / Transactions)
  const [activeTab, setActiveTab] = useState<"settings" | "subscriptions" | "transactions">(
    "settings"
  );

  // Profile Edit fields
  const [nameInput, setNameInput] = useState(user.name || "");
  const [savingProfile, setSavingProfile] = useState(false);

  // KYC Aadhaar Verification fields
  const [aadhaarInput, setAadhaarInput] = useState("");
  const [submittingKyc, setSubmittingKyc] = useState(false);
  const [kycError, setKycError] = useState<string | null>(null);

  // Account Deletion
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteReason, setDeleteReason] = useState("");
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  // "confirm" → reason + type DELETE; "otp" → enter the code sent to the phone
  const [deleteStep, setDeleteStep] = useState<"confirm" | "otp">("confirm");
  const [deleteOtp, setDeleteOtp] = useState("");
  const [deletePhoneMasked, setDeletePhoneMasked] = useState("");
  const [sendingDeleteOtp, setSendingDeleteOtp] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);

  // Subscriptions Tab states
  const [activeSubs, setActiveSubs] = useState<Subscription[]>([]);
  const [expiredSubs, setExpiredSubs] = useState<Subscription[]>([]);
  const [cancelledSubs, setCancelledSubs] = useState<Subscription[]>([]);
  const [loadingSubs, setLoadingSubs] = useState(true);
  const [subTab, setSubTab] = useState<"ACTIVE" | "EXPIRED" | "CANCELLED">("ACTIVE");

  // Transactions Tab states
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loadingTxns, setLoadingTxns] = useState(true);
  const [receipt, setReceipt] = useState<Transaction | null>(null);

  // Sync activeTab on URL parameter mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get("tab");
      Promise.resolve().then(() => {
        if (tabParam === "subscriptions" || tabParam === "transactions") {
          setActiveTab(tabParam);
        } else {
          setActiveTab("settings");
        }
      });
    }
  }, []);

  const handleTabChange = (tab: "settings" | "subscriptions" | "transactions") => {
    setActiveTab(tab);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      if (tab === "settings") {
        url.searchParams.delete("tab");
      } else {
        url.searchParams.set("tab", tab);
      }
      window.history.pushState({}, "", url.pathname + url.search);
    }
  };

  // Fetch Subscriptions data
  const fetchProfileSubscriptions = useCallback(async () => {
    setLoadingSubs(true);
    try {
      const [activeRes, expiredRes, cancelledRes] = await Promise.all([
        fetch("/api/trader/subscriptions?status=ACTIVE&limit=50"),
        fetch("/api/trader/subscriptions?status=EXPIRED&limit=50"),
        fetch("/api/trader/subscriptions?status=CANCELLED&limit=50"),
      ]);

      const [activeData, expiredData, cancelledData] = await Promise.all([
        activeRes.json().catch(() => ({})),
        expiredRes.json().catch(() => ({})),
        cancelledRes.json().catch(() => ({})),
      ]);

      setActiveSubs(activeData.subscriptions ?? activeData.data ?? []);
      setExpiredSubs(expiredData.subscriptions ?? expiredData.data ?? []);
      setCancelledSubs(cancelledData.subscriptions ?? cancelledData.data ?? []);
    } catch (err) {
      console.error("Failed to fetch subscriptions:", err);
    } finally {
      setLoadingSubs(false);
    }
  }, []);

  useEffect(() => {
    Promise.resolve().then(() => {
      fetchProfileSubscriptions();
    });
  }, [fetchProfileSubscriptions]);

  // Fetch Transactions (payment history) data
  const fetchTransactions = useCallback(async () => {
    setLoadingTxns(true);
    try {
      const res = await fetch("/api/trader/transactions?limit=100");
      const data = await res.json().catch(() => ({}));
      setTransactions(data.transactions ?? data.data ?? []);
    } catch (err) {
      console.error("Failed to fetch transactions:", err);
    } finally {
      setLoadingTxns(false);
    }
  }, []);

  useEffect(() => {
    Promise.resolve().then(() => {
      fetchTransactions();
    });
  }, [fetchTransactions]);

  // Update Profile handler (Backend Supported PATCH /me)
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = nameInput.trim();
    if (cleanName.length < 2) {
      toast.error("Name must be at least 2 characters long.");
      return;
    }

    setSavingProfile(true);
    try {
      const res = await fetch("/api/trader/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: cleanName }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const cleaned = cleanErrorMessage(data, data.error || "Failed to update profile.");
        throw new Error(cleaned);
      }
      setUserData((prev) => ({ ...prev, name: cleanName }));
      toast.success("Profile updated successfully!");
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Something went wrong.";
      toast.error(errorMessage);
    } finally {
      setSavingProfile(false);
    }
  };

  // Format Aadhaar: XXXX XXXX XXXX
  const handleAadhaarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, "");
    if (raw.length > 12) return;

    let formatted = "";
    for (let i = 0; i < raw.length; i++) {
      if (i > 0 && i % 4 === 0) {
        formatted += " ";
      }
      formatted += raw[i];
    }
    setAadhaarInput(formatted);
  };

  // Verify Aadhaar KYC (Backend Supported POST /kyc/submit)
  const handleVerifyKyc = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanAadhaar = aadhaarInput.replace(/\s/g, "");
    if (cleanAadhaar.length !== 12) {
      setKycError("Please enter a valid 12-digit Aadhaar number.");
      return;
    }

    setKycError(null);
    setSubmittingKyc(true);
    try {
      const res = await fetch("/api/user/kyc", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ aadhaar_number: cleanAadhaar }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        const cleaned = cleanErrorMessage(data, data.error || "KYC verification failed.");
        throw new Error(cleaned);
      }

      setUserData((prev) => ({ ...prev, state: data.state || "ACTIVE" }));
      toast.success("Identity verified successfully!");
      setAadhaarInput("");

      // Auto-fetch subscriptions again if status shifts to ACTIVE
      fetchProfileSubscriptions();
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "An unexpected error occurred during KYC.";
      setKycError(errorMessage);
    } finally {
      setSubmittingKyc(false);
    }
  };

  // Account Deletion — step 1: send the confirmation OTP to the registered phone
  const handleRequestDeleteOtp = async () => {
    if (deleteConfirmText !== "DELETE") return;

    setSendingDeleteOtp(true);
    try {
      const res = await fetch("/api/user/delete/request-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const cleaned = cleanErrorMessage(data, data.error || "Failed to send verification code.");
        throw new Error(cleaned);
      }
      setDeletePhoneMasked(data.phone_masked || "");
      setDeleteOtp("");
      setDeleteStep("otp");
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Something went wrong.";
      toast.error(errorMessage);
    } finally {
      setSendingDeleteOtp(false);
    }
  };

  // Account Deletion — step 2: confirm with the OTP
  const handleDeleteAccount = async () => {
    if (deleteOtp.length !== 6) return;

    setDeletingAccount(true);
    try {
      const res = await fetch("/api/user/deactivate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ otp: deleteOtp, reason: deleteReason.trim() || undefined }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const cleaned = cleanErrorMessage(data, data.error || "Failed to delete account.");
        throw new Error(cleaned);
      }
      toast.success("Your account has been deleted.");
      // Redirect to home after a brief delay so the toast is visible
      setTimeout(() => {
        window.location.href = "/";
      }, 1500);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Something went wrong.";
      toast.error(errorMessage);
      setDeletingAccount(false);
    }
  };

  return (
    <div className="px-4 py-8 lg:px-12 lg:py-12 max-w-[1200px] mx-auto font-sans">
      <Toaster position="bottom-right" />

      <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-8">
        {/* ─── LEFT COLUMN: PROFILE CARD ─── */}
        <div className="space-y-6">
          <div className="rounded-[24px] border border-slate-200 bg-white shadow-[0_8px_30px_rgb(0,0,0,0.02)] overflow-hidden">
            {/* Header info */}
            <div className="flex items-center gap-4 px-6 pt-6 pb-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-[var(--brand)] to-[#4f46e5] text-[18px] font-extrabold text-white shadow-md select-none">
                {getInitials(userData.name || userData.phone || "U")}
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="text-[15px] font-extrabold text-[var(--ink)] leading-snug truncate">
                  {userData.name || "Trader"}
                </h4>
                <p className="text-[12px] text-[var(--muted)] truncate">{userData.phone}</p>
              </div>
            </div>

            {/* Subscription KPI cells */}
            <div className="mx-6 my-2 grid grid-cols-2 rounded-xl bg-slate-50 border border-slate-100 p-3 text-center select-none">
              <div className="border-r border-slate-200/60">
                <div className="text-[18px] font-extrabold text-[var(--ink)]">
                  {loadingSubs ? "—" : activeSubs.length}
                </div>
                <div className="text-[11px] font-semibold text-[var(--muted)]">Active</div>
              </div>
              <div>
                <div className="text-[18px] font-extrabold text-[var(--ink)]">
                  {loadingSubs
                    ? "—"
                    : activeSubs.length + expiredSubs.length + cancelledSubs.length}
                </div>
                <div className="text-[11px] font-semibold text-[var(--muted)]">Total</div>
              </div>
            </div>

            {/* Sidebar list items */}
            <div className="px-3 pb-6 pt-4 border-t border-slate-100">
              <ul className="flex flex-col gap-1 list-none p-0 m-0">
                <li>
                  <button
                    onClick={() => handleTabChange("settings")}
                    className={`w-full flex items-center gap-3 rounded-xl px-4 py-3 text-[13.5px] font-bold transition-all text-left ${
                      activeTab === "settings"
                        ? "bg-emerald-50/60 text-emerald-700"
                        : "text-[var(--muted)] hover:bg-slate-50 hover:text-[var(--ink)]"
                    }`}
                  >
                    <Icon
                      name="users"
                      className={`h-4.5 w-4.5 ${activeTab === "settings" ? "text-emerald-600" : "text-slate-400"}`}
                    />
                    My Profile
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => handleTabChange("subscriptions")}
                    className={`w-full flex items-center gap-3 rounded-xl px-4 py-3 text-[13.5px] font-bold transition-all text-left ${
                      activeTab === "subscriptions"
                        ? "bg-emerald-50/60 text-emerald-700"
                        : "text-[var(--muted)] hover:bg-slate-50 hover:text-[var(--ink)]"
                    }`}
                  >
                    <Icon
                      name="listChecks"
                      className={`h-4.5 w-4.5 ${activeTab === "subscriptions" ? "text-emerald-600" : "text-slate-400"}`}
                    />
                    Subscriptions
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => handleTabChange("transactions")}
                    className={`w-full flex items-center gap-3 rounded-xl px-4 py-3 text-[13.5px] font-bold transition-all text-left ${
                      activeTab === "transactions"
                        ? "bg-emerald-50/60 text-emerald-700"
                        : "text-[var(--muted)] hover:bg-slate-50 hover:text-[var(--ink)]"
                    }`}
                  >
                    <Icon
                      name="creditCard"
                      className={`h-4.5 w-4.5 ${activeTab === "transactions" ? "text-emerald-600" : "text-slate-400"}`}
                    />
                    Transactions
                  </button>
                </li>
                <li className="mt-4 pt-4 border-t border-slate-100">
                  <LogoutButton className="w-full flex items-center gap-3 rounded-xl px-4 py-3 text-[13.5px] font-bold text-red-600 transition-all hover:bg-red-50 text-left">
                    <Icon name="x" className="h-4.5 w-4.5 text-red-500" />
                    Log Out
                  </LogoutButton>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* ─── RIGHT COLUMN: MAIN PANEL ─── */}
        <div className="space-y-6">
          {/* Header Title */}
          <div>
            <h1 className="font-serif text-[36px] font-normal tracking-tight text-[var(--ink)] leading-none mb-2 select-none">
              My Profile
            </h1>
            <p className="text-[13.5px] text-[var(--muted)]">
              Manage your trading subscriptions, account details and settings.
            </p>
          </div>

          {/* Horizontal Navigation Underline Tabs */}
          <div className="flex border-b border-slate-200/80 gap-6">
            <button
              onClick={() => handleTabChange("settings")}
              className={`pb-3.5 text-[14px] font-bold tracking-tight border-b-2 transition-all relative ${
                activeTab === "settings"
                  ? "border-emerald-600 text-emerald-800 font-extrabold"
                  : "border-transparent text-[var(--muted)] hover:text-[var(--ink)]"
              }`}
            >
              Settings
            </button>
            <button
              onClick={() => handleTabChange("subscriptions")}
              className={`pb-3.5 text-[14px] font-bold tracking-tight border-b-2 transition-all relative ${
                activeTab === "subscriptions"
                  ? "border-emerald-600 text-emerald-800 font-extrabold"
                  : "border-transparent text-[var(--muted)] hover:text-[var(--ink)]"
              }`}
            >
              Subscriptions
            </button>
            <button
              onClick={() => handleTabChange("transactions")}
              className={`pb-3.5 text-[14px] font-bold tracking-tight border-b-2 transition-all relative ${
                activeTab === "transactions"
                  ? "border-emerald-600 text-emerald-800 font-extrabold"
                  : "border-transparent text-[var(--muted)] hover:text-[var(--ink)]"
              }`}
            >
              Transactions
            </button>
          </div>

          {/* ─── TAB VIEW: SETTINGS ─── */}
          {activeTab === "settings" && (
            <div className="space-y-8 animate-fade-in duration-200">
              <div>
                <h3 className="text-[17px] font-extrabold text-[var(--ink)] mb-6 select-none">
                  Edit Personal Information
                </h3>

                {/* Large Avatar Element */}
                <div className="flex items-center gap-5 mb-8">
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-tr from-[var(--brand)] to-[#4f46e5] text-[24px] font-extrabold text-white shadow-lg border-4 border-white ring-1 ring-slate-200 select-none">
                    {getInitials(userData.name || userData.phone || "U")}
                  </div>
                </div>

                {/* Profile Edit fields */}
                <form onSubmit={handleUpdateProfile} className="space-y-6 max-w-[540px]">
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-[var(--muted)] mb-2 select-none">
                      Full Name
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={nameInput}
                        onChange={(e) => setNameInput(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-white py-3 px-4 text-[13.5px] font-semibold text-[var(--ink)] placeholder:text-slate-400 outline-none focus:border-emerald-500 transition-colors pr-10"
                        placeholder="Your full name"
                      />
                      <Icon
                        name="sparkle"
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300 pointer-events-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-[var(--muted)] mb-2 select-none">
                      Phone Number
                    </label>
                    <input
                      type="text"
                      disabled
                      value={userData.phone || "Not provided"}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/70 py-3 px-4 text-[13.5px] font-semibold text-[var(--muted)] outline-none cursor-not-allowed"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={savingProfile || nameInput.trim() === userData.name}
                    className="rounded-full bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white font-bold text-[13px] px-6 py-2.5 shadow-sm active:scale-[0.98] transition-all cursor-pointer"
                  >
                    {savingProfile ? "Updating..." : "Update profile"}
                  </button>
                </form>
              </div>

              {/* Identity Verification (KYC) Section */}
              <div className="border-t border-slate-100 pt-8 max-w-[540px]">
                <h3 className="text-[17px] font-extrabold text-[var(--ink)] mb-2 select-none">
                  Identity Verification (KYC)
                </h3>
                <p className="text-[12.5px] text-[var(--muted)] leading-relaxed mb-5 select-none">
                  SEBI regulations require identity verification (KYC) for all users accessing
                  premium research analyst signals.
                </p>

                {userData.state === "ACTIVE" ? (
                  <div className="flex items-center gap-3.5 rounded-xl border border-emerald-100 bg-emerald-50/50 p-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600">
                      <Icon name="shieldCheck" className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="text-[13.5px] font-bold text-emerald-800 select-none">
                        Aadhaar KYC Verified
                      </h4>
                      <p className="text-[12px] text-emerald-700">
                        Your identity is verified. You have full access to subscribe to analyst
                        batches.
                      </p>
                    </div>
                  </div>
                ) : userData.state === "KYC_PENDING" ? (
                  <div className="flex items-center gap-3.5 rounded-xl border border-amber-100 bg-amber-50/50 p-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600">
                      <Icon name="timer" className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="text-[13.5px] font-bold text-amber-800 select-none">
                        Verification Pending
                      </h4>
                      <p className="text-[12px] text-amber-700">
                        Your Aadhaar KYC verification is pending review.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3.5 rounded-xl border border-slate-200 bg-slate-50 p-4 mb-4 select-none">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-200 text-slate-500">
                        <Icon name="lock" className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="text-[13.5px] font-bold text-[var(--ink)]">
                          Verification Required
                        </h4>
                        <p className="text-[12px] text-[var(--muted)]">
                          Please verify your identity using Aadhaar to unlock trading signals.
                        </p>
                      </div>
                    </div>

                    <form onSubmit={handleVerifyKyc} className="space-y-4">
                      <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-[var(--muted)] mb-2 select-none">
                          Aadhaar Number
                        </label>
                        <input
                          type="text"
                          value={aadhaarInput}
                          onChange={handleAadhaarChange}
                          placeholder="0000 0000 0000"
                          disabled={submittingKyc}
                          className="w-full rounded-xl border border-slate-200 bg-white py-3 px-4 text-[13.5px] font-mono tracking-wider text-[var(--ink)] placeholder:text-slate-300 outline-none focus:border-emerald-500 transition-colors"
                        />
                      </div>

                      {kycError && (
                        <p className="text-[12px] font-semibold text-red-600 flex items-center gap-1.5 animate-slide-down">
                          <Icon name="x" className="h-3.5 w-3.5 animate-bounce" />
                          {kycError}
                        </p>
                      )}

                      <button
                        type="submit"
                        disabled={submittingKyc || aadhaarInput.replace(/\s/g, "").length !== 12}
                        className="rounded-full bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white font-bold text-[13px] px-6 py-2.5 shadow-sm active:scale-[0.98] transition-all cursor-pointer"
                      >
                        {submittingKyc ? "Verifying..." : "Verify Aadhaar"}
                      </button>
                    </form>
                  </div>
                )}
              </div>

              {/* ─── Danger Zone — Account Deletion ─── */}
              <div className="border-t border-red-100 pt-8 max-w-[540px]">
                <h3 className="text-[17px] font-extrabold text-red-600 mb-2 select-none flex items-center gap-2">
                  <Icon name="trash" className="h-4.5 w-4.5" />
                  Danger Zone
                </h3>
                <p className="text-[12.5px] text-[var(--muted)] leading-relaxed mb-5 select-none">
                  Permanently delete your Stoxify account. This action is irreversible — all your
                  subscriptions will be cancelled and you will lose access immediately.
                </p>

                <button
                  type="button"
                  onClick={() => setShowDeleteModal(true)}
                  className="rounded-full border-2 border-red-200 bg-red-50 hover:bg-red-100 text-red-600 font-bold text-[13px] px-6 py-2.5 transition-all active:scale-[0.98] cursor-pointer"
                >
                  Delete My Account
                </button>
              </div>
            </div>
          )}

          {/* ─── TAB VIEW: SUBSCRIPTIONS ─── */}
          {activeTab === "subscriptions" && (
            <div className="space-y-6 animate-fade-in duration-200">
              {/* Filter Tabs */}
              <div className="flex rounded-lg border border-slate-200/80 bg-slate-50 p-0.5 w-fit">
                {(["ACTIVE", "EXPIRED", "CANCELLED"] as const).map((t) => {
                  const count =
                    t === "ACTIVE"
                      ? activeSubs.length
                      : t === "EXPIRED"
                        ? expiredSubs.length
                        : cancelledSubs.length;
                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setSubTab(t)}
                      className={[
                        "rounded-md px-4 py-1.5 text-[12px] font-bold transition-all flex items-center gap-1.5",
                        subTab === t
                          ? "bg-white text-emerald-800 shadow-sm"
                          : "text-[var(--muted)] hover:text-[var(--ink)]",
                      ].join(" ")}
                    >
                      <span>{t.charAt(0) + t.slice(1).toLowerCase()}</span>
                      <span
                        className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${subTab === t ? "bg-emerald-100 text-emerald-800" : "bg-slate-200/80 text-slate-500"}`}
                      >
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* List grid */}
              {loadingSubs ? (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {[1, 2].map((i) => (
                    <div
                      key={i}
                      className="rounded-xl border border-slate-200 bg-white p-5 animate-pulse"
                    >
                      <div className="flex items-start gap-4 mb-4">
                        <div className="h-11 w-11 rounded-[12px] bg-slate-100" />
                        <div className="flex-1">
                          <div className="h-4 w-28 rounded bg-slate-100 mb-2" />
                          <div className="h-3 w-20 rounded bg-slate-100" />
                        </div>
                      </div>
                      <div className="h-16 rounded-lg bg-slate-100 mb-4" />
                      <div className="h-9 rounded-lg bg-slate-100" />
                    </div>
                  ))}
                </div>
              ) : (subTab === "ACTIVE"
                  ? activeSubs
                  : subTab === "EXPIRED"
                    ? expiredSubs
                    : cancelledSubs
                ).length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed border-slate-200 rounded-2xl bg-slate-50/30">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-[var(--muted)]">
                    <Icon name="listChecks" className="h-5 w-5" />
                  </div>
                  <h3 className="text-[14px] font-bold text-[var(--ink)] mb-1 select-none">
                    {subTab === "ACTIVE"
                      ? "No active subscriptions"
                      : `No ${subTab.toLowerCase()} subscriptions`}
                  </h3>
                  <p className="text-[12.5px] text-[var(--muted)] max-w-[280px] mb-4 select-none">
                    {subTab === "ACTIVE"
                      ? "Browse analysts and subscribe to a batch to start receiving live trade alerts."
                      : "Your subscription history will appear here."}
                  </p>
                  {subTab === "ACTIVE" && (
                    <Link
                      href="/trader/discover"
                      className="inline-flex items-center gap-2 rounded-full bg-emerald-700 px-5 py-2 text-[12px] font-bold text-white hover:bg-emerald-800 transition-all shadow-sm"
                    >
                      <Icon name="search" className="h-3.5 w-3.5" />
                      Discover Analysts
                    </Link>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {(subTab === "ACTIVE"
                    ? activeSubs
                    : subTab === "EXPIRED"
                      ? expiredSubs
                      : cancelledSubs
                  ).map((sub) => (
                    <SubscriptionCard key={sub.subscription_id} sub={sub} />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ─── TAB VIEW: TRANSACTIONS ─── */}
          {activeTab === "transactions" && (
            <div className="space-y-4 animate-fade-in duration-200">
              {loadingTxns ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="h-[68px] rounded-xl border border-slate-200 bg-white animate-pulse"
                    />
                  ))}
                </div>
              ) : transactions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed border-slate-200 rounded-2xl bg-slate-50/30">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-[var(--muted)]">
                    <Icon name="creditCard" className="h-5 w-5" />
                  </div>
                  <h3 className="text-[14px] font-bold text-[var(--ink)] mb-1 select-none">
                    No transactions yet
                  </h3>
                  <p className="text-[12.5px] text-[var(--muted)] max-w-[280px] select-none">
                    Your payment history and receipts will appear here once you subscribe to a
                    batch.
                  </p>
                </div>
              ) : (
                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                  {transactions.map((txn, i) => {
                    const meta = TXN_STATUS[txn.status] ?? TXN_STATUS.CREATED;
                    const isRefund = txn.type === "REFUND";
                    return (
                      <div
                        key={txn.transaction_id}
                        className={`flex items-center gap-4 px-5 py-3.5 ${i !== 0 ? "border-t border-slate-100" : ""}`}
                      >
                        <div
                          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${isRefund ? "bg-slate-100 text-slate-500" : "bg-emerald-50 text-emerald-600"}`}
                        >
                          <Icon
                            name={isRefund ? "banknote" : "creditCard"}
                            className="h-4.5 w-4.5"
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-[13.5px] font-bold text-[var(--ink)] truncate">
                            {txn.plan_name || txn.analyst_name || txn.subscription_id}
                          </div>
                          <div className="text-[11.5px] text-[var(--muted)] truncate">
                            {formatDateTime(txn.created_at)}
                            {txn.analyst_name ? ` · ${txn.analyst_name}` : ""}
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <div
                            className={`text-[13.5px] font-extrabold ${isRefund ? "text-slate-500" : "text-[var(--ink)]"}`}
                          >
                            {isRefund ? "-" : ""}
                            {formatCurrency(txn.amount, txn.currency)}
                          </div>
                          <span
                            className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-bold ${meta.cls}`}
                          >
                            {meta.label}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setReceipt(txn)}
                          className="shrink-0 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[11.5px] font-bold text-[var(--muted)] transition-colors hover:border-slate-400 hover:text-[var(--ink)]"
                        >
                          Receipt
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ─── RECEIPT MODAL ─── */}
      {receipt && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 print:bg-white print:p-0"
          onClick={() => setReceipt(null)}
        >
          <div
            id="txn-receipt"
            className="w-full max-w-[440px] rounded-2xl bg-white p-7 shadow-2xl print:max-w-none print:shadow-none"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <div className="text-[18px] font-extrabold text-[var(--ink)]">Stoxify</div>
                <div className="text-[11px] text-[var(--muted)]">Payment Receipt</div>
              </div>
              <span
                className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${(TXN_STATUS[receipt.status] ?? TXN_STATUS.CREATED).cls}`}
              >
                {(TXN_STATUS[receipt.status] ?? TXN_STATUS.CREATED).label}
              </span>
            </div>

            <div className="rounded-xl bg-slate-50 border border-slate-100 p-4 mb-5 text-center">
              <div className="text-[11px] font-bold uppercase tracking-wider text-[var(--muted)] mb-1">
                {receipt.type === "REFUND" ? "Refunded" : "Amount Paid"}
              </div>
              <div className="text-[26px] font-extrabold text-[var(--ink)]">
                {formatCurrency(receipt.amount, receipt.currency)}
              </div>
            </div>

            <dl className="space-y-2.5 text-[12.5px] mb-6">
              {[
                ["Invoice No.", receipt.transaction_id],
                ["Date", formatDateTime(receipt.created_at)],
                ["Batch", receipt.plan_name || "—"],
                ["Analyst", receipt.analyst_name || "—"],
                ["Subscription", receipt.subscription_id],
                receipt.razorpay_payment_id ? ["Payment ID", receipt.razorpay_payment_id] : null,
                receipt.coupon_applied ? ["Coupon", receipt.coupon_applied] : null,
                receipt.reason ? ["Reason", receipt.reason] : null,
              ]
                .filter((row): row is [string, string] => Array.isArray(row))
                .map(([label, value]) => (
                  <div key={label} className="flex items-start justify-between gap-4">
                    <dt className="text-[var(--muted)] font-semibold shrink-0">{label}</dt>
                    <dd className="text-[var(--ink)] font-bold text-right break-all">{value}</dd>
                  </div>
                ))}
            </dl>

            <div className="flex gap-2 print:hidden">
              <button
                type="button"
                onClick={() => window.print()}
                className="flex-1 rounded-full bg-emerald-700 px-4 py-2.5 text-[12.5px] font-bold text-white hover:bg-emerald-800 transition-colors"
              >
                Download / Print
              </button>
              <button
                type="button"
                onClick={() => setReceipt(null)}
                className="rounded-full border border-slate-200 px-4 py-2.5 text-[12.5px] font-bold text-[var(--muted)] hover:text-[var(--ink)] transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── DELETE ACCOUNT CONFIRMATION MODAL ─── */}
      {showDeleteModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
          onClick={() => {
            if (deletingAccount || sendingDeleteOtp) return;
            setShowDeleteModal(false);
            setDeleteStep("confirm");
            setDeleteConfirmText("");
            setDeleteReason("");
            setDeleteOtp("");
          }}
        >
          <div
            className="w-full max-w-[460px] rounded-2xl bg-white p-7 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center gap-3 mb-5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-100 text-red-600">
                <Icon name="trash" className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-[17px] font-extrabold text-[var(--ink)] select-none">
                  {deleteStep === "confirm" ? "Delete Account" : "Verify It's You"}
                </h3>
                <p className="text-[12px] text-[var(--muted)]">
                  {deleteStep === "confirm"
                    ? "This action cannot be undone."
                    : `Enter the 6-digit code sent to ${deletePhoneMasked || "your registered phone"}.`}
                </p>
              </div>
            </div>

            {deleteStep === "confirm" ? (
              <>
                {/* Warning */}
                <div className="rounded-xl bg-red-50 border border-red-100 p-4 mb-5 text-[12.5px] text-red-700 leading-relaxed">
                  <strong className="text-red-800">Warning:</strong> Deleting your account will:
                  <ul className="mt-2 ml-4 space-y-1 list-disc">
                    <li>Cancel all your active subscriptions</li>
                    <li>Revoke access to all analyst signals</li>
                    <li>Log you out of all devices immediately</li>
                    <li>Make this phone number unavailable for re-registration</li>
                  </ul>
                </div>

                {/* Reason input */}
                <div className="mb-4">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[var(--muted)] mb-2 select-none">
                    Reason for leaving (optional)
                  </label>
                  <textarea
                    value={deleteReason}
                    onChange={(e) => setDeleteReason(e.target.value)}
                    disabled={sendingDeleteOtp}
                    placeholder="Help us improve by sharing your reason..."
                    className="w-full h-20 rounded-xl border border-slate-200 bg-white py-3 px-4 text-[13px] text-[var(--ink)] placeholder:text-slate-400 outline-none focus:border-red-400 transition-colors resize-none"
                  />
                </div>

                {/* Confirmation input */}
                <div className="mb-6">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[var(--muted)] mb-2 select-none">
                    Type <span className="text-red-600 font-extrabold">DELETE</span> to confirm
                  </label>
                  <input
                    type="text"
                    value={deleteConfirmText}
                    onChange={(e) => setDeleteConfirmText(e.target.value.toUpperCase())}
                    disabled={sendingDeleteOtp}
                    placeholder="DELETE"
                    className="w-full rounded-xl border border-slate-200 bg-white py-3 px-4 text-[13.5px] font-mono tracking-wider text-[var(--ink)] placeholder:text-slate-300 outline-none focus:border-red-400 transition-colors"
                  />
                </div>

                {/* Buttons */}
                <div className="flex gap-3">
                  <button
                    type="button"
                    disabled={sendingDeleteOtp}
                    onClick={() => {
                      setShowDeleteModal(false);
                      setDeleteConfirmText("");
                      setDeleteReason("");
                    }}
                    className="flex-1 rounded-full border border-slate-200 px-4 py-2.5 text-[13px] font-bold text-[var(--muted)] hover:text-[var(--ink)] hover:border-slate-400 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={sendingDeleteOtp || deleteConfirmText !== "DELETE"}
                    onClick={handleRequestDeleteOtp}
                    className="flex-1 rounded-full bg-red-600 hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-[13px] px-4 py-2.5 transition-all active:scale-[0.98]"
                  >
                    {sendingDeleteOtp ? "Sending code..." : "Continue"}
                  </button>
                </div>
              </>
            ) : (
              <>
                {/* OTP input */}
                <div className="mb-6">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[var(--muted)] mb-2 select-none">
                    Verification code
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    value={deleteOtp}
                    onChange={(e) => setDeleteOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    disabled={deletingAccount}
                    placeholder="••••••"
                    className="w-full rounded-xl border border-slate-200 bg-white py-3 px-4 text-[17px] font-mono tracking-[0.5em] text-center text-[var(--ink)] placeholder:text-slate-300 outline-none focus:border-red-400 transition-colors"
                  />
                  <button
                    type="button"
                    disabled={sendingDeleteOtp || deletingAccount}
                    onClick={handleRequestDeleteOtp}
                    className="mt-2 text-[12px] font-bold text-red-600 hover:text-red-700 disabled:opacity-40 transition-colors"
                  >
                    {sendingDeleteOtp ? "Resending..." : "Resend code"}
                  </button>
                </div>

                {/* Buttons */}
                <div className="flex gap-3">
                  <button
                    type="button"
                    disabled={deletingAccount}
                    onClick={() => {
                      setDeleteStep("confirm");
                      setDeleteOtp("");
                    }}
                    className="flex-1 rounded-full border border-slate-200 px-4 py-2.5 text-[13px] font-bold text-[var(--muted)] hover:text-[var(--ink)] hover:border-slate-400 transition-colors"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    disabled={deletingAccount || deleteOtp.length !== 6}
                    onClick={handleDeleteAccount}
                    className="flex-1 rounded-full bg-red-600 hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-[13px] px-4 py-2.5 transition-all active:scale-[0.98]"
                  >
                    {deletingAccount ? "Deleting..." : "Permanently Delete"}
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
