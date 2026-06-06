"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { AuthPanel } from "@/components/auth-panel";
import { Icon } from "@/components/stoxify-icon";

type Step = "identifier" | "otp";

interface FormErrors {
  identifier?: string;
}

// Accepts either a 10-digit Indian mobile (with or without +91/91/0) or an
// email. Returns the canonical value to send to the BFF.
function normalizeIdentifier(
  raw: string
): { ok: true; value: string } | { ok: false; error: string } {
  const trimmed = raw.trim();
  if (!trimmed) return { ok: false, error: "Phone number or email is required" };
  if (trimmed.includes("@")) {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      return { ok: false, error: "Enter a valid email address" };
    }
    return { ok: true, value: trimmed.toLowerCase() };
  }
  const digits = trimmed.replace(/\D/g, "").replace(/^0/, "").replace(/^91/, "");
  if (!/^[6-9]\d{9}$/.test(digits)) {
    return { ok: false, error: "Enter a valid 10-digit mobile number" };
  }
  return { ok: true, value: `+91${digits}` };
}

export default function LoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("identifier");
  const [identifier, setIdentifier] = useState("");
  const [normalizedIdentifier, setNormalizedIdentifier] = useState("");
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

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

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
        body: JSON.stringify({ identifier: check.value }),
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

      setNormalizedIdentifier(check.value);
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
        body: JSON.stringify({ identifier: normalizedIdentifier, otp: code }),
      });

      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        error?: string;
        redirectTo?: string;
      };

      if (!res.ok) {
        setOtpError(data.error ?? "Verification failed. Try again.");
        setOtp(Array.from({ length: 6 }, () => ""));
        setIsVerifying(false);
        otpInputs.current[0]?.focus();
        return;
      }

      const params = new URLSearchParams(window.location.search);
      const next = params.get("next");
      const destination = next && next.startsWith("/") ? next : (data.redirectTo ?? "/dashboard");
      router.push(destination);
      router.refresh();
    } catch {
      setOtpError("Unable to verify. Check your connection and try again.");
      setIsVerifying(false);
    }
  };

  const handleResendOtp = async () => {
    if (cooldown > 0 || isResending) return;
    setIsResending(true);
    setOtpError(null);

    try {
      const res = await fetch("/api/auth/login-request-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: normalizedIdentifier }),
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

  return (
    <main className="grid h-screen w-screen grid-cols-1 overflow-hidden min-[860px]:grid-cols-2">
      <AuthPanel />

      <div className="flex h-full flex-col justify-between overflow-y-auto bg-white px-6 py-12 min-[860px]:px-16 min-[1100px]:px-24">
        {/* Mobile header */}
        <div className="flex justify-between items-center min-[860px]:hidden mb-8">
          <Link
            className="flex items-center font-sans text-xl font-extrabold tracking-[-0.5px] text-[var(--ink)]"
            href="/"
          >
            Stoxify
          </Link>
          <Link className="text-xs font-semibold text-[var(--brand)]" href="/signup">
            Sign Up
          </Link>
        </div>

        <div className="my-auto mx-auto w-full max-w-[400px]">
          {step === "identifier" ? (
            <>
              <div className="mb-6">
                <h1 className="text-2xl font-bold tracking-[-0.5px] text-[var(--ink)] mb-1.5">
                  Welcome back
                </h1>
                <p className="text-[13px] leading-relaxed text-[var(--muted)]">
                  Sign in with the phone number or email you registered with. We&apos;ll send you a
                  6-digit code.
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
                    htmlFor="identifier"
                  >
                    Phone number or email
                  </label>
                  <input
                    className={`w-full rounded-lg border px-3.5 py-2.5 text-[13px] transition-all placeholder:text-[var(--muted-2)] focus:outline-none ${
                      fieldErrors.identifier
                        ? "border-[var(--red)] focus:border-[var(--red)] bg-[var(--red-light)]/10"
                        : "border-[var(--line)] focus:border-[var(--brand)] focus:bg-white"
                    }`}
                    id="identifier"
                    name="identifier"
                    onChange={(e) => {
                      setIdentifier(e.target.value);
                      if (fieldErrors.identifier) setFieldErrors({});
                    }}
                    placeholder="10-digit mobile or name@example.com"
                    type="text"
                    value={identifier}
                    autoComplete="username"
                  />
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
              <div className="mb-6">
                <h1 className="text-2xl font-bold tracking-[-0.5px] text-[var(--ink)] mb-1.5">
                  Enter your code
                </h1>
                <p className="text-[13px] leading-relaxed text-[var(--muted)]">
                  We sent a 6-digit code to{" "}
                  <span className="font-semibold text-[var(--ink)]">{normalizedIdentifier}</span>.
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
                <div className="flex gap-2 mb-6" onPaste={handleOtpPaste}>
                  {otp.map((digit, i) => (
                    <input
                      key={i}
                      ref={(el) => {
                        otpInputs.current[i] = el;
                      }}
                      className="w-full aspect-square max-w-[52px] rounded-lg border border-[var(--line)] text-center text-xl font-bold text-[var(--ink)] transition-all focus:border-[var(--brand)] focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/20"
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

              <div className="mt-5 text-center text-[13px]">
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

              <div className="mt-3 text-center">
                <button
                  className="text-[13px] font-semibold text-[var(--brand)] hover:underline"
                  onClick={() => {
                    setStep("identifier");
                    setOtp(Array.from({ length: 6 }, () => ""));
                    setOtpError(null);
                  }}
                  type="button"
                >
                  Use a different phone or email
                </button>
              </div>
            </>
          )}
        </div>

        {/* FOOTER */}
        <div className="mt-8 text-center text-[13px] text-[var(--muted)]">
          New to Stoxify?{" "}
          <Link className="font-semibold text-[var(--brand)] hover:underline" href="/signup">
            Create an account
          </Link>
        </div>
      </div>
    </main>
  );
}
