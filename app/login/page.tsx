"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { AuthPanel } from "@/components/auth-panel";
import { Icon } from "@/components/stoxify-icon";

interface FormErrors {
  email?: string;
  password?: string;
}

export default function LoginPage() {
  const router = useRouter();
  const [emailVerified, setEmailVerified] = useState(false);
  const [formData, setFormData] = useState({ email: "", password: "" });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (params.get("verified") === "1") setEmailVerified(true);
  }, []);
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FormErrors>({});
  const [authError, setAuthError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [consecutiveFailures, setConsecutiveFailures] = useState(0);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (fieldErrors[name as keyof FormErrors]) {
      setFieldErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.email.trim()) {
      newErrors.email = "Email address is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      newErrors.email = "Enter a valid email address";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    }

    setFieldErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    if (consecutiveFailures >= 5) return;

    setIsSubmitting(true);
    setAuthError(null);

    const fingerprint = {
      ua: navigator.userAgent,
      lang: navigator.language,
      tz: Intl.DateTimeFormat().resolvedOptions().timeZone,
      screen: `${screen.width}x${screen.height}`,
    };

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        cache: "no-store",
        body: JSON.stringify({
          email: formData.email.trim().toLowerCase(),
          password: formData.password,
          device_fingerprint: fingerprint,
          device_type: "WEB",
          device_name: "Web",
        }),
      });

      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        error?: string;
        code?: string;
        redirectTo?: string;
        user?: unknown;
      };

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
        if (data.code === "EMAIL_UNVERIFIED") {
          router.push(
            `/verify-email?email=${encodeURIComponent(formData.email.trim().toLowerCase())}`
          );
          return;
        }
        setConsecutiveFailures((c) => c + 1);
        setFormData((prev) => ({ ...prev, password: "" }));
        setAuthError(data.error ?? "Unable to sign in");
        setIsSubmitting(false);
        return;
      }

      const params = new URLSearchParams(window.location.search);
      const next = params.get("next");
      const destination = next && next.startsWith("/") ? next : (data.redirectTo ?? "/");
      router.push(destination);
      router.refresh();
    } catch {
      setAuthError("Unable to sign in. Please check your connection and try again.");
      setIsSubmitting(false);
    }
  };

  const submitDisabled = isSubmitting || consecutiveFailures >= 5;

  return (
    <main className="grid h-screen w-screen grid-cols-1 overflow-hidden min-[860px]:grid-cols-2">
      {/* LEFT SPLIT PANEL: Hidden on small screens */}
      <AuthPanel />

      {/* RIGHT PANEL: Form inputs */}
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
          {/* HEADING */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold tracking-[-0.5px] text-[var(--ink)] mb-1.5">
              Welcome back
            </h1>
            <p className="text-[13px] leading-relaxed text-[var(--muted)]">
              Log in to your Stoxify account to access trade ideas.
            </p>
          </div>

          {/* EMAIL VERIFIED SUCCESS BANNER */}
          {emailVerified && (
            <div className="mb-4 rounded-lg border border-[rgba(27,158,75,0.25)] bg-[var(--green-light)] px-3.5 py-3 text-[13px] text-[var(--green)] flex items-start gap-2">
              <Icon className="h-4 w-4 shrink-0 mt-0.5" name="check" />
              <span>Email verified! You can now log in.</span>
            </div>
          )}

          {/* AUTH ERROR BANNER */}
          {authError && (
            <div className="mb-4 rounded-lg border border-[rgba(220,38,38,0.2)] bg-red-50 px-3.5 py-3 text-[13px] text-red-700 flex items-start gap-2">
              <Icon className="h-4 w-4 shrink-0 mt-0.5" name="x" />
              <span>{authError}</span>
            </div>
          )}

          {/* LOCKED-OUT HINT */}
          {consecutiveFailures >= 5 && (
            <div className="mb-4 rounded-lg border border-[rgba(234,179,8,0.3)] bg-yellow-50 px-3.5 py-3 text-[13px] text-yellow-800">
              Too many failed attempts. Please wait before trying again or{" "}
              <Link className="font-semibold underline" href="/forgot-password">
                reset your password
              </Link>
              .
            </div>
          )}

          {/* MAIN FORM */}
          <form className="space-y-4" onSubmit={handleSubmit}>
            {/* Email */}
            <div>
              <label
                className="mb-1.5 block text-xs font-bold uppercase tracking-[0.05em] text-[var(--muted)]"
                htmlFor="email"
              >
                Email Address
              </label>
              <input
                className={`w-full rounded-lg border px-3.5 py-2.5 text-[13px] transition-all placeholder:text-[var(--muted-2)] focus:outline-none ${
                  fieldErrors.email
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
                <p className="mt-1 text-[11px] text-[var(--red)] font-medium">
                  {fieldErrors.email}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label
                  className="block text-xs font-bold uppercase tracking-[0.05em] text-[var(--muted)]"
                  htmlFor="password"
                >
                  Password
                </label>
                <Link
                  className="text-[11.5px] font-bold text-[var(--brand)] hover:underline"
                  href="/forgot-password"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <input
                  className={`w-full rounded-lg border pl-3.5 pr-10 py-2.5 text-[13px] transition-all placeholder:text-[var(--muted-2)] focus:outline-none ${
                    fieldErrors.password
                      ? "border-[var(--red)] focus:border-[var(--red)] bg-[var(--red-light)]/10"
                      : "border-[var(--line)] focus:border-[var(--brand)] focus:bg-white"
                  }`}
                  id="password"
                  name="password"
                  onChange={handleChange}
                  placeholder="Enter your password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  autoComplete="current-password"
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
                <p className="mt-1 text-[11px] text-[var(--red)] font-medium">
                  {fieldErrors.password}
                </p>
              )}
            </div>

            {/* SUBMIT */}
            <button
              className="w-full rounded-lg bg-[var(--brand)] py-3 text-[13.5px] font-bold text-white transition-all hover:bg-[var(--brand-dark)] hover:shadow-md active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2"
              disabled={submitDisabled}
              type="submit"
            >
              {isSubmitting ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Logging in...
                </>
              ) : (
                "Log In"
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

          {/* SOCIAL BUTTONS — disabled until OAuth is implemented */}
          <div className="grid grid-cols-2 gap-3">
            <button
              className="flex items-center justify-center gap-2 rounded-lg border border-[var(--line)] bg-white py-2.5 text-[13px] font-bold text-[var(--muted-2)] transition-colors cursor-not-allowed opacity-60"
              type="button"
              disabled
              aria-disabled="true"
              title="Google sign-in coming soon"
            >
              <Icon className="h-4 w-4" name="google" />
              Google
            </button>
            <button
              className="flex items-center justify-center gap-2 rounded-lg border border-[var(--line)] bg-white py-2.5 text-[13px] font-bold text-[var(--muted-2)] transition-colors cursor-not-allowed opacity-60"
              type="button"
              disabled
              aria-disabled="true"
              title="Apple sign-in coming soon"
            >
              <Icon className="h-4 w-4" name="apple" />
              Apple
            </button>
          </div>
        </div>

        {/* FOOTER */}
        <div className="mt-8 text-center text-[13px] text-[var(--muted)]">
          Don&apos;t have an account?{" "}
          <Link className="font-semibold text-[var(--brand)] hover:underline" href="/signup">
            Sign up
          </Link>
        </div>
      </div>
    </main>
  );
}
