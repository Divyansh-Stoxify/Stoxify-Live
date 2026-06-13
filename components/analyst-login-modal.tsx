"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Icon } from "@/components/stoxify-icon";

type Step = "phone" | "otp";

interface FormErrors {
  phone?: string;
}

function normalizePhone(raw: string): { ok: true; value: string } | { ok: false; error: string } {
  const trimmed = raw.trim();
  if (!trimmed) return { ok: false, error: "Phone number is required" };
  const digits = trimmed.replace(/\D/g, "").replace(/^0/, "").replace(/^91/, "");
  if (!/^[6-9]\d{9}$/.test(digits)) {
    return { ok: false, error: "Enter a valid 10-digit mobile number" };
  }
  return { ok: true, value: `+91${digits}` };
}

export function AnalystLoginModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const [step, setStep] = useState<Step>("phone");

  // Login inputs
  const [phoneInput, setPhoneInput] = useState("");
  const [normalizedPhone, setNormalizedPhone] = useState("");


  const [fieldErrors, setFieldErrors] = useState<FormErrors>({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // OTP inputs
  const [otp, setOtp] = useState<string[]>(() => Array.from({ length: 6 }, () => ""));
  const [cooldown, setCooldown] = useState(0);
  const [isResending, setIsResending] = useState(false);
  const otpInputs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (isOpen) {
      setStep("phone");
      setPhoneInput("");
      setNormalizedPhone("");
      setOtp(Array.from({ length: 6 }, () => ""));
      setFieldErrors({});
      setGeneralError(null);
      setIsSubmitting(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError(null);
    setFieldErrors({});

    const check = normalizePhone(phoneInput);
    if (!check.ok) {
      setFieldErrors({ phone: check.error });
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/auth/login-request-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        cache: "no-store",
        body: JSON.stringify({ identifier: check.value, intent: "ANALYST" }),
      });

      const data = (await res.json().catch(() => ({}))) as { error?: string };

      if (res.status === 429) {
        const retryAfter = res.headers.get("Retry-After");
        setGeneralError(
          retryAfter
            ? `Too many attempts. Try again in ${retryAfter} seconds.`
            : "Too many attempts. Please try again later."
        );
        setIsSubmitting(false);
        return;
      }

      if (!res.ok) {
        setGeneralError(data.error ?? "Unable to send verification code. Are you registered?");
        setIsSubmitting(false);
        return;
      }

      setNormalizedPhone(check.value);
      setStep("otp");
      setOtp(Array.from({ length: 6 }, () => ""));
      setCooldown(60);
      setIsSubmitting(false);
      setTimeout(() => otpInputs.current[0]?.focus(), 50);
    } catch {
      setGeneralError("Unable to reach the server. Check your connection.");
      setIsSubmitting(false);
    }
  };


  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = otp.join("");
    if (code.length !== 6) {
      setGeneralError("Enter all 6 digits of your code");
      return;
    }

    setIsSubmitting(true);
    setGeneralError(null);

    try {
      const res = await fetch("/api/auth/login-verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ identifier: normalizedPhone, otp: code, intent: "ANALYST" }),
      });

      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        error?: string;
        redirectTo?: string;
        is_new_user?: boolean;
        registration_token?: string;
      };

      if (!res.ok) {
        setGeneralError(data.error ?? "Verification failed. Try again.");
        setOtp(Array.from({ length: 6 }, () => ""));
        setIsSubmitting(false);
        otpInputs.current[0]?.focus();
        return;
      }

      // If new user, capture the token and redirect to full-page onboarding
      if (data.is_new_user && data.registration_token) {
        onClose();
        router.push(`/analyst-onboarding?token=${encodeURIComponent(data.registration_token)}&phone=${encodeURIComponent(normalizedPhone)}`);
        return;
      }

      // Success: Close modal and redirect to analyst dashboard
      onClose();
      window.location.href = data.redirectTo || "/dashboard";
    } catch {
      setGeneralError("Unable to verify. Check your connection.");
      setIsSubmitting(false);
    }
  };

  const handleResendOtp = async () => {
    if (cooldown > 0 || isResending) return;
    setIsResending(true);
    setGeneralError(null);

    try {
      const res = await fetch("/api/auth/login-request-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: normalizedPhone, intent: "ANALYST" }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setGeneralError(data.error ?? "Failed to resend code.");
      } else {
        setCooldown(60);
      }
    } catch {
      setGeneralError("Unable to resend code. Check your connection.");
    } finally {
      setIsResending(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, "").slice(-1);
    const next = [...otp];
    next[index] = digit;
    setOtp(next);
    setGeneralError(null);
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
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-[480px] bg-white border border-[var(--line)] rounded-2xl p-7 shadow-2xl overflow-hidden font-sans">
        <DialogHeader className="mb-4">
          <DialogTitle className="text-[20px] font-extrabold text-[var(--ink)] tracking-tight">
            {step === "phone" && "Research Analyst Login"}
            {step === "otp" && "Verify Your Account"}
          </DialogTitle>
          <DialogDescription className="text-[13px] text-[var(--muted)] mt-1.5 leading-relaxed">
            {step === "phone" && "Enter your registered phone number. We will send a 6-digit verification code."}
            {step === "otp" && `Enter the 6-digit code sent to ${normalizedPhone}.`}
          </DialogDescription>
        </DialogHeader>

        {generalError && (
          <div className="mb-4 flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 p-3 text-[13px] text-red-700 animate-slide-down">
            <Icon className="mt-0.5 h-4 w-4 shrink-0 text-red-600" name="x" />
            <span className="font-medium">{generalError}</span>
          </div>
        )}

        {step === "phone" && (
          <form onSubmit={handleRequestOtp} className="space-y-4">
            <div>
              <label htmlFor="phone" className="block text-[11px] font-bold uppercase tracking-[0.05em] text-[var(--muted)] mb-1.5">
                Phone Number
              </label>
              <input
                id="phone"
                type="text"
                placeholder="10-digit mobile number"
                value={phoneInput}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, "").slice(0, 10);
                  setPhoneInput(val);
                  if (fieldErrors.phone) setFieldErrors({});
                }}
                disabled={isSubmitting}
                className={`w-full rounded-lg border px-3.5 py-2.5 text-[13px] transition-all placeholder:text-[var(--muted-2)] focus:outline-none ${
                  fieldErrors.phone
                    ? "border-red-500 bg-red-50/10 focus:border-red-500"
                    : "border-[var(--line)] focus:border-[var(--brand)] focus:bg-white"
                }`}
              />
              {fieldErrors.phone && (
                <p className="mt-1.5 text-[11px] text-red-600 font-semibold">{fieldErrors.phone}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting || phoneInput.length < 10}
              className="w-full rounded-lg bg-[var(--brand)] py-2.5 text-[13.5px] font-bold text-white transition-all hover:bg-[var(--brand-dark)] hover:shadow-md active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Sending code...
                </>
              ) : (
                "Send verification code"
              )}
            </button>

          </form>
        )}

        {step === "otp" && (
          <form onSubmit={handleVerifyOtp} className="space-y-5">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-[11px] font-bold uppercase tracking-[0.05em] text-[var(--muted)]">
                  Enter 6-Digit Code
                </span>
                <span className="inline-flex items-center gap-1.5 rounded bg-amber-50 border border-amber-200 px-2 py-0.5 text-[11px] text-amber-800 font-medium select-none">
                  <span className="font-bold">Dev Code:</span>
                  <span className="font-mono font-bold tracking-wider">999999</span>
                </span>
              </div>

              <div className="flex gap-2" onPaste={handleOtpPaste}>
                {otp.map((digit, i) => (
                  <input
                    key={i}
                    ref={(el) => {
                      otpInputs.current[i] = el;
                    }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(i, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(i, e)}
                    disabled={isSubmitting}
                    className="w-full aspect-square max-w-[50px] rounded-lg border border-[var(--line)] text-center text-[18px] font-extrabold text-[var(--ink)] transition-all focus:border-[var(--brand)] focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/20"
                    autoComplete={i === 0 ? "one-time-code" : "off"}
                  />
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || otp.join("").length !== 6}
              className="w-full rounded-lg bg-[var(--brand)] py-2.5 text-[13.5px] font-bold text-white transition-all hover:bg-[var(--brand-dark)] hover:shadow-md active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Verifying...
                </>
              ) : (
                "Verify and Log In"
              )}
            </button>

            <div className="flex items-center justify-between text-[12.5px] pt-1">
              <button
                type="button"
                onClick={() => {
                  setStep("phone");
                  setOtp(Array.from({ length: 6 }, () => ""));
                  setGeneralError(null);
                }}
                className="font-semibold text-[var(--muted)] hover:text-[var(--brand)] hover:underline"
              >
                ← Back
              </button>

              <button
                type="button"
                onClick={handleResendOtp}
                disabled={cooldown > 0 || isResending}
                className="font-bold text-[var(--brand)] hover:underline disabled:opacity-50 disabled:no-underline"
              >
                {isResending
                  ? "Resending..."
                  : cooldown > 0
                    ? `Resend in ${cooldown}s`
                    : "Resend Code"}
              </button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
