"use client";

import { useState, useEffect } from "react";
import { Icon } from "@/components/stoxify-icon";
import { cleanErrorMessage } from "@/lib/utils";

type OnboardingUser = {
  user_id: string;
  name: string;
  email: string;
  phone: string;
  state: string;
};

export function DashboardOnboarding({ user }: { user: OnboardingUser }) {
  const [showKycForm, setShowKycForm] = useState(false);
  const [aadhaarInput, setAadhaarInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showReactivationAlert, setShowReactivationAlert] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("reactivated") === "true") {
        setShowReactivationAlert(true);
        const newUrl = window.location.pathname;
        window.history.replaceState({}, "", newUrl);
      }
    }
  }, []);

  // Formats Aadhaar as: XXXX XXXX XXXX
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

  const handleVerifyKyc = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanAadhaar = aadhaarInput.replace(/\s/g, "");

    if (cleanAadhaar.length !== 12) {
      setError("Please enter a valid 12-digit Aadhaar number");
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/user/kyc", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ aadhaar_number: cleanAadhaar }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        const cleaned = cleanErrorMessage(data, data.error || "KYC submission failed");
        throw new Error(cleaned);
      }

      setSuccess(true);
      setShowKycForm(false);

      // Force reload page to refresh session and render active dashboard view
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "An unexpected error occurred during KYC verification.";
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isKycDone = user.state === "ACTIVE" || success;
  const completedCount = 1 + (isKycDone ? 1 : 0);
  const progressPercent = Math.round((completedCount / 3) * 100);

  return (
    <div className="min-h-screen bg-[var(--surface)] font-sans">
      {/* Top Banner Alert (Jobyaan reference header style) */}
      {!isKycDone && (
        <div className="w-full bg-[#EAB308] bg-gradient-to-r from-amber-500 to-yellow-500 text-amber-950 text-center text-[13px] font-semibold py-2.5 px-4 shadow-sm select-none flex items-center justify-center gap-2 animate-fade-in">
          <Icon name="shieldCheck" className="h-4.5 w-4.5 text-amber-950" />
          <span>
            You&apos;re halfway there — complete your verification to start subscribing and
            receiving real-time signals.
          </span>
        </div>
      )}

      <div className="mx-auto max-w-[760px] px-6 py-12">
        {/* Header Title section */}
        <div className="mb-8">
          <h1 className="text-[28px] font-extrabold tracking-[-0.75px] text-[var(--ink)]">
            Welcome to Stoxify!
          </h1>
          <p className="mt-1.5 text-[14px] text-[var(--muted)] leading-relaxed">
            Complete your setup guide to start connecting with SEBI-licensed analysts and receive
            live trade recommendations.
          </p>
        </div>

        {/* Onboarding checklist card */}
        <div className="rounded-2xl border border-[var(--line)] bg-white p-8 shadow-sm">
          {/* Header of checklist */}
          <div className="flex items-center justify-between flex-wrap gap-4 border-b border-[var(--line)] pb-6 mb-8">
            <div className="flex-1">
              <h2 className="text-[16px] font-bold text-[var(--ink)]">Onboarding Tasks</h2>
              <div className="mt-1 flex items-center gap-3">
                <span className="text-[13px] text-[var(--muted)] font-medium">
                  {completedCount} of 3 completed
                </span>
                <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[var(--brand)] rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Why it matters note */}
            <div className="max-w-[280px] text-[11px] text-[var(--muted)] leading-normal bg-[var(--line-2)] rounded-lg p-2.5 border border-[var(--line)]">
              <span className="font-bold text-[var(--ink)] block mb-0.5">Why it matters</span>
              SEBI regulations require identity verification (KYC) for all users accessing premium
              research analyst signals.
            </div>
          </div>

          {/* Timeline steps */}
          <div className="relative pl-10 border-l-2 border-slate-100 ml-4 space-y-12 py-1">
            {/* Timeline Line Connector styling helper */}
            <div className="absolute top-0 bottom-0 left-[-2px] w-[2px] bg-slate-100" />

            {/* STEP 1: Account Created */}
            <div className="relative">
              {/* Step indicator */}
              <div className="absolute left-[-52px] top-0.5 flex h-8 w-8 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200">
                <Icon name="check" className="h-4 w-4" />
              </div>

              <div className="flex items-start justify-between gap-6 flex-wrap md:flex-nowrap">
                <div className="flex-1">
                  <h3 className="text-[15px] font-bold text-[var(--ink)]">Account created</h3>
                  <p className="mt-1 text-[13px] text-[var(--muted)] leading-relaxed">
                    Your trader profile is active with phone number{" "}
                    <span className="font-mono text-[var(--ink)] font-semibold">{user.phone}</span>.
                  </p>
                </div>
                <div className="shrink-0 pt-0.5">
                  <span className="inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 text-[12px] font-bold text-emerald-700">
                    Done
                  </span>
                </div>
              </div>
            </div>

            {/* STEP 2: KYC Verification */}
            <div className="relative">
              {/* Step indicator */}
              <div
                className={`absolute left-[-52px] top-0.5 flex h-8 w-8 items-center justify-center rounded-full transition-all ${
                  isKycDone
                    ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
                    : "bg-blue-50 text-[var(--brand)] border border-[var(--brand-mid)] shadow-[0_0_12px_rgba(31,122,224,0.1)]"
                }`}
              >
                {isKycDone ? (
                  <Icon name="check" className="h-4 w-4" />
                ) : (
                  <Icon name="shieldCheck" className="h-4 w-4 text-[var(--brand)]" />
                )}
              </div>

              <div className="flex items-start justify-between gap-6 flex-wrap md:flex-nowrap">
                <div className="flex-1">
                  <h3 className="text-[15px] font-bold text-[var(--ink)]">Verify Identity (KYC)</h3>
                  <p className="mt-1 text-[13px] text-[var(--muted)] leading-relaxed">
                    Verify your identity via Aadhaar to comply with SEBI regulations and activate
                    your subscription dashboard.
                  </p>

                  {/* Inline verification form */}
                  {showKycForm && !isKycDone && (
                    <form
                      onSubmit={handleVerifyKyc}
                      className="mt-4 rounded-xl border border-[var(--line)] bg-[var(--line-2)] p-4 max-w-[480px] animate-slide-down"
                    >
                      <label
                        htmlFor="aadhaar"
                        className="block text-[12px] font-bold text-[var(--ink)] mb-1.5"
                      >
                        Enter 12-Digit Aadhaar Number
                      </label>
                      <div className="flex gap-2">
                        <input
                          id="aadhaar"
                          type="text"
                          placeholder="0000 0000 0000"
                          value={aadhaarInput}
                          onChange={handleAadhaarChange}
                          disabled={isSubmitting}
                          className="flex-1 rounded-md border border-[var(--line)] bg-white px-3 py-2 text-[14px] font-mono text-[var(--ink)] tracking-wider placeholder:text-[var(--muted-2)] focus:border-[var(--brand)] focus:ring-1 focus:ring-[var(--brand)] outline-none"
                        />
                        <button
                          type="submit"
                          disabled={isSubmitting || aadhaarInput.replace(/\s/g, "").length !== 12}
                          className="rounded-md bg-[var(--brand)] px-4 py-2 text-[13px] font-bold text-white hover:bg-[var(--brand-dark)] disabled:opacity-50 transition-colors"
                        >
                          {isSubmitting ? "Verifying..." : "Submit"}
                        </button>
                      </div>

                      {error && (
                        <p className="mt-2 text-[12px] font-medium text-[var(--red)] flex items-center gap-1.5">
                          <Icon name="x" className="h-3 w-3" />
                          {error}
                        </p>
                      )}
                    </form>
                  )}

                  {success && (
                    <div className="mt-3 inline-flex items-center gap-2 rounded-lg bg-emerald-50 border border-emerald-100 p-3 text-emerald-800 text-[13px] font-medium animate-fade-in">
                      <Icon name="check" className="h-4 w-4 text-emerald-600 animate-bounce" />
                      Verification successful! Redirecting to dashboard...
                    </div>
                  )}
                </div>

                <div className="shrink-0 pt-0.5">
                  {isKycDone ? (
                    <span className="inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 text-[12px] font-bold text-emerald-700">
                      Done
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setShowKycForm((prev) => !prev)}
                      className={`inline-flex items-center justify-center rounded-md px-4 py-1.5 text-[12px] font-bold transition-all ${
                        showKycForm
                          ? "border border-[var(--line)] bg-white text-[var(--muted)] hover:border-[var(--muted-2)]"
                          : "bg-[var(--brand)] text-white hover:bg-[var(--brand-dark)] shadow-sm"
                      }`}
                    >
                      {showKycForm ? "Cancel" : "Verify Aadhaar"}
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* STEP 3: Explore & Subscribe */}
            <div className="relative">
              {/* Step indicator */}
              <div
                className={`absolute left-[-52px] top-0.5 flex h-8 w-8 items-center justify-center rounded-full transition-all ${
                  isKycDone
                    ? "bg-blue-50 text-[var(--brand)] border border-[var(--brand-mid)] shadow-[0_0_12px_rgba(31,122,224,0.1)] animate-pulse"
                    : "bg-slate-50 text-[var(--muted-2)] border border-slate-200"
                }`}
              >
                <Icon name="zap" className="h-4 w-4" />
              </div>

              <div className="flex items-start justify-between gap-6 flex-wrap md:flex-nowrap">
                <div className="flex-1">
                  <h3
                    className={`text-[15px] font-bold ${
                      isKycDone ? "text-[var(--ink)]" : "text-[var(--muted-2)]"
                    }`}
                  >
                    Subscribe to a plan
                  </h3>
                  <p
                    className={`mt-1 text-[13px] leading-relaxed ${
                      isKycDone ? "text-[var(--muted)]" : "text-[var(--muted-2)]"
                    }`}
                  >
                    Explore plans from SEBI-registered Research Analysts and activate live trade
                    alerts to your phone.
                  </p>
                </div>
                <div className="shrink-0 pt-0.5">
                  <a
                    href={isKycDone ? "/#marketplace" : undefined}
                    className={`inline-flex items-center justify-center rounded-md px-4 py-1.5 text-[12px] font-bold transition-all ${
                      isKycDone
                        ? "bg-[var(--brand)] text-white hover:bg-[var(--brand-dark)] shadow-sm pointer-events-auto"
                        : "bg-slate-100 text-[var(--muted-2)] cursor-not-allowed pointer-events-none"
                    }`}
                  >
                    Explore Analysts
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── REACTIVATION ALERT MODAL ─── */}
      {showReactivationAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-[460px] rounded-2xl bg-white p-7 shadow-2xl relative text-left">
            <button
              onClick={() => setShowReactivationAlert(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <Icon name="x" className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-3 mb-5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
                <Icon name="shieldCheck" className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-[17px] font-extrabold text-[var(--ink)] select-none">
                  Account Reactivated
                </h3>
                <p className="text-[12px] text-[var(--muted)]">Welcome back!</p>
              </div>
            </div>
            <div className="text-[13.5px] text-[var(--ink)] leading-relaxed mb-6">
              You deleted your account and it was under deactivation phase for 30 days. After login, you need to delete again in order to go under deactivation phase of 30 days.
            </div>
            <button
              type="button"
              onClick={() => setShowReactivationAlert(false)}
              className="w-full rounded-full bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-[13.5px] py-2.5 transition-all shadow-sm active:scale-[0.98]"
            >
              I Understand
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
