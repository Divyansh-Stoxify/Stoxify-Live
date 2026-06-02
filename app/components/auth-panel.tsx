"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

// Hardcoded premium testimonials to cycle through or display based on context
const TESTIMONIALS = [
  {
    quote: "Stoxify gives me the perfect platform to monetize my expertise and broadcast live calls to thousands of traders instantly.",
    author: "Priya Desai",
    role: "SEBI Registered Analyst",
    initials: "PD",
    gradient: "linear-gradient(135deg, #FF6B6B, #FF8E53)"
  },
  {
    quote: "The instant alerts have changed how my subscribers trade. Payouts are seamless, and compliance tools are built directly into the flow.",
    author: "Arjun Kapoor",
    role: "Equity & Index RA",
    initials: "AK",
    gradient: "linear-gradient(135deg, #3B82F6, #2D5BE3)"
  }
];

export function AuthPanel() {
  const [index, setIndex] = useState(0);

  // Rotate testimonials every 6 seconds for a dynamic feel
  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % TESTIMONIALS.length);
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  const current = TESTIMONIALS[index];

  return (
    <div className="relative hidden h-full flex-col justify-between overflow-hidden bg-[#141b23] p-12 text-white select-none min-[860px]:flex">
      {/* 1. BACKGROUND GEOMETRIC CURVES */}
      <div className="pointer-events-none absolute inset-0 z-0 opacity-40">
        <div className="absolute left-[-170px] top-[120px] h-[540px] w-[820px] rotate-[18deg] rounded-[50%] border border-white/[0.07]" />
        <div className="absolute left-[-110px] top-[210px] h-[590px] w-[920px] rotate-[28deg] rounded-[50%] border border-[rgba(31,122,224,0.14)]" />
        <div className="absolute left-[210px] top-[-110px] h-[800px] w-[520px] rotate-[-24deg] rounded-[50%] border border-[rgba(31,122,224,0.09)]" />
        {/* Subtle blur overlay for depth */}
        <div className="absolute right-[10%] top-[10%] h-[300px] w-[300px] rounded-full bg-[var(--brand)]/10 blur-[80px]" />
        <div className="absolute bottom-[20%] left-[-10%] h-[400px] w-[400px] rounded-full bg-[rgba(249,115,22,0.05)] blur-[100px]" />
      </div>

      {/* 2. LOGO / BRANDING (Z-1 to stay above background) */}
      <div className="relative z-10">
        <Link className="inline-flex items-center font-sans text-[22px] font-extrabold tracking-[-0.5px] text-white" href="/">
          Stoxify
        </Link>
      </div>

      {/* 3. TESTIMONIAL CARD
          Includes transitions to smoothly animate when changing testimonials.
          Uses glassmorphism (bg-white/5, backdrop-blur-md, and thin border)
          to feel premium and integrated into the layout. */}
      <div className="relative z-10 w-full max-w-[420px] self-start rounded-2xl border border-white/10 bg-white/[0.04] p-7 backdrop-blur-md transition-all duration-500 ease-in-out hover:border-white/15 hover:bg-white/[0.06]">
        {/* Quote Block with fade keyframe transition */}
        <p className="key-fade mb-5 text-[15px] font-medium leading-[1.65] text-white/90 transition-opacity duration-300">
          &ldquo;{current.quote}&rdquo;
        </p>

        {/* Profile Footer */}
        <div className="flex items-center gap-3">
          {/* Avatar Placeholder with high-end initials and custom gradient */}
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-extrabold text-white transition-all duration-500"
            style={{ background: current.gradient }}
          >
            {current.initials}
          </div>

          <div>
            <div className="text-[13px] font-bold text-white transition-colors">{current.author}</div>
            <div className="text-[11.5px] text-white/50">{current.role}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
