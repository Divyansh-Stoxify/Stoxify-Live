import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { Icon, type IconName } from "@/components/stoxify-icon";
import { RevealObserver } from "@/components/reveal-observer";
import { StoxifyNav } from "@/components/stoxify-nav";
import { Logo } from "@/components/logo";
import { FAQSchema } from "@/components/seo/faq-schema";

export const metadata: Metadata = {
  title: "Get Real-Time Trade Ideas from SEBI-Registered Research Analysts",
  description:
    "Subscribe to verified SEBI-registered Research Analysts and receive real-time timestamped trade ideas with entry, target, stop-loss, and audited performance.",
  alternates: {
    canonical: "https://www.stoxify.in",
  },
};

const buttonLarge =
  "inline-flex items-center justify-center gap-2 rounded px-[26px] py-3 text-[15px] font-medium transition-all active:scale-[0.97]";
const buttonPrimary =
  "bg-[var(--brand)] text-white hover:-translate-y-px hover:bg-[var(--brand-dark)] hover:shadow-[0_4px_16px_rgba(31,122,224,0.35)]";

const faqs = [
  {
    question: "Is StoXify an investment adviser?",
    answer:
      "No. StoXify is a marketplace. The analysts you follow are independent, SEBI-registered professionals. StoXify does not give advice, manage your money, or access your holdings.",
  },
  {
    question: "How do you verify analysts?",
    answer:
      "Before an analyst can publish a single trade, we check their SEBI registration number against the public SEBI register and confirm their identity. The registration number and verified badge stay on their profile, so you can check it yourself at any time. Every trade they publish is NSE-timestamped and locked — it cannot be edited or deleted afterwards.",
  },
  {
    question: "Do you guarantee returns?",
    answer:
      "No, and nobody on StoXify is allowed to. Markets carry risk and some trades will go against you — that is why every idea comes with a stop-loss and a stated risk-to-reward before you act. What we do guarantee is an honest record: an analyst's full history stays on their public page, losses included.",
  },
  {
    question: "What is KYC for?",
    answer:
      "SEBI requires every user receiving research from a registered analyst to verify their identity, so KYC is a one-time step before your first subscription. Aadhaar verification is usually instant. It only confirms who you are — StoXify never gets access to your demat account, your broker, or your holdings.",
  },
];

const revealDelays = ["", "reveal-delay-1", "reveal-delay-2", "reveal-delay-3", "reveal-delay-4"];

const tickerItems = [
  { symbol: "NIFTY 50", price: "22,463", direction: "up", change: "0.41%" },
  { symbol: "RELIANCE", price: "\u20B92,847", direction: "up", change: "1.24%" },
  { symbol: "TCS", price: "\u20B93,412", direction: "down", change: "0.38%" },
  { symbol: "HDFC BANK", price: "\u20B91,654", direction: "up", change: "0.87%" },
  { symbol: "INFOSYS", price: "\u20B91,389", direction: "up", change: "2.10%" },
  { symbol: "ICICI BANK", price: "\u20B91,102", direction: "up", change: "0.55%" },
  { symbol: "WIPRO", price: "\u20B9478", direction: "down", change: "0.92%" },
  { symbol: "SENSEX", price: "74,119", direction: "up", change: "0.36%" },
];

const heroTrust: Array<{ icon: IconName; label: string }> = [
  { icon: "shieldCheck", label: "SEBI-verified\nRAs only" },
  { icon: "timer", label: "NSE Timestamped\nRecords" },
  { icon: "lock", label: "Transparent\nby Default" },
];

const heroAvatars = [
  "linear-gradient(135deg,#3B82F6,#2D5BE3)",
  "linear-gradient(135deg,#F59E0B,#D97706)",
  "linear-gradient(135deg,#10B981,#059669)",
];

const oldWayPoints = [
  "Unknown person",
  "No registration",
  "No stop-loss",
  "No accountability",
];

const stoxifyWayPoints = [
  "Verified analyst",
  "SEBI registration",
  "Complete trade plan",
  "Timestamp & accountability",
];

type DifferentiatorIconName = "shield" | "clock" | "chart" | "doc";

