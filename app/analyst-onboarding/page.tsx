"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Icon } from "@/components/stoxify-icon";

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

function AnalystOnboardingForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const phone = searchParams.get("phone");

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError(null);
    setFieldErrors({});

    const errors: FormErrors = {};
    if (!registerData.name.trim()) errors.name = "Full name is required";
    if (!registerData.email.trim() || !registerData.email.includes("@")) {
      errors.email = "Enter a valid email address";
    }
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

      const data = (await res.json().catch(() => ({}))) as { error?: string; redirectTo?: string };

      if (!res.ok) {
        setGeneralError(data.error ?? "Registration failed. Please try again.");
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
    <div className="min-h-screen bg-[var(--bg)] flex flex-col md:flex-row font-sans">
      {/* Left Panel: Branding & Value Prop */}
      <div className="w-full md:w-[45%] lg:w-[40%] bg-[#0B1221] text-white p-8 md:p-12 lg:p-16 flex flex-col relative overflow-hidden shrink-0">
        {/* Abstract subtle line waves background matching the image */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-20">
          <svg className="absolute w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 100">
            <path d="M0,20 C30,10 60,40 100,10" fill="none" stroke="white" strokeWidth="0.2" vectorEffect="non-scaling-stroke" />
            <path d="M-10,80 C40,90 50,20 110,60" fill="none" stroke="white" strokeWidth="0.2" vectorEffect="non-scaling-stroke" />
            <path d="M30,-10 C40,40 20,80 80,110" fill="none" stroke="white" strokeWidth="0.2" vectorEffect="non-scaling-stroke" />
          </svg>
        </div>

        <div className="relative z-10 flex flex-col h-full">
          {/* Logo area - text only */}
          <div className="mb-16">
            <span className="text-3xl font-extrabold tracking-tight">Stoxify</span>
          </div>

          <div className="mt-auto mb-16">
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-6 leading-[1.1]">
              Elevate your <br className="hidden md:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-blue-200">research</span>.
            </h1>
            <p className="text-[16px] text-white/80 font-medium leading-relaxed max-w-[400px]">
              Join India's premier platform for SEBI Registered Research Analysts. Publish insights, grow your subscriber base, and monetize your expertise securely.
            </p>
          </div>

          {/* Value props */}
          <div className="space-y-6 mt-auto">
            {[
              { icon: "shieldCheck" as const, title: "SEBI Compliant", desc: "Built with regulatory guidelines in mind." },
              { icon: "users" as const, title: "Audience Growth", desc: "Reach thousands of active traders directly." },
              { icon: "banknote" as const, title: "Instant Payouts", desc: "Zero hidden fees on your subscription revenue." }
            ].map((feature, i) => (
              <div key={i} className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center shrink-0 border border-white/5">
                  <Icon name={feature.icon} className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-[14px] font-bold text-white mb-0.5">{feature.title}</h3>
                  <p className="text-[13px] text-white/70 font-medium">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel: Form */}
      <div className="flex-1 flex flex-col bg-[var(--bg)]">
        <div className="flex-1 flex items-center justify-center p-6 md:p-12">
          <div className="w-full max-w-lg">
            <div className="mb-10">
              <h2 className="text-2xl font-extrabold text-[var(--ink)] tracking-tight mb-2">Complete your profile</h2>
              <p className="text-[14px] text-[var(--muted)] font-medium">Please provide your professional details to finalize registration.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-5">
                <div>
                  <label className="block text-[12px] font-bold uppercase tracking-[0.05em] text-[var(--muted)] mb-1.5">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Name as per SEBI records"
                    value={registerData.name}
                    onChange={(e) => setRegisterData(prev => ({ ...prev, name: e.target.value }))}
                    className={`w-full rounded-xl border px-4 py-3.5 text-[14px] transition-all focus:outline-none ${
                      fieldErrors.name 
                        ? 'border-red-300 bg-red-50/30 focus:border-red-500 focus:ring-1 focus:ring-red-500' 
                        : 'border-[var(--line)] bg-[var(--bg)] focus:border-[var(--brand)] focus:ring-1 focus:ring-[var(--brand)] hover:border-[var(--muted-2)]'
                    }`}
                  />
                  {fieldErrors.name && (
                    <p className="mt-1.5 text-[12px] text-red-600 font-bold flex items-center gap-1.5">
                      <Icon name="ban" className="w-3.5 h-3.5" />
                      {fieldErrors.name}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-[12px] font-bold uppercase tracking-[0.05em] text-[var(--muted)] mb-1.5 flex items-center justify-between">
                      <span>Phone Number</span>
                      <Icon name="circleCheck" className="w-3.5 h-3.5 text-green-500" />
                    </label>
                    <input
                      type="text"
                      disabled
                      value={phone || ""}
                      className="w-full rounded-xl border border-[var(--line)] px-4 py-3.5 text-[14px] bg-[var(--line)]/40 text-[var(--muted)] cursor-not-allowed font-medium opacity-80"
                    />
                  </div>

                  <div>
                    <label className="block text-[12px] font-bold uppercase tracking-[0.05em] text-[var(--muted)] mb-1.5">
                      Email Address <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      placeholder="Official email"
                      value={registerData.email}
                      onChange={(e) => setRegisterData(prev => ({ ...prev, email: e.target.value }))}
                      className={`w-full rounded-xl border px-4 py-3.5 text-[14px] transition-all focus:outline-none ${
                        fieldErrors.email 
                          ? 'border-red-300 bg-red-50/30 focus:border-red-500 focus:ring-1 focus:ring-red-500' 
                          : 'border-[var(--line)] bg-[var(--bg)] focus:border-[var(--brand)] focus:ring-1 focus:ring-[var(--brand)] hover:border-[var(--muted-2)]'
                      }`}
                    />
                    {fieldErrors.email && (
                      <p className="mt-1.5 text-[12px] text-red-600 font-bold flex items-center gap-1.5">
                        <Icon name="ban" className="w-3.5 h-3.5" />
                        {fieldErrors.email}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-[12px] font-bold uppercase tracking-[0.05em] text-[var(--muted)] mb-1.5">
                    SEBI Registration Number <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="e.g. INH000000000"
                      value={registerData.sebiLicenseNumber}
                      onChange={(e) => setRegisterData(prev => ({ ...prev, sebiLicenseNumber: e.target.value.toUpperCase() }))}
                      className={`w-full rounded-xl border pl-11 pr-4 py-3.5 text-[14px] transition-all focus:outline-none uppercase font-semibold tracking-wide ${
                        fieldErrors.sebiLicenseNumber 
                          ? 'border-red-300 bg-red-50/30 focus:border-red-500 focus:ring-1 focus:ring-red-500' 
                          : 'border-[var(--line)] bg-[var(--bg)] focus:border-[var(--brand)] focus:ring-1 focus:ring-[var(--brand)] hover:border-[var(--muted-2)]'
                      }`}
                    />
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--muted)]">
                      <Icon name="fileBadge" className="w-4 h-4" />
                    </div>
                  </div>
                  {fieldErrors.sebiLicenseNumber && (
                    <p className="mt-1.5 text-[12px] text-red-600 font-bold flex items-center gap-1.5">
                      <Icon name="ban" className="w-3.5 h-3.5" />
                      {fieldErrors.sebiLicenseNumber}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-[12px] font-bold uppercase tracking-[0.05em] text-[var(--muted)] mb-1.5">
                      Entity Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Stoxify Advisory"
                      value={registerData.companyName}
                      onChange={(e) => setRegisterData(prev => ({ ...prev, companyName: e.target.value }))}
                      className={`w-full rounded-xl border px-4 py-3.5 text-[14px] transition-all focus:outline-none ${
                        fieldErrors.companyName 
                          ? 'border-red-300 bg-red-50/30 focus:border-red-500 focus:ring-1 focus:ring-red-500' 
                          : 'border-[var(--line)] bg-[var(--bg)] focus:border-[var(--brand)] focus:ring-1 focus:ring-[var(--brand)] hover:border-[var(--muted-2)]'
                      }`}
                    />
                    {fieldErrors.companyName && (
                      <p className="mt-1.5 text-[12px] text-red-600 font-bold flex items-center gap-1.5">
                        <Icon name="ban" className="w-3.5 h-3.5" />
                        {fieldErrors.companyName}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-[12px] font-bold uppercase tracking-[0.05em] text-[var(--muted)] mb-1.5">
                      City / Location <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Mumbai"
                      value={registerData.companyLocation}
                      onChange={(e) => setRegisterData(prev => ({ ...prev, companyLocation: e.target.value }))}
                      className={`w-full rounded-xl border px-4 py-3.5 text-[14px] transition-all focus:outline-none ${
                        fieldErrors.companyLocation 
                          ? 'border-red-300 bg-red-50/30 focus:border-red-500 focus:ring-1 focus:ring-red-500' 
                          : 'border-[var(--line)] bg-[var(--bg)] focus:border-[var(--brand)] focus:ring-1 focus:ring-[var(--brand)] hover:border-[var(--muted-2)]'
                      }`}
                    />
                    {fieldErrors.companyLocation && (
                      <p className="mt-1.5 text-[12px] text-red-600 font-bold flex items-center gap-1.5">
                        <Icon name="ban" className="w-3.5 h-3.5" />
                        {fieldErrors.companyLocation}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-[12px] font-bold uppercase tracking-[0.05em] text-[var(--muted)] mb-1.5">
                      Business Type <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={registerData.businessType}
                      onChange={(e) => setRegisterData(prev => ({ ...prev, businessType: e.target.value }))}
                      className={`w-full rounded-xl border px-4 py-3.5 text-[14px] transition-all focus:outline-none appearance-none bg-[var(--bg)] ${
                        fieldErrors.businessType 
                          ? 'border-red-300 bg-red-50/30 focus:border-red-500 focus:ring-1 focus:ring-red-500' 
                          : 'border-[var(--line)] focus:border-[var(--brand)] focus:ring-1 focus:ring-[var(--brand)] hover:border-[var(--muted-2)]'
                      }`}
                    >
                      <option value="" disabled>Select business type</option>
                      <option value="Individual">Individual</option>
                      <option value="Partnership Firm">Partnership Firm</option>
                      <option value="Limited Liability Partnership">Limited Liability Partnership</option>
                      <option value="Body Corporate">Body Corporate</option>
                    </select>
                    {fieldErrors.businessType && (
                      <p className="mt-1.5 text-[12px] text-red-600 font-bold flex items-center gap-1.5">
                        <Icon name="ban" className="w-3.5 h-3.5" />
                        {fieldErrors.businessType}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-[12px] font-bold uppercase tracking-[0.05em] text-[var(--muted)] mb-1.5">
                      Website <span className="text-[10px] lowercase text-[var(--muted-2)] font-medium tracking-normal ml-1">(optional)</span>
                    </label>
                    <input
                      type="url"
                      placeholder="e.g. https://stoxify.com"
                      value={registerData.website}
                      onChange={(e) => setRegisterData(prev => ({ ...prev, website: e.target.value }))}
                      className="w-full rounded-xl border border-[var(--line)] bg-[var(--bg)] px-4 py-3.5 text-[14px] transition-all focus:outline-none focus:border-[var(--brand)] focus:ring-1 focus:ring-[var(--brand)] hover:border-[var(--muted-2)]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[12px] font-bold uppercase tracking-[0.05em] text-[var(--muted)] mb-1.5">
                    Type of Registration <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={registerData.registrationType}
                    onChange={(e) => setRegisterData(prev => ({ ...prev, registrationType: e.target.value }))}
                    className={`w-full rounded-xl border px-4 py-3.5 text-[14px] transition-all focus:outline-none appearance-none bg-[var(--bg)] ${
                      fieldErrors.registrationType 
                        ? 'border-red-300 bg-red-50/30 focus:border-red-500 focus:ring-1 focus:ring-red-500' 
                        : 'border-[var(--line)] focus:border-[var(--brand)] focus:ring-1 focus:ring-[var(--brand)] hover:border-[var(--muted-2)]'
                    }`}
                  >
                    <option value="" disabled>Select registration type</option>
                    <option value="Research Analyst">Research Analyst</option>
                    <option value="Investment Advisor">Investment Advisor</option>
                  </select>
                  {fieldErrors.registrationType && (
                    <p className="mt-1.5 text-[12px] text-red-600 font-bold flex items-center gap-1.5">
                      <Icon name="ban" className="w-3.5 h-3.5" />
                      {fieldErrors.registrationType}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-[12px] font-bold uppercase tracking-[0.05em] text-[var(--muted)] mb-1.5">
                      Asset Under Research (₹Cr) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.1"
                      placeholder="e.g. 50"
                      value={registerData.assetUnderResearchCr}
                      onChange={(e) => setRegisterData(prev => ({ ...prev, assetUnderResearchCr: e.target.value }))}
                      className={`w-full rounded-xl border px-4 py-3.5 text-[14px] transition-all focus:outline-none ${
                        fieldErrors.assetUnderResearchCr 
                          ? 'border-red-300 bg-red-50/30 focus:border-red-500 focus:ring-1 focus:ring-red-500' 
                          : 'border-[var(--line)] bg-[var(--bg)] focus:border-[var(--brand)] focus:ring-1 focus:ring-[var(--brand)] hover:border-[var(--muted-2)]'
                      }`}
                    />
                    {fieldErrors.assetUnderResearchCr && (
                      <p className="mt-1.5 text-[12px] text-red-600 font-bold flex items-center gap-1.5">
                        <Icon name="ban" className="w-3.5 h-3.5" />
                        {fieldErrors.assetUnderResearchCr}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-[12px] font-bold uppercase tracking-[0.05em] text-[var(--muted)] mb-1.5">
                      Number of Clients <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      min="0"
                      placeholder="e.g. 1500"
                      value={registerData.numberOfClients}
                      onChange={(e) => setRegisterData(prev => ({ ...prev, numberOfClients: e.target.value }))}
                      className={`w-full rounded-xl border px-4 py-3.5 text-[14px] transition-all focus:outline-none ${
                        fieldErrors.numberOfClients 
                          ? 'border-red-300 bg-red-50/30 focus:border-red-500 focus:ring-1 focus:ring-red-500' 
                          : 'border-[var(--line)] bg-[var(--bg)] focus:border-[var(--brand)] focus:ring-1 focus:ring-[var(--brand)] hover:border-[var(--muted-2)]'
                      }`}
                    />
                    {fieldErrors.numberOfClients && (
                      <p className="mt-1.5 text-[12px] text-red-600 font-bold flex items-center gap-1.5">
                        <Icon name="ban" className="w-3.5 h-3.5" />
                        {fieldErrors.numberOfClients}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {generalError && (
                <div className="p-4 bg-red-50 text-red-700 text-[14px] rounded-xl border border-red-200 flex items-start gap-3 mt-4 animate-slide-down shadow-sm">
                  <Icon name="ban" className="w-5 h-5 mt-0.5 shrink-0 text-red-500" />
                  <span className="font-semibold leading-relaxed">{generalError}</span>
                </div>
              )}

              <div className="pt-6">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-[var(--ink)] text-white font-extrabold h-14 rounded-xl text-[15px] transition-all hover:bg-[var(--brand)] active:scale-[0.98] shadow-lg hover:shadow-xl hover:shadow-[var(--brand)]/20 disabled:opacity-70 disabled:pointer-events-none flex items-center justify-center gap-3 relative overflow-hidden group"
                >
                  {/* Subtle shine effect on hover */}
                  <div className="absolute inset-0 -translate-x-full bg-white/20 group-hover:animate-[shimmer_1.5s_infinite] skew-x-12" />
                  
                  {isSubmitting ? (
                    <>
                      <Icon name="timer" className="w-5 h-5 animate-spin" />
                      Creating Account...
                    </>
                  ) : (
                    <>
                      Complete Registration
                      <Icon name="arrowRight" className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                    </>
                  )}
                </button>
                
                <div className="mt-6 text-center text-[13px] text-[var(--muted)] font-medium">
                  By registering, you agree to the <a href="#" className="text-[var(--brand)] hover:underline font-bold transition-colors">Analyst Terms of Service</a>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AnalystOnboardingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center">
        <Icon name="timer" className="w-8 h-8 animate-spin text-[var(--brand)]" />
      </div>
    }>
      <AnalystOnboardingForm />
    </Suspense>
  );
}
