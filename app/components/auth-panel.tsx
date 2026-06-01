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
      {/* 1. BACKGROUND GEOMETRIC CURVES (SVG)
          We use absolute positioning, absolute width/height, and pointer-events-none 
          so the background doesn't block interactions. The curves are drawn with thin,
          semi-transparent strokes (white/0.05 and brand/0.1) to create depth. */}
      <div className="pointer-events-none absolute inset-0 z-0 opacity-40">
        <svg className="h-full w-full" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M-100 100 C 300 200, 200 600, 800 400"
            stroke="rgba(255, 255, 255, 0.04)"
            strokeWidth="2"
          />
          <path
            d="M-50 200 C 400 300, 100 800, 900 600"
            stroke="rgba(31, 122, 224, 0.08)"
            strokeWidth="1.5"
          />
          <path
            d="M200 -50 C 100 400, 800 300, 600 1000"
            stroke="rgba(31, 122, 224, 0.05)"
            strokeWidth="2"
          />
          <circle cx="80%" cy="20%" r="250" fill="radial-gradient(circle, rgba(31,122,224,0.08) 0%, transparent 70%)" />
        </svg>
        {/* Subtle blur overlay for depth */}
        <div className="absolute right-[10%] top-[10%] h-[300px] w-[300px] rounded-full bg-[var(--brand)]/10 blur-[80px]" />
        <div className="absolute bottom-[20%] left-[-10%] h-[400px] w-[400px] rounded-full bg-[rgba(249,115,22,0.05)] blur-[100px]" />
      </div>

      {/* 2. LOGO / BRANDING (Z-1 to stay above background) */}
      <div className="relative z-10">
        <Link className="inline-flex items-center gap-2 font-sans text-[22px] font-extrabold tracking-[-0.5px] text-white" href="/">
          <span className="h-2.5 w-2.5 rounded-full bg-[var(--brand)]" />
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
