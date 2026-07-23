"use client";

import type React from "react";
import { Logo, LogoBrandCard, LogoIcon } from "@/components/logo";
import { Icon, IconName } from "@/components/stoxify-icon";

export function BrandLogoShowcase() {
  const typographyRules = [
    {
      role: "Display",
      specimen: "Compliant by design.",
      specs: "Manrope Bold 32–40px",
      className: "type-display text-[#0A192F]",
    },
    {
      role: "Screen title",
      specimen: "Active Recommendations",
      specs: "Manrope SemiBold 24–28px",
      className: "type-screen-title text-[#0A192F]",
    },
    {
      role: "Section header",
      specimen: "Portfolio Performance",
      specs: "Manrope SemiBold 20px",
      className: "type-section-header text-[#0A192F]",
    },
    {
      role: "Card title",
      specimen: "Bajaj Finance — Buy",
      specs: "Manrope SemiBold 16–18px",
      className: "type-card-title text-[#0A192F]",
    },
    {
      role: "Body",
      specimen:
        "Your recommendation from Vikram Nair has achieved T1. Review the updated rationale before deciding next steps.",
      specs: "Inter Regular 14–15px",
      className: "type-body text-[#1F2937]",
    },
    {
      role: "Body medium",
      specimen: "SEBI Registration: INH000012345 · CMP ₹2,280",
      specs: "Inter Medium 14px",
      className: "type-body-medium text-[#1F2937]",
    },
    {
      role: "Caption / meta",
      specimen: "Last updated 14 min ago · Expires 18 Jul 2026",
      specs: "Inter Regular 12px",
      className: "type-caption text-gray-500",
    },
    {
      role: "Numeric / data",
      specimen: (
        <span className="inline-flex items-center gap-3">
          <span>₹2,450.60</span>
          <span className="text-emerald-600 font-semibold">↑ 3.24%</span>
          <span>₹1,850.00</span>
        </span>
      ),
      specs: "Inter Medium Tabular nums 14–16px",
      className: "type-numeric text-[#0A192F]",
    },
  ];

  const exampleIcons: { label: string; name: IconName }[] = [
    { label: "Trending", name: "trendingUp" },
    { label: "Alerts", name: "bell" },
    { label: "Compliance", name: "shieldCheck" },
    { label: "Profile", name: "user" },
    { label: "Search", name: "search" },
    { label: "Watchlist", name: "bookmark" },
    { label: "Research", name: "fileText" },
    { label: "Expiry", name: "timer" },
  ];

  return (
    <div className="mx-auto max-w-5xl px-6 py-12 font-sans">
      {/* Page Header */}
      <div className="mb-10 border-b border-gray-200 pb-5">
        <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">
          StoXify Brand & Design System
        </h1>
        <p className="mt-2 text-sm text-gray-500">
          Official logo specifications, color codes, typography hierarchy, and iconography guidelines.
        </p>
      </div>

      {/* Grid of 4 Brand Logo Variants */}
      <div className="mb-14">
        <h2 className="mb-4 font-bold uppercase tracking-wider text-xs text-gray-400">
          LOGO VARIANTS
        </h2>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* 01 - Primary */}
          <LogoBrandCard
            variant="primary"
            title="01 — Primary"
            subtitle="White or transparent background"
          />

          {/* 02 - Reversed */}
          <LogoBrandCard
            variant="reversed"
            title="02 — Reversed"
            subtitle="Navy background · Accent Blue X (#4F8CFF)"
          />

          {/* 03 - Monochrome */}
          <LogoBrandCard
            variant="monochrome"
            title="03 — Monochrome"
            subtitle="Single #111827 — stamps, watermarks, single-color print"
          />

          {/* 04 - Transparent */}
          <LogoBrandCard
            variant="transparent"
            title="04 — Transparent"
            subtitle="Transparent background PNG for overlay use"
          />
        </div>
      </div>

      {/* Section 6: Iconography */}
      <div className="mb-14">
        <div className="mb-6 flex items-center gap-3">
          <span className="flex size-7 items-center justify-center rounded-lg bg-[#0B192C] text-xs font-black text-white">
            6
          </span>
          <h2 className="text-2xl font-extrabold text-[#0B192C]">Iconography</h2>
        </div>

        {/* Style Rules 2x2 Grid */}
        <div className="mb-8">
          <h3 className="mb-3 font-bold uppercase tracking-wider text-xs text-gray-400">
            STYLE RULES
          </h3>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Rule 1 */}
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <h4 className="font-bold text-sm text-gray-900">
                Outline only — never filled
              </h4>
              <p className="mt-1 text-xs leading-relaxed text-gray-500">
                Consistent outline style throughout the entire icon set. No filled icons in any context.
              </p>
            </div>

            {/* Rule 2 */}
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <h4 className="font-bold text-sm text-gray-900">
                1.5–2px stroke, rounded caps
              </h4>
              <p className="mt-1 text-xs leading-relaxed text-gray-500">
                Consistent stroke weight. Rounded linecaps and joins match card corner radii across the product.
              </p>
            </div>

            {/* Rule 3 */}
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <h4 className="font-bold text-sm text-gray-900">
                Default: #111827 · Active: #1A5CC8
              </h4>
              <p className="mt-1 text-xs leading-relaxed text-gray-500">
                Single dark gray/navy default. Brand Blue for active or selected states in navigation and controls.
              </p>
            </div>

            {/* Rule 4 */}
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <h4 className="font-bold text-sm text-gray-900">
                Semantic tinting in trade cards
              </h4>
              <p className="mt-1 text-xs leading-relaxed text-gray-500">
                Icons inside trade cards representing semantic meaning (risk level, trade direction) are tinted to match their semantic color.
              </p>
            </div>
          </div>
        </div>

        {/* Example Icons Showcase Card */}
        <div>
          <h3 className="mb-3 font-bold uppercase tracking-wider text-xs text-gray-400">
            EXAMPLE ICONS AT DEFAULT, ACTIVE, AND SEMANTIC STATES
          </h3>

          <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
            {/* Default Icons Row */}
            <div className="grid grid-cols-4 gap-6 border-b border-gray-100 pb-8 sm:grid-cols-8">
              {exampleIcons.map((item) => (
                <div key={item.label} className="flex flex-col items-center justify-center gap-3 text-center">
                  <div className="flex size-10 items-center justify-center rounded-xl bg-gray-50/80">
                    <Icon name={item.name} size={22} state="default" />
                  </div>
                  <span className="text-[11px] font-medium text-gray-500">{item.label}</span>
                </div>
              ))}
            </div>

            {/* Active & Semantic Tinting Row */}
            <div className="mt-8 flex flex-wrap items-center justify-between gap-6">
              <div className="flex flex-wrap items-center gap-8">
                {/* Active State */}
                <div className="flex flex-col items-center gap-2">
                  <div className="flex size-10 items-center justify-center rounded-xl bg-blue-50/50">
                    <Icon name="trendingUp" size={22} state="active" />
                  </div>
                  <span className="text-[11px] font-semibold text-[#1A5CC8]">Active</span>
                </div>

                {/* Semantic Success */}
                <div className="flex flex-col items-center gap-2">
                  <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-50/50">
                    <Icon name="trendingUp" size={22} state="success" />
                  </div>
                  <span className="text-[11px] font-semibold text-[#16A34A]">
                    Semantic: Success
                  </span>
                </div>

                {/* Semantic Danger */}
                <div className="flex flex-col items-center gap-2">
                  <div className="flex size-10 items-center justify-center rounded-xl bg-red-50/50">
                    <Icon name="trendingUp" size={22} state="danger" />
                  </div>
                  <span className="text-[11px] font-semibold text-[#DC2626]">
                    Semantic: Danger
                  </span>
                </div>

                {/* Semantic Warning */}
                <div className="flex flex-col items-center gap-2">
                  <div className="flex size-10 items-center justify-center rounded-xl bg-amber-50/50">
                    <Icon name="shieldCheck" size={22} state="warning" />
                  </div>
                  <span className="text-[11px] font-semibold text-[#D97706]">
                    Semantic: Warning
                  </span>
                </div>
              </div>

              <div className="max-w-xs text-right text-xs leading-relaxed text-gray-400 max-sm:text-left">
                Semantic tinting applies only inside trade cards — not as general decorative color.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Brand Color Palette Summary */}
      <div className="mb-14 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h3 className="mb-4 font-bold text-base text-gray-900">
          Brand Color Palette & Specifications
        </h3>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
            <div className="mb-3 h-10 w-full rounded-lg bg-[#111827]" />
            <div className="font-bold text-xs text-gray-900">Primary Dark Ink</div>
            <div className="font-mono text-[11px] text-gray-500">#111827</div>
          </div>

          <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
            <div className="mb-3 h-10 w-full rounded-lg bg-[#4F8CFF]" />
            <div className="font-bold text-xs text-gray-900">Accent Blue X</div>
            <div className="font-mono text-[11px] text-gray-500">#4F8CFF</div>
          </div>

          <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
            <div className="mb-3 h-10 w-full rounded-lg bg-[#0B192C]" />
            <div className="font-bold text-xs text-gray-900">Navy Background</div>
            <div className="font-mono text-[11px] text-gray-500">#0B192C</div>
          </div>

          <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
            <div className="mb-3 h-10 w-full rounded-lg border border-gray-200 bg-white" />
            <div className="font-bold text-xs text-gray-900">White / Light</div>
            <div className="font-mono text-[11px] text-gray-500">#FFFFFF</div>
          </div>
        </div>
      </div>

      {/* Typography Type Specimen Guidelines */}
      <div className="mb-14">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="font-bold uppercase tracking-wider text-xs text-gray-400">
              TYPOGRAPHY SPECIFICATION
            </h2>
            <p className="mt-1 font-bold text-lg text-gray-900">Text Type Guidelines</p>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <span className="rounded-full bg-blue-50 px-3 py-1 font-semibold text-blue-600">
              Heading: Manrope
            </span>
            <span className="rounded-full bg-gray-100 px-3 py-1 font-semibold text-gray-700">
              Body & Data: Inter
            </span>
          </div>
        </div>

        {/* Specimen Cards Layout matching Brand Guideline Design */}
        <div className="space-y-3">
          {/* Table Header */}
          <div className="grid grid-cols-[130px_1fr_180px] gap-4 px-6 py-2 text-xs font-bold uppercase tracking-wider text-gray-400 max-sm:grid-cols-1">
            <div>ROLE</div>
            <div>SPECIMEN</div>
            <div className="text-right max-sm:text-left">SPECS</div>
          </div>

          {/* Rows */}
          {typographyRules.map((rule, idx) => (
            <div
              key={idx}
              className="grid grid-cols-[130px_1fr_180px] items-center gap-4 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-all hover:border-gray-300 hover:shadow-md max-sm:grid-cols-1"
            >
              <div className="font-medium text-xs text-gray-500">{rule.role}</div>
              <div className={rule.className}>{rule.specimen}</div>
              <div className="text-right text-xs font-medium text-gray-400 max-sm:text-left">
                {rule.specs}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Icon Mark Section */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h3 className="mb-2 font-bold text-base text-gray-900">
          Icon Mark / Favicon Symbol
        </h3>
        <p className="mb-4 text-xs text-gray-500">
          Standalone dual-stroke X mark used for app icons, avatars, and compact spaces.
        </p>

        <div className="flex flex-wrap items-center gap-6">
          <div className="flex items-center gap-3">
            <LogoIcon size={48} variant="primary" />
            <span className="font-medium text-xs text-gray-600">Primary Icon</span>
          </div>

          <div className="flex items-center gap-3 rounded-xl bg-[#0B192C] px-4 py-2 text-white">
            <LogoIcon size={48} variant="reversed" />
            <span className="font-medium text-xs text-gray-200">Reversed Icon</span>
          </div>
        </div>
      </div>
    </div>
  );
}
