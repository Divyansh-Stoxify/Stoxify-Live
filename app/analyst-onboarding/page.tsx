"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Icon } from "@/components/stoxify-icon";
import { cleanErrorMessage } from "@/lib/utils";

interface FormErrors {
  name?: string;
  email?: string;
  sebiLicenseNumber?: string;
  companyName?: string;
  companyLocation?: string;
  businessType?: string;
  registrationType?: string;
  assetUnderResearchCr?: string;
  numberOfClients?: string;
}

/* ─── Sidebar ─────────────────────────────────────────────────────────── */

const sidebarFeatures = [
  {
    icon: "shieldCheck" as const,
    title: "SEBI Compliant",
    desc: "Built with regulatory guidelines in mind.",
  },
  {
    icon: "users" as const,
    title: "Audience Growth",
    desc: "Reach thousands of active traders directly.",
  },
  {
    icon: "banknote" as const,
    title: "Instant Payouts",
    desc: "Zero hidden fees on subscription revenue.",
  },
];

function OnboardingSidebar({ formStep }: { formStep: number }) {
  const sidebarSteps = [
    { label: "Phone Verified", done: true },
    { label: "Personal Details", done: formStep > 0, active: formStep === 0 },
    { label: "SEBI & Business", done: false, active: formStep === 1 },
    { label: "Dashboard", done: false },
  ];

  return (
    <aside className="hidden lg:flex w-[280px] shrink-0 flex-col border-r border-[var(--line)] bg-white">
      {/* Logo */}
      <div className="flex h-[66px] items-center px-6 border-b border-[var(--line)]">
        <Link
          href="/"
          className="flex items-center font-sans text-[21px] font-extrabold tracking-[-0.5px] text-[var(--ink)]"
        >
          Stoxify
        </Link>
      </div>

      {/* Steps */}
      <div className="px-5 py-6 border-b border-[var(--line)]">
        <div className="text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--muted-2)] mb-4">
          Registration Progress
        </div>
        <div className="flex flex-col">
          {sidebarSteps.map((step, i) => (
            <div key={step.label} className="flex items-start gap-3 relative">
              {/* Connector line */}
              {i < sidebarSteps.length - 1 && (
                <div
                  className={`absolute left-[13px] top-[28px] w-px h-[16px] transition-colors duration-300 ${
                    step.done ? "bg-[var(--green)]" : "bg-[var(--line)]"
                  }`}
                />
              )}
              {/* Icon */}
              <div
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-bold transition-all duration-300 ${
                  step.done
                    ? "bg-[var(--green)] text-white"
                    : step.active
                      ? "bg-[var(--brand)] text-white ring-4 ring-[var(--brand-light)]"
                      : "border-2 border-[var(--line)] text-[var(--muted-2)] bg-white"
                }`}
              >
                {step.done ? <Icon name="check" className="h-3.5 w-3.5" /> : i + 1}
              </div>
              {/* Label */}
              <span
                className={`text-[13px] font-medium py-1.5 transition-colors duration-300 ${
                  step.done
                    ? "text-[var(--green)]"
                    : step.active
                      ? "text-[var(--brand)] font-semibold"
                      : "text-[var(--muted-2)]"
                }`}
              >
                {step.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Feature highlights */}
      <div className="flex-1 px-5 py-6 overflow-y-auto">
        <div className="text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--muted-2)] mb-4">
          Why Stoxify
        </div>
        <div className="flex flex-col gap-4">
          {sidebarFeatures.map((f) => (
            <div key={f.title} className="flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--brand-light)] text-[var(--brand)]">
                <Icon name={f.icon} className="h-4 w-4" />
              </div>
              <div>
                <div className="text-[12px] font-bold text-[var(--ink)] mb-0.5">{f.title}</div>
                <div className="text-[11px] text-[var(--muted)] leading-[1.5]">{f.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-[var(--line)] px-5 py-4">
        <div className="flex items-center gap-2 text-[11px] text-[var(--muted)]">
          <Icon name="lock" className="h-3.5 w-3.5" />
          <span className="font-medium">256-bit encrypted · SEBI compliant</span>
        </div>
      </div>
    </aside>
  );
}

/* ─── Mobile Top Bar ──────────────────────────────────────────────────── */

function MobileTopBar({ formStep }: { formStep: number }) {
  return (
    <header className="flex h-[60px] shrink-0 items-center justify-between border-b border-[var(--line)] bg-white px-5 lg:hidden">
      <Link
        href="/"
        className="font-sans text-[18px] font-extrabold tracking-[-0.5px] text-[var(--ink)]"
      >
        Stoxify
      </Link>

      {/* Compact stepper */}
      <div className="flex items-center gap-2">
        {/* Phone verified */}
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--green)] text-white text-[10px]">
          <Icon name="check" className="h-3 w-3" />
        </span>
        <div className="h-px w-3 bg-[var(--line)]" />
        {/* Step 1: Personal */}
        <span
          className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold transition-all duration-300 ${
            formStep > 0
              ? "bg-[var(--green)] text-white"
              : formStep === 0
                ? "bg-[var(--brand)] text-white ring-2 ring-[var(--brand-light)]"
                : "border-2 border-[var(--line)] text-[var(--muted-2)] bg-white"
          }`}
        >
          {formStep > 0 ? <Icon name="check" className="h-3 w-3" /> : "2"}
        </span>
        <div className="h-px w-3 bg-[var(--line)]" />
        {/* Step 2: SEBI */}
        <span
          className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold transition-all duration-300 ${
            formStep === 1
              ? "bg-[var(--brand)] text-white ring-2 ring-[var(--brand-light)]"
              : "border-2 border-[var(--line)] text-[var(--muted-2)] bg-white"
          }`}
        >
          3
        </span>
        <div className="h-px w-3 bg-[var(--line)]" />
        {/* Dashboard */}
        <span className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-[var(--line)] text-[var(--muted-2)] text-[10px] font-bold bg-white">
          4
        </span>
      </div>

      <div className="flex items-center gap-1.5 text-[11px] text-[var(--muted)]">
        <Icon name="lock" className="h-3 w-3" />
      </div>
    </header>
  );
}

/* ─── Shared Styles ───────────────────────────────────────────────────── */

const inputBase =
  "w-full rounded-lg border px-3.5 py-3 text-[14px] font-medium transition-all duration-200 focus:outline-none placeholder:text-[var(--muted-2)] placeholder:font-normal";

const inputNormal =
  "border-[var(--line)] bg-white focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--brand)]/10 hover:border-[var(--muted-2)]";

const inputError =
  "border-red-300 bg-red-50/30 focus:border-red-500 focus:ring-2 focus:ring-red-500/10";

const selectBase =
  "w-full rounded-lg border px-3.5 py-3 text-[14px] font-medium transition-all duration-200 focus:outline-none appearance-none bg-white";

const labelBase =
  "block text-[11px] font-bold uppercase tracking-[0.06em] text-[var(--muted)] mb-1.5";

/* ─── Field Error ─────────────────────────────────────────────────────── */

function FieldError({ children }: { children: React.ReactNode }) {
  return (
    <p className="mt-1.5 text-[11px] text-red-600 font-semibold flex items-center gap-1">
      <Icon name="x" className="h-3 w-3" />
      {children}
    </p>
  );
}

/* ─── Main Form ───────────────────────────────────────────────────────── */

function AnalystOnboardingForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const phone = searchParams.get("phone");

  const [formStep, setFormStep] = useState(0); // 0 = Personal, 1 = SEBI & Business

  const [registerData, setRegisterData] = useState({
    name: "",
    email: "",
    sebiLicenseNumber: "",
    companyName: "",
    companyLocation: "",
    businessType: "",
    website: "",
    registrationType: "",
    assetUnderResearchCr: "",
    numberOfClients: "",
  });

  const [fieldErrors, setFieldErrors] = useState<FormErrors>({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!token || !phone) {
      router.replace("/");
    }
  }, [token, phone, router]);

  /* ── Step 1 validation ── */
  const validateStep1 = (): boolean => {
    const errors: FormErrors = {};
    if (!registerData.name.trim()) errors.name = "Full name is required";
    if (!registerData.email.trim() || !registerData.email.includes("@")) {
      errors.email = "Enter a valid email address";
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return false;
    }
    setFieldErrors({});
    return true;
  };

  const handleNext = () => {
    if (validateStep1()) {
      setFormStep(1);
    }
  };

  const handleBack = () => {
    setFormStep(0);
    setFieldErrors({});
    setGeneralError(null);
  };

  /* ── Full submission ── */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError(null);
    setFieldErrors({});

    const errors: FormErrors = {};
    if (!registerData.sebiLicenseNumber.trim()) {
      errors.sebiLicenseNumber = "SEBI Registration Number is required";
    }
    if (!registerData.companyName.trim()) {
      errors.companyName = "Company Name is required";
    }
    if (!registerData.companyLocation.trim()) {
      errors.companyLocation = "Company Location is required";
    }
    if (!registerData.businessType) {
      errors.businessType = "Business Type is required";
    }
    if (!registerData.registrationType) {
      errors.registrationType = "Type of Registration is required";
    }
    if (!registerData.assetUnderResearchCr.trim()) {
      errors.assetUnderResearchCr = "AUM is required";
    } else if (isNaN(Number(registerData.assetUnderResearchCr))) {
      errors.assetUnderResearchCr = "Must be a number";
    }
    if (!registerData.numberOfClients.trim()) {
      errors.numberOfClients = "Number of clients is required";
    } else if (isNaN(Number(registerData.numberOfClients))) {
      errors.numberOfClients = "Must be a number";
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/auth/register-analyst", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        cache: "no-store",
        body: JSON.stringify({
          name: registerData.name.trim(),
          email: registerData.email.trim().toLowerCase(),
          phone: phone,
          sebi_license_number: registerData.sebiLicenseNumber.trim(),
          company_name: registerData.companyName.trim(),
          company_location: registerData.companyLocation.trim(),
          business_type: registerData.businessType,
          website: registerData.website.trim() || undefined,
          registration_type: registerData.registrationType,
          asset_under_research_cr: Number(registerData.assetUnderResearchCr),
          number_of_clients: Number(registerData.numberOfClients),
          registration_token: token,
        }),
      });

      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        redirectTo?: string;
        field_errors?: { path: string[]; message: string }[];
      };

      if (!res.ok) {
        if (data.field_errors && Array.isArray(data.field_errors)) {
          const newFieldErrors: Record<string, string> = {};
          data.field_errors.forEach((err) => {
            const field = err.path[0];
            if (field === "email") newFieldErrors.email = err.message;
            if (field === "name") newFieldErrors.name = err.message;
            if (field === "company_name") newFieldErrors.companyName = err.message;
            if (field === "company_location") newFieldErrors.companyLocation = err.message;
            if (field === "sebi_license_number") newFieldErrors.sebiLicenseNumber = err.message;
            if (field === "business_type") newFieldErrors.businessType = err.message;
            if (field === "registration_type") newFieldErrors.registrationType = err.message;
            if (field === "asset_under_research_cr")
              newFieldErrors.assetUnderResearchCr = err.message;
            if (field === "number_of_clients") newFieldErrors.numberOfClients = err.message;
            if (field === "website") newFieldErrors.website = err.message;
          });
          setFieldErrors(newFieldErrors);

          if (newFieldErrors.name || newFieldErrors.email) {
            setFormStep(0);
          }
          setGeneralError(cleanErrorMessage(data, data.error ?? "Please check the highlighted fields."));
          setIsSubmitting(false);
          return;
        }

        setGeneralError(cleanErrorMessage(data, data.error ?? "Registration failed. Please try again."));
        setIsSubmitting(false);
        return;
      }

      window.location.href = data.redirectTo || "/dashboard";
    } catch {
      setGeneralError("Unable to reach the server. Please check your connection.");
      setIsSubmitting(false);
    }
  };

  if (!token || !phone) return null;

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--surface)] font-sans">
      {/* ─── Desktop Sidebar ─── */}
      <OnboardingSidebar formStep={formStep} />

      {/* ─── Main Content Area ─── */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <MobileTopBar formStep={formStep} />

        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-[580px] px-5 py-8 md:py-12">
            {/* Page Header */}
            <div className="mb-8 animate-[fadeUp_0.4s_ease_both]">
              <div className="inline-flex items-center gap-2 rounded-full bg-[var(--brand-light)] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.06em] text-[var(--brand)] mb-4">
                <Icon name="users" className="h-3 w-3" />
                {formStep === 0 ? "Step 1 of 2" : "Step 2 of 2"}
              </div>
              <h1 className="text-[26px] font-extrabold tracking-[-0.5px] text-[var(--ink)] mb-1.5">
                {formStep === 0 ? "Personal details" : "SEBI & Business info"}
              </h1>
              <p className="text-[14px] text-[var(--muted)] leading-relaxed">
                {formStep === 0
                  ? "Let's start with your basic information."
                  : "Almost there — fill in your professional details."}
              </p>
            </div>

            {/* Step indicator pills (inline) */}
            <div className="flex items-center gap-2 mb-6">
              <div
                className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${
                  formStep >= 0 ? "bg-[var(--brand)]" : "bg-[var(--line)]"
                }`}
              />
              <div
                className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${
                  formStep >= 1 ? "bg-[var(--brand)]" : "bg-[var(--line)]"
                }`}
              />
            </div>

            {/* ═══════════════════ STEP 1: Personal Details ═══════════════════ */}
            {formStep === 0 && (
              <div className="animate-[fadeUp_0.3s_ease_both]">
                <div className="rounded-xl border border-[var(--line)] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04),0_8px_24px_rgba(0,0,0,0.03)] p-5 md:p-8">
                  <div className="space-y-5">
                    {/* Full Name */}
                    <div>
                      <label className={labelBase} htmlFor="onb-name">
                        Full Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="onb-name"
                        type="text"
                        placeholder="Name as per SEBI records"
                        value={registerData.name}
                        onChange={(e) =>
                          setRegisterData((prev) => ({ ...prev, name: e.target.value }))
                        }
                        className={`${inputBase} ${fieldErrors.name ? inputError : inputNormal}`}
                        autoFocus
                      />
                      {fieldErrors.name && <FieldError>{fieldErrors.name}</FieldError>}
                    </div>

                    {/* Phone */}
                    <div>
                      <label className={`${labelBase} flex items-center justify-between`}>
                        <span>Phone Number</span>
                        <span className="flex items-center gap-1 text-[var(--green)] text-[10px] normal-case tracking-normal font-semibold">
                          <Icon name="check" className="h-3 w-3" />
                          Verified
                        </span>
                      </label>
                      <input
                        type="text"
                        disabled
                        value={phone || ""}
                        className={`${inputBase} border-[var(--line)] bg-[var(--surface)] text-[var(--muted)] cursor-not-allowed opacity-75`}
                      />
                    </div>

                    {/* Email */}
                    <div>
                      <label className={labelBase} htmlFor="onb-email">
                        Email Address <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="onb-email"
                        type="email"
                        placeholder="Official email address"
                        value={registerData.email}
                        onChange={(e) =>
                          setRegisterData((prev) => ({ ...prev, email: e.target.value }))
                        }
                        className={`${inputBase} ${fieldErrors.email ? inputError : inputNormal}`}
                      />
                      {fieldErrors.email && <FieldError>{fieldErrors.email}</FieldError>}
                    </div>
                  </div>

                  {/* Next button */}
                  <div className="pt-6 mt-2 border-t border-[var(--line)]">
                    <button
                      type="button"
                      onClick={handleNext}
                      className="w-full bg-[var(--brand)] text-white font-bold h-[52px] rounded-lg text-[14px] transition-all duration-200 hover:bg-[var(--brand-dark)] hover:shadow-[0_4px_16px_rgba(31,122,224,0.35)] active:scale-[0.98] flex items-center justify-center gap-2.5"
                    >
                      Continue
                      <Icon name="arrowRight" className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ═══════════════════ STEP 2: SEBI & Business ═══════════════════ */}
            {formStep === 1 && (
              <div className="animate-[fadeUp_0.3s_ease_both]">
                <div className="rounded-xl border border-[var(--line)] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04),0_8px_24px_rgba(0,0,0,0.03)] p-5 md:p-8">
                  <form onSubmit={handleSubmit} className="space-y-5">
                    {/* SEBI Registration Number */}
                    <div>
                      <label className={labelBase} htmlFor="onb-sebi">
                        SEBI Registration Number <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          id="onb-sebi"
                          type="text"
                          placeholder="e.g. INH000000000"
                          value={registerData.sebiLicenseNumber}
                          onChange={(e) =>
                            setRegisterData((prev) => ({
                              ...prev,
                              sebiLicenseNumber: e.target.value.toUpperCase(),
                            }))
                          }
                          className={`${inputBase} pl-10 uppercase font-semibold tracking-wide ${
                            fieldErrors.sebiLicenseNumber ? inputError : inputNormal
                          }`}
                          autoFocus
                        />
                        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--muted-2)]">
                          <Icon name="fileBadge" className="h-4 w-4" />
                        </div>
                      </div>
                      {fieldErrors.sebiLicenseNumber && (
                        <FieldError>{fieldErrors.sebiLicenseNumber}</FieldError>
                      )}
                    </div>

                    {/* Entity Name + City */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className={labelBase} htmlFor="onb-entity">
                          Entity Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          id="onb-entity"
                          type="text"
                          placeholder="e.g. Stoxify Advisory"
                          value={registerData.companyName}
                          onChange={(e) =>
                            setRegisterData((prev) => ({ ...prev, companyName: e.target.value }))
                          }
                          className={`${inputBase} ${
                            fieldErrors.companyName ? inputError : inputNormal
                          }`}
                        />
                        {fieldErrors.companyName && (
                          <FieldError>{fieldErrors.companyName}</FieldError>
                        )}
                      </div>
                      <div>
                        <label className={labelBase} htmlFor="onb-city">
                          City / Location <span className="text-red-500">*</span>
                        </label>
                        <input
                          id="onb-city"
                          type="text"
                          placeholder="e.g. Mumbai"
                          value={registerData.companyLocation}
                          onChange={(e) =>
                            setRegisterData((prev) => ({
                              ...prev,
                              companyLocation: e.target.value,
                            }))
                          }
                          className={`${inputBase} ${
                            fieldErrors.companyLocation ? inputError : inputNormal
                          }`}
                        />
                        {fieldErrors.companyLocation && (
                          <FieldError>{fieldErrors.companyLocation}</FieldError>
                        )}
                      </div>
                    </div>

                    {/* Business Type + Website */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className={labelBase} htmlFor="onb-btype">
                          Business Type <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <select
                            id="onb-btype"
                            value={registerData.businessType}
                            onChange={(e) =>
                              setRegisterData((prev) => ({
                                ...prev,
                                businessType: e.target.value,
                              }))
                            }
                            className={`${selectBase} ${
                              fieldErrors.businessType ? inputError : inputNormal
                            } pr-10`}
                          >
                            <option value="" disabled>
                              Select type
                            </option>
                            <option value="Individual">Individual</option>
                            <option value="Partnership Firm">Partnership Firm</option>
                            <option value="Limited Liability Partnership">LLP</option>
                            <option value="Body Corporate">Body Corporate</option>
                          </select>
                          <Icon
                            name="chevronDown"
                            className="absolute right-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[var(--muted-2)] pointer-events-none"
                          />
                        </div>
                        {fieldErrors.businessType && (
                          <FieldError>{fieldErrors.businessType}</FieldError>
                        )}
                      </div>
                      <div>
                        <label className={labelBase} htmlFor="onb-website">
                          Website{" "}
                          <span className="text-[10px] lowercase text-[var(--muted-2)] font-medium tracking-normal ml-0.5">
                            (optional)
                          </span>
                        </label>
                        <input
                          id="onb-website"
                          type="url"
                          placeholder="e.g. https://stoxify.com"
                          value={registerData.website}
                          onChange={(e) =>
                            setRegisterData((prev) => ({ ...prev, website: e.target.value }))
                          }
                          className={`${inputBase} ${inputNormal}`}
                        />
                      </div>
                    </div>

                    {/* Registration Type */}
                    <div>
                      <label className={labelBase} htmlFor="onb-regtype">
                        Type of Registration <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <select
                          id="onb-regtype"
                          value={registerData.registrationType}
                          onChange={(e) =>
                            setRegisterData((prev) => ({
                              ...prev,
                              registrationType: e.target.value,
                            }))
                          }
                          className={`${selectBase} ${
                            fieldErrors.registrationType ? inputError : inputNormal
                          } pr-10`}
                        >
                          <option value="" disabled>
                            Select registration type
                          </option>
                          <option value="research_analyst">Research Analyst</option>
                          <option value="investment_advisors">Investment Advisor</option>
                        </select>
                        <Icon
                          name="chevronDown"
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[var(--muted-2)] pointer-events-none"
                        />
                      </div>
                      {fieldErrors.registrationType && (
                        <FieldError>{fieldErrors.registrationType}</FieldError>
                      )}
                    </div>

                    {/* Divider — Business Scale */}
                    <div className="flex items-center gap-3 py-0.5">
                      <div className="h-px flex-1 bg-[var(--line)]" />
                      <span className="text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--muted-2)]">
                        Business Scale
                      </span>
                      <div className="h-px flex-1 bg-[var(--line)]" />
                    </div>

                    {/* AUM + Clients */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className={labelBase} htmlFor="onb-aum">
                          Asset Under Research (₹Cr) <span className="text-red-500">*</span>
                        </label>
                        <input
                          id="onb-aum"
                          type="number"
                          min="0"
                          step="0.1"
                          placeholder="e.g. 50"
                          value={registerData.assetUnderResearchCr}
                          onChange={(e) =>
                            setRegisterData((prev) => ({
                              ...prev,
                              assetUnderResearchCr: e.target.value,
                            }))
                          }
                          className={`${inputBase} ${
                            fieldErrors.assetUnderResearchCr ? inputError : inputNormal
                          }`}
                        />
                        {fieldErrors.assetUnderResearchCr && (
                          <FieldError>{fieldErrors.assetUnderResearchCr}</FieldError>
                        )}
                      </div>
                      <div>
                        <label className={labelBase} htmlFor="onb-clients">
                          Number of Clients <span className="text-red-500">*</span>
                        </label>
                        <input
                          id="onb-clients"
                          type="number"
                          min="0"
                          placeholder="e.g. 1500"
                          value={registerData.numberOfClients}
                          onChange={(e) =>
                            setRegisterData((prev) => ({
                              ...prev,
                              numberOfClients: e.target.value,
                            }))
                          }
                          className={`${inputBase} ${
                            fieldErrors.numberOfClients ? inputError : inputNormal
                          }`}
                        />
                        {fieldErrors.numberOfClients && (
                          <FieldError>{fieldErrors.numberOfClients}</FieldError>
                        )}
                      </div>
                    </div>

                    {/* General Error */}
                    {generalError && (
                      <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-[13px] text-red-700 animate-[fadeUp_0.3s_ease]">
                        <Icon name="x" className="h-4 w-4 mt-0.5 shrink-0 text-red-500" />
                        <span className="font-semibold leading-relaxed">{generalError}</span>
                      </div>
                    )}

                    {/* Buttons */}
                    <div className="flex items-center gap-3 pt-4 mt-1 border-t border-[var(--line)]">
                      <button
                        type="button"
                        onClick={handleBack}
                        className="flex items-center justify-center gap-2 rounded-lg border border-[var(--line)] bg-white px-5 h-[52px] text-[13px] font-semibold text-[var(--muted)] transition-all duration-200 hover:border-[var(--muted-2)] hover:text-[var(--ink)] hover:bg-[var(--line-2)]"
                      >
                        <Icon name="arrowRight" className="h-3.5 w-3.5 rotate-180" />
                        Back
                      </button>
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="flex-1 bg-[var(--brand)] text-white font-bold h-[52px] rounded-lg text-[14px] transition-all duration-200 hover:bg-[var(--brand-dark)] hover:shadow-[0_4px_16px_rgba(31,122,224,0.35)] active:scale-[0.98] disabled:opacity-60 disabled:pointer-events-none flex items-center justify-center gap-2.5"
                      >
                        {isSubmitting ? (
                          <>
                            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                            Creating account...
                          </>
                        ) : (
                          <>
                            Complete Registration
                            <Icon name="arrowRight" className="h-4 w-4" />
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>

                {/* Terms */}
                <p className="mt-5 text-center text-[12px] text-[var(--muted)] font-medium">
                  By registering, you agree to the{" "}
                  <a href="#" className="text-[var(--brand)] hover:underline font-bold">
                    Analyst Terms of Service
                  </a>
                </p>
              </div>
            )}

            {/* Trust badges */}
            <div className="flex flex-wrap justify-center gap-x-6 gap-y-3 mt-8 animate-[fadeUp_0.5s_ease_0.3s_both]">
              {[
                { icon: "shieldCheck" as const, text: "SEBI Compliant" },
                { icon: "users" as const, text: "340+ RAs" },
                { icon: "zap" as const, text: "< 3s delivery" },
                { icon: "banknote" as const, text: "Zero fees" },
              ].map((b) => (
                <div
                  key={b.text}
                  className="flex items-center gap-1.5 text-[11px] text-[var(--muted)] font-medium"
                >
                  <Icon name={b.icon} className="h-3 w-3 text-[var(--brand)]" />
                  {b.text}
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

/* ─── Page Export ──────────────────────────────────────────────────────── */

export default function AnalystOnboardingPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[var(--surface)] flex items-center justify-center">
          <span className="h-8 w-8 animate-spin rounded-full border-3 border-[var(--brand)] border-t-transparent" />
        </div>
      }
    >
      <AnalystOnboardingForm />
    </Suspense>
  );
}
