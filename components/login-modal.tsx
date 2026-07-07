"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";

import { Icon } from "@/components/stoxify-icon";

type Step = "identifier" | "otp";

interface FormErrors {
  identifier?: string;
}

/**
 * Normalizes the identifier exactly as the login page does.
 * Accepts either a 10-digit Indian mobile (with or without +91/91/0) or an
 * email. Returns the canonical value to send to the BFF.
 */
function normalizeIdentifier(
  raw: string
): { ok: true; value: string } | { ok: false; error: string } {
  const trimmed = raw.trim();
  if (!trimmed) return { ok: false, error: "Phone number is required" };
  if (trimmed.includes("@") || /[a-zA-Z]/.test(trimmed)) {
    return { ok: false, error: "Email login is not supported. Please use a mobile number." };
  }
  const digits = trimmed.replace(/\D/g, "").replace(/^0/, "").replace(/^91/, "");
  if (!/^[6-9]\d{9}$/.test(digits)) {
    return { ok: false, error: "Enter a valid 10-digit mobile number" };
  }
  return { ok: true, value: `+91${digits}` };
}

export function LoginModal({
  open,
  onClose,
  intent,
}: {
  open: boolean;
  onClose: () => void;
  intent?: "ANALYST" | "TRADER";
}) {
  const router = useRouter();
  const [step, setStep] = useState<Step>("identifier");
  const [identifier, setIdentifier] = useState("");
  const [normalizedId, setNormalizedId] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FormErrors>({});
  const [authError, setAuthError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // OTP state
  const [otp, setOtp] = useState<string[]>(() => Array.from({ length: 6 }, () => ""));
  const [otpError, setOtpError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [isResending, setIsResending] = useState(false);
  const otpInputs = useRef<(HTMLInputElement | null)[]>([]);
  const backdropRef = useRef<HTMLDivElement>(null);

  // Reset state when modal closes
  useEffect(() => {
    if (!open) {
      // Delay reset so close animation plays first
      const t = setTimeout(() => {
        setStep("identifier");
        setIdentifier("");
        setNormalizedId("");
        setFieldErrors({});
        setAuthError(null);
        setIsSubmitting(false);
        setOtp(Array.from({ length: 6 }, () => ""));
        setOtpError(null);
        setIsVerifying(false);
        setCooldown(0);
        setIsResending(false);
      }, 300);
      return () => clearTimeout(t);
    }
  }, [open]);

  // Cooldown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  // Lock body scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  // ── Request OTP ────────────────────────────────────────────────────────
  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setFieldErrors({});

    const check = normalizeIdentifier(identifier);
    if (!check.ok) {
      setFieldErrors({ identifier: check.error });
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/auth/login-request-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        cache: "no-store",
        body: JSON.stringify({ identifier: check.value, ...(intent ? { intent } : {}) }),
      });

      const data = (await res.json().catch(() => ({}))) as { error?: string };

      if (res.status === 429) {
        const retryAfter = res.headers.get("Retry-After");
        setAuthError(
          retryAfter
            ? `Too many attempts. Try again in ${retryAfter} seconds.`
            : "Too many attempts. Please try again later."
        );
        setIsSubmitting(false);
        return;
      }

      if (!res.ok) {
        setAuthError(data.error ?? "Unable to send code");
        setIsSubmitting(false);
        return;
      }

      setNormalizedId(check.value);
      setStep("otp");
      setOtp(Array.from({ length: 6 }, () => ""));
      setCooldown(60);
      setIsSubmitting(false);
      setTimeout(() => otpInputs.current[0]?.focus(), 50);
    } catch {
      setAuthError("Unable to reach the server. Check your connection and try again.");
      setIsSubmitting(false);
    }
  };

  // ── Verify OTP ─────────────────────────────────────────────────────────
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = otp.join("");
    if (code.length !== 6) {
      setOtpError("Enter all 6 digits of your code");
      return;
    }

    setIsVerifying(true);
    setOtpError(null);

    try {
      const res = await fetch("/api/auth/login-verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        cache: "no-store",
        body: JSON.stringify({
          identifier: normalizedId,
          otp: code,
          ...(intent ? { intent } : {}),
        }),
      });

      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        error?: string;
        redirectTo?: string;
        is_new_user?: boolean;
        registration_token?: string;
      };

      if (!res.ok) {
        setOtpError(data.error ?? "Verification failed. Try again.");
        setOtp(Array.from({ length: 6 }, () => ""));
        setIsVerifying(false);
        otpInputs.current[0]?.focus();
        return;
      }

      // If new analyst user, capture the token and redirect to full-page onboarding
      if (intent === "ANALYST" && data.is_new_user && data.registration_token) {
        onClose();
        router.push(
          `/analyst-onboarding?token=${encodeURIComponent(data.registration_token)}&phone=${encodeURIComponent(normalizedId)}`
        );
        return;
      }

      // Success – close modal and redirect
      console.log("[LoginModal] verify response", { intent, redirectTo: data.redirectTo, data });
      onClose();
      // Check for ?next= param from auth redirect, fall back to server-provided redirect or default
      const params = new URLSearchParams(window.location.search);
      const nextParam = params.get("next");
      const destination = nextParam || data.redirectTo || "/trader/dashboard";
      console.log("[LoginModal] redirecting to", destination);
      router.push(destination);
      router.refresh();
    } catch {
      setOtpError("Unable to verify. Check your connection and try again.");
      setIsVerifying(false);
    }
  };

  // ── Resend OTP ─────────────────────────────────────────────────────────
  const handleResendOtp = async () => {
    if (cooldown > 0 || isResending) return;
    setIsResending(true);
    setOtpError(null);

    try {
      const res = await fetch("/api/auth/login-request-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: normalizedId, ...(intent ? { intent } : {}) }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setOtpError(data.error ?? "Failed to resend code.");
      } else {
        setCooldown(60);
      }
    } catch {
      setOtpError("Unable to resend code. Check your connection.");
    } finally {
      setIsResending(false);
    }
  };

  // ── OTP input helpers ──────────────────────────────────────────────────
  const handleOtpChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, "").slice(-1);
    const next = [...otp];
    next[index] = digit;
    setOtp(next);
    setOtpError(null);
    if (digit && index < 5) otpInputs.current[index + 1]?.focus();
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) otpInputs.current[index - 1]?.focus();
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;
    e.preventDefault();
    const next = [...otp];
    for (let i = 0; i < 6; i++) next[i] = pasted[i] ?? "";
    setOtp(next);
    otpInputs.current[Math.min(pasted.length, 5)]?.focus();
  };

  // ── Close on backdrop click ────────────────────────────────────────────
  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === backdropRef.current) onClose();
    },
    [onClose]
  );

  if (!open) return null;

  return createPortal(
    <div
      ref={backdropRef}
      onClick={handleBackdropClick}
      className="fixed inset-0 z-[500] flex items-center justify-center bg-black/45 animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-label="Login"
    >
      <div className="relative w-full max-w-[420px] mx-4 px-7 pt-8 pb-7 bg-white rounded-2xl shadow-[0_24px_64px_rgba(0,0,0,0.18),0_0_0_1px_rgba(0,0,0,0.04)] animate-in slide-in-from-bottom-4 fade-in duration-300">
        {/* Close button */}
        <button
          onClick={onClose}
          type="button"
          className="absolute top-3.5 right-3.5 flex items-center justify-center w-[30px] h-[30px] rounded-lg bg-[var(--line-2)] text-[var(--muted)] border-none cursor-pointer transition-all duration-150 hover:bg-[var(--line)] hover:text-[var(--ink)]"
          aria-label="Close"
        >
          <Icon className="h-4 w-4" name="x" />
        </button>

        {step === "identifier" ? (
          <>
            <div className="mb-5">
              <h2 className="text-xl font-bold tracking-[-0.5px] text-[var(--ink)] mb-1">
                Welcome back
              </h2>
              <p className="text-[13px] leading-relaxed text-[var(--muted)]">
                Sign in with your phone number. We&apos;ll send you a 6-digit code.
              </p>
            </div>

            {authError && (
              <div className="mb-4 flex items-start gap-2 rounded-lg border border-[rgba(220,38,38,0.2)] bg-red-50 px-3.5 py-3 text-[13px] text-red-700">
                <Icon className="mt-0.5 h-4 w-4 shrink-0" name="x" />
                <span>{authError}</span>
              </div>
            )}

            <form className="space-y-4" onSubmit={handleRequestOtp}>
              <div>
                <label
                  className="mb-1.5 block text-xs font-bold uppercase tracking-[0.05em] text-[var(--muted)]"
                  htmlFor="login-modal-identifier"
                >
                  Phone number
                </label>
                <div className={`flex w-full rounded-lg border transition-all ${
                    fieldErrors.identifier
                      ? "border-[var(--red)] bg-[var(--red-light)]/10"
                      : "border-[var(--line)] focus-within:border-[var(--brand)] focus-within:bg-white"
                  }`}>
                  <span className="flex items-center px-3 text-[13px] text-[var(--muted)] border-r border-inherit select-none">
                    +91
                  </span>
                  <input
                    className="flex-1 rounded-r-lg bg-transparent px-3.5 py-2.5 text-[13px] placeholder:text-[var(--muted-2)] focus:outline-none"
                    id="login-modal-identifier"
                    name="identifier"
                    onChange={(e) => {
                      let val = e.target.value.replace(/\D/g, "").slice(0, 10);
                      setIdentifier(val);
                      if (fieldErrors.identifier) setFieldErrors({});
                    }}
                    placeholder="10-digit mobile number"
                    type="text"
                    inputMode="numeric"
                    value={identifier}
                    autoComplete="username"
                    autoFocus
                  />
                </div>
                {fieldErrors.identifier && (
                  <p className="mt-1 text-[11px] text-[var(--red)] font-medium">
                    {fieldErrors.identifier}
                  </p>
                )}
              </div>

              <button
                className="w-full rounded-lg bg-[var(--brand)] py-3 text-[13.5px] font-bold text-white transition-all hover:bg-[var(--brand-dark)] hover:shadow-md active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2"
                disabled={isSubmitting}
                type="submit"
              >
                {isSubmitting ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Sending code...
                  </>
                ) : (
                  "Send code"
                )}
              </button>
            </form>
          </>
        ) : (
          <>
            <div className="mb-5">
              <h2 className="text-xl font-bold tracking-[-0.5px] text-[var(--ink)] mb-1">
                Enter your code
              </h2>
              <p className="text-[13px] leading-relaxed text-[var(--muted)]">
                We sent a 6-digit code to{" "}
                <span className="font-semibold text-[var(--ink)]">{normalizedId}</span>.
              </p>
              <div className="mt-3 inline-flex items-center gap-2 rounded-md bg-amber-50 border border-amber-200 px-3 py-2 text-[12px] text-amber-800">
                <span className="font-bold">Dev mode:</span> use code{" "}
                <span className="font-mono font-extrabold tracking-widest">999999</span>
              </div>
            </div>

            {otpError && (
              <div className="mb-4 flex items-start gap-2 rounded-lg border border-[rgba(220,38,38,0.2)] bg-red-50 px-3.5 py-3 text-[13px] text-red-700">
                <Icon className="mt-0.5 h-4 w-4 shrink-0" name="x" />
                <span>{otpError}</span>
              </div>
            )}

            <form onSubmit={handleVerifyOtp}>
              <div className="flex gap-2 mb-5" onPaste={handleOtpPaste}>
                {otp.map((digit, i) => (
                  <input
                    key={i}
                    ref={(el) => {
                      otpInputs.current[i] = el;
                    }}
                    className="w-full aspect-square max-w-[48px] rounded-lg border border-[var(--line)] text-center text-lg font-bold text-[var(--ink)] transition-all focus:border-[var(--brand)] focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/20"
                    inputMode="numeric"
                    maxLength={1}
                    onChange={(e) => handleOtpChange(i, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(i, e)}
                    type="text"
                    value={digit}
                    autoComplete={i === 0 ? "one-time-code" : "off"}
                    aria-label={`Digit ${i + 1}`}
                  />
                ))}
              </div>

              <button
                className="w-full rounded-lg bg-[var(--brand)] py-3 text-[13.5px] font-bold text-white transition-all hover:bg-[var(--brand-dark)] hover:shadow-md active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2"
                disabled={isVerifying}
                type="submit"
              >
                {isVerifying ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Verifying...
                  </>
                ) : (
                  "Verify and sign in"
                )}
              </button>
            </form>

            <div className="mt-4 text-center text-[13px]">
              <span className="text-[var(--muted)]">Didn&apos;t receive a code? </span>
              <button
                onClick={handleResendOtp}
                disabled={cooldown > 0 || isResending}
                className="font-bold text-[var(--brand)] hover:underline disabled:opacity-50 disabled:no-underline"
                type="button"
              >
                {isResending
                  ? "Resending..."
                  : cooldown > 0
                    ? `Resend in ${cooldown}s`
                    : "Resend code"}
              </button>
            </div>

            <div className="mt-2.5 text-center">
              <button
                className="text-[13px] font-semibold text-[var(--brand)] hover:underline"
                onClick={() => {
                  setStep("identifier");
                  setOtp(Array.from({ length: 6 }, () => ""));
                  setOtpError(null);
                }}
                type="button"
              >
                Use a different phone number
              </button>
            </div>
          </>
        )}
      </div>
    </div>,
    document.body
  );
}
