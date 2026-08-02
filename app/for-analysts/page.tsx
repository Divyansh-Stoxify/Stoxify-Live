import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { Icon, type IconName } from "@/components/stoxify-icon";
import { Logo } from "@/components/logo";
import { RevealObserver } from "@/components/reveal-observer";
import { StoxifyNav } from "@/components/stoxify-nav";
import { WaitlistForm } from "@/components/waitlist-form";
import { FAQSchema } from "@/components/seo/faq-schema";

export const metadata: Metadata = {
  title: "Stoxify for Research Analysts - PaRRVA Compliance & Subscription SaaS Platform",
  description:
    "Stoxify gives SEBI-registered Research Analysts a complete platform to publish real-time timestamped trade ideas, automate subscriber billing, and ensure PaRRVA compliance.",
  alternates: {
    canonical: "https://www.stoxify.in/for-analysts",
  },
};

const revealDelays = ["", "reveal-delay-1", "reveal-delay-2", "reveal-delay-3", "reveal-delay-4"];

const heroAvatars = [
  "linear-gradient(135deg,#3B82F6,#2D5BE3)",
  "linear-gradient(135deg,#F59E0B,#D97706)",
  "linear-gradient(135deg,#10B981,#059669)",
];

/**
 * "Anatomy of a Trade" grid — column order is row-major, so the left/right
 * pairing in Figma (publish/billing, growth/compliance, profile/analytics) is
 * preserved on desktop and flattens to a single column under 860px.
 */
const practiceFeatures: FeatureBullet[] = [
  {
    icon: "send",
    iconBg: "bg-[var(--brand-light)]",
    iconColor: "text-[var(--brand)]",
    title: "Publish trade ideas in seconds",
    body: "Open the app, enter symbol, type BUY/SELL, set entry/target/SL, hit publish. Your idea reaches every subscriber instantly — timestamped and sealed.",
  },
  {
    icon: "creditCard",
    iconBg: "bg-[var(--brand-light)]",
    iconColor: "text-[var(--brand)]",
    title: "Subscriber management & billing",
    body: "Stoxify handles the full subscription lifecycle — payment collection, GST invoicing, renewals, plan upgrades, and lapsed-subscription handling.",
  },
  {
    icon: "trendingUp",
    iconBg: "bg-[var(--brand-light)]",
    iconColor: "text-[var(--brand)]",
    title: "Grow your subscriber base",
    body: "Your verified track record is visible on the marketplace. Good performance speaks for itself. Subscribers come to you — no cold marketing needed.",
  },
  {
    icon: "wrench",
    iconBg: "bg-[var(--brand-light)]",
    iconColor: "text-[var(--brand)]",
    title: "SEBI compliance tools & audit trail",
    body: "Every idea is timestamped, every delivery logged. Complete audit trail for SEBI inspections. Disclosure management handled for you.",
  },
  {
    icon: "tag",
    iconBg: "bg-[var(--brand-light)]",
    iconColor: "text-[var(--brand)]",
    title: "Branded profile page",
    body: "A dedicated, professional profile with your photo, SEBI credentials, performance history, and subscription plans — all verified by Stoxify.",
  },
  {
    icon: "barChart",
    iconBg: "bg-[var(--brand-light)]",
    iconColor: "text-[var(--brand)]",
    title: "Analytics to grow smarter",
    body: "Track hit rates, P&L per idea, subscriber growth, revenue trends, and more. Build your reputation on real, verifiable data.",
  },
];

const manageFeatures: FeatureBullet[] = [
  {
    icon: "creditCard",
    iconBg: "bg-[rgba(139,92,246,0.08)]",
    iconColor: "text-[#6D28D9]",
    title: "Complete subscriber & billing management",
    body: "Payment collection, GST invoicing, auto-renewals & risk profiling - all automated.",
  },
  {
    icon: "listChecks",
    iconBg: "bg-[var(--red-light)]",
    iconColor: "text-[var(--red)]",
    title: "SEBI audit trail & compliance tools",
    body: "Every idea timestamped. Full logs ready for SEBI inspections at any time.",
  },
  {
    icon: "barChart",
    iconBg: "bg-[rgba(20,184,166,0.08)]",
    iconColor: "text-[#14B8A6]",
    title: "Analytics to grow smarter",
    body: "Hit rate, P&L per idea, subscriber growth & revenue trends in one dashboard.",
  },
];

const timingRows = [
  { dot: "bg-[var(--orange)]", label: "You hit Publish", value: "T+0s" },
  { dot: "bg-[var(--brand)]", label: "Idea is timestamped", value: "T+0.1s" },
  { dot: "bg-[var(--green)]", label: "Subscribers notified", value: "T+2.8s" },
];

