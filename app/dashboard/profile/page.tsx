"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { Topbar } from "@/components/dashboard/topbar";
import { useAnalystProfile } from "@/lib/hooks/use-analyst-dashboard";
import { useDashboard } from "@/components/dashboard/dashboard-context";
import { Icon } from "@/components/stoxify-icon";

const TABS = [
  { name: "Profile Information", icon: "user" as const },
  { name: "SEBI Verification", icon: "shieldCheck" as const },
  { name: "Security", icon: "lock" as const },
  { name: "Notifications", icon: "bell" as const },
  { name: "Bank & Payouts", icon: "bank" as const },
];

// Seed collection of beautiful avatar images to cycle through when user clicks "Change Avatar"
const AVATAR_POOL = [
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200", // Rohan (glasses)
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=200", // Man 2
  "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=200", // Man 3
  "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=200", // Man 4
];

export default function ProfilePage() {
  const { profile, mutate } = useAnalystProfile();
  const { showSuccessToast } = useDashboard();

  // Derive SEBI verification status from the analyst's state
  const isSebiVerified = profile?.state ? /^ACTIVE$/i.test(profile.state) : false;

  // Human-readable registration type
  const entityTypeLabel = profile?.registration_type
    ? profile.registration_type === "research_analyst"
      ? "Research Analyst"
      : profile.registration_type === "investment_advisors"
        ? "Investment Advisor"
        : profile.registration_type
    : "Individual";

  // Tab State
  const [activeTab, setActiveTab] = useState("Profile Information");

  // Form Fields State
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [bio, setBio] = useState("");
  const [twitterUrl, setTwitterUrl] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");

  // Sync state with SWR mock profile when fetched
  useEffect(() => {
    if (profile) {
      const parts = profile.name.split(" ");
      /* eslint-disable react-hooks/set-state-in-effect */
      setFirstName(parts[0] || "");
      setLastName(parts.slice(1).join(" ") || "");
      setBio(profile.bio || "");
      setTwitterUrl(profile.twitter_url || "");
      setLinkedinUrl(profile.linkedin_url || "");
      setAvatarUrl(profile.avatar_url || "");
      /* eslint-enable react-hooks/set-state-in-effect */
    }
  }, [profile]);

  // Cancel edit — reset values to cached server-side values
  const handleCancel = () => {
    if (profile) {
      const parts = profile.name.split(" ");
      setFirstName(parts[0] || "");
      setLastName(parts.slice(1).join(" ") || "");
      setBio(profile.bio || "");
      setTwitterUrl(profile.twitter_url || "");
      setLinkedinUrl(profile.linkedin_url || "");
      setAvatarUrl(profile.avatar_url || "");
    }
  };

  // Save changes via real API and trigger refresh
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!firstName.trim()) {
      showSuccessToast("Error", "First name is required.");
      return;
    }

    const updatedName = `${firstName.trim()} ${lastName.trim()}`.trim();

    try {
      const res = await fetch("/api/analyst/profile", {
        method: "PATCH",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: updatedName,
          bio: bio.trim(),
          twitter_url: twitterUrl.trim(),
          linkedin_url: linkedinUrl.trim(),
          avatar_url: avatarUrl,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        showSuccessToast("Save Failed", err.error ?? "Unable to save profile changes.");
        return;
      }

      // Refresh cached profile so sidebar/topbar update instantly
      await mutate();

      showSuccessToast(
        "Profile Updated",
        "Your professional profile details have been saved successfully."
      );
    } catch {
      showSuccessToast("Network Error", "Unable to reach the server. Please try again.");
    }
  };

  // Cycle avatar selection
  const handleCycleAvatar = () => {
    const currentIndex = AVATAR_POOL.indexOf(avatarUrl);
    const nextIndex = (currentIndex + 1) % AVATAR_POOL.length;
    setAvatarUrl(AVATAR_POOL[nextIndex]);
    showSuccessToast("Avatar Changed", "New avatar selection updated in form.");
  };

  // Remove avatar
  const handleRemoveAvatar = () => {
    setAvatarUrl("");
    showSuccessToast("Avatar Removed", "Avatar removed. Initials will be displayed.");
  };

  // Calculate initials fallback
  const initials = profile?.name
    ? profile.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "?";

  return (
    <>
      <Topbar title="Settings" showUserProfile={true} />

      <div className="flex-1 p-8 bg-[#fafbfc] flex flex-col md:flex-row gap-8 overflow-y-auto">
        {/* ─── Left Sidebar Tabs (With icons) ─── */}
        <div
          className="flex flex-col gap-1 w-full md:w-[220px] shrink-0"
          role="tablist"
          aria-label="Settings Tab list"
        >
          {TABS.map((tab) => {
            const isActive = activeTab === tab.name;
            const tabId = `tab-${tab.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
            const panelId = `panel-${tab.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
            return (
              <button
                key={tab.name}
                id={tabId}
                role="tab"
                aria-selected={isActive}
                aria-controls={panelId}
                onClick={() => setActiveTab(tab.name)}
                className={`flex items-center gap-3 rounded-lg px-4 py-2.5 text-[13.5px] font-semibold transition-all duration-150 text-left ${
                  isActive
                    ? "bg-[#eef2f6] text-slate-800"
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
                }`}
                type="button"
              >
                <Icon className="h-4 w-4 shrink-0" name={tab.icon} />
                {tab.name}
              </button>
            );
          })}
        </div>

        {/* ─── Right Content Card ─── */}
        <div className="flex-1 max-w-4xl bg-white rounded-xl border border-slate-100 shadow-sm p-8">
          {activeTab === "Profile Information" && (
            <div
              role="tabpanel"
              id="panel-profile-information"
              aria-labelledby="tab-profile-information"
              className="outline-none"
            >
              <form onSubmit={handleSave} className="flex flex-col gap-6">
                {/* Header */}
                <div>
                  <h2 className="text-[17px] font-bold text-slate-800 leading-tight">
                    Profile Information
                  </h2>
                  <p className="text-[13px] text-slate-400 mt-1">
                    Update your photo and personal details here.
                  </p>
                </div>

                <hr className="border-slate-100" />

                {/* Avatar section */}
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full overflow-hidden bg-[var(--brand)] flex items-center justify-center text-white text-[18px] font-bold shadow-sm border border-slate-100">
                    {avatarUrl ? (
                      <Image
                        src={avatarUrl}
                        alt="Avatar"
                        width={56}
                        height={56}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      initials
                    )}
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={handleCycleAvatar}
                      className="px-4 py-1.5 border border-slate-200 rounded-lg text-[12.5px] font-bold text-slate-700 bg-white hover:bg-slate-50 transition-colors shadow-sm cursor-pointer"
                      type="button"
                    >
                      Change Avatar
                    </button>
                    <button
                      onClick={handleRemoveAvatar}
                      className="px-3 py-1.5 text-red-500 text-[12.5px] font-bold hover:text-red-600 transition-colors cursor-pointer bg-transparent border-none"
                      type="button"
                    >
                      Remove
                    </button>
                  </div>
                </div>

                {/* Form Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* First Name */}
                  <div>
                    <label
                      htmlFor="firstName"
                      className="text-[12.5px] font-bold text-slate-700 mb-1.5 block"
                    >
                      First Name
                    </label>
                    <input
                      id="firstName"
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-[13.5px] text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[var(--brand)] transition-colors shadow-sm"
                    />
                  </div>

                  {/* Last Name */}
                  <div>
                    <label
                      htmlFor="lastName"
                      className="text-[12.5px] font-bold text-slate-700 mb-1.5 block"
                    >
                      Last Name
                    </label>
                    <input
                      id="lastName"
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-[13.5px] text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[var(--brand)] transition-colors shadow-sm"
                    />
                  </div>
                </div>

                {/* Email Address */}
                <div>
                  <label
                    htmlFor="email"
                    className="text-[12.5px] font-bold text-slate-700 mb-1.5 block"
                  >
                    Email Address
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={profile?.email || ""}
                    disabled
                    className="w-full px-3 py-2 border border-slate-100 bg-[#f8fafc] rounded-lg text-[13.5px] text-slate-400 cursor-not-allowed focus:outline-none"
                  />
                  <span className="text-[11px] text-slate-400 mt-1 block">
                    Email cannot be changed. Contact support for assistance.
                  </span>
                </div>

                {/* Bio */}
                <div>
                  <label
                    htmlFor="bio"
                    className="text-[12.5px] font-bold text-slate-700 mb-1.5 block"
                  >
                    Professional Bio
                  </label>
                  <textarea
                    id="bio"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    className="w-full h-24 px-3 py-2 border border-slate-200 rounded-lg text-[13.5px] text-slate-800 focus:outline-none focus:border-[var(--brand)] transition-colors shadow-sm resize-none"
                    placeholder="Describe your credentials and approach..."
                  />
                </div>

                {/* Social URLs Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Twitter */}
                  <div>
                    <label
                      htmlFor="twitter"
                      className="text-[12.5px] font-bold text-slate-700 mb-1.5 block"
                    >
                      Twitter/X Profile URL
                    </label>
                    <input
                      id="twitter"
                      type="text"
                      value={twitterUrl}
                      onChange={(e) => setTwitterUrl(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-[13.5px] text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[var(--brand)] transition-colors shadow-sm"
                      placeholder="https://twitter.com/..."
                    />
                  </div>

                  {/* LinkedIn */}
                  <div>
                    <label
                      htmlFor="linkedin"
                      className="text-[12.5px] font-bold text-slate-700 mb-1.5 block"
                    >
                      LinkedIn Profile URL
                    </label>
                    <input
                      id="linkedin"
                      type="text"
                      value={linkedinUrl}
                      onChange={(e) => setLinkedinUrl(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-[13.5px] text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[var(--brand)] transition-colors shadow-sm"
                      placeholder="https://linkedin.com/in/..."
                    />
                  </div>
                </div>

                <hr className="border-slate-100 mt-2" />

                {/* Actions */}
                <div className="flex justify-end gap-3">
                  <button
                    onClick={handleCancel}
                    className="px-4 py-2 border border-slate-200 rounded-lg text-[13px] font-bold text-slate-700 hover:bg-slate-50 transition-colors shadow-sm cursor-pointer bg-white"
                    type="button"
                  >
                    Cancel
                  </button>
                  <button
                    className="px-4 py-2 bg-[var(--brand)] hover:bg-[var(--brand-dark)] rounded-lg text-[13px] font-bold text-white transition-colors cursor-pointer shadow-sm shadow-[var(--brand)]/15"
                    type="submit"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          )}

          {activeTab === "SEBI Verification" && (
            <div
              role="tabpanel"
              id="panel-sebi-verification"
              aria-labelledby="tab-sebi-verification"
              className="flex flex-col gap-6 outline-none"
            >
              {/* Header */}
              <div>
                <div className="flex items-center justify-between">
                  <h2 className="text-[17px] font-bold text-slate-800 leading-tight flex items-center gap-2">
                    SEBI Verification
                    {isSebiVerified ? (
                      <span className="inline-flex items-center gap-1 rounded-full border border-green-200 bg-green-50 px-2.5 py-0.5 text-[10.5px] font-bold text-green-600">
                        <Icon className="h-3 w-3" name="circleCheck" />
                        Verified
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-[10.5px] font-bold text-amber-600">
                        <Icon className="h-3 w-3" name="lock" />
                        {profile?.state ? profile.state.replace(/_/g, " ") : "Pending"}
                      </span>
                    )}
                  </h2>
                </div>
                <p className="text-[13px] text-slate-400 mt-1">
                  Manage your SEBI registration details and compliance documents.
                </p>
              </div>

              <hr className="border-slate-100" />

              {/* Fields */}
              <div className="flex flex-col gap-5">
                {/* Registration Number */}
                <div>
                  <label className="text-[12.5px] font-bold text-slate-700 mb-1.5 block">
                    SEBI Registration Number
                  </label>
                  <input
                    type="text"
                    value={profile?.sebi_license_number || profile?.sebi_registration_number || "—"}
                    disabled
                    className="w-full px-3 py-2 border border-slate-100 bg-[#f8fafc] rounded-lg text-[13.5px] text-slate-500 cursor-not-allowed focus:outline-none"
                  />
                </div>

                {/* Date Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="text-[12.5px] font-bold text-slate-700 mb-1.5 block">
                      Registration Date
                    </label>
                    <input
                      type="text"
                      value={
                        profile?.verification?.submitted_at
                          ? new Date(profile.verification.submitted_at).toLocaleDateString(
                              "en-IN",
                              {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              }
                            )
                          : "—"
                      }
                      disabled
                      className="w-full px-3 py-2 border border-slate-100 bg-[#f8fafc] rounded-lg text-[13.5px] text-slate-500 cursor-not-allowed focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[12.5px] font-bold text-slate-700 mb-1.5 block">
                      Valid Until
                    </label>
                    <input
                      type="text"
                      value="—"
                      disabled
                      className="w-full px-3 py-2 border border-slate-100 bg-[#f8fafc] rounded-lg text-[13.5px] text-slate-500 cursor-not-allowed focus:outline-none"
                    />
                  </div>
                </div>

                {/* Registered Name & Entity Type */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="text-[12.5px] font-bold text-slate-700 mb-1.5 block">
                      Registered Name
                    </label>
                    <input
                      type="text"
                      value={profile?.name || "Rohan Mehta"}
                      disabled
                      className="w-full px-3 py-2 border border-slate-100 bg-[#f8fafc] rounded-lg text-[13.5px] text-slate-500 cursor-not-allowed focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[12.5px] font-bold text-slate-700 mb-1.5 block">
                      Entity Type
                    </label>
                    <input
                      type="text"
                      value={entityTypeLabel}
                      disabled
                      className="w-full px-3 py-2 border border-slate-100 bg-[#f8fafc] rounded-lg text-[13.5px] text-slate-500 cursor-not-allowed focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <hr className="border-slate-100 mt-2" />

              {/* Uploaded Documents */}
              <div>
                <h3 className="text-[14px] font-bold text-slate-800">Uploaded Documents</h3>
                <p className="text-[12px] text-slate-400 mt-0.5">
                  Copies of your official registration certificates on file.
                </p>

                {profile?.sebi_license_doc_url ? (
                  <div className="border border-slate-100 rounded-lg p-4 bg-[#f8fafc] flex items-center justify-between mt-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-500 shrink-0">
                        <Icon className="h-5 w-5" name="fileText" />
                      </div>
                      <div>
                        <div className="text-[13.5px] font-bold text-slate-800 leading-tight">
                          SEBI Registration Document
                        </div>
                        <div className="text-[11.5px] text-slate-400 mt-0.5">
                          {profile.verification?.submitted_at
                            ? `Uploaded on ${new Date(profile.verification.submitted_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}`
                            : "Uploaded"}
                        </div>
                      </div>
                    </div>

                    <a
                      href={profile.sebi_license_doc_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-3 py-1.5 border border-slate-200 rounded-lg text-[12.5px] font-bold text-slate-700 bg-white hover:bg-slate-50 transition-colors shadow-sm cursor-pointer"
                    >
                      <Icon className="h-3.5 w-3.5" name="download" />
                      View / Download
                    </a>
                  </div>
                ) : (
                  <div className="border border-slate-100 rounded-lg p-4 bg-[#f8fafc] flex items-center gap-3 mt-3 text-[13px] text-slate-400">
                    <Icon className="h-4 w-4 shrink-0" name="fileText" />
                    No document uploaded yet.
                  </div>
                )}
              </div>

              {/* Bottom Actions */}
              <div className="flex mt-2">
                <button
                  onClick={() =>
                    showSuccessToast(
                      "Request Submitted",
                      "Your request to update registration details has been received by support."
                    )
                  }
                  className="px-4 py-2 border border-slate-200 rounded-lg text-[13px] font-bold text-slate-700 hover:bg-slate-50 transition-colors shadow-sm cursor-pointer bg-white"
                  type="button"
                >
                  Request Detail Update
                </button>
              </div>
            </div>
          )}

          {activeTab === "Bank & Payouts" && (
            <div
              role="tabpanel"
              id="panel-bank-payouts"
              aria-labelledby="tab-bank-payouts"
              className="flex flex-col gap-6 outline-none"
            >
              {/* Header */}
              <div>
                <h2 className="text-[17px] font-bold text-slate-800 leading-tight">
                  Bank & Payouts
                </h2>
                <p className="text-[13px] text-slate-400 mt-1">
                  Manage your bank accounts and track your earnings payouts.
                </p>
              </div>

              <hr className="border-slate-100" />

              {/* Bank Account Details Card */}
              <div className="border border-slate-100 rounded-xl p-6 bg-white shadow-sm flex flex-col gap-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-slate-50 flex items-center justify-center text-slate-500 shrink-0 border border-slate-100">
                      <Icon className="h-5 w-5" name="bank" />
                    </div>
                    <div>
                      <div className="text-[14px] font-bold text-slate-800 leading-tight">
                        HDFC Bank Ltd.
                      </div>
                      <div className="text-[11.5px] text-slate-400 mt-0.5">
                        Primary Receiving Account
                      </div>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1 rounded-full border border-green-200 bg-green-50 px-2.5 py-0.5 text-[10.5px] font-bold text-green-600">
                    <Icon className="h-3 w-3" name="circleCheck" />
                    Verified
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8 text-[13px]">
                  <div>
                    <span className="text-slate-400 block mb-0.5">Account Holder Name</span>
                    <span className="font-bold text-slate-800">
                      {profile?.name || "Rohan Mehta"}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5">Account Number</span>
                    <span className="font-bold text-slate-800">•••• •••• 9382</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5">IFSC Code</span>
                    <span className="font-bold text-slate-800">HDFC0001234</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5">Account Type</span>
                    <span className="font-bold text-slate-800">Savings Account</span>
                  </div>
                </div>

                <hr className="border-slate-100" />

                <div className="flex items-center gap-2">
                  <button
                    onClick={() =>
                      showSuccessToast(
                        "Request Initiated",
                        "Bank details update request sent to compliance support."
                      )
                    }
                    className="px-3 py-1.5 border border-slate-200 rounded-lg text-[12.5px] font-bold text-slate-700 bg-white hover:bg-slate-50 transition-colors shadow-sm cursor-pointer"
                    type="button"
                  >
                    Update Bank Details
                  </button>
                  <button
                    onClick={() =>
                      showSuccessToast(
                        "Request Sent",
                        "Account removal request submitted to support."
                      )
                    }
                    className="px-3 py-1.5 text-red-500 text-[12.5px] font-bold hover:text-red-600 transition-colors cursor-pointer bg-transparent border-none"
                    type="button"
                  >
                    Remove Account
                  </button>
                </div>
              </div>

              {/* Tax Information Card */}
              <div className="border border-slate-100 rounded-xl p-6 bg-white shadow-sm flex flex-col gap-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-slate-50 flex items-center justify-center text-slate-500 shrink-0 border border-slate-100">
                      <Icon className="h-5 w-5" name="fileText" />
                    </div>
                    <div>
                      <div className="text-[14px] font-bold text-slate-800 leading-tight">
                        Tax Information
                      </div>
                      <div className="text-[11.5px] text-slate-400 mt-0.5">
                        PAN & TDS Details for statutory compliance
                      </div>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1 rounded-full border border-green-200 bg-green-50 px-2.5 py-0.5 text-[10.5px] font-bold text-green-600">
                    <Icon className="h-3 w-3" name="circleCheck" />
                    Verified
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8 text-[13px]">
                  <div>
                    <span className="text-slate-400 block mb-0.5">PAN Number</span>
                    <span className="font-bold text-slate-800">ABCDE1234F</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5">Name on PAN</span>
                    <span className="font-bold text-slate-800">
                      {profile?.name || "Rohan Mehta"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Recent Payouts Table */}
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-[14.5px] font-bold text-slate-800">Recent Payouts</h3>
                  <button
                    onClick={() =>
                      showSuccessToast("Export Started", "Downloading payouts history CSV...")
                    }
                    className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 rounded-lg text-[12px] font-bold text-slate-700 bg-white hover:bg-slate-50 transition-colors shadow-sm cursor-pointer"
                    type="button"
                  >
                    <Icon className="h-3.5 w-3.5" name="download" />
                    Export CSV
                  </button>
                </div>

                <div className="overflow-hidden border border-slate-100 rounded-lg">
                  <table className="w-full border-collapse text-left">
                    <thead>
                      <tr className="bg-[#122238] text-white text-[12px] font-bold">
                        <th className="px-4 py-3 font-semibold">Date</th>
                        <th className="px-4 py-3 font-semibold">Transaction ID</th>
                        <th className="px-4 py-3 font-semibold">Amount</th>
                        <th className="px-4 py-3 font-semibold">Status</th>
                      </tr>
                    </thead>
                    <tbody className="text-[13px] text-slate-700 divide-y divide-slate-100">
                      <tr className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3 text-slate-500">Oct 15, 2023</td>
                        <td className="px-4 py-3 text-slate-400 font-mono">TXN-84729104</td>
                        <td className="px-4 py-3 font-bold text-slate-800">₹45,200</td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center gap-1 text-green-600 font-semibold text-[12.5px]">
                            <Icon className="h-3 w-3" name="circleCheck" />
                            Processed
                          </span>
                        </td>
                      </tr>
                      <tr className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3 text-slate-500">Oct 01, 2023</td>
                        <td className="px-4 py-3 text-slate-400 font-mono">TXN-73920183</td>
                        <td className="px-4 py-3 font-bold text-slate-800">₹38,500</td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center gap-1 text-green-600 font-semibold text-[12.5px]">
                            <Icon className="h-3 w-3" name="circleCheck" />
                            Processed
                          </span>
                        </td>
                      </tr>
                      <tr className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3 text-slate-500">Sep 15, 2023</td>
                        <td className="px-4 py-3 text-slate-400 font-mono">TXN-64829102</td>
                        <td className="px-4 py-3 font-bold text-slate-800">₹41,100</td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center gap-1 text-green-600 font-semibold text-[12.5px]">
                            <Icon className="h-3 w-3" name="circleCheck" />
                            Processed
                          </span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab !== "Profile Information" &&
            activeTab !== "SEBI Verification" &&
            activeTab !== "Bank & Payouts" && (
              <div
                role="tabpanel"
                id={`panel-${activeTab.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}
                aria-labelledby={`tab-${activeTab.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}
                className="py-20 text-center flex flex-col items-center justify-center outline-none"
              >
                <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center mb-3">
                  <i className="fa-solid fa-gear text-slate-400 text-[18px] animate-spin" />
                </div>
                <h3 className="text-[15px] font-bold text-slate-700">{activeTab}</h3>
                <p className="text-[12.5px] text-slate-400 mt-1 max-w-[280px]">
                  This settings tab interface is currently simulated as a visual placeholder.
                </p>
              </div>
            )}
        </div>
      </div>
    </>
  );
}
