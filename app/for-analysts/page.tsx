import type { Metadata } from "next";
import Link from "next/link";

import { Icon, type IconName } from "@/components/stoxify-icon";
import { RevealObserver } from "@/components/reveal-observer";
import { StoxifyNav } from "@/components/stoxify-nav";
import { WaitlistForm } from "@/components/waitlist-form";

export const metadata: Metadata = {
  title: "Stoxify for Research Analysts - Grow Your Advisory Practice",
  description:
    "Stoxify gives SEBI-registered Research Analysts a complete platform to publish real-time trade ideas, grow subscribers, and earn recurring revenue.",
};

const revealDelays = ["", "reveal-delay-1", "reveal-delay-2", "reveal-delay-3", "reveal-delay-4"];

const oldWay = [
  "Publish ideas on WhatsApp groups manually",
  "Chase clients for subscription renewals",
  "Maintain Excel sheets for billing & invoicing",
  "No timestamped proof if SEBI asks",
  "Track performance manually on spreadsheets",
  "Rely only on word of mouth for discovery",
];

const newWay = [
  "Publish in seconds - delivered to all subscribers instantly",
  "Auto-billing, renewal reminders & lapsed management",
  "GST-compliant invoices generated automatically",
  "Every idea timestamped & cryptographically sealed",
  "Full analytics dashboard updated in real time",
  "Listed on marketplace - discovered by 12K+ traders",
];

const stats = [
  { value: "340+", label: "SEBI-registered RAs on waitlist" },
  { value: "\u20B9480Cr+", label: "Trade volume facilitated" },
  { value: "<3s", label: "Alert delivery time" },
  { value: "12K+", label: "Traders waiting" },
];

const publishFeatures: FeatureBullet[] = [
  {
    icon: "zap",
    iconBg: "bg-[var(--orange-light)]",
    iconColor: "text-[var(--orange)]",
    title: "Publish trade ideas in seconds",
    body: "Open the app, enter symbol, type BUY/SELL, set entry/target/SL, hit publish. Your idea reaches every subscriber instantly - timestamped and sealed.",
  },
  {
    icon: "users",
    iconBg: "bg-[var(--brand-light)]",
    iconColor: "text-[var(--brand)]",
    title: "Grow your subscriber base",
    body: "Your verified track record is visible on the marketplace. Good performance speaks for itself. Subscribers come to you - no cold marketing needed.",
  },
  {
    icon: "badge",
    iconBg: "bg-[var(--green-light)]",
    iconColor: "text-[var(--green)]",
    title: "Branded profile page",
    body: "A dedicated, professional profile with your photo, SEBI credentials, performance history, and subscription plans - all verified by Stoxify.",
  },
];