const revenuePillars = [
  {
    icon: "send",
    title: "Push Trade Ideas Instantly",
    body: "Publish in seconds via app or web. Every idea timestamped and delivered to all subscribers in under 3 seconds. NSE API verified.",
    points: [
      "Monthly subscription revenue from followers",
      "Client acquisition through our marketplace",
    ],
    delay: 0,
  },
  {
    icon: "trendingUp",
    title: "Earn Recurring Revenue",
    body: "Set your own subscription price. Earn monthly recurring income. Transparent 5% platform fee. Direct bank payouts — no chasing.",
    points: ["Built-in compliance framework", "No liability for client fund management"],
    delay: 2,
  },
  {
    icon: "lock",
    title: "Stay Fully Compliant",
    body: "SEBI compliance is built in. Audit trail, risk disclosures, credential verification. No liability for client fund management — ever.",
    points: ["Performance tracking & verification", "Transparent rating system builds trust"],
    delay: 3,
  },
] satisfies Array<{
  icon: IconName;
  title: string;
  body: string;
  points: string[];
  delay: number;
}>;

const threeSteps = [
  {
    title: "Verify",
    body: "Confirm your SEBI registration. We check it against the registry.",
  },
  {
    title: "Publish",
    body: "Create trade ideas with entry, target, stop-loss and rationale. Every one is timestamped the moment it goes live.",
  },
  {
    title: "Get paid",
    body: "Set your plans. Subscriptions, billing and payouts run automatically.",
  },
];

const faqs = [
  {
    question: "Who can publish on Stoxify?",
    answer:
      "Only SEBI-registered Research Analysts. Registration is verified before you can publish.",
  },
  {
    question: "Does Stoxify control or change my calls?",
    answer:
      "No. Every idea is yours alone. Stoxify never edits, filters, or overrides what you publish - we timestamp it, seal it, and deliver it to your subscribers exactly as you wrote it.",
  },
  {
    question: "How do payouts work?",
    answer:
      "You set your own subscription price. Stoxify collects payments, raises GST invoices, and handles renewals, then transfers your earnings directly to your bank account after a transparent 5% platform fee.",
  },
  {
    question: "Is my performance data safe from manipulation?",
    answer:
      "Yes. Entry, target, and stop-loss are timestamped at the millisecond of publish and stored as an immutable record, so nothing can be edited after the fact. Every outcome shown on your profile is computed from that sealed record.",
  },
  {
    question: "What about PaRRVA?",
    answer:
      "Stoxify structures your trade records for SEBI's performance-verification regime from the moment you publish - NSE-timestamped, immutable, and audit-ready - so your track record is ready for verification rather than reconstructed after the fact.",
  },
];

const comparisonRows = [
  { icon: "send", label: "Publish in seconds" },
  { icon: "message", label: "WhatsApp + Push + SMS delivery" },
  { icon: "creditCard", label: "Automated Billing" },
  { icon: "fileText", label: "GST Invoices" },
  { icon: "shieldCheck", label: "Compliance Ready" },
  { icon: "barChart", label: "Performance Analytics" },
  { icon: "users", label: "Subscriber Management" },
  { icon: "store", label: "Marketplace Discovery" },
  { icon: "refresh", label: "Renewal Automation" },
  { icon: "grid", label: "Single Dashboard" },
] satisfies Array<{ icon: IconName; label: string }>;

const complianceCards = [
  {
    icon: "timer",
    title: "Cryptographic Timestamps",
    body: "Every trade idea is timestamped at the millisecond of publish. Immutable, downloadable proof that the call was made before the move.",
    delay: 0,
  },
  {
    icon: "shieldCheck",
    title: "Complete Audit Trail",
    body: "Full logs of all published ideas, subscriber deliveries, and performance outcomes - formatted for SEBI inspection requirements.",
    delay: 2,
  },
  {
    icon: "gear",
    title: "Risk Disclosure Management",
    body: "SEBI-compliant risk disclosures are automatically appended to every idea you publish. Nothing falls through the cracks.",
    delay: 3,
  },
] satisfies Array<{ icon: IconName; title: string; body: string; delay: number }>;

type FeatureBullet = {
  icon: IconName;
  iconBg: string;
  iconColor: string;
  title: string;
  body: string;
};

function revealClass(delay = 0, className = "") {
  return ["reveal", revealDelays[delay], className].filter(Boolean).join(" ");
}