const differentiators: Array<{
  icon: DifferentiatorIconName;
  title: string;
  description: string;
}> = [
  {
    icon: "shield",
    title: "Only SEBI-registered analysts.",
    description:
      "Every analyst on StoXify has a verifiable SEBI registration number. No exceptions.",
  },
  {
    icon: "clock",
    title: "Verified, timestamped performance.",
    description:
      "Trade records are NSE-timestamped and cannot be edited after the fact — so a track record is actually a track record.",
  },
  {
    icon: "chart",
    title: "Full transparency by default.",
    description:
      "Every trade sits on the analyst's public page — the ones that worked and the ones that did not.",
  },
  {
    icon: "doc",
    title: "A complete idea, every time.",
    description:
      "Entry, target, stop-loss and rationale on every trade. You always know the plan and the risk before you act.",
  },
];

const LOREM =
  "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et";

const tradeAnatomy: Array<{ icon: IconName; title: string; description: string }> = [
  { icon: "wrench", title: "Marketing tools", description: LOREM },
  { icon: "tag", title: "Entry price", description: LOREM },
  { icon: "x", title: "Stop-loss", description: LOREM },
  { icon: "target", title: "Up to three targets, with booking levels", description: LOREM },
  { icon: "activity", title: "Risk-to-reward ratio", description: LOREM },
  { icon: "barChart", title: "The analyst's rationale", description: LOREM },
  {
    icon: "shieldCheck",
    title: "The analyst's SEBI registration number and verified badge",
    description: LOREM,
  },
  { icon: "timer", title: "An immutable NSE timestamp", description: LOREM },
];

function revealClass(delay = 0, className = "") {
  return ["reveal", revealDelays[delay], className].filter(Boolean).join(" ");
}

function SectionTag({ children }: { children: React.ReactNode }) {
  return (
    <span className="mb-3.5 inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.12em] text-[var(--brand)]">
      {children}
    </span>
  );
}