const scaleFeatures: FeatureBullet[] = [
  {
    icon: "creditCard",
    iconBg: "bg-[rgba(139,92,246,0.08)]",
    iconColor: "text-[#6D28D9]",
    title: "Subscriber management & billing",
    body: "Stoxify handles the full subscription lifecycle - payment collection, GST invoicing, renewals, plan upgrades, and lapsed-subscription handling.",
  },
  {
    icon: "listChecks",
    iconBg: "bg-[var(--red-light)]",
    iconColor: "text-[var(--red)]",
    title: "SEBI compliance tools & audit trail",
    body: "Every idea is timestamped, every delivery logged. Complete audit trail for SEBI inspections. Disclosure management handled for you.",
  },
  {
    icon: "barChart",
    iconBg: "bg-[rgba(20,184,166,0.08)]",
    iconColor: "text-[#14B8A6]",
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

const howItWorks = [
  {
    icon: "send",
    title: "Push Trade Ideas Instantly",
    body: "Publish in seconds via app or web. Every idea timestamped and delivered to all subscribers in under 3 seconds. NSE API verified.",
    delay: 0,
  },
  {
    icon: "wallet",
    title: "Earn Recurring Revenue",
    body: "Set your own subscription price. Earn monthly recurring income. Transparent 5% platform fee. Direct bank payouts - no chasing.",
    delay: 2,
  },
  {
    icon: "lock",
    title: "Stay Fully Compliant",
    body: "SEBI compliance is built in. Audit trail, risk disclosures, credential verification. No liability for client fund management - ever.",
    delay: 3,
  },
] satisfies Array<{ icon: IconName; title: string; body: string; delay: number }>;

const chipItems = [
  { icon: "banknote", text: "Monthly subscription revenue from followers" },
  { icon: "scale", text: "Built-in compliance framework" },
  { icon: "barChart", text: "Performance tracking & verification" },
  { icon: "users", text: "Client acquisition through our marketplace" },
  { icon: "shieldCheck", text: "No liability for client fund management" },
  { icon: "star", text: "Transparent rating system builds trust" },
] satisfies Array<{ icon: IconName; text: string }>;

const complianceCards = [
  {
    icon: "timer",
    title: "Cryptographic Timestamps",
    body: "Every trade idea is timestamped at the millisecond of publish. Immutable, downloadable proof that the call was made before the move.",
    delay: 0,
  },
  {
    icon: "folder",
    title: "Complete Audit Trail",
    body: "Full logs of all published ideas, subscriber deliveries, and performance outcomes - formatted for SEBI inspection requirements.",
    delay: 2,
  },
  {
    icon: "fileText",
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

function OrangeChip({ children }: { children: React.ReactNode }) {
  return (
    <span className="mb-5 inline-flex items-center gap-2 rounded-full bg-[var(--orange-light)] px-3 py-1 text-xs font-semibold text-[var(--orange)]">
      {children}
    </span>
  );
}

function FeatureBullet({ feature }: { feature: FeatureBullet }) {
  return (
    <div className="mb-5 flex items-start gap-3.5 last:mb-0">
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
    <section className="mt-[66px] bg-[var(--footer-bg)] px-10 pb-[100px] pt-[140px] text-center max-[860px]:px-6 max-[860px]:pb-16 max-[860px]:pt-[100px] max-[560px]:px-5">
      <OrangeChip>For SEBI-Registered Research Analysts</OrangeChip>
      <h1 className="mb-[18px] text-[clamp(34px,5vw,56px)] font-bold leading-[1.08] tracking-[-0.02em] text-white">
        Scale your research
        <br />
        &amp; advisory practice
      </h1>
      <p className="mx-auto mb-9 max-w-[560px] text-[clamp(15px,1.6vw,17px)] leading-[1.65] text-white/55">
        Stoxify gives SEBI-registered Research Analysts a complete platform to publish real-time
        trade ideas, grow a subscriber base, and build a scalable advisory practice.
      </p>
      <WaitlistForm />
      <div className="mt-[18px] flex flex-wrap justify-center gap-6">
        {["SEBI RAs only", "Free to join", "Priority onboarding", "Launching soon"].map((item) => (
          <span className="inline-flex items-center gap-1.5 text-xs text-white/35" key={item}>
            <Icon className="h-3.5 w-3.5 text-[#34d399]" name="check" />
            {item}
          </span>
        ))}
      </div>
    </section>
  );
}

function StatsStrip() {
  return (
    <div className="border-b border-[var(--line)] bg-white px-10 py-8 max-[860px]:px-6 max-[560px]:px-5">
      <div className="mx-auto grid max-w-[1100px] grid-cols-4 max-[860px]:grid-cols-2">
        {stats.map((stat, index) => (
          <div
            className={[
              "border-r border-[var(--line)] py-2 text-center",
              index === stats.length - 1 && "border-r-0",
              index === 1 && "max-[860px]:border-r-0",
            ]
              .filter(Boolean)
              .join(" ")}
            key={stat.label}
          >
            <div className="text-2xl font-bold leading-none tracking-[-0.5px] text-[var(--ink)]">
              {stat.value}
            </div>
            <div className="mt-[5px] text-xs text-[var(--muted)]">{stat.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function OldVsNew() {
  return (
    <section className="border-y border-[var(--line)] bg-[var(--surface)] px-10 py-[88px] max-[860px]:px-6 max-[860px]:py-16 max-[560px]:px-5 max-[560px]:py-14">
      <div className="mx-auto max-w-[1100px]">
        <div className={revealClass()} data-reveal>
          <SectionTag>Complete Advisory Solution</SectionTag>
          <h2 className="text-[clamp(24px,3vw,40px)] font-medium leading-[1.2] tracking-[-0.01em] text-[var(--ink)]">
            Replace WhatsApp, Excel &amp; manual billing
            <br />
            with one platform
          </h2>
          <p className="mt-2.5 max-w-[560px] text-[clamp(15px,1.6vw,17px)] leading-[1.65] text-[var(--muted)]">
            Most RAs juggle 5+ tools. Stoxify replaces all of them - so you focus on research, not
            operations.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-2 gap-5 max-[860px]:grid-cols-1">
          <ComparisonCard dark={false} items={oldWay} label="The Old Way" />
          <ComparisonCard dark items={newWay} label="With Stoxify" />
        </div>
      </div>
    </section>
  );
}

function ComparisonCard({ label, items, dark }: { label: string; items: string[]; dark: boolean }) {
  return (
    <div
      className={revealClass(
        dark ? 2 : 0,
        `rounded-lg border border-[var(--line)] p-8 transition-all hover:-translate-y-1 hover:border-[var(--brand-mid)] hover:shadow-[0_12px_32px_rgba(0,0,0,0.09)] ${
          dark ? "bg-[var(--footer-bg)]" : "bg-[var(--surface)]"
        }`
      )}
      data-reveal
    >
      <div
        className={`mb-5 text-[11px] font-bold uppercase tracking-[0.08em] ${
          dark ? "text-[var(--orange)]" : "text-[var(--muted-2)]"
        }`}
      >
        <span className="inline-flex items-center gap-2">
          <Icon className="h-4 w-4" name={dark ? "check" : "x"} />
          {label}
        </span>
      </div>
      <ul className="flex list-none flex-col gap-[11px]">
        {items.map((item) => (
          <li
            className={`flex items-start gap-2.5 text-sm leading-[1.5] ${
              dark ? "text-white/70" : "text-[var(--muted)]"
            }`}
            key={item}
          >
            <Icon
              className={`mt-0.5 h-4 w-4 shrink-0 ${dark ? "text-[#34d399]" : "text-[var(--red)]"}`}
              name={dark ? "check" : "x"}
            />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ValueProps() {
  return (
    <section className="px-10 py-[88px] max-[860px]:px-6 max-[860px]:py-16 max-[560px]:px-5 max-[560px]:py-14">
      <div className="mx-auto max-w-[1100px]">
        <div className={revealClass(0, "mb-14 text-center")} data-reveal>
          <h2 className="text-[clamp(24px,3vw,40px)] font-medium leading-[1.2] tracking-[-0.01em] text-[var(--ink)]">
            Everything to run and
            <br />
            grow your practice.
          </h2>
          <p className="mx-auto mt-3 max-w-[520px] text-[clamp(15px,1.6vw,17px)] leading-[1.65] text-[var(--muted)]">
            Stop juggling WhatsApp groups, spreadsheets, manual billing, and compliance paperwork.
            Stoxify handles it all.
          </p>
        </div>
        <div
          className={revealClass(0, "grid grid-cols-2 gap-12 max-[860px]:grid-cols-1")}
          data-reveal
        >
          <FeatureColumn features={publishFeatures} title="Publish & Distribute" />
          <FeatureColumn features={scaleFeatures} title="Manage & Scale" />
        </div>
      </div>
    </section>
  );
}

function FeatureColumn({ title, features }: { title: string; features: FeatureBullet[] }) {
  return (
    <div>
      <div className="mb-5 flex items-center gap-2.5 text-[11px] font-bold uppercase tracking-[0.1em] text-[var(--orange)] after:block after:h-px after:flex-1 after:bg-[var(--line)]">
        {title}
      </div>
      {features.map((feature) => (
        <FeatureBullet feature={feature} key={feature.title} />
      ))}
    </div>
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
          <DashboardMockup />
        </div>
      </div>
    </section>
  );
}

function DashboardMockup() {
  const rows = [
    {
      name: "RELIANCE BUY",
      range: `${"\u20B9"}2,800 -> ${"\u20B9"}2,940`,
      pnl: "+4.3%",
      status: "Active",
      active: true,
    },
    {
      name: "INFY SELL",
      range: `${"\u20B9"}1,400 -> ${"\u20B9"}1,340`,
      pnl: "+4.1%",
      status: "Closed",
    },
    {
      name: "NIFTY CE BUY",
      range: `${"\u20B9"}220 -> ${"\u20B9"}280`,
      pnl: "+27%",
      status: "Closed",
    },
  ];

  return (
    <div className="overflow-hidden rounded-lg border border-white/[0.08] bg-[#17191c] shadow-[0_16px_48px_rgba(0,0,0,0.12)]">
      <div className="flex items-center justify-between border-b border-white/[0.07] bg-[#1e2124] px-4 py-3">
        <div>
          <div className="text-[13px] font-semibold text-white">RA Dashboard</div>
          <div className="text-[11px] text-white/35">Arjun Kapoor · SEBI RA</div>
        </div>
        <button
          className="rounded bg-[var(--orange)] px-3 py-[5px] text-[11px] font-semibold text-white"
          type="button"
        >
          + Publish
        </button>
      </div>
      <div className="grid grid-cols-3 gap-2 px-3.5 pt-3.5">
        <MetricCard
          color="text-[var(--orange)]"
          label="Monthly Revenue"
          sub="+18% this month"
          value={`${"\u20B9"}1.2L`}
        />
        <MetricCard color="text-white" label="Subscribers" sub="+42 this week" value="384" />
        <MetricCard color="text-[#34d399]" label="Hit Rate" sub="Last 90 days" value="74%" />
      </div>
      <div className="p-3.5 pt-3">
        <div className="overflow-hidden rounded bg-white/[0.02]">
          <div className="grid grid-cols-[2fr_1fr_1fr] border-b border-white/[0.05] px-3 py-[7px] text-[10px] font-semibold uppercase tracking-[0.06em] text-white/30">
            <span>Idea</span>
            <span>P&amp;L</span>
            <span>Status</span>
          </div>
          {rows.map((row) => (
            <div
              className="grid grid-cols-[2fr_1fr_1fr] items-center border-b border-white/[0.03] px-3 py-2.5 last:border-b-0"
              key={row.name}
            >
              <div>
                <div className="text-xs font-semibold text-white">{row.name}</div>
                <div className="text-[10px] text-white/30">{row.range}</div>
              </div>
              <div className="text-xs font-semibold text-[#34d399]">{row.pnl}</div>
              <div>
                <span
                  className={[
                    "rounded px-2 py-0.5 text-[10px] font-semibold",
                    row.active
                      ? "bg-[rgba(52,211,153,0.12)] text-[#34d399]"
                      : "bg-white/[0.06] text-white/35",
                  ].join(" ")}
                >
                  {row.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function MetricCard({
  label,
  value,
  sub,
  color,
}: {
  label: string;
  value: string;
  sub: string;
  color: string;
}) {
  return (
    <div className="rounded border border-white/[0.06] bg-white/[0.04] p-3">
      <div className="mb-[5px] text-[10px] uppercase tracking-[0.04em] text-white/35">{label}</div>
      <div className={`text-lg font-bold leading-none tracking-[-0.5px] ${color}`}>{value}</div>
      <div className="mt-1 text-[10px] text-white/30">{sub}</div>
    </div>
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
          <div>
            <SectionTag orange>Publishing Experience</SectionTag>
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
          <PublishMockup />
        </div>
      </div>
    </section>
  );
}

function PublishMockup() {
  return (
    <div className="overflow-hidden rounded-lg border border-[var(--line)] bg-white shadow-[0_8px_24px_rgba(0,0,0,0.1)]">
      <div className="flex items-center justify-between border-b border-[var(--line)] bg-[var(--surface)] px-5 py-[13px]">
        <span className="text-sm font-semibold text-[var(--ink)]">Publish Trade Idea</span>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--green-light)] px-2.5 py-[3px] text-[11px] font-semibold text-[var(--green)]">
          <Icon className="h-3.5 w-3.5" name="check" />
          SEBI Verified RA
        </span>
      </div>
      <div className="flex flex-col gap-[11px] p-[18px]">
        <PublishRow left={["Symbol", "RELIANCE", "brand"]} right={["Exchange", "NSE", "brand"]} />
        <PublishRow left={["Type", "BUY", "buy"]} right={["Segment", "Intraday", "brand"]} />
        <PublishRow
          left={["Entry Price", `${"\u20B9"} 2,847`, "default"]}
          right={["Target", `${"\u20B9"} 2,940`, "buy"]}
        />
        <PublishRow
          left={["Stop Loss", `${"\u20B9"} 2,800`, "sell"]}
          right={["Risk:Reward", "1 : 2.0", "buy"]}
        />
        <div>
          <FieldLabel>Rationale (Optional)</FieldLabel>
          <div className="rounded border border-[var(--line)] bg-[var(--surface)] px-3 py-[9px] text-xs leading-[1.5] text-[var(--muted)]">
            Strong support at 2800, bullish engulfing on 15min chart. Targeting resistance at 2940.
          </div>
        </div>
        <button
          className="inline-flex w-full items-center justify-center gap-2 rounded bg-[var(--orange)] p-[13px] text-sm font-semibold text-white transition-colors hover:bg-[#EA6F0C]"
          type="button"
        >
          <Icon className="h-4 w-4" name="zap" />
          Publish to 342 Subscribers
        </button>
        <div className="flex items-center justify-center gap-1.5 text-[11px] text-[var(--muted-2)]">
          <span className="h-1.5 w-1.5 animate-[blink_1.5s_infinite] rounded-full bg-[var(--green)]" />
          Will be timestamped &amp; logged for SEBI compliance
        </div>
      </div>
    </div>
  );
}

function PublishRow({
  left,
  right,
}: {
  left: [string, string, "brand" | "buy" | "sell" | "default"];
  right: [string, string, "brand" | "buy" | "sell" | "default"];
}) {
  return (
    <div className="grid grid-cols-2 gap-2.5 max-[860px]:grid-cols-1">
      <PublishField field={left} />
      <PublishField field={right} />
    </div>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-[5px] text-[10px] font-bold uppercase tracking-[0.07em] text-[var(--muted-2)]">
      {children}
    </div>
  );
}

function PublishField({
  field,
}: {
  field: [string, string, "brand" | "buy" | "sell" | "default"];
}) {
  const [label, value, tone] = field;
  const classes = {
    brand: "border-[var(--brand-mid)] bg-[var(--brand-light)] text-[var(--brand)]",
    buy: "border-[rgba(27,158,75,0.3)] bg-[var(--green-light)] text-[var(--green)]",
    sell: "border-[rgba(217,48,37,0.2)] bg-[var(--red-light)] text-[var(--red)]",
    default: "border-[var(--line)] bg-[var(--surface)] text-[var(--ink)]",
  };

  return (
    <div>
      <FieldLabel>{label}</FieldLabel>
      <div className={`rounded border px-3 py-[9px] text-[13px] font-semibold ${classes[tone]}`}>
        {value}
      </div>
    </div>
  );
}

function HowItWorks() {
  return (
    <section className="border-y border-[var(--line)] bg-[var(--surface)] px-10 py-[88px] max-[860px]:px-6 max-[860px]:py-16 max-[560px]:px-5 max-[560px]:py-14">
      <div className="mx-auto max-w-[1100px]">
        <div className={revealClass(0, "text-center")} data-reveal>
          <SectionTag center>How It Works</SectionTag>
          <h2 className="text-[clamp(24px,3vw,40px)] font-medium leading-[1.2] tracking-[-0.01em] text-[var(--ink)]">
            Turn your research into recurring revenue
          </h2>
          <p className="mx-auto mt-3 max-w-[520px] text-[clamp(15px,1.6vw,17px)] leading-[1.65] text-[var(--muted)]">
            Three core things Stoxify does for every Research Analyst on the platform.
          </p>
        </div>
        <div className="mt-12 grid grid-cols-3 gap-5 max-[860px]:grid-cols-1">
          {howItWorks.map((item) => (
            <div
              className={revealClass(
                item.delay,
                "rounded-lg border border-[var(--line)] bg-white px-6 py-8 text-center transition-all hover:-translate-y-1 hover:border-[var(--brand-mid)] hover:shadow-[0_12px_32px_rgba(0,0,0,0.09)]"
              )}
              data-reveal
              key={item.title}
            >
              <div className="mx-auto mb-5 flex h-[52px] w-[52px] items-center justify-center rounded-full bg-[var(--brand-light)] text-[var(--brand)]">
                <Icon className="h-[22px] w-[22px]" name={item.icon} />
              </div>
              <h3 className="mb-2.5 text-base font-semibold tracking-[-0.01em] text-[var(--ink)]">
                {item.title}
              </h3>
              <p className="text-[13px] leading-[1.65] text-[var(--muted)]">{item.body}</p>
            </div>
          ))}
        </div>
        <div
          className={revealClass(0, "mt-9 grid grid-cols-3 gap-3.5 max-[860px]:grid-cols-1")}
          data-reveal
        >
          {chipItems.map((item) => (
            <div
              className="flex items-center gap-2.5 text-[13px] text-[var(--muted)]"
              key={item.text}
            >
              <Icon className="h-[17px] w-[17px] shrink-0 text-[var(--brand)]" name={item.icon} />
              {item.text}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Revenue() {
  return (
    <section className="bg-[var(--footer-bg)] px-10 py-[88px] max-[860px]:px-6 max-[860px]:py-16 max-[560px]:px-5 max-[560px]:py-14">
      <div className="mx-auto grid max-w-[1100px] grid-cols-2 items-start gap-16 max-[860px]:grid-cols-1">
        <div className={revealClass()} data-reveal>
          <SectionTag orange>Revenue Potential</SectionTag>
          <h2 className="mb-3.5 text-[clamp(24px,3vw,40px)] font-medium leading-[1.2] tracking-[-0.01em] text-white">
            What could you earn
            <br />
            on Stoxify?
          </h2>
          <p className="text-[clamp(15px,1.6vw,17px)] leading-[1.65] text-white/45">
            Your revenue scales with your subscriber base. Stoxify handles every rupee - billing,
            renewals, and payouts.
          </p>
        </div>
        <div
          className={revealClass(2, "rounded-lg border border-white/10 bg-white/[0.05] p-7")}
          data-reveal
        >
          <div className="mb-5 text-[11px] font-semibold uppercase tracking-[0.08em] text-white/35">
            Sample Revenue Calculation
          </div>
          <RevenueRow label="Your subscribers" value="300" />
          <RevenueRow label="Monthly subscription fee" value={`${"\u20B9"}999 / month`} />
          <RevenueRow label="Gross Revenue" value={`${"\u20B9"}2,99,700`} />
          <RevenueRow label="Stoxify platform fee" muted value="5% + GST" />
          <div className="mt-4 flex items-center justify-between rounded border border-[rgba(249,115,22,0.25)] bg-[rgba(249,115,22,0.12)] px-5 py-4">
            <span className="text-[13px] text-white/60">Your monthly payout</span>
            <span className="text-[26px] font-bold tracking-[-1px] text-[var(--orange)]">
              ~{"\u20B9"}2.7L
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

function RevenueRow({
  label,
  value,
  muted = false,
}: {
  label: string;
  value: string;
  muted?: boolean;
}) {
  return (
    <div className="flex items-center justify-between border-b border-white/[0.07] py-[13px] text-sm last:border-b-0">
      <span className="text-white/45">{label}</span>
      <span className={muted ? "font-semibold text-white/35" : "font-semibold text-white"}>
        {value}
      </span>
    </div>
  );
}

function Compliance() {
  return (
    <section className="px-10 py-[88px] max-[860px]:px-6 max-[860px]:py-16 max-[560px]:px-5 max-[560px]:py-14">
      <div className="mx-auto max-w-[1100px]">
        <div className={revealClass(0, "text-center")} data-reveal>
          <SectionTag center>Compliance</SectionTag>
          <h2 className="text-[clamp(24px,3vw,40px)] font-medium leading-[1.2] tracking-[-0.01em] text-[var(--ink)]">
            Built for SEBI. Not bolted on.
          </h2>
          <p className="mx-auto mt-3 max-w-[520px] text-[clamp(15px,1.6vw,17px)] leading-[1.65] text-[var(--muted)]">
            Every feature was designed with India&apos;s regulatory framework in mind - so you can
            focus on research, not paperwork.
          </p>
        </div>
        <div className="mt-12 grid grid-cols-3 gap-4 max-[860px]:grid-cols-1">
          {complianceCards.map((card) => (
            <div
              className={revealClass(
                card.delay,
                "rounded-lg border border-[var(--line)] bg-[var(--surface)] px-6 py-7 transition-all hover:-translate-y-1 hover:border-[var(--brand-mid)] hover:shadow-[0_12px_32px_rgba(0,0,0,0.09)]"
              )}
              data-reveal
              key={card.title}
            >
              <Icon className="mb-3.5 h-[26px] w-[26px] text-[var(--brand)]" name={card.icon} />
              <h3 className="mb-2 text-[15px] font-semibold tracking-[-0.01em] text-[var(--ink)]">
                {card.title}
              </h3>
              <p className="text-[13px] leading-[1.65] text-[var(--muted)]">{card.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function WaitlistCta() {
  return (
    <section
      className="bg-[var(--footer-bg)] px-10 py-24 text-center max-[860px]:px-6 max-[860px]:py-16 max-[560px]:px-5 max-[560px]:py-14"
      id="waitlist"
    >
      <div className="mx-auto max-w-[1200px]">
        <OrangeChip>Early Access - Founding Batch</OrangeChip>
        <h2
          className={revealClass(
            0,
            "mb-3.5 text-[clamp(24px,3vw,40px)] font-medium leading-[1.2] tracking-[-0.01em] text-white"
          )}
          data-reveal
        >
          Be among the first Research Analysts
          <br />
          on Stoxify
        </h2>
        <p
          className={revealClass(
            2,
            "mx-auto mb-9 max-w-[640px] text-[clamp(15px,1.6vw,17px)] leading-[1.65] text-white/45"
          )}
          data-reveal
        >
          We&apos;re onboarding our founding batch of SEBI-registered RAs. Get priority access,
          founding member benefits, and zero platform fee for your first 3 months.
        </p>
        <div className={revealClass(3)} data-reveal>
          <WaitlistForm />
        </div>
        <p
          className={revealClass(
            4,
            "mt-5 inline-flex items-center justify-center gap-2 text-[13px] text-white/35"
          )}
          data-reveal
        >
          <Icon className="h-4 w-4 text-[var(--orange)]" name="flame" />
          340+ analysts already on the waitlist
        </p>
        <div className={revealClass(4, "mt-3 flex flex-wrap justify-center gap-6")} data-reveal>
          {[
            "Free to join",
            "Priority onboarding",
            "0% platform fee for first 3 months",
            "Founding member badge",
          ].map((item) => (
            <span className="inline-flex items-center gap-1.5 text-xs text-white/35" key={item}>
              <Icon className="h-3.5 w-3.5 text-[#34d399]" name="check" />
              {item}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="bg-[var(--footer-bg)] px-10 pb-9 pt-16 max-[860px]:px-6 max-[860px]:pb-7 max-[860px]:pt-12 max-[560px]:px-5">
      <div className="mx-auto max-w-[1200px]">
        <div className="mb-14 grid grid-cols-[1.8fr_1fr_1fr_1fr] gap-12 max-[860px]:grid-cols-2 max-[860px]:gap-8 max-[560px]:grid-cols-1">
          <div>
            <Link
              className="mb-3 flex items-center font-sans text-xl font-extrabold text-white"
              href="/"
            >
              Stoxify
            </Link>
            <p className="mb-5 text-sm leading-[1.7] text-white/40">
              India&apos;s first real-time trade idea marketplace - a complete business platform for
              SEBI-registered Research Analysts.
            </p>
            <div className="flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/[0.07] px-3 py-1 text-[11px] font-semibold text-white/50">
                <Icon className="h-3.5 w-3.5" name="check" />
                SEBI Regulated
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/[0.07] px-3 py-1 text-[11px] font-semibold text-white/50">
                <Icon className="h-3.5 w-3.5" name="sparkle" />
                Made in India
              </span>
            </div>
          </div>
          <FooterColumn
            links={["Join Waitlist", "RA Dashboard", "Revenue & Pricing", "Compliance Tools"]}
            title="For Research Analysts"
          />
          <FooterColumn links={["For Traders", "Home", "Blog", "Contact"]} title="Platform" />
          <FooterColumn
            links={[
              "Privacy Policy",
              "Terms of Service",
              "SEBI Disclosures",
              "Grievance Redressal",
            ]}
            title="Legal"
          />
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.08] pt-6 max-[860px]:flex-col max-[860px]:items-start max-[860px]:gap-2">
          <div className="text-[13px] text-white/30">
            &copy; 2026 Stoxify Technologies Pvt. Ltd. All rights reserved.
          </div>
          <div className="flex gap-5 max-[560px]:flex-wrap max-[560px]:gap-3">
            <Link
              className="text-[13px] text-white/30 transition-colors hover:text-white/60"
              href="/privacy"
            >
              Privacy
            </Link>
            <Link
              className="text-[13px] text-white/30 transition-colors hover:text-white/60"
              href="/terms"
            >
              Terms
            </Link>
            <Link
              className="text-[13px] text-white/30 transition-colors hover:text-white/60"
              href="/sebi-disclosures"
            >
              Disclosures
            </Link>
          </div>
        </div>
        <p className="mt-5 border-t border-white/[0.06] pt-5 text-[11.5px] leading-[1.75] text-white/20">
          Stoxify is a SEBI-regulated technology platform. Only SEBI-registered Research Analysts
          (RAs) may publish trade ideas. All published ideas are the sole views of the respective
          RA. Past performance is not indicative of future results. Stoxify does not guarantee
          returns or accuracy of any trade idea.
        </p>
      </div>
    </footer>
  );
}

function FooterColumn({ title, links }: { title: string; links: string[] }) {
  return (
    <div>
      <h3 className="mb-4 text-xs font-bold uppercase tracking-[0.1em] text-white/40">{title}</h3>
      <ul className="flex list-none flex-col gap-[9px]">
        {links.map((link) => (
          <li key={link}>
            <Link
              className="text-sm text-white/55 transition-colors hover:text-white"
              href={
                link === "Join Waitlist"
                  ? "#waitlist"
                  : link === "RA Dashboard"
                    ? "/login?role=analyst"
                    : "#"
              }
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
      <RevealObserver />
      <StoxifyNav active="analysts" ctaHref="#waitlist" ctaVariant="orange" />
      <main>
        <Hero />
        <StatsStrip />
        <OldVsNew />
        <ValueProps />
        <ManageSection />
        <PublishDemo />
        <HowItWorks />
        <Revenue />
        <Compliance />
        <WaitlistCta />
      </main>
      <Footer />
    </>
  );
}