function SectionTag({
  children,
  orange = false,
  center = false,
}: {
  children: React.ReactNode;
  orange?: boolean;
  center?: boolean;
}) {
  return (
    <span
      className={[
        "mb-3 block text-[11px] font-semibold uppercase tracking-[0.1em]",
        orange ? "text-[var(--orange)]" : "text-[var(--brand)]",
        center && "text-center",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </span>
  );
}

/**
 * Product screenshot on a blue panel. Figma rounds these evenly on all four
 * corners — the large asymmetric radius is reserved for the PaRRVA diagram.
 */
function MockupPanel({
  src,
  alt,
  width,
  height,
  crop,
  aspect = "aspect-[16/10]",
  className = "",
}: {
  src: string;
  alt: string;
  width: number;
  height: number;
  /**
   * Where the screenshot sits inside the panel. Figma oversizes each mockup so
   * it bleeds past one or two edges and gets clipped — the blue only shows on
   * the remaining sides, and the offsets differ per row.
   */
  crop: React.CSSProperties;
  /** Panel shape — Figma sizes each one to its screenshot rather than a fixed ratio. */
  aspect?: string;
  className?: string;
}) {
  return (
    <div
      className={revealClass(
        2,
        `relative ${aspect} overflow-hidden rounded-3xl bg-[linear-gradient(135deg,#2f80f5_0%,#1a5fd0_45%,#0b2e78_100%)] ${className}`
      )}
      data-reveal
    >
      <Image
        alt={alt}
        className="absolute h-auto rounded-lg shadow-[0_14px_40px_rgba(3,10,28,0.22)]"
        height={height}
        sizes="(max-width: 860px) 90vw, 560px"
        src={src}
        style={crop}
        width={width}
      />
    </div>
  );
}

function FeatureBullet({
  feature,
  /** Stacked lists space themselves; grids let the container's row gap do it. */
  spacing = "mb-5 last:mb-0",
}: {
  feature: FeatureBullet;
  spacing?: string;
}) {
  return (
    <div className={`flex items-start gap-3.5 ${spacing}`}>
      <div
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${feature.iconBg}`}
      >
        <Icon className={`h-[18px] w-[18px] ${feature.iconColor}`} name={feature.icon} />
      </div>
      <div>
        <h3 className="mb-1 text-[15px] font-semibold tracking-[-0.01em] text-[var(--ink)]">
          {feature.title}
        </h3>
        <p className="text-[13px] leading-[1.65] text-[var(--muted)]">{feature.body}</p>
      </div>
    </div>
  );
}

function Hero() {
  return (
    // Navy-to-blue glow: brightest right of centre, falling off to near-black
    // on the left, matching the analyst hero in Figma.
    <section className="mt-[66px] bg-[#03091b] bg-[radial-gradient(115%_125%_at_82%_45%,#2f7ff2_0%,#1a5fd0_20%,#0c3a8c_40%,#061e4d_62%,#03091b_85%)] px-10 pb-[100px] pt-[130px] text-center max-[860px]:px-6 max-[860px]:pb-16 max-[860px]:pt-[100px] max-[560px]:px-5">
      <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-white/85">
        <span className="h-1.5 w-1.5 rounded-full bg-[#5aa2ff]" />
        For SEBI-Registered Research Analysts
      </span>
      <h1 className="mb-[18px] text-[clamp(34px,5vw,56px)] font-bold leading-[1.08] tracking-[-0.02em] text-white">
        Scale your research
        <br />
        &amp; advisory practice
      </h1>
      <p className="mx-auto mb-9 max-w-[620px] text-[clamp(15px,1.6vw,17px)] leading-[1.65] text-white/70">
        Stoxify gives SEBI-registered Research Analysts a complete platform to publish real-time
        trade ideas, grow a subscriber base, and build a scalable advisory practice.
      </p>
      <WaitlistForm variant="pill" />

      <div className="mt-6 flex items-center justify-center gap-3">
        <div className="flex -space-x-2.5">
          {heroAvatars.map((gradient) => (
            <span
              className="h-[26px] w-[26px] rounded-full ring-2 ring-white/80"
              key={gradient}
              style={{ background: gradient }}
            />
          ))}
        </div>
        <span className="text-[12.5px] text-white/70">500+ verified analysts joined</span>
      </div>

      <div className="mt-6 flex flex-wrap justify-center gap-6">
        {["SEBI RAs only", "Free to join", "Priority onboarding", "Launching soon"].map((item) => (
          <span className="inline-flex items-center gap-1.5 text-xs text-white/55" key={item}>
            <Icon className="h-3.5 w-3.5 text-white/45" name="check" />
            {item}
          </span>
        ))}
      </div>
    </section>
  );
}

function ManageSection() {
  return (
    <section className="border-y border-[var(--line)] bg-[var(--surface)] px-10 py-[88px] max-[860px]:px-6 max-[860px]:py-16 max-[560px]:px-5 max-[560px]:py-14">
      <div className="mx-auto max-w-[1100px]">
        <div
          className={revealClass(
            0,
            "grid grid-cols-2 items-center gap-[72px] max-[860px]:grid-cols-1 max-[860px]:gap-10"
          )}
          data-reveal
        >
          <div>
            <SectionTag>Manage</SectionTag>
            <h2 className="text-[clamp(24px,3vw,40px)] font-medium leading-[1.2] tracking-[-0.01em] text-[var(--ink)]">
              Invest time in research,
              <br />
              not operations
            </h2>
            <p className="mb-7 mt-3 text-[clamp(15px,1.6vw,17px)] leading-[1.65] text-[var(--muted)]">
              Everything you need to run a professional advisory practice - without the manual work.
            </p>
            {manageFeatures.map((feature) => (
              <FeatureBullet feature={feature} key={feature.title} />
            ))}
          </div>
          <MockupPanel
            alt="RA dashboard showing monthly revenue, subscriber count and hit rate, with a table of published ideas and their P&L"
            aspect="aspect-[23/20]"
            crop={{ top: "8%", right: "7%", width: "112%" }}
            height={1120}
            src="/Assets/asset6.png"
            width={1404}
          />
        </div>
      </div>
    </section>
  );
}

function PublishDemo() {
  return (
    <section className="px-10 py-[88px] max-[860px]:px-6 max-[860px]:py-16 max-[560px]:px-5 max-[560px]:py-14">
      <div className="mx-auto max-w-[1100px]">
        <div
          className={revealClass(
            0,
            "grid grid-cols-2 items-center gap-[72px] max-[860px]:grid-cols-1 max-[860px]:gap-10"
          )}
          data-reveal
        >
          {/* Figma alternates the sides here — panel left, copy right. */}
          <MockupPanel
            alt="Publish Trade Idea form with symbol, exchange, type, entry price, target, stop loss and risk-to-reward fields"
            aspect="aspect-[16/9]"
            className="max-[860px]:order-2"
            crop={{ top: "8%", left: "12%", width: "82%" }}
            height={1293}
            src="/Assets/asset7.png"
            width={1216}
          />
          <div className="max-[860px]:order-1">
            <SectionTag>Publishing Experience</SectionTag>
            <h2 className="mb-3.5 text-[clamp(28px,3.5vw,42px)] font-bold leading-[1.15] tracking-[-0.02em] text-[var(--ink)]">
              Publish an idea in
              <br />
              under 30 seconds.
            </h2>
            <p className="mb-7 text-[clamp(15px,1.6vw,17px)] leading-[1.65] text-[var(--muted)]">
              Our mobile-first publish interface is built for speed. Every field is optimised for
              the market - symbol search, type toggle, pre-filled exchanges.
            </p>
            <div className="flex flex-col gap-3.5 rounded-lg border border-[var(--line)] bg-white p-5">
              {timingRows.map((row) => (
                <div className="flex items-center gap-3 text-sm" key={row.label}>
                  <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${row.dot}`} />
                  <span className="flex-1 text-[var(--muted)]">{row.label}</span>
                  <span className="font-mono text-[15px] font-bold text-[var(--ink)]">
                    {row.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Revenue() {
  return (
    <section className="bg-white px-10 py-[88px] max-[860px]:px-6 max-[860px]:py-16 max-[560px]:px-5 max-[560px]:py-14">
      <div className="mx-auto grid max-w-[1100px] grid-cols-2 items-center gap-16 max-[860px]:grid-cols-1 max-[860px]:gap-10">
        <div className={revealClass()} data-reveal>
          <SectionTag>Revenue Potential</SectionTag>
          <h2 className="mb-3.5 text-[clamp(24px,3vw,40px)] font-medium leading-[1.2] tracking-[-0.01em] text-[var(--ink)]">
            What could you earn
            <br />
            on Stoxify?
          </h2>
          <p className="text-[clamp(15px,1.6vw,17px)] leading-[1.65] text-[var(--muted)]">
            Your revenue scales with your subscriber base. Stoxify handles every rupee - billing,
            renewals, and payouts.
          </p>
        </div>
        <MockupPanel
          alt="Sample revenue calculation: 300 subscribers at \u20B9999 per month gives \u20B92,99,700 gross revenue and a monthly payout of about \u20B92.7L after a 5% platform fee"
          aspect="aspect-[23/20]"
          crop={{ top: "9%", left: "9%", width: "100%" }}
          height={1125}
          src="/Assets/asset8.png"
          width={1398}
        />
      </div>
    </section>
  );
}

function AnatomyOfTrade() {
  return (
    <section className="border-y border-[var(--line)] bg-[var(--surface)] px-10 py-[88px] max-[860px]:px-6 max-[860px]:py-16 max-[560px]:px-5 max-[560px]:py-14">
      <div className="mx-auto max-w-[1100px]">
        <div className={revealClass(0, "text-center")} data-reveal>
          <SectionTag center>Anatomy of a Trade</SectionTag>
          <h2 className="text-[clamp(24px,3vw,40px)] font-medium leading-[1.2] tracking-[-0.01em] text-[var(--ink)]">
            Everything You Need To Run Your Practice
          </h2>
        </div>
        <div
          className={revealClass(
            0,
            "mt-12 grid grid-cols-2 gap-x-14 gap-y-9 max-[860px]:grid-cols-1 max-[860px]:gap-y-7"
          )}
          data-reveal
        >
          {practiceFeatures.map((feature) => (
            <FeatureBullet feature={feature} key={feature.title} spacing="" />
          ))}
        </div>
      </div>
    </section>
  );
}

function RecurringRevenue() {
  return (
    <section className="bg-white px-10 py-[88px] max-[860px]:px-6 max-[860px]:py-16 max-[560px]:px-5 max-[560px]:py-14">
      <div className="mx-auto max-w-[1100px]">
        <div className={revealClass(0, "text-center")} data-reveal>
          <h2 className="text-[clamp(24px,3vw,40px)] font-medium leading-[1.2] tracking-[-0.01em] text-[var(--ink)]">
            Turn Your Research Into
            <br />
            Recurring Revenue
          </h2>
          <p className="mx-auto mt-3 max-w-[560px] text-[clamp(15px,1.6vw,17px)] leading-[1.65] text-[var(--muted)]">
            Three core things Stoxify does for every Research Analyst on the platform.
          </p>
        </div>
        <div className="mt-14 grid grid-cols-3 gap-12 max-[860px]:grid-cols-1 max-[860px]:gap-10">
          {revenuePillars.map((pillar) => (
            <div className={revealClass(pillar.delay)} data-reveal key={pillar.title}>
              <Icon className="mb-5 h-7 w-7 text-[var(--brand)]" name={pillar.icon} />
              <h3 className="mb-2.5 text-[17px] font-semibold tracking-[-0.01em] text-[var(--ink)]">
                {pillar.title}
              </h3>
              <p className="text-[13px] leading-[1.65] text-[var(--muted)]">{pillar.body}</p>
              <ul className="mt-4 flex list-none flex-col gap-2.5">
                {pillar.points.map((point) => (
                  <li className="flex items-start gap-2.5" key={point}>
                    <Icon
                      className="mt-[2px] h-4 w-4 shrink-0 text-[var(--green)]"
                      name="circleCheck"
                    />
                    <span className="text-[13px] leading-[1.5] text-[var(--muted)]">{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Parrva() {
  return (
    <section className="border-y border-[var(--line)] bg-[var(--surface)] px-10 py-[88px] max-[860px]:px-6 max-[860px]:py-16 max-[560px]:px-5 max-[560px]:py-14">
      <div className="mx-auto grid max-w-[1100px] grid-cols-2 items-center gap-16 max-[860px]:grid-cols-1 max-[860px]:gap-10">
        <div className={revealClass()} data-reveal>
          <span className="mb-5 inline-flex items-center gap-1.5 rounded-full bg-[var(--brand-light)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--brand)]">
            <Icon className="h-3.5 w-3.5" name="shieldCheck" />
            Compliance-First
          </span>
          <h2 className="mb-3.5 text-[clamp(28px,3.5vw,42px)] font-bold leading-[1.15] tracking-[-0.02em] text-[var(--ink)]">
            Ready for <span className="text-[var(--brand)]">PaRRVA</span>,
            <br />
            before the deadline
          </h2>
          <p className="text-[clamp(15px,1.6vw,17px)] leading-[1.65] text-[var(--muted)]">
            SEBI&apos;s performance-verification regime (PaRRVA) is live, and unverified performance
            claims are on the clock. Stoxify structures your trade records for verification from the
            moment you publish — NSE-timestamped, immutable, and audit-ready.
          </p>
        </div>
        {/* Figma crops this diagram to 16:10 from the top, dropping the icon strip
            that runs along the bottom of the source asset. */}
        <div
          className={revealClass(
            2,
            "relative aspect-[16/10] overflow-hidden rounded-2xl rounded-bl-[72px] rounded-tr-[72px] max-[560px]:rounded-bl-[48px] max-[560px]:rounded-tr-[48px]"
          )}
          data-reveal
        >
          <Image
            alt="Compliance diagram: every trade record is NSE-timestamped, kept as tamper-proof immutable records, structured audit-ready for verification, and SEBI aligned for PaRRVA"
            className="object-cover object-top"
            fill
            sizes="(max-width: 860px) 90vw, 560px"
            src="/Assets/asset10.png"
          />
        </div>
      </div>
    </section>
  );
}

/** Solid status pill used in the comparison table — red cross or green tick. */
function Verdict({ yes, label }: { yes: boolean; label: string }) {
  return (
    <span
      className={[
        "inline-flex h-[22px] w-[22px] items-center justify-center rounded-full text-white",
        yes ? "bg-[var(--green)]" : "bg-[var(--red)]",
      ].join(" ")}
    >
      <Icon aria-hidden className="h-3.5 w-3.5" name={yes ? "check" : "x"} strokeWidth={3} />
      <span className="sr-only">{label}</span>
    </span>
  );
}

function Comparison() {
  return (
    <section className="bg-white px-10 py-[88px] max-[860px]:px-6 max-[860px]:py-16 max-[560px]:px-5 max-[560px]:py-14">
      <div className="mx-auto max-w-[1100px]">
        <div className={revealClass(0, "text-center")} data-reveal>
          <SectionTag center>Complete Advisory Solution</SectionTag>
          <h2 className="text-[clamp(24px,3vw,40px)] font-medium leading-[1.2] tracking-[-0.01em] text-[var(--ink)]">
            Replace WhatsApp, Excel &amp; Manual
            <br />
            Billing With One Platform
          </h2>
          <p className="mx-auto mt-3 max-w-[560px] text-[clamp(15px,1.6vw,17px)] leading-[1.65] text-[var(--muted)]">
            Most RAs juggle 5+ tools. Stoxify replaces all of them — so you focus on research, not
            operations.
          </p>
        </div>
        <div
          className={revealClass(
            2,
            "mt-12 overflow-hidden rounded-xl border border-[var(--line)] bg-white"
          )}
          data-reveal
        >
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-[var(--line)]">
                <th className="w-2/5 px-6 py-5 text-left text-[11px] font-bold uppercase tracking-[0.1em] text-[var(--muted)] max-[560px]:px-3.5 max-[560px]:py-4">
                  <span className="inline-flex items-center gap-2">
                    Feature
                    <Icon aria-hidden className="h-4 w-4 text-[var(--muted-2)]" name="scale" />
                  </span>
                </th>
                <th className="w-[30%] bg-[rgba(217,48,37,0.05)] px-4 py-5 text-center max-[560px]:px-2 max-[560px]:py-4">
                  <span className="inline-flex items-center gap-2 max-[560px]:flex-col max-[560px]:gap-1">
                    <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[var(--red)] text-white">
                      <Icon aria-hidden className="h-3.5 w-3.5" name="x" strokeWidth={3} />
                    </span>
                    <span className="text-[13px] font-bold uppercase tracking-[0.06em] text-[var(--ink)]">
                      Traditional Way
                    </span>
                  </span>
                  <span className="mt-1.5 block text-[11.5px] font-normal text-[var(--muted)]">
                    Manual. Slow. Scattered.
                  </span>
                </th>
                <th className="w-[30%] bg-[rgba(27,158,75,0.05)] px-4 py-5 text-center max-[560px]:px-2 max-[560px]:py-4">
                  <span className="inline-flex items-center gap-2 max-[560px]:flex-col max-[560px]:gap-1">
                    <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[var(--green)] text-white">
                      <Icon aria-hidden className="h-3.5 w-3.5" name="check" strokeWidth={3} />
                    </span>
                    <span className="text-[13px] font-bold uppercase tracking-[0.06em] text-[var(--ink)]">
                      Stoxify
                    </span>
                  </span>
                  <span className="mt-1.5 block text-[11.5px] font-normal text-[var(--muted)]">
                    Automated. Fast. All-in-One.
                  </span>
                </th>
              </tr>
            </thead>
            <tbody>
              {comparisonRows.map((row) => (
                <tr className="border-b border-[var(--line)] last:border-b-0" key={row.label}>
                  <th
                    className="px-6 py-3.5 text-left font-normal max-[560px]:px-3.5"
                    scope="row"
                  >
                    <span className="flex items-center gap-3 max-[560px]:gap-2.5">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--brand-light)]">
                        <Icon
                          aria-hidden
                          className="h-[17px] w-[17px] text-[var(--brand)]"
                          name={row.icon}
                        />
                      </span>
                      <span className="text-sm text-[var(--ink)] max-[560px]:text-[13px]">
                        {row.label}
                      </span>
                    </span>
                  </th>
                  <td className="bg-[rgba(217,48,37,0.03)] px-4 py-3.5 text-center">
                    <Verdict label="Not available" yes={false} />
                  </td>
                  <td className="bg-[rgba(27,158,75,0.03)] px-4 py-3.5 text-center">
                    <Verdict label="Included" yes />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

function ThreeSteps() {
  return (
    <section className="bg-white px-10 py-[88px] max-[860px]:px-6 max-[860px]:py-16 max-[560px]:px-5 max-[560px]:py-14">
      <div className="mx-auto max-w-[1000px]">
        <div className={revealClass(0, "mb-14 text-center")} data-reveal>
          <SectionTag center>How It Works</SectionTag>
          <h2 className="text-[clamp(24px,3vw,40px)] font-medium leading-[1.2] tracking-[-0.01em] text-[var(--ink)]">
            Three Steps
          </h2>
        </div>
        {/* The connector rail is drawn per step as two half-width rules either
            side of the badge, with the outer ends hidden on the first/last. */}
        <ol className="grid grid-cols-3 max-[560px]:grid-cols-1 max-[560px]:gap-8">
          {threeSteps.map((step, index) => (
            <li
              className={revealClass(index, "flex flex-col items-center text-center")}
              data-reveal
              key={step.title}
            >
              <div className="flex w-full items-center max-[560px]:hidden">
                <span
                  className={`h-px flex-1 bg-[var(--brand)] ${index === 0 ? "invisible" : ""}`}
                />
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--brand)] text-[13px] font-semibold text-white">
                  {index + 1}
                </span>
                <span
                  className={`h-px flex-1 bg-[var(--brand)] ${
                    index === threeSteps.length - 1 ? "invisible" : ""
                  }`}
                />
              </div>
              <span className="hidden h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--brand)] text-[13px] font-semibold text-white max-[560px]:flex">
                {index + 1}
              </span>
              <h3 className="mt-5 text-[17px] font-semibold tracking-[-0.01em] text-[var(--ink)]">
                {step.title}
              </h3>
              <p className="mt-2.5 max-w-[240px] text-[13px] leading-[1.7] text-[var(--muted)]">
                {step.body}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function Compliance() {
  return (
    <section className="bg-[var(--brand-dark)] px-10 py-[88px] max-[860px]:px-6 max-[860px]:py-16 max-[560px]:px-5 max-[560px]:py-14">
      <div className="mx-auto max-w-[1100px]">
        <div className={revealClass(0, "text-center")} data-reveal>
          <span className="mb-3 block text-[11px] font-semibold uppercase tracking-[0.1em] text-white/70">
            Compliance
          </span>
          <h2 className="text-[clamp(24px,3vw,40px)] font-medium leading-[1.2] tracking-[-0.01em] text-white">
            Built for SEBI. Not bolted on.
          </h2>
        </div>
        <div className="mt-12 grid grid-cols-3 gap-6 max-[860px]:grid-cols-1">
          {complianceCards.map((card) => (
            <div
              className={revealClass(card.delay, "rounded-2xl bg-white px-7 py-8")}
              data-reveal
              key={card.title}
            >
              <Icon className="mb-5 h-9 w-9 text-[var(--brand)]" name={card.icon} />
              <h3 className="mb-2.5 text-[17px] font-semibold tracking-[-0.01em] text-[var(--ink)]">
                {card.title}
              </h3>
              <p className="text-[13px] leading-[1.7] text-[var(--muted)]">{card.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Faq() {
  return (
    <section className="bg-white px-10 py-[88px] max-[860px]:px-6 max-[860px]:py-16 max-[560px]:px-5 max-[560px]:py-14">
      <div className="mx-auto max-w-[860px]">
        <div className={revealClass(0, "mb-12 text-center")} data-reveal>
          <SectionTag center>Got Any Questions?</SectionTag>
          <h2 className="text-[clamp(24px,3vw,40px)] font-medium leading-[1.2] tracking-[-0.01em] text-[var(--ink)]">
            Frequently Asked Questions
          </h2>
        </div>
        <div className="flex flex-col gap-3.5">
          {faqs.map((faq, index) => (
            <details
              className={revealClass(
                index % 5,
                "group rounded-xl border border-[var(--line)] bg-white px-6 py-5 transition-colors open:border-[var(--brand-mid)] max-[560px]:px-5"
              )}
              data-reveal
              key={faq.question}
              open={index === 0}
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-6 [&::-webkit-details-marker]:hidden">
                <span className="text-[15.5px] font-semibold leading-snug tracking-[-0.01em] text-[var(--ink)]">
                  {faq.question}
                </span>
                <Icon
                  className="h-5 w-5 shrink-0 text-[var(--muted)] group-open:hidden"
                  name="plus"
                />
                <Icon
                  className="hidden h-5 w-5 shrink-0 text-[var(--brand)] group-open:block"
                  name="minus"
                />
              </summary>
              <p className="mt-3 text-[13.5px] leading-[1.75] text-[var(--muted)]">{faq.answer}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

const socialLinks: Array<{ label: string; href: string; path: string }> = [
  {
    label: "Facebook",
    href: "#",
    path: "M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07C0 18.1 4.39 23.1 10.13 24v-8.44H7.08v-3.49h3.05V9.41c0-3.02 1.79-4.69 4.53-4.69 1.31 0 2.68.24 2.68.24v2.96h-1.51c-1.49 0-1.96.93-1.96 1.89v2.26h3.33l-.53 3.49h-2.8V24C19.61 23.1 24 18.1 24 12.07Z",
  },
  {
    label: "Twitter",
    href: "#",
    path: "M23.95 4.57a10 10 0 0 1-2.82.77 4.96 4.96 0 0 0 2.16-2.72c-.95.56-2 .96-3.13 1.18a4.92 4.92 0 0 0-8.38 4.49A13.97 13.97 0 0 1 1.64 3.16a4.82 4.82 0 0 0-.67 2.47c0 1.71.87 3.22 2.19 4.1a4.9 4.9 0 0 1-2.23-.62v.06a4.92 4.92 0 0 0 3.95 4.83 4.99 4.99 0 0 1-2.21.08 4.94 4.94 0 0 0 4.6 3.42A9.87 9.87 0 0 1 0 19.54a13.94 13.94 0 0 0 7.56 2.21c9.05 0 14-7.5 14-13.99 0-.21 0-.42-.02-.63a9.94 9.94 0 0 0 2.41-2.54Z",
  },
  {
    label: "Instagram",
    href: "#",
    path: "M12 0C8.74 0 8.33.02 7.05.07 5.78.13 4.9.33 4.14.63a5.9 5.9 0 0 0-2.13 1.38A5.9 5.9 0 0 0 .63 4.14c-.3.77-.5 1.64-.56 2.91C.01 8.33 0 8.74 0 12s.02 3.67.07 4.95c.06 1.28.26 2.15.56 2.91a5.9 5.9 0 0 0 1.38 2.13 5.9 5.9 0 0 0 2.13 1.38c.77.3 1.64.5 2.91.56C8.33 23.99 8.74 24 12 24s3.67-.02 4.95-.07c1.28-.06 2.15-.26 2.91-.56a6.15 6.15 0 0 0 3.51-3.51c.3-.77.5-1.64.56-2.91.06-1.28.07-1.69.07-4.95s-.02-3.67-.07-4.95c-.06-1.28-.26-2.15-.56-2.91a5.9 5.9 0 0 0-1.38-2.13A5.9 5.9 0 0 0 19.86.63c-.77-.3-1.64-.5-2.91-.56C15.67.01 15.26 0 12 0Zm0 2.16c3.2 0 3.58.02 4.85.07 1.17.06 1.8.25 2.23.42.56.21.96.48 1.38.9.42.42.68.82.9 1.38.16.42.36 1.06.41 2.23.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.06 1.17-.25 1.8-.42 2.23-.22.56-.48.96-.9 1.38-.42.42-.82.68-1.38.9-.42.16-1.06.36-2.23.41-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-1.17-.06-1.8-.25-2.23-.42-.56-.22-.96-.48-1.38-.9-.42-.42-.68-.82-.9-1.38-.16-.42-.36-1.06-.41-2.23-.06-1.27-.07-1.65-.07-4.85s.01-3.58.07-4.85c.06-1.17.25-1.8.42-2.23.21-.56.48-.96.9-1.38.42-.42.82-.68 1.38-.9.42-.16 1.06-.36 2.23-.41C8.42 2.18 8.8 2.16 12 2.16Zm0 3.68a6.16 6.16 0 1 0 0 12.32 6.16 6.16 0 0 0 0-12.32ZM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8Zm7.85-10.41a1.44 1.44 0 1 1-2.88 0 1.44 1.44 0 0 1 2.88 0Z",
  },
  {
    label: "LinkedIn",
    href: "#",
    path: "M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28ZM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13Zm1.78 13.02H3.56V9h3.56v11.45ZM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.73C24 .77 23.2 0 22.22 0Z",
  },
  {
    label: "YouTube",
    href: "#",
    path: "M23.5 6.19a3.02 3.02 0 0 0-2.12-2.14C19.5 3.55 12 3.55 12 3.55s-7.5 0-9.38.5A3.02 3.02 0 0 0 .5 6.19C0 8.07 0 12 0 12s0 3.93.5 5.81a3.02 3.02 0 0 0 2.12 2.14c1.88.5 9.38.5 9.38.5s7.5 0 9.38-.5a3.02 3.02 0 0 0 2.12-2.14C24 15.93 24 12 24 12s0-3.93-.5-5.81ZM9.55 15.57V8.43L15.82 12l-6.27 3.57Z",
  },
];

function Footer() {
  return (
    <footer className="border-t border-[var(--line)] bg-white px-10 pb-10 pt-16 max-[860px]:px-6 max-[860px]:pt-12 max-[560px]:px-5">
      <div className="mx-auto max-w-[1200px]">
        <div className="mb-12 grid grid-cols-[1.8fr_1fr_1fr_1fr] gap-12 max-[860px]:grid-cols-2 max-[860px]:gap-8 max-[560px]:grid-cols-1">
          <div>
            <Logo asLink href="/" size="xl" />
            <p className="mt-4 max-w-[320px] text-[12.5px] leading-[1.7] text-[var(--muted)]">
              India&apos;s first real-time trade idea marketplace &mdash; SEBI-registered Research
              Analysts, verified calls, instant delivery.
            </p>
          </div>
          <FooterColumn
            links={["Browse Analysts", "Pricing", "How It Works", "Broker Connect"]}
            title="For Traders"
          />
          <FooterColumn links={["For Research Analysts", "Home", "Blog"]} title="Platform" />
          <FooterColumn
            links={["Privacy Policy", "Terms", "SEBI Disclosures", "Grievance Redressal"]}
            title="Legal"
          />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-[var(--line)] pt-6">
          <div className="text-[13px] text-[var(--muted-2)]">
            &copy; 2026 Stoxify Technologies Pvt. Ltd.
          </div>
          <div className="flex items-center gap-5">
            {socialLinks.map((social) => (
              <Link
                aria-label={social.label}
                className="text-[var(--ink-2)] transition-colors hover:text-[var(--brand)]"
                href={social.href}
                key={social.label}
              >
                <svg
                  aria-hidden
                  className="h-[17px] w-[17px]"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d={social.path} />
                </svg>
              </Link>
            ))}
          </div>
        </div>

        <p className="mx-auto mt-8 max-w-[900px] text-center text-[11.5px] leading-[1.75] text-[var(--muted-2)]">
          All trade ideas on Stoxify are published by SEBI-registered Research Analysts. Stoxify is
          a technology intermediary and does not provide investment advice. Investments in
          securities are subject to market risks. Read all scheme related documents carefully. Past
          performance is not indicative of future results.
        </p>
      </div>
    </footer>
  );
}

function FooterColumn({ title, links }: { title: string; links: string[] }) {
  return (
    <div>
      <h3 className="mb-4 text-[15px] font-semibold tracking-[-0.01em] text-[var(--ink)]">
        {title}
      </h3>
      <ul className="flex list-none flex-col gap-3">
        {links.map((link) => (
          <li key={link}>
            <Link
              className="text-[13.5px] text-[var(--muted)] transition-colors hover:text-[var(--brand)]"
              href="#"
            >
              {link}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function ForAnalystsPage() {
  return (
    <>
      <FAQSchema items={faqs} />
      <RevealObserver />
      <StoxifyNav active="analysts" ctaHref="/signup" ctaLabel="Sign Up" ctaVariant="orange" />
      <main>
        <Hero />
        <ManageSection />
        <PublishDemo />
        <Revenue />
        <AnatomyOfTrade />
        <RecurringRevenue />
        <Parrva />
        <Comparison />
        <ThreeSteps />
        <Compliance />
        <Faq />
      </main>
      <Footer />
    </>
  );
}