function TickerBar() {
  return (
    <div className="mt-[66px] flex h-11 items-center overflow-hidden bg-[var(--ink)]">
      <div className="flex animate-[ticker_30s_linear_infinite] whitespace-nowrap">
        {[...tickerItems, ...tickerItems].map((item, index) => {
          const up = item.direction === "up";

          return (
            <span
              className="inline-flex items-center gap-2 border-r border-white/10 px-7 text-[12.5px] font-medium"
              key={`${item.symbol}-${index}`}
            >
              <span className="text-white/65">{item.symbol}</span>
              <span className="text-white/35">{item.price}</span>
              <span
                className={
                  up
                    ? "inline-flex items-center gap-1 font-semibold text-[#34D399]"
                    : "inline-flex items-center gap-1 font-semibold text-[#F87171]"
                }
              >
                <Icon className="h-3.5 w-3.5" name={up ? "trendingUp" : "trendingDown"} />
                {item.change}
              </span>
            </span>
          );
        })}
      </div>
    </div>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden bg-[linear-gradient(103deg,#ffffff_0%,#ffffff_36%,#ecf2fd_63%,#d6e3fa_100%)] px-10 pb-20 pt-24 max-[860px]:px-6 max-[860px]:pb-14 max-[860px]:pt-16">
      <div className="relative z-[1] mx-auto grid max-w-[1200px] grid-cols-[1.08fr_0.92fr] gap-8 max-[860px]:grid-cols-1 max-[860px]:gap-10">
        <div className="max-[860px]:max-w-[560px]">
          <h1 className="text-[clamp(28px,3.7vw,50px)] font-bold leading-[1.1] tracking-[-0.025em] text-[var(--ink)]">
            Trade ideas from
            <br />
            SEBI-registered analysts
          </h1>
          <p className="mt-7 text-[clamp(15px,1.4vw,19px)] font-semibold leading-snug tracking-[-0.01em] text-[var(--brand)]">
            Every trade idea comes with a clear entry, target and stop-loss
          </p>
          <p className="mt-5 max-w-[560px] text-[clamp(14.5px,1.15vw,16.5px)] leading-[1.72] text-[var(--muted)]">
            StoXify is a marketplace of SEBI-registered Research Analysts. Every trade idea comes
            with a clear entry, target and stop-loss &mdash; verified, timestamped, and tied to a
            real registration number.
          </p>
          <Link
            className={`${buttonLarge} ${buttonPrimary} mt-8 rounded-md px-8 py-4 max-[560px]:w-full`}
            href="#"
          >
            Join Us Today
          </Link>
          <ul className="mt-7 flex flex-wrap items-center gap-x-8 gap-y-5">
            {heroTrust.map((item) => (
              <li className="flex items-center gap-2.5" key={item.label}>
                <Icon
                  className="h-[18px] w-[18px] shrink-0 text-[var(--muted)]"
                  name={item.icon}
                />
                <span className="whitespace-pre-line text-[11.5px] font-medium leading-[1.35] text-[var(--muted)]">
                  {item.label}
                </span>
              </li>
            ))}
          </ul>
          <div className="mt-7 flex items-center gap-3">
            <div className="flex -space-x-2.5">
              {heroAvatars.map((gradient) => (
                <span
                  className="h-[26px] w-[26px] rounded-full ring-2 ring-white"
                  key={gradient}
                  style={{ background: gradient }}
                />
              ))}
            </div>
            <span className="text-[11.5px] text-[var(--muted-2)]">
              500+ verified analysts joined
            </span>
          </div>
        </div>

        <div className="flex items-center justify-center">
          <Image
            alt="The StoXify app shown on two phones"
            className="h-auto w-full max-w-[560px]"
            height={703}
            priority
            sizes="(max-width: 860px) 90vw, 560px"
            src="/Assets/HeroImage.png"
            width={765}
          />
        </div>
      </div>
    </section>
  );
}

function ChecklistItem({ label, tone }: { label: string; tone: "bad" | "good" }) {
  const bad = tone === "bad";

  return (
    <li className="flex items-center gap-2.5">
      <span
        className={`flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full ${
          bad ? "bg-[var(--red)]" : "bg-[var(--brand)]"
        }`}
      >
        <Icon className="h-3 w-3 text-white" name={bad ? "x" : "check"} strokeWidth={3} />
      </span>
      <span className="text-[13.5px] leading-snug text-[var(--ink-2)]">{label}</span>
    </li>
  );
}

function Problem() {
  return (
    <section className="border-t border-[var(--line)] bg-white px-10 py-24 max-[860px]:px-6 max-[860px]:py-16 max-[560px]:px-5 max-[560px]:py-14">
      <div className="mx-auto max-w-[1100px]">
        <div className={revealClass(0, "mb-14 text-center")} data-reveal>
          <SectionTag>The Problem</SectionTag>
          <h2 className="text-[clamp(24px,3vw,40px)] font-medium leading-[1.2] tracking-[-0.01em] text-[var(--ink)]">
            You&rsquo;ve Been Here Before
          </h2>
        </div>

        <div className="grid grid-cols-[0.85fr_1.15fr] items-start gap-10 max-[860px]:grid-cols-1 max-[860px]:gap-10">
          {/* ---------- narrative ---------- */}
          <div className={revealClass(0)} data-reveal>
            <p className="text-[15.5px] font-semibold leading-snug text-[var(--brand)]">
              It usually starts with a screenshot.
            </p>
            <p className="mt-2 text-[15px] leading-[1.7] text-[var(--ink-2)]">
              Someone in a group who doubled their money last week. The first two calls hit, so you
              put in more.
              <br />
              Then a call goes wrong, there is no stop-loss, and the person you trusted with your
              savings goes quiet.
            </p>

            <p className="mt-7 text-[15.5px] font-semibold leading-snug text-[var(--brand)]">
              No name. No licence. No one to answer for it.
            </p>
            <p className="mt-2 text-[15px] leading-[1.7] text-[var(--ink-2)]">
              Every year, thousands of retail investors in India lose money this way &mdash; to
              anonymous channels promising sure-shot calls and guaranteed returns. StoXify exists
              because trusting a stranger with your money should not be the only option.
            </p>
          </div>

          {/* ---------- old way vs StoXify way ---------- */}
          <div
            className={revealClass(2, "relative grid grid-cols-2 max-[560px]:grid-cols-1")}
            data-reveal
          >
            {/* arrow between the two panels */}
            <div className="absolute left-1/2 top-1/2 z-10 flex h-11 w-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-[var(--line)] bg-white shadow-[0_4px_14px_rgba(0,0,0,0.1)] max-[560px]:hidden">
              <Icon className="h-[18px] w-[18px] text-[var(--brand)]" name="arrowRight" />
            </div>

            {/* the old way */}
            <div className="rounded-l-xl bg-[var(--red-light)] p-5 max-[560px]:rounded-xl">
              <div className="mb-5 flex justify-center">
                <span className="rounded-full bg-[#9f1d15] px-4 py-1.5 text-[12.5px] font-semibold text-white">
                  The old way
                </span>
              </div>

              <div className="rounded-lg border border-[rgba(217,48,37,0.16)] bg-white p-4">
                <div className="text-[12.5px] font-bold text-[var(--ink)]">
                  &#128293; JACKPOT CALL &#128293;
                </div>
                <div className="mt-2 text-[13px] font-medium text-[var(--ink-2)]">
                  BAJAJ FINANCE BUY NOW
                </div>
                <div className="text-[13px] text-[var(--ink-2)]">Target 2500+</div>
                <div className="mt-3 flex items-end justify-between border-t border-[var(--line)] pt-2.5">
                  <span className="text-[12.5px] text-[var(--muted)]">No Stop Loss</span>
                  <span className="text-[11px] text-[var(--muted-2)]">09:15 AM</span>
                </div>
              </div>

              <ul className="mt-5 flex flex-col gap-2.5">
                {oldWayPoints.map((point) => (
                  <ChecklistItem key={point} label={point} tone="bad" />
                ))}
              </ul>
            </div>

            {/* the StoXify way */}
            <div className="rounded-r-xl bg-[var(--brand-light)] p-5 max-[560px]:mt-4 max-[560px]:rounded-xl">
              <div className="mb-5 flex justify-center">
                <span className="rounded-full bg-[var(--brand)] px-4 py-1.5 text-[12.5px] font-semibold text-white">
                  The StoXify way
                </span>
              </div>

              <div className="rounded-lg border border-[var(--brand-mid)] bg-white p-4">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="whitespace-nowrap text-[13px] font-bold text-[var(--ink)]">
                      BAJAJ FINANCE
                    </span>
                    <span className="rounded bg-[var(--green-light)] px-1.5 py-0.5 text-[10px] font-bold text-[var(--green)]">
                      BUY
                    </span>
                  </div>
                  <span className="flex shrink-0 items-center gap-1 text-[10px] font-semibold text-[var(--brand)]">
                    <Icon className="h-3 w-3" name="circleCheck" />
                    SEBI Verified
                  </span>
                </div>
                <div className="mt-1.5 text-[11px] text-[var(--muted-2)]">
                  SEBI Reg. INH000012345
                </div>

                <div className="mt-3 grid grid-cols-3 gap-2">
                  <div>
                    <div className="text-[10.5px] text-[var(--muted-2)]">Entry</div>
                    <div className="text-[13px] font-semibold text-[var(--ink)]">2,280</div>
                  </div>
                  <div>
                    <div className="text-[10.5px] text-[var(--muted-2)]">T1</div>
                    <div className="text-[13px] font-semibold text-[var(--ink)]">2,450.60</div>
                  </div>
                  <div>
                    <div className="text-[10.5px] text-[var(--muted-2)]">SL</div>
                    <div className="text-[13px] font-semibold text-[var(--red)]">2,150.00</div>
                  </div>
                </div>

                <div className="mt-3 border-t border-[var(--line)] pt-2.5 text-[11px] text-[var(--muted-2)]">
                  23 May 2026, 10:24 AM &middot; NSE
                </div>
              </div>

              <ul className="mt-5 flex flex-col gap-2.5">
                {stoxifyWayPoints.map((point) => (
                  <ChecklistItem key={point} label={point} tone="good" />
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function DifferentiatorIcon({ name }: { name: DifferentiatorIconName }) {
  if (name === "shield") {
    return (
      <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24">
        <path
          d="M12 2 4 5.4v6.1c0 5 3.4 8.9 8 10.5 4.6-1.6 8-5.5 8-10.5V5.4L12 2Z"
          fill="var(--brand)"
        />
        <path
          d="m8.5 12 2.4 2.4 4.6-4.7"
          stroke="#fff"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
        />
      </svg>
    );
  }

  if (name === "clock") {
    return (
      <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24">
        <circle cx="12" cy="12" fill="var(--brand)" r="10" />
        <path
          d="M12 6.6V12l3.5 2.1"
          stroke="#fff"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
        />
      </svg>
    );
  }

  if (name === "chart") {
    return (
      <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24">
        <rect fill="var(--brand)" height="8.5" rx="1.3" width="4.8" x="3" y="12.5" />
        <rect fill="var(--brand)" height="13" rx="1.3" width="4.8" x="9.6" y="8" />
        <rect fill="var(--brand)" height="18" rx="1.3" width="4.8" x="16.2" y="3" />
      </svg>
    );
  }

  return (
    <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24">
      <rect fill="var(--brand)" height="19" rx="2.6" width="16" x="4" y="2.5" />
      <path
        d="M8 8h8M8 12h8M8 16h5"
        stroke="#fff"
        strokeLinecap="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function WhyStoxify() {
  return (
    <section className="bg-[#0d5bd6] px-10 py-24 max-[860px]:px-6 max-[860px]:py-16 max-[560px]:px-5 max-[560px]:py-14">
      <div className="mx-auto max-w-[1180px]">
        <div className={revealClass(0, "mb-14 text-center")} data-reveal>
          <span className="mb-5 inline-flex items-center rounded-full bg-white/15 px-4 py-1.5 text-[11.5px] font-bold uppercase tracking-[0.12em] text-white">
            Why Stoxify?
          </span>
          <h2 className="text-[clamp(24px,3vw,40px)] font-semibold leading-[1.2] tracking-[-0.01em] text-white">
            What Makes Us Different
          </h2>
        </div>

        <div className="grid grid-cols-4 gap-5 max-[1024px]:grid-cols-2 max-[560px]:grid-cols-1">
          {differentiators.map((item, index) => (
            <div
              className={revealClass(index, "rounded-2xl bg-white p-7")}
              data-reveal
              key={item.title}
            >
              <DifferentiatorIcon name={item.icon} />
              <h3 className="mt-6 text-[19px] font-semibold leading-[1.3] tracking-[-0.01em] text-[#0f1b2d]">
                {item.title}
              </h3>
              <p className="mt-4 text-[13.5px] leading-[1.75] text-[var(--muted)]">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function TradeAnatomy() {
  return (
    <section className="border-t border-[var(--line)] bg-white px-10 py-24 max-[860px]:px-6 max-[860px]:py-16 max-[560px]:px-5 max-[560px]:py-14">
      <div className="mx-auto max-w-[1100px]">
        <div className={revealClass(0, "mb-14 text-center")} data-reveal>
          <SectionTag>Anatomy of a Trade</SectionTag>
          <h2 className="text-[clamp(24px,3vw,40px)] font-medium leading-[1.2] tracking-[-0.01em] text-[var(--ink)]">
            What You Get On Every Trade
          </h2>
        </div>

        <div className="grid grid-cols-2 gap-x-16 gap-y-10 max-[860px]:grid-cols-1 max-[860px]:gap-y-8">
          {tradeAnatomy.map((item, index) => (
            <div className={revealClass(index % 5, "flex gap-4")} data-reveal key={item.title}>
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--brand-light)]">
                <Icon className="h-[19px] w-[19px] text-[var(--brand)]" name={item.icon} />
              </div>
              <div>
                <h3 className="text-[15.5px] font-semibold leading-snug tracking-[-0.01em] text-[var(--ink)]">
                  {item.title}
                </h3>
                <p className="mt-1.5 text-[13.5px] leading-[1.7] text-[var(--muted)]">
                  {item.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function AssetClasses() {
  const classes = [
    {
      title: "Stocks",
      description: "Expert buy/sell recommendations",
      image: { src: "/Assets/asset1.png", width: 1024, height: 1024 },
    },
    {
      title: "Futures & Options",
      description: "For traders seeking naked and hedged opportunities",
      image: { src: "/Assets/asset2.png", width: 1024, height: 1024 },
    },
    {
      title: "Commodity",
      description: "Diversify with MCX-listed commodity recommendations",
      image: { src: "/Assets/asset11.png", width: 577, height: 433 },
    },
  ];

  return (
    <section className="border-t border-[var(--line)] bg-white px-10 py-24 max-[860px]:px-6 max-[860px]:py-16 max-[560px]:px-5 max-[560px]:py-14">
      <div className="mx-auto max-w-[1100px]">
        <div className={revealClass(0, "mb-14 text-center")} data-reveal>
          <SectionTag>SEBI-Registered Advisory</SectionTag>
          <h2 className="text-[clamp(24px,3vw,40px)] font-medium leading-[1.2] tracking-[-0.01em] text-[var(--ink)]">
            Every Asset Class
          </h2>
        </div>

        {/* Three columns on desktop; below 860px the cards become a horizontal
            snap slider instead of a tall stack. Cards are 80% wide so the next
            one peeks in as the affordance that the row scrolls, and the negative
            margin lets them bleed to the screen edge while `scroll-px-*` keeps
            snapped cards aligned with the section's padding. */}
        <div className="no-scrollbar grid grid-cols-3 gap-8 max-[860px]:-mx-6 max-[860px]:snap-x max-[860px]:snap-mandatory max-[860px]:auto-cols-[80%] max-[860px]:grid-flow-col max-[860px]:grid-cols-none max-[860px]:gap-4 max-[860px]:overflow-x-auto max-[860px]:overscroll-x-contain max-[860px]:scroll-px-6 max-[860px]:px-6 max-[560px]:-mx-5 max-[560px]:scroll-px-5 max-[560px]:px-5">
          {classes.map((item, index) => (
            <article
              className={revealClass(
                index,
                "flex aspect-square flex-col overflow-hidden rounded-2xl bg-[linear-gradient(140deg,#0b4cc0_0%,#1a6cf0_100%)] p-7 max-[860px]:aspect-auto max-[860px]:snap-start"
              )}
              data-reveal
              key={item.title}
            >
              <h3 className="text-[21px] font-bold leading-tight tracking-[-0.01em] text-white">
                {item.title}
              </h3>
              <p className="mt-2 max-w-[230px] text-[13.5px] leading-[1.55] text-white/85">
                {item.description}
              </p>

              {/* The 3D illustration fills the leftover height of the square card; on
                  mobile the card loses its aspect ratio, so the box gets a fixed height. */}
              <div className="mt-auto flex min-h-0 flex-1 items-end justify-center pt-5 max-[860px]:mt-8 max-[860px]:h-[190px] max-[860px]:flex-none">
                <Image
                  alt=""
                  className="h-full w-auto max-w-full object-contain"
                  height={item.image.height}
                  sizes="(max-width: 860px) 60vw, 300px"
                  src={item.image.src}
                  width={item.image.width}
                />
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function BuiltToBeTrusted() {
  const pillars: Array<{ icon: IconName; title: string; description: string }> = [
    {
      icon: "shieldCheck",
      title: "Verified & Compliant",
      description:
        "Every analyst's registration is verified against the SEBI registry before it goes live.",
    },
    {
      icon: "lock",
      title: "Secure & Regulated Payments",
      description:
        "All payments are processed through regulated and secure payment infrastructure.",
    },
  ];

  return (
    <section className="bg-[#f2f3f5] px-10 py-24 max-[860px]:px-6 max-[860px]:py-16 max-[560px]:px-5 max-[560px]:py-14">
      <div className="mx-auto max-w-[1100px]">
        <div className={revealClass(0, "mb-14 text-center")} data-reveal>
          <SectionTag>Trust and Security</SectionTag>
          <h2 className="text-[clamp(24px,3vw,40px)] font-medium leading-[1.2] tracking-[-0.01em] text-[var(--ink)]">
            Built To Be Trusted
          </h2>
        </div>

        <div className="grid grid-cols-[0.8fr_1.2fr] items-center gap-14 max-[860px]:grid-cols-1 max-[860px]:gap-10">
          <div className={revealClass(0, "flex flex-col gap-9")} data-reveal>
            {pillars.map((pillar) => (
              <div className="flex gap-4" key={pillar.title}>
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--brand-light)]">
                  <Icon className="h-[19px] w-[19px] text-[var(--brand)]" name={pillar.icon} />
                </div>
                <div>
                  <h3 className="text-[16px] font-semibold leading-snug tracking-[-0.01em] text-[var(--ink)]">
                    {pillar.title}
                  </h3>
                  <p className="mt-1.5 text-[13.5px] leading-[1.7] text-[var(--muted)]">
                    {pillar.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <Image
            alt=""
            className={revealClass(2, "h-auto w-full")}
            data-reveal
            height={1000}
            sizes="(max-width: 860px) 90vw, 620px"
            src="/Assets/asset4.png"
            width={1500}
          />
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    {
      title: "Step 1",
      description: "Create your Stoxify account in 2 minutes. No credit card required to start.",
    },
    {
      title: "Step 2",
      description:
        "Browse verified analysts. Compare track records. Subscribe to the ones that fit your trading style.",
    },
    {
      title: "Step 3",
      description:
        "Get instant alerts. Connect your broker. Execute with one tap and track your positions.",
    },
  ];

  return (
    <section className="border-t border-[var(--line)] bg-white px-10 py-24 max-[860px]:px-6 max-[860px]:py-16 max-[560px]:px-5 max-[560px]:py-14">
      <div className="mx-auto max-w-[1000px]">
        <div className={revealClass(0, "mb-14 text-center")} data-reveal>
          <SectionTag>How it works</SectionTag>
          <h2 className="text-[clamp(24px,3vw,40px)] font-medium leading-[1.2] tracking-[-0.01em] text-[var(--ink)]">
            Up And Running In Minutes
          </h2>
        </div>

        <ol className="grid grid-cols-3 max-[560px]:grid-cols-1 max-[560px]:gap-8">
          {steps.map((step, index) => (
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
                    index === steps.length - 1 ? "invisible" : ""
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
                {step.description}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function Faq() {
  return (
    <section className="border-t border-[var(--line)] bg-white px-10 pb-24 pt-16 max-[860px]:px-6 max-[860px]:pb-16 max-[560px]:px-5 max-[560px]:pb-14">
      <div className="mx-auto max-w-[860px]">
        <div className={revealClass(0, "mb-12 text-center")} data-reveal>
          <SectionTag>Got any questions?</SectionTag>
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

function FinalCta() {
  return (
    <section className="bg-[#f2f3f5] px-10 py-20 max-[860px]:px-6 max-[860px]:py-14 max-[560px]:px-5">
      <div className="mx-auto grid max-w-[1100px] grid-cols-[0.85fr_1.15fr] items-center gap-12 max-[860px]:grid-cols-1 max-[860px]:gap-8">
        <div className={revealClass(0)} data-reveal>
          <h2 className="text-[clamp(24px,2.6vw,34px)] font-semibold leading-[1.2] tracking-[-0.015em] text-[var(--ink)]">
            Start trading smarter today.
          </h2>
          <p className="mt-3 text-[15px] leading-[1.6] text-[var(--muted)]">
            Join 12,000+ traders already using Stoxify.
          </p>
          <Link
            className={`${buttonLarge} ${buttonPrimary} mt-7 rounded-md px-10 py-3.5 max-[560px]:w-full`}
            href="/signup"
          >
            Sign Up
          </Link>
        </div>

        <Image
          alt=""
          className={revealClass(2, "h-auto w-full")}
          data-reveal
          height={1000}
          sizes="(max-width: 860px) 90vw, 620px"
          src="/Assets/asset5.png"
          width={1501}
        />
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
                <svg aria-hidden className="h-[17px] w-[17px]" fill="currentColor" viewBox="0 0 24 24">
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

export default function Home() {
  return (
    <>
      <FAQSchema items={faqs} />
      <RevealObserver />
      <StoxifyNav />
      <main>
        <TickerBar />
        <Hero />
        <Problem />
        <WhyStoxify />
        <TradeAnatomy />
        <AssetClasses />
        <BuiltToBeTrusted />
        <HowItWorks />
        <Faq />
        <FinalCta />
      </main>
      <Footer />
    </>
  );
}
