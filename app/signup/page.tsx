"use client";

import Link from "next/link";
import { useState } from "react";

import { AuthPanel } from "../components/auth-panel";
import { Icon } from "../components/stoxify-icon";

type Role = "trader" | "analyst";

interface FormErrors {
  name?: string;
  sebi?: string;
  phone?: string;
  email?: string;
  password?: string;
}

interface SubmittedSignupData {
  role: Role;
  name: string;
  email: string;
  phone: string;
  sebi?: string;
  password?: string;
}

export default function SignupPage() {
  const [role, setRole] = useState<Role>("analyst");
  const [formData, setFormData] = useState({
    name: "",
    sebi: "",
    phone: "",
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedData, setSubmittedData] = useState<SubmittedSignupData | null>(null);

  // Field change handler
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear field error when user starts typing
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  // Switch role and reset forms/errors
  const handleRoleChange = (newRole: Role) => {
    setRole(newRole);
    setErrors({});
    setSubmittedData(null);
  };

  // Validation logic
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Full name is required";
    }

    if (role === "analyst") {
      if (!formData.sebi.trim()) {
        newErrors.sebi = "SEBI registration number is required";
      } else if (!/^INH\d{9}$/i.test(formData.sebi.trim())) {
        newErrors.sebi = "SEBI number must start with INH followed by 9 digits (e.g. INH000000000)";
      }
    }

    if (!formData.phone.trim()) {
      newErrors.phone = "Phone number is required";
    } else if (!/^\d{10}$/.test(formData.phone.trim())) {
      newErrors.phone = "Enter a valid 10-digit mobile number";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email address is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      newErrors.email = "Enter a valid email address";
    }

    if (role === "trader" && !formData.password) {
      newErrors.password = "Password is required";
    } else if (role === "trader" && formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Form submission simulation
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    setSubmittedData(null);

    // Simulate network delay
    setTimeout(() => {
      setIsSubmitting(false);
      const output = {
        role,
        name: formData.name,
        email: formData.email,
        phone: `+91${formData.phone}`,
        ...(role === "analyst"
          ? { sebi: formData.sebi.toUpperCase() }
          : { password: formData.password }),
      };

      console.log("Signup form submitted successfully:", output);
      setSubmittedData(output);
    }, 1500);
  };

  return (
    <main className="grid h-screen w-screen grid-cols-1 overflow-hidden min-[860px]:grid-cols-2">
      {/* LEFT SPLIT PANEL: Hidden on small screens, absolute beauty on desktop */}
      <AuthPanel />

      {/* RIGHT PANEL: Form inputs */}
      <div className="flex h-full flex-col justify-between overflow-y-auto bg-white px-6 py-12 min-[860px]:px-16 min-[1100px]:px-24">
        {/* Top Spacer or Small Mobile Header */}
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
          {/* HEADING SECTION */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold tracking-[-0.5px] text-[var(--ink)] mb-1.5">
              {role === "analyst" ? "Join as an Analyst" : "Join as a Trader"}
            </h1>
            <p className="text-[13px] leading-relaxed text-[var(--muted)]">
              {role === "analyst"
                ? "Create your professional profile and share live trades."
                : "Subscribe to registered experts and get real-time trade ideas."}
            </p>
          </div>

          {/* ROLE TOGGLE TABS (Pill Segmented Selector) */}
          <div className="flex rounded-xl bg-[var(--line-2)] p-[3.5px] border border-[var(--line)] mb-6">
            <button
              className={`flex-1 rounded-[9px] py-2 text-[13px] font-semibold transition-all ${
                role === "trader"
                  ? "bg-white text-[var(--ink)] shadow-sm border border-[rgba(0,0,0,0.04)]"
                  : "text-[var(--muted)] hover:text-[var(--ink)] bg-transparent"
              }`}
              onClick={() => handleRoleChange("trader")}
              type="button"
            >
              Trader
            </button>
            <button
              className={`flex-1 rounded-[9px] py-2 text-[13px] font-semibold transition-all ${
                role === "analyst"
                  ? "bg-white text-[var(--ink)] shadow-sm border border-[rgba(0,0,0,0.04)]"
                  : "text-[var(--muted)] hover:text-[var(--ink)] bg-transparent"
              }`}
              onClick={() => handleRoleChange("analyst")}
              type="button"
            >
              SEBI Analyst
            </button>
          </div>

          {/* SUCCESS MESSAGE */}
          {submittedData && (
            <div className="mb-6 rounded-xl border border-[rgba(27,158,75,0.25)] bg-[var(--green-light)] p-4 text-[13px] text-[var(--green)]">
              <div className="flex items-center gap-2 font-bold mb-1">
                <Icon className="h-4 w-4 shrink-0" name="check" />
                <span>Signup Simulated Successfully!</span>
              </div>
              <p className="text-[12px] opacity-90 leading-relaxed mb-2.5">
                Check the browser developer console to view the payload. Next, we will connect this
                form to the backend auth endpoint.
              </p>
              <div className="bg-white/50 p-2.5 rounded font-mono text-[11px] text-[var(--ink)] overflow-x-auto whitespace-pre">
                {JSON.stringify(submittedData, null, 2)}
              </div>
            </div>
          )}

          {/* MAIN FORM */}
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
                className={`w-full rounded-lg border px-3.5 py-2.5 text-[13px] transition-all placeholder:text-[var(--muted-2)] focus:outline-none ${
                  errors.name
                    ? "border-[var(--red)] focus:border-[var(--red)] bg-[var(--red-light)]/10"
                    : "border-[var(--line)] focus:border-[var(--brand)] focus:bg-white"
                }`}
                id="name"
                name="name"
                onChange={handleChange}
                placeholder="Enter your full name"
                type="text"
                value={formData.name}
              />
              {errors.name && (
                <p className="mt-1 text-[11px] text-[var(--red)] font-medium">{errors.name}</p>
              )}
            </div>

            {/* SEBI Registration Code (Analyst Tab Only) */}
            {role === "analyst" && (
              <div>
                <label
                  className="mb-1.5 block text-xs font-bold uppercase tracking-[0.05em] text-[var(--muted)]"
                  htmlFor="sebi"
                >
                  SEBI Registration Number
                </label>
                <input
                  className={`w-full rounded-lg border px-3.5 py-2.5 text-[13px] transition-all placeholder:text-[var(--muted-2)] focus:outline-none ${
                    errors.sebi
                      ? "border-[var(--red)] focus:border-[var(--red)] bg-[var(--red-light)]/10"
                      : "border-[var(--line)] focus:border-[var(--brand)] focus:bg-white"
                  }`}
                  id="sebi"
                  name="sebi"
                  onChange={handleChange}
                  placeholder="e.g. INH000000000"
                  type="text"
                  value={formData.sebi}
                />
                {errors.sebi && (
                  <p className="mt-1 text-[11px] text-[var(--red)] font-medium">{errors.sebi}</p>
                )}
              </div>
            )}

            {/* Phone Number with fixed +91 prefix container inside input visually */}
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
                  className={`w-full rounded-r-lg border-y border-r px-3.5 py-2.5 text-[13px] transition-all placeholder:text-[var(--muted-2)] focus:outline-none ${
                    errors.phone
                      ? "border-[var(--red)] focus:border-[var(--red)] bg-[var(--red-light)]/10"
                      : "border-[var(--line)] focus:border-[var(--brand)] focus:bg-white"
                  }`}
                  id="phone"
                  name="phone"
                  onChange={handleChange}
                  placeholder="10-digit mobile number"
                  type="tel"
                  value={formData.phone}
                />
              </div>
              {errors.phone && (
                <p className="mt-1 text-[11px] text-[var(--red)] font-medium">{errors.phone}</p>
              )}
            </div>

            {/* Email Address */}
            <div>
              <label
                className="mb-1.5 block text-xs font-bold uppercase tracking-[0.05em] text-[var(--muted)]"
                htmlFor="email"
              >
                Email Address
              </label>
              <input
                className={`w-full rounded-lg border px-3.5 py-2.5 text-[13px] transition-all placeholder:text-[var(--muted-2)] focus:outline-none ${
                  errors.email
                    ? "border-[var(--red)] focus:border-[var(--red)] bg-[var(--red-light)]/10"
                    : "border-[var(--line)] focus:border-[var(--brand)] focus:bg-white"
                }`}
                id="email"
                name="email"
                onChange={handleChange}
                placeholder="name@example.com"
                type="email"
                value={formData.email}
              />
              {errors.email && (
                <p className="mt-1 text-[11px] text-[var(--red)] font-medium">{errors.email}</p>
              )}
            </div>

            {/* Password (Trader Tab Only) */}
            {role === "trader" && (
              <div>
                <label
                  className="mb-1.5 block text-xs font-bold uppercase tracking-[0.05em] text-[var(--muted)]"
                  htmlFor="password"
                >
                  Password
                </label>
                <div className="relative">
                  <input
                    className={`w-full rounded-lg border pl-3.5 pr-10 py-2.5 text-[13px] transition-all placeholder:text-[var(--muted-2)] focus:outline-none ${
                      errors.password
                        ? "border-[var(--red)] focus:border-[var(--red)] bg-[var(--red-light)]/10"
                        : "border-[var(--line)] focus:border-[var(--brand)] focus:bg-white"
                    }`}
                    id="password"
                    name="password"
                    onChange={handleChange}
                    placeholder="Create a strong password"
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
                {errors.password && (
                  <p className="mt-1 text-[11px] text-[var(--red)] font-medium">
                    {errors.password}
                  </p>
                )}
              </div>
            )}

            {/* SUBMIT BUTTON */}
            <button
              className="w-full rounded-lg bg-[var(--brand)] py-3 text-[13.5px] font-bold text-white transition-all hover:bg-[var(--brand-dark)] hover:shadow-md active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2"
              disabled={isSubmitting}
              type="submit"
            >
              {isSubmitting ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Processing...
                </>
              ) : role === "analyst" ? (
                "Verify SEBI Details"
              ) : (
                "Create Account"
              )}
            </button>
          </form>

          {/* SOCIAL LOGIN DIVIDER */}
          <div className="my-6 flex items-center justify-center gap-3">
            <span className="h-[1px] flex-1 bg-[var(--line)]" />
            <span className="text-[9.5px] font-extrabold uppercase tracking-[0.1em] text-[var(--muted-2)]">
              Or Continue With
            </span>
            <span className="h-[1px] flex-1 bg-[var(--line)]" />
          </div>

          {/* SOCIAL BUTTONS */}
          <div className="grid grid-cols-2 gap-3">
            <button
              className="flex items-center justify-center gap-2 rounded-lg border border-[var(--line)] bg-white py-2.5 text-[13px] font-bold text-[var(--ink)] transition-colors hover:bg-[var(--line-2)] hover:border-[var(--muted-2)]"
              type="button"
            >
              <Icon className="h-4 w-4" name="google" />
              Google
            </button>
            <button
              className="flex items-center justify-center gap-2 rounded-lg border border-[var(--line)] bg-white py-2.5 text-[13px] font-bold text-[var(--ink)] transition-colors hover:bg-[var(--line-2)] hover:border-[var(--muted-2)]"
              type="button"
            >
              <Icon className="h-4 w-4" name="apple" />
              Apple
            </button>
          </div>
        </div>

        {/* BOTTOM FOOTER LINK */}
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
