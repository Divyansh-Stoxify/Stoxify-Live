"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

import { AuthPanel } from "../components/auth-panel";
import { Icon } from "../components/stoxify-icon";
import { saveAuthToken } from "@/app/lib/api";

interface FormErrors {
  email?: string;
  password?: string;
}

interface SubmittedLoginData {
  email: string;
  password: string;
}

export default function LoginPage() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedData, setSubmittedData] = useState<SubmittedLoginData | null>(null);
  const [nextUrl, setNextUrl] = useState("/dashboard");

  const router = useRouter();

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const next = params.get("next");
      if (next) {
        /* eslint-disable-next-line react-hooks/set-state-in-effect */
        setNextUrl(next);
      }
    }
  }, []);

  // Field change handler
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear field error when user starts typing
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  // Validation logic
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.email.trim()) {
      newErrors.email = "Email address is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      newErrors.email = "Enter a valid email address";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
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
        email: formData.email,
        password: formData.password,
      };

      console.log("Login form submitted successfully:", output);
      setSubmittedData(output);

      // Save mock token to enable bypassing auth middleware
      saveAuthToken("mock_access_token_value");

      // Redirect to next URL or main dashboard
      router.push(nextUrl);
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
          <Link className="text-xs font-semibold text-[var(--brand)]" href="/signup">
            Sign Up
          </Link>
        </div>

        <div className="my-auto mx-auto w-full max-w-[400px]">
          {/* HEADING SECTION */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold tracking-[-0.5px] text-[var(--ink)] mb-1.5">
              Welcome back
            </h1>
            <p className="text-[13px] leading-relaxed text-[var(--muted)]">
              Log in to your Stoxify account to access trade ideas.
            </p>
          </div>

          {/* SUCCESS MESSAGE */}
          {submittedData && (
            <div className="mb-6 rounded-xl border border-[rgba(27,158,75,0.25)] bg-[var(--green-light)] p-4 text-[13px] text-[var(--green)]">
              <div className="flex items-center gap-2 font-bold mb-1">
                <Icon className="h-4 w-4 shrink-0" name="check" />
                <span>Login Simulated Successfully!</span>
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

            {/* Password with Eye icon toggle and Forgot Password link */}
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
                  href="#"
                >
                  Forgot password?
                </Link>
              </div>
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
                  placeholder="Enter your password"
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
                <p className="mt-1 text-[11px] text-[var(--red)] font-medium">{errors.password}</p>
              )}
            </div>

            {/* SUBMIT BUTTON */}
            <button
              className="w-full rounded-lg bg-[var(--brand)] py-3 text-[13.5px] font-bold text-white transition-all hover:bg-[var(--brand-dark)] hover:shadow-md active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2"
              disabled={isSubmitting}
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
          Don&apos;t have an account?{" "}
          <Link className="font-semibold text-[var(--brand)] hover:underline" href="/signup">
            Sign up
          </Link>
        </div>
      </div>
    </main>
  );
}
