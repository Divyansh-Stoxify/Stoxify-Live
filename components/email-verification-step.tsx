"use client";

import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";

import { Icon } from "@/components/stoxify-icon";

type EmailVerificationStepProps = {
  description: ReactNode;
  email: string;
  error: string | null;
  footer?: ReactNode;
  heading?: string;
  isResending: boolean;
  isSubmitting: boolean;
  onClearError?: () => void;
  onResend: () => Promise<boolean>;
  onVerify: (code: string) => Promise<boolean>;
  submittingLabel?: string;
  submitLabel?: string;
};

const OTP_LENGTH = 6;

function createEmptyOtp(): string[] {
  return Array.from({ length: OTP_LENGTH }, () => "");
}

export function EmailVerificationStep({
  description,
  email,
  error,
  footer,
  heading = "Verify your email",
  isResending,
  isSubmitting,
  onClearError,
  onResend,
  onVerify,
  submittingLabel = "Verifying...",
  submitLabel = "Verify Email",
}: EmailVerificationStepProps) {
  const [otp, setOtp] = useState<string[]>(() => createEmptyOtp());
  const [localError, setLocalError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);
  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    inputs.current[0]?.focus();
  }, []);

  useEffect(() => {
    if (cooldown === 0) return;

    const timer = window.setTimeout(() => {
      setCooldown((current) => current - 1);
    }, 1000);

    return () => window.clearTimeout(timer);
  }, [cooldown]);

  const clearErrors = () => {
    setLocalError(null);
    onClearError?.();
  };

  const handleOtpChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, "").slice(-1);
    const next = [...otp];
    next[index] = digit;
    setOtp(next);
    clearErrors();

    if (digit && index < OTP_LENGTH - 1) {
      inputs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Backspace" && !otp[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (event: React.ClipboardEvent<HTMLDivElement>) => {
    const pasted = event.clipboardData.getData("text").replace(/\D/g, "").slice(0, OTP_LENGTH);
    if (!pasted) return;

    event.preventDefault();
    clearErrors();

    const next = createEmptyOtp();
    for (let index = 0; index < OTP_LENGTH; index += 1) {
      next[index] = pasted[index] ?? "";
    }

    setOtp(next);
    inputs.current[Math.min(pasted.length, OTP_LENGTH - 1)]?.focus();
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const code = otp.join("");

    if (code.length !== OTP_LENGTH) {
      setLocalError("Enter all 6 digits of your verification code");
      return;
    }

    clearErrors();
    const ok = await onVerify(code);
    if (!ok) {
      setOtp(createEmptyOtp());
      inputs.current[0]?.focus();
    }
  };

  const handleResend = async () => {
    if (cooldown > 0 || isResending) return;

    clearErrors();
    const ok = await onResend();
    if (ok) {
      setCooldown(60);
    }
  };

  const activeError = error ?? localError;

  return (
    <div className="animate-[fadeSlideIn_0.35s_ease-out]">
      <style>{`
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div className="mb-6">
        <div className="mb-3 flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--brand)]/10 text-[var(--brand)]">
            <Icon className="h-4 w-4" name="mail" />
          </span>
          <h1 className="text-2xl font-bold tracking-[-0.5px] text-[var(--ink)]">{heading}</h1>
        </div>

        <p className="text-[13px] leading-relaxed text-[var(--muted)]">{description}</p>

        <div className="mt-3 inline-flex items-center gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-[12px] text-amber-800">
          <span className="font-bold">Dev mode:</span> use code{" "}
          <span className="font-mono font-extrabold tracking-widest">999999</span>
        </div>
      </div>

      {activeError && (
        <div className="mb-5 flex items-start gap-2 rounded-lg border border-[rgba(220,38,38,0.2)] bg-red-50 px-3.5 py-3 text-[13px] text-red-700">
          <Icon className="mt-0.5 h-4 w-4 shrink-0" name="x" />
          <span>{activeError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="mb-6 flex gap-2" onPaste={handleOtpPaste}>
          {otp.map((digit, index) => (
            <input
              key={index}
              ref={(element) => {
                inputs.current[index] = element;
              }}
              aria-label={`Digit ${index + 1} for ${email || "email verification"}`}
              autoComplete={index === 0 ? "one-time-code" : "off"}
              className="aspect-square w-full max-w-[52px] rounded-lg border border-[var(--line)] text-center text-xl font-bold text-[var(--ink)] transition-all focus:border-[var(--brand)] focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/20"
              inputMode="numeric"
              maxLength={1}
              onChange={(event) => handleOtpChange(index, event.target.value)}
              onKeyDown={(event) => handleOtpKeyDown(index, event)}
              type="text"
              value={digit}
            />
          ))}
        </div>

        <button
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-[var(--brand)] py-3 text-[13.5px] font-bold text-white transition-all hover:bg-[var(--brand-dark)] hover:shadow-md active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50"
          disabled={isSubmitting}
          type="submit"
        >
          {isSubmitting ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              {submittingLabel}
            </>
          ) : (
            submitLabel
          )}
        </button>
      </form>

      <div className="mt-5 text-center text-[13px]">
        <span className="text-[var(--muted)]">Didn&apos;t receive a code? </span>
        <button
          className="font-bold text-[var(--brand)] hover:underline disabled:opacity-50 disabled:no-underline"
          disabled={cooldown > 0 || isResending}
          onClick={handleResend}
          type="button"
        >
          {isResending ? "Resending..." : cooldown > 0 ? `Resend in ${cooldown}s` : "Resend Code"}
        </button>
      </div>

      {footer}
    </div>
  );
}
