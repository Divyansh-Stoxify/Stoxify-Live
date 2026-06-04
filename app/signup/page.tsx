"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown } from "lucide-react";

import { AuthPanel } from "@/components/auth-panel";
import { Icon } from "@/components/stoxify-icon";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

type Role = "trader" | "analyst";
type Step = "form" | "otp";

interface FormErrors {
  name?: string;
  phone?: string;
  email?: string;
  password?: string;
  sebiLicenseNumber?: string;
  companyName?: string;
  companyLocation?: string;
  businessType?: string;
  website?: string;
  registrationType?: string;
  assetUnderResearchCr?: string;
  numberOfClients?: string;
}

export default function SignupPage() {
  const router = useRouter();
  const [role, setRole] = useState<Role>("trader");
  const [step, setStep] = useState<Step>("form");
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    password: "",
    companyName: "",
    companyLocation: "",
    businessType: "Individual",
    website: "",
    registrationType: "research_analyst",
    sebiLicenseNumber: "",
    assetUnderResearchCr: "",
    numberOfClients: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FormErrors>({});
  const [authError, setAuthError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // OTP state
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const otpInputs = useRef<(HTMLInputElement | null)[]>([]);
  const [cooldown, setCooldown] = useState(0);
  const [isResending, setIsResending] = useState(false);

  useEffect(() => {
    if (cooldown === 0) return;
    const timer = setTimeout(() => {
      setCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const handleResendOtp = async () => {
    if (cooldown > 0 || isResending) return;
    setIsResending(true);
    setOtpError(null);

    try {
      const res = await fetch("/api/auth/resend-email-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: formData.email.trim().toLowerCase() }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setOtpError(data.error ?? "Failed to resend verification code.");
      } else {
        setCooldown(60);
      }
    } catch {
      setOtpError("Unable to resend code. Please check your connection.");
    } finally {
      setIsResending(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    let newValue = value;

    if (name === "phone") {
      // Strip all non-digit characters
      let digits = value.replace(/\D/g, "");

      // Handle pasted/typed country code +91, 91, or trunk prefix 0
      // if the length exceeds 10 digits
      if (digits.length > 10) {
        if (digits.startsWith("91")) {
          digits = digits.slice(2);
        } else if (digits.startsWith("0")) {
          digits = digits.slice(1);
        }
      }

      // Restrict to max 10 digits
      newValue = digits.slice(0, 10);
    } else if (name === "numberOfClients") {
      newValue = value.replace(/\D/g, "");
    } else if (name === "assetUnderResearchCr") {
      // Allow only digits and a single decimal point
      newValue = value.replace(/[^0-9.]/g, "");
      const parts = newValue.split(".");
      if (parts.length > 2) {
        newValue = `${parts[0]}.${parts.slice(1).join("")}`;
      }
    }

    setFormData((prev) => ({ ...prev, [name]: newValue }));
    if (fieldErrors[name as keyof FormErrors]) {
      setFieldErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (fieldErrors[name as keyof FormErrors]) {
      setFieldErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleRoleChange = (newRole: Role) => {
    setRole(newRole);
    setFieldErrors({});
    setAuthError(null);
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Common fields
    if (!formData.name.trim() || formData.name.trim().length < 2) {
      newErrors.name = "Full name must be at least 2 characters";
    }

    if (!formData.phone.trim()) {
      newErrors.phone = "Phone number is required";
    } else if (!/^[6-9]\d{9}$/.test(formData.phone.trim())) {
      newErrors.phone = "Enter a valid 10-digit mobile number starting with 6, 7, 8, or 9";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email address is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      newErrors.email = "Enter a valid email address";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.trim().length === 0) {
      newErrors.password = "Password cannot consist only of spaces";
    } else if (formData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    }

    // Role-specific fields for Analyst
    if (role === "analyst") {
      if (!formData.companyName.trim() || formData.companyName.trim().length < 2) {
        newErrors.companyName = "Company or Entity name must be at least 2 characters";
      }

      if (!formData.companyLocation.trim() || formData.companyLocation.trim().length < 2) {
        newErrors.companyLocation = "Company location must be at least 2 characters";
      }

      if (!formData.businessType) {
        newErrors.businessType = "Business type is required";
      }

      if (!formData.sebiLicenseNumber.trim() || formData.sebiLicenseNumber.trim().length < 5) {
        newErrors.sebiLicenseNumber = "SEBI Registration/License Number must be at least 5 characters";
      }

      if (!formData.assetUnderResearchCr.trim() || Number.isNaN(Number(formData.assetUnderResearchCr))) {
        newErrors.assetUnderResearchCr = "Asset under research must be a valid number";
      }

      if (!formData.numberOfClients.trim() || !/^\d+$/.test(formData.numberOfClients)) {
        newErrors.numberOfClients = "Number of research clients must be a non-negative integer";
      }

      if (formData.website.trim() && !/^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([\/\w .-]*)*\/?$/.test(formData.website.trim())) {
        newErrors.website = "Enter a valid URL (e.g. https://example.com)";
      }
    }

    setFieldErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    setAuthError(null);

    const isAnalyst = role === "analyst";
    const url = isAnalyst ? "/api/auth/register-analyst" : "/api/auth/register";

    const bodyData = isAnalyst
      ? {
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        phone: `+91${formData.phone.trim()}`,
        company_name: formData.companyName.trim(),
        company_location: formData.companyLocation.trim(),
        business_type: formData.businessType,
        website: formData.website.trim(),
        registration_type: formData.registrationType,
        asset_under_research_cr: Number(formData.assetUnderResearchCr),
        number_of_clients: Number(formData.numberOfClients),
        sebi_license_number: formData.sebiLicenseNumber.trim(),
      }
      : {
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        phone: `+91${formData.phone.trim()}`,
      };

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        cache: "no-store",
        body: JSON.stringify(bodyData),
      });

      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        error?: string;
        redirectTo?: string;
      };

      if (!res.ok) {
        setAuthError(data.error ?? "Unable to create account");
        setIsSubmitting(false);
        return;
      }

      // Transition to OTP step instead of navigating away
      setStep("otp");
      setIsSubmitting(false);
      // Focus the first OTP input after transition
      setTimeout(() => otpInputs.current[0]?.focus(), 100);
    } catch {
      setAuthError("Unable to create account. Please check your connection and try again.");
      setIsSubmitting(false);
    }
  };

  // ── OTP handlers ──────────────────────────────────────────────

  const handleOtpChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, "").slice(-1);
    const next = [...otp];
    next[index] = digit;
    setOtp(next);
    setOtpError(null);

    if (digit && index < 5) {
      otpInputs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpInputs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;
    e.preventDefault();
    const next = [...otp];
    for (let i = 0; i < 6; i++) {
      next[i] = pasted[i] ?? "";
    }
    setOtp(next);
    otpInputs.current[Math.min(pasted.length, 5)]?.focus();
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = otp.join("");
    if (code.length !== 6) {
      setOtpError("Enter all 6 digits of your verification code");
      return;
    }

    setIsVerifying(true);
    setOtpError(null);

    try {
      const res = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        cache: "no-store",
        body: JSON.stringify({ email: formData.email.trim().toLowerCase(), otp: code }),
      });

      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        error?: string;
        redirectTo?: string;
      };

      if (!res.ok) {
        setOtpError(data.error ?? "Verification failed. Please try again.");
        setOtp(["", "", "", "", "", ""]);
        otpInputs.current[0]?.focus();
        setIsVerifying(false);
        return;
      }

      router.push(data.redirectTo ?? "/login?verified=1");
    } catch {
      setOtpError("Unable to verify. Please check your connection and try again.");
      setIsVerifying(false);
    }
  };

  const handleBackToForm = () => {
    setStep("form");
    setOtp(["", "", "", "", "", ""]);
    setOtpError(null);
  };

  // ── Render ────────────────────────────────────────────────────

  return (
    <main className="grid h-screen w-screen grid-cols-1 overflow-hidden min-[860px]:grid-cols-2">
      <AuthPanel />

      <div className="flex min-h-0 h-full flex-col justify-between overflow-y-auto bg-white px-6 py-12 min-[860px]:px-16 min-[1100px]:px-24">
        {/* Mobile header */}
        <div className="flex justify-between items-center min-[860px]:hidden mb-8">
          <Link
            className="flex items-center font-sans text-xl font-extrabold tracking-[-0.5px] text-[var(--ink)]"
            href="/"
          >
            Stoxify
          </Link>
          <Link className="text-xs font-semibold text-[var(--brand)]" href="/login">
            Log In
          </Link>
        </div>

        <div className="my-auto mx-auto w-full max-w-[400px]">
          {/* ─── STEP: OTP VERIFICATION ─── */}
          {step === "otp" ? (
            <div
              className="animate-[fadeSlideIn_0.35s_ease-out]"
              style={{
                /* @keyframes injected via inline style for simplicity */
              }}
            >
              <style>{`
                @keyframes fadeSlideIn {
                  from { opacity: 0; transform: translateY(12px); }
                  to   { opacity: 1; transform: translateY(0); }
                }
              `}</style>

              {/* Heading */}
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--brand)]/10 text-[var(--brand)]">
                    <Icon className="h-4 w-4" name="mail" />
                  </span>
                  <h1 className="text-2xl font-bold tracking-[-0.5px] text-[var(--ink)]">
                    Verify your email
                  </h1>
                </div>
                <p className="text-[13px] leading-relaxed text-[var(--muted)]">
                  We sent a 6-digit code to{" "}
                  <span className="font-semibold text-[var(--ink)]">
                    {formData.email.trim()}
                  </span>
                  . Enter it below to complete your registration.
                </p>
                <div className="mt-3 inline-flex items-center gap-2 rounded-md bg-amber-50 border border-amber-200 px-3 py-2 text-[12px] text-amber-800">
                  <span className="font-bold">Dev mode:</span> use code{" "}
                  <span className="font-mono font-extrabold tracking-widest">999999</span>
                </div>
              </div>

              {/* OTP Error */}
              {otpError && (
                <div className="mb-5 rounded-lg border border-[rgba(220,38,38,0.2)] bg-red-50 px-3.5 py-3 text-[13px] text-red-700 flex items-start gap-2">
                  <Icon className="h-4 w-4 shrink-0 mt-0.5" name="x" />
                  <span>{otpError}</span>
                </div>
              )}

              {/* OTP Form */}
              <form onSubmit={handleVerifyOtp}>
                <div className="flex gap-2 mb-6" onPaste={handleOtpPaste}>
                  {otp.map((digit, i) => (
                    <input
                      key={i}
                      ref={(el) => { otpInputs.current[i] = el; }}
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
                    "Verify Email"
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
                      : "Resend Code"}
                </button>
              </div>

              <div className="mt-3 text-center">
                <button
                  className="text-[13px] font-semibold text-[var(--brand)] hover:underline"
                  onClick={handleBackToForm}
                  type="button"
                >
                  ← Back to sign up
                </button>
              </div>
            </div>
          ) : (
            /* ─── STEP: REGISTRATION FORM ─── */
            <>
              {/* HEADING */}
              <div className="mb-6">
                <h1 className="text-2xl font-bold tracking-[-0.5px] text-[var(--ink)] mb-1.5">
                  {role === "analyst" ? "Join as an Analyst" : "Create your account"}
                </h1>
                <p className="text-[13px] leading-relaxed text-[var(--muted)]">
                  {role === "analyst"
                    ? "Get verified and share live trade ideas."
                    : "Subscribe to registered experts and get real-time trade ideas."}
                </p>
              </div>

              {/* ROLE TOGGLE */}
              <div className="flex rounded-xl bg-[var(--line-2)] p-[3.5px] border border-[var(--line)] mb-6">
                <button
                  className={`flex-1 rounded-[9px] py-2 text-[13px] font-semibold transition-all ${role === "trader"
                    ? "bg-white text-[var(--ink)] shadow-sm border border-[rgba(0,0,0,0.04)]"
                    : "text-[var(--muted)] hover:text-[var(--ink)] bg-transparent"
                    }`}
                  onClick={() => handleRoleChange("trader")}
                  type="button"
                >
                  Trader
                </button>
                <button
                  className={`flex-1 rounded-[9px] py-2 text-[13px] font-semibold transition-all ${role === "analyst"
                    ? "bg-white text-[var(--ink)] shadow-sm border border-[rgba(0,0,0,0.04)]"
                    : "text-[var(--muted)] hover:text-[var(--ink)] bg-transparent"
                    }`}
                  onClick={() => handleRoleChange("analyst")}
                  type="button"
                >
                  SEBI Analyst
                </button>
              </div>

              {/* ANALYST REGISTRATION FORM */}
              {role === "analyst" ? (
                <form className="space-y-4" onSubmit={handleSubmit}>

                  {/* SECTION 1: PERSONAL & CONTACT */}
                  <div className="border-b border-[var(--line)] pb-4">
                    <h3 className="text-xs font-extrabold uppercase tracking-[0.07em] text-[var(--brand)] mb-3">
                      1. Contact Information
                    </h3>
                    <div className="space-y-4">
                      {/* Full Name */}
                      <div>
                        <label className="mb-1.5 block text-xs font-bold uppercase tracking-[0.05em] text-[var(--muted)]" htmlFor="name">
                          Full Name
                        </label>
                        <input
                          className={`w-full rounded-lg border px-3.5 py-2.5 text-[13px] transition-all placeholder:text-[var(--muted-2)] focus:outline-none ${fieldErrors.name ? "border-[var(--red)] focus:border-[var(--red)] bg-[var(--red-light)]/10" : "border-[var(--line)] focus:border-[var(--brand)] focus:bg-white"
                            }`}
                          id="name"
                          name="name"
                          onChange={handleChange}
                          placeholder="Enter your full name"
                          type="text"
                          value={formData.name}
                        />
                        {fieldErrors.name && <p className="mt-1 text-[11px] text-[var(--red)] font-medium">{fieldErrors.name}</p>}
                      </div>

                      {/* Phone */}
                      <div>
                        <label className="mb-1.5 block text-xs font-bold uppercase tracking-[0.05em] text-[var(--muted)]" htmlFor="phone">
                          Phone Number
                        </label>
                        <div className="relative flex rounded-lg">
                          <span className="inline-flex items-center rounded-l-lg border-y border-l border-[var(--line)] bg-[var(--line-2)] px-3 text-[13px] font-bold text-[var(--ink)] select-none">
                            +91
                          </span>
                          <input
                            className={`w-full rounded-r-lg border-y border-r px-3.5 py-2.5 text-[13px] transition-all placeholder:text-[var(--muted-2)] focus:outline-none ${fieldErrors.phone ? "border-[var(--red)] focus:border-[var(--red)] bg-[var(--red-light)]/10" : "border-[var(--line)] focus:border-[var(--brand)] focus:bg-white"
                              }`}
                            id="phone"
                            name="phone"
                            onChange={handleChange}
                            placeholder="10-digit mobile number"
                            type="tel"
                            value={formData.phone}
                            maxLength={10}
                            inputMode="numeric"
                            pattern="[0-9]*"
                          />
                        </div>
                        {fieldErrors.phone && <p className="mt-1 text-[11px] text-[var(--red)] font-medium">{fieldErrors.phone}</p>}
                      </div>

                      {/* Email */}
                      <div>
                        <label className="mb-1.5 block text-xs font-bold uppercase tracking-[0.05em] text-[var(--muted)]" htmlFor="email">
                          Email Address
                        </label>
                        <input
                          className={`w-full rounded-lg border px-3.5 py-2.5 text-[13px] transition-all placeholder:text-[var(--muted-2)] focus:outline-none ${fieldErrors.email ? "border-[var(--red)] focus:border-[var(--red)] bg-[var(--red-light)]/10" : "border-[var(--line)] focus:border-[var(--brand)] focus:bg-white"
                            }`}
                          id="email"
                          name="email"
                          onChange={handleChange}
                          placeholder="name@example.com"
                          type="email"
                          value={formData.email}
                        />
                        {fieldErrors.email && <p className="mt-1 text-[11px] text-[var(--red)] font-medium">{fieldErrors.email}</p>}
                      </div>

                      {/* Password */}
                      <div>
                        <label className="mb-1.5 block text-xs font-bold uppercase tracking-[0.05em] text-[var(--muted)]" htmlFor="password">
                          Password
                        </label>
                        <div className="relative">
                          <input
                            className={`w-full rounded-lg border pl-3.5 pr-10 py-2.5 text-[13px] transition-all placeholder:text-[var(--muted-2)] focus:outline-none ${fieldErrors.password ? "border-[var(--red)] focus:border-[var(--red)] bg-[var(--red-light)]/10" : "border-[var(--line)] focus:border-[var(--brand)] focus:bg-white"
                              }`}
                            id="password"
                            name="password"
                            onChange={handleChange}
                            placeholder="At least 8 characters"
                            type={showPassword ? "text" : "password"}
                            value={formData.password}
                          />
                          <button
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted-2)] hover:text-[var(--ink)] focus:outline-none p-1"
                            onClick={() => setShowPassword(!showPassword)}
                            type="button"
                          >
                            <Icon className="h-4 w-4" name={showPassword ? "eyeOff" : "eye"} />
                          </button>
                        </div>
                        {fieldErrors.password && <p className="mt-1 text-[11px] text-[var(--red)] font-medium">{fieldErrors.password}</p>}
                      </div>
                    </div>
                  </div>

                  {/* SECTION 2: BUSINESS DETAILS */}
                  <div className="border-b border-[var(--line)] pb-4">
                    <h3 className="text-xs font-extrabold uppercase tracking-[0.07em] text-[var(--brand)] mb-3">
                      2. Company Information
                    </h3>
                    <div className="space-y-4">
                      {/* Company Name */}
                      <div>
                        <label className="mb-1.5 block text-xs font-bold uppercase tracking-[0.05em] text-[var(--muted)]" htmlFor="companyName">
                          Company / Entity Name
                        </label>
                        <input
                          className={`w-full rounded-lg border px-3.5 py-2.5 text-[13px] transition-all placeholder:text-[var(--muted-2)] focus:outline-none ${fieldErrors.companyName ? "border-[var(--red)] focus:border-[var(--red)] bg-[var(--red-light)]/10" : "border-[var(--line)] focus:border-[var(--brand)] focus:bg-white"
                            }`}
                          id="companyName"
                          name="companyName"
                          onChange={handleChange}
                          placeholder="Enter company/entity name"
                          type="text"
                          value={formData.companyName}
                        />
                        {fieldErrors.companyName && <p className="mt-1 text-[11px] text-[var(--red)] font-medium">{fieldErrors.companyName}</p>}
                      </div>

                      {/* Location */}
                      <div>
                        <label className="mb-1.5 block text-xs font-bold uppercase tracking-[0.05em] text-[var(--muted)]" htmlFor="companyLocation">
                          Location of the Company
                        </label>
                        <input
                          className={`w-full rounded-lg border px-3.5 py-2.5 text-[13px] transition-all placeholder:text-[var(--muted-2)] focus:outline-none ${fieldErrors.companyLocation ? "border-[var(--red)] focus:border-[var(--red)] bg-[var(--red-light)]/10" : "border-[var(--line)] focus:border-[var(--brand)] focus:bg-white"
                            }`}
                          id="companyLocation"
                          name="companyLocation"
                          onChange={handleChange}
                          placeholder="e.g. Mumbai, India"
                          type="text"
                          value={formData.companyLocation}
                        />
                        {fieldErrors.companyLocation && <p className="mt-1 text-[11px] text-[var(--red)] font-medium">{fieldErrors.companyLocation}</p>}
                      </div>

                      {/* Business Type */}
                      <div>
                        <label className="mb-1.5 block text-xs font-bold uppercase tracking-[0.05em] text-[var(--muted)]" htmlFor="businessType">
                          Business Type
                        </label>
                        <DropdownMenu>
                          <DropdownMenuTrigger
                            id="businessType"
                            className="w-full flex items-center justify-between rounded-lg border border-[var(--line)] bg-white px-3.5 py-2.5 text-[13px] text-[var(--ink)] transition-all focus:border-[var(--brand)] focus:outline-none cursor-pointer"
                            render={<button type="button" />}
                          >
                            <span>
                              {formData.businessType === "Individual" && "Individual"}
                              {formData.businessType === "Partnership" && "Partnership"}
                              {formData.businessType === "LLP" && "LLP"}
                              {formData.businessType === "Corporate" && "Corporate / Private Limited"}
                            </span>
                            <ChevronDown className="h-4 w-4 text-[var(--muted-2)]" />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent className="w-[--anchor-width] min-w-[200px]">
                            <DropdownMenuItem onSelect={() => handleSelectChange("businessType", "Individual")}>
                              Individual
                            </DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => handleSelectChange("businessType", "Partnership")}>
                              Partnership
                            </DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => handleSelectChange("businessType", "LLP")}>
                              LLP
                            </DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => handleSelectChange("businessType", "Corporate")}>
                              Corporate / Private Limited
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      {/* Website */}
                      <div>
                        <label className="mb-1.5 block text-xs font-bold uppercase tracking-[0.05em] text-[var(--muted)]" htmlFor="website">
                          Website (Optional)
                        </label>
                        <input
                          className={`w-full rounded-lg border px-3.5 py-2.5 text-[13px] transition-all placeholder:text-[var(--muted-2)] focus:outline-none ${fieldErrors.website ? "border-[var(--red)] focus:border-[var(--red)] bg-[var(--red-light)]/10" : "border-[var(--line)] focus:border-[var(--brand)] focus:bg-white"
                            }`}
                          id="website"
                          name="website"
                          onChange={handleChange}
                          placeholder="https://example.com"
                          type="url"
                          value={formData.website}
                        />
                        {fieldErrors.website && <p className="mt-1 text-[11px] text-[var(--red)] font-medium">{fieldErrors.website}</p>}
                      </div>
                    </div>
                  </div>

                  {/* SECTION 3: SEBI REGISTRATION */}
                  <div className="pb-4">
                    <h3 className="text-xs font-extrabold uppercase tracking-[0.07em] text-[var(--brand)] mb-3">
                      3. SEBI Registration
                    </h3>
                    <div className="space-y-4">
                      {/* Registration Type */}
                      <div>
                        <label className="mb-1.5 block text-xs font-bold uppercase tracking-[0.05em] text-[var(--muted)]" htmlFor="registrationType">
                          Type of Registration
                        </label>
                        <DropdownMenu>
                          <DropdownMenuTrigger
                            id="registrationType"
                            className="w-full flex items-center justify-between rounded-lg border border-[var(--line)] bg-white px-3.5 py-2.5 text-[13px] text-[var(--ink)] transition-all focus:border-[var(--brand)] focus:outline-none cursor-pointer"
                            render={<button type="button" />}
                          >
                            <span>
                              {formData.registrationType === "research_analyst" ? "Research Analyst" : "Investment Advisors"}
                            </span>
                            <ChevronDown className="h-4 w-4 text-[var(--muted-2)]" />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent className="w-[--anchor-width] min-w-[200px]">
                            <DropdownMenuItem onSelect={() => handleSelectChange("registrationType", "research_analyst")}>
                              Research Analyst
                            </DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => handleSelectChange("registrationType", "investment_advisors")}>
                              Investment Advisors
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      {/* License Number */}
                      <div>
                        <label className="mb-1.5 block text-xs font-bold uppercase tracking-[0.05em] text-[var(--muted)]" htmlFor="sebiLicenseNumber">
                          SEBI Registration / License Number
                        </label>
                        <input
                          className={`w-full rounded-lg border px-3.5 py-2.5 text-[13px] transition-all placeholder:text-[var(--muted-2)] focus:outline-none ${fieldErrors.sebiLicenseNumber ? "border-[var(--red)] focus:border-[var(--red)] bg-[var(--red-light)]/10" : "border-[var(--line)] focus:border-[var(--brand)] focus:bg-white"
                            }`}
                          id="sebiLicenseNumber"
                          name="sebiLicenseNumber"
                          onChange={handleChange}
                          placeholder="e.g. INH000000000"
                          type="text"
                          value={formData.sebiLicenseNumber}
                        />
                        {fieldErrors.sebiLicenseNumber && <p className="mt-1 text-[11px] text-[var(--red)] font-medium">{fieldErrors.sebiLicenseNumber}</p>}
                      </div>

                      {/* Assets Under Research */}
                      <div>
                        <label className="mb-1.5 block text-xs font-bold uppercase tracking-[0.05em] text-[var(--muted)]" htmlFor="assetUnderResearchCr">
                          Asset Under Research (₹Cr)
                        </label>
                        <input
                          className={`w-full rounded-lg border px-3.5 py-2.5 text-[13px] transition-all placeholder:text-[var(--muted-2)] focus:outline-none ${fieldErrors.assetUnderResearchCr ? "border-[var(--red)] focus:border-[var(--red)] bg-[var(--red-light)]/10" : "border-[var(--line)] focus:border-[var(--brand)] focus:bg-white"
                            }`}
                          id="assetUnderResearchCr"
                          name="assetUnderResearchCr"
                          onChange={handleChange}
                          placeholder="e.g. 10"
                          type="text"
                          value={formData.assetUnderResearchCr}
                        />
                        {fieldErrors.assetUnderResearchCr && <p className="mt-1 text-[11px] text-[var(--red)] font-medium">{fieldErrors.assetUnderResearchCr}</p>}
                      </div>

                      {/* Client Count */}
                      <div>
                        <label className="mb-1.5 block text-xs font-bold uppercase tracking-[0.05em] text-[var(--muted)]" htmlFor="numberOfClients">
                          Number of Research Clients
                        </label>
                        <input
                          className={`w-full rounded-lg border px-3.5 py-2.5 text-[13px] transition-all placeholder:text-[var(--muted-2)] focus:outline-none ${fieldErrors.numberOfClients ? "border-[var(--red)] focus:border-[var(--red)] bg-[var(--red-light)]/10" : "border-[var(--line)] focus:border-[var(--brand)] focus:bg-white"
                            }`}
                          id="numberOfClients"
                          name="numberOfClients"
                          onChange={handleChange}
                          placeholder="e.g. 100"
                          type="text"
                          value={formData.numberOfClients}
                        />
                        {fieldErrors.numberOfClients && <p className="mt-1 text-[11px] text-[var(--red)] font-medium">{fieldErrors.numberOfClients}</p>}
                      </div>
                    </div>
                  </div>

                  {/* SUBMIT BUTTON */}
                  <button
                    className="w-full rounded-lg bg-[var(--brand)] py-3 text-[13.5px] font-bold text-white transition-all hover:bg-[var(--brand-dark)] hover:shadow-md active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2 mt-2"
                    disabled={isSubmitting}
                    type="submit"
                  >
                    {isSubmitting ? (
                      <>
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        Submitting Application...
                      </>
                    ) : (
                      "Verify SEBI Details"
                    )}
                  </button>
                </form>
              ) : (
                <>
                  {/* AUTH ERROR BANNER */}
                  {authError && (
                    <div className="mb-4 rounded-lg border border-[rgba(220,38,38,0.2)] bg-red-50 px-3.5 py-3 text-[13px] text-red-700 flex items-start gap-2">
                      <Icon className="h-4 w-4 shrink-0 mt-0.5" name="x" />
                      <span>{authError}</span>
                    </div>
                  )}

                  {/* TRADER FORM */}
                  <form className="space-y-4" onSubmit={handleSubmit}>
                    {/* Full Name */}
                    <div>
                      <label
                        className="mb-1.5 block text-xs font-bold uppercase tracking-[0.05em] text-[var(--muted)]"
                        htmlFor="name"
                      >
                        Full Name
                      </label>
                      <input
                        className={`w-full rounded-lg border px-3.5 py-2.5 text-[13px] transition-all placeholder:text-[var(--muted-2)] focus:outline-none ${fieldErrors.name
                          ? "border-[var(--red)] focus:border-[var(--red)] bg-[var(--red-light)]/10"
                          : "border-[var(--line)] focus:border-[var(--brand)] focus:bg-white"
                          }`}
                        id="name"
                        name="name"
                        onChange={handleChange}
                        placeholder="Enter your full name"
                        type="text"
                        value={formData.name}
                        autoComplete="name"
                      />
                      {fieldErrors.name && (
                        <p className="mt-1 text-[11px] text-[var(--red)] font-medium">{fieldErrors.name}</p>
                      )}
                    </div>

                    {/* Phone */}
                    <div>
                      <label
                        className="mb-1.5 block text-xs font-bold uppercase tracking-[0.05em] text-[var(--muted)]"
                        htmlFor="phone"
                      >
                        Phone Number
                      </label>
                      <div className="relative flex rounded-lg">
                        <span className="inline-flex items-center rounded-l-lg border-y border-l border-[var(--line)] bg-[var(--line-2)] px-3 text-[13px] font-bold text-[var(--ink)] select-none">
                          +91
                        </span>
                        <input
                          className={`w-full rounded-r-lg border-y border-r px-3.5 py-2.5 text-[13px] transition-all placeholder:text-[var(--muted-2)] focus:outline-none ${fieldErrors.phone
                            ? "border-[var(--red)] focus:border-[var(--red)] bg-[var(--red-light)]/10"
                            : "border-[var(--line)] focus:border-[var(--brand)] focus:bg-white"
                            }`}
                          id="phone"
                          name="phone"
                          onChange={handleChange}
                          placeholder="10-digit mobile number"
                          type="tel"
                          value={formData.phone}
                          autoComplete="tel-national"
                          maxLength={10}
                          inputMode="numeric"
                          pattern="[0-9]*"
                        />
                      </div>
                      {fieldErrors.phone && (
                        <p className="mt-1 text-[11px] text-[var(--red)] font-medium">{fieldErrors.phone}</p>
                      )}
                    </div>

                    {/* Email */}
                    <div>
                      <label
                        className="mb-1.5 block text-xs font-bold uppercase tracking-[0.05em] text-[var(--muted)]"
                        htmlFor="email"
                      >
                        Email Address
                      </label>
                      <input
                        className={`w-full rounded-lg border px-3.5 py-2.5 text-[13px] transition-all placeholder:text-[var(--muted-2)] focus:outline-none ${fieldErrors.email
                          ? "border-[var(--red)] focus:border-[var(--red)] bg-[var(--red-light)]/10"
                          : "border-[var(--line)] focus:border-[var(--brand)] focus:bg-white"
                          }`}
                        id="email"
                        name="email"
                        onChange={handleChange}
                        placeholder="name@example.com"
                        type="email"
                        value={formData.email}
                        autoComplete="email"
                      />
                      {fieldErrors.email && (
                        <p className="mt-1 text-[11px] text-[var(--red)] font-medium">{fieldErrors.email}</p>
                      )}
                    </div>

                    {/* Password */}
                    <div>
                      <label
                        className="mb-1.5 block text-xs font-bold uppercase tracking-[0.05em] text-[var(--muted)]"
                        htmlFor="password"
                      >
                        Password
                      </label>
                      <div className="relative">
                        <input
                          className={`w-full rounded-lg border pl-3.5 pr-10 py-2.5 text-[13px] transition-all placeholder:text-[var(--muted-2)] focus:outline-none ${fieldErrors.password
                            ? "border-[var(--red)] focus:border-[var(--red)] bg-[var(--red-light)]/10"
                            : "border-[var(--line)] focus:border-[var(--brand)] focus:bg-white"
                            }`}
                          id="password"
                          name="password"
                          onChange={handleChange}
                          placeholder="At least 8 characters"
                          type={showPassword ? "text" : "password"}
                          value={formData.password}
                          autoComplete="new-password"
                        />
                        <button
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted-2)] hover:text-[var(--ink)] focus:outline-none p-1"
                          onClick={() => setShowPassword(!showPassword)}
                          type="button"
                          aria-label={showPassword ? "Hide password" : "Show password"}
                        >
                          <Icon className="h-4 w-4" name={showPassword ? "eyeOff" : "eye"} />
                        </button>
                      </div>
                      {fieldErrors.password && (
                        <p className="mt-1 text-[11px] text-[var(--red)] font-medium">{fieldErrors.password}</p>
                      )}
                    </div>

                    {/* SUBMIT */}
                    <button
                      className="w-full rounded-lg bg-[var(--brand)] py-3 text-[13.5px] font-bold text-white transition-all hover:bg-[var(--brand-dark)] hover:shadow-md active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2"
                      disabled={isSubmitting}
                      type="submit"
                    >
                      {isSubmitting ? (
                        <>
                          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                          Creating account...
                        </>
                      ) : (
                        "Create Account"
                      )}
                    </button>
                  </form>

                  {/* SOCIAL DIVIDER */}
                  <div className="my-6 flex items-center justify-center gap-3">
                    <span className="h-[1px] flex-1 bg-[var(--line)]" />
                    <span className="text-[9.5px] font-extrabold uppercase tracking-[0.1em] text-[var(--muted-2)]">
                      Or Continue With
                    </span>
                    <span className="h-[1px] flex-1 bg-[var(--line)]" />
                  </div>

                  {/* SOCIAL BUTTONS — disabled until OAuth is implemented */}
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      className="flex items-center justify-center gap-2 rounded-lg border border-[var(--line)] bg-white py-2.5 text-[13px] font-bold text-[var(--muted-2)] transition-colors cursor-not-allowed opacity-60"
                      type="button"
                      disabled
                      aria-disabled="true"
                      title="Google sign-up coming soon"
                    >
                      <Icon className="h-4 w-4" name="google" />
                      Google
                    </button>
                    <button
                      className="flex items-center justify-center gap-2 rounded-lg border border-[var(--line)] bg-white py-2.5 text-[13px] font-bold text-[var(--muted-2)] transition-colors cursor-not-allowed opacity-60"
                      type="button"
                      disabled
                      aria-disabled="true"
                      title="Apple sign-up coming soon"
                    >
                      <Icon className="h-4 w-4" name="apple" />
                      Apple
                    </button>
                  </div>
                </>
              )}
            </>
          )}
        </div>

        {/* FOOTER */}
        <div className="mt-8 text-center text-[13px] text-[var(--muted)]">
          Already have an account?{" "}
          <Link className="font-semibold text-[var(--brand)] hover:underline" href="/login">
            Log in
          </Link>
        </div>
      </div>
    </main>
  );
}
