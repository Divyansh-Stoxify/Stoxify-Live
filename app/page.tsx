import Link from "next/link";

import { AnalystFilters } from "./components/analyst-filters";
import { Icon, type IconName } from "./components/stoxify-icon";
import { RevealObserver } from "./components/reveal-observer";
import { StoxifyNav } from "./components/stoxify-nav";

const buttonBase =
  "inline-flex items-center justify-center gap-2 rounded px-5 py-[9px] text-[13px] font-medium transition-all active:scale-[0.97]";
const buttonLarge =
  "inline-flex items-center justify-center gap-2 rounded px-[26px] py-3 text-[15px] font-medium transition-all active:scale-[0.97]";
const buttonPrimary =
  "bg-[var(--brand)] text-white hover:-translate-y-px hover:bg-[var(--brand-dark)] hover:shadow-[0_4px_16px_rgba(31,122,224,0.35)]";
const buttonGhost =
  "border border-[var(--line)] bg-transparent text-[var(--muted)] hover:border-[var(--muted-2)] hover:bg-[var(--line-2)] hover:text-[var(--ink)]";
const buttonOutline =
  "border border-[rgba(31,122,224,0.3)] bg-white text-[var(--brand)] hover:border-[var(--brand)] hover:bg-[var(--brand-light)]";

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
  { icon: "check", label: "SEBI-verified RAs only" },
  { icon: "zap", label: "Alerts in under 3 seconds" },
  { icon: "lock", label: "Timestamped proof" },
  { icon: "link", label: "One-click execution" },
];

const features: Array<{
  icon: IconName;
  iconWrap: string;
  iconColor: string;
  title: string;
  description: string;
  delay: number;
}> = [
  {
    icon: "zap",
    iconWrap: "bg-[var(--brand-light)]",
    iconColor: "text-[var(--brand)]",
    title: "Real-Time Trade Alerts",
    description:
      "The instant a Research Analyst hits publish, you get notified. Every idea includes entry price, target, stop-loss, segment, and rationale.",
    delay: 0,
  },
  {
    icon: "lock",
    iconWrap: "bg-[var(--green-light)]",
    iconColor: "text-[var(--green)]",
    title: "Timestamped & Verified Calls",
    description:
      "Every trade idea is cryptographically timestamped at the moment of publish. No one can backdate calls or claim performance that didn't happen.",
    delay: 2,
  },
  {
    icon: "target",
    iconWrap: "bg-[var(--orange-light)]",
    iconColor: "text-[var(--orange)]",
    title: "One-Click Broker Execution",
    description:
      "Connect Zerodha, Upstox, Angel One or 10+ other brokers. When an alert arrives, tap once - the order is pre-filled and ready.",
    delay: 3,
  },
  {
    icon: "listChecks",
    iconWrap: "bg-[rgba(139,92,246,0.08)]",
    iconColor: "text-[#6D28D9]",
    title: "Flexible Subscription Plans",
    description:
      "Each analyst sets their own pricing. Subscribe monthly or annually. Cancel anytime. Mix and match multiple analysts to suit your trading style.",
    delay: 4,
  },
];

const trustCards: Array<{
  icon: IconName;
  iconWrap: string;
  iconColor: string;
  dot: string;
  title: string;
  description: string;
  bullets: string[];
  delay: number;
}> = [
  {
    icon: "shieldCheck",
    iconWrap: "bg-[var(--brand-light)]",
    iconColor: "text-[var(--brand)]",
    dot: "bg-[var(--brand)]",
    title: "Verified SEBI-Registered Experts",
    description:
      "Every Research Analyst on Stoxify undergoes strict verification before going live:",
    bullets: [
      "Valid SEBI Registration Number",
      "Regulatory & Conflict of Interest Disclosures",
      "Registration validity & category confirmed",
      "Past research samples reviewed",
    ],
    delay: 0,
  },
  {
    icon: "fileBadge",
    iconWrap: "bg-[var(--brand-light)]",
    iconColor: "text-[var(--brand)]",
    dot: "bg-[var(--brand)]",
    title: "Transparent RA Profiles",
    description: "Every analyst has a verified public profile. Before subscribing, you can view:",
    bullets: [
      "Experience & research methodology",
      "Verified hit rate & historical performance",
      "Subscription fee structure",
      "Segment focus & trading style",
    ],
    delay: 2,
  },
  {
    icon: "store",
    iconWrap: "bg-[var(--green-light)]",
    iconColor: "text-[var(--green)]",
    dot: "bg-[var(--green)]",
    title: "Independent Marketplace",
    description:
      "Stoxify is a neutral marketplace. We do not provide tips, calls, or advice of our own.",
    bullets: [
      "Only SEBI-registered RAs publish research",
      "All ideas timestamped & sealed at publish",
      "No backdating or performance manipulation",
      "Full SEBI audit trail maintained always",
    ],
    delay: 3,
  },
  {
    icon: "creditCard",
    iconWrap: "bg-[var(--orange-light)]",
    iconColor: "text-[var(--orange)]",
    dot: "bg-[var(--orange)]",
    title: "Secure Payments",
    description:
      "Subscription fees go directly to the Research Analyst through a regulated payment channel.",
    bullets: [
      "No hidden charges or commissions",
      "Transparent 5% platform fee only",
      "GST-compliant invoices generated",
      "Cancel or pause subscriptions anytime",
    ],
    delay: 4,
  },
];

const analysts = [
  {
    initials: "AK",
    gradient: "linear-gradient(135deg,#3B82F6,#2D5BE3)",
    name: "Arjun Kapoor",
    sebi: "INH000012345",
    tags: ["Intraday", "F&O"],
    stats: [
      { label: "Hit Rate", value: "74%", highlight: true },
      { label: "Subscribers", value: "342" },
      { label: "Avg. R", value: "+31%", highlight: true },
    ],
    price: "\u20B9999",
    delay: 0,
  },
  {
    initials: "RS",
    gradient: "linear-gradient(135deg,#8B5CF6,#6D28D9)",
    name: "Riya Shah",
    sebi: "INH000023456",
    tags: ["Swing", "Positional"],
    stats: [
      { label: "Hit Rate", value: "68%", highlight: true },
      { label: "Subscribers", value: "218" },
      { label: "Avg. R", value: "+24%", highlight: true },
    ],
    price: "\u20B9799",
    delay: 1,
  },
  {
    initials: "PM",
    gradient: "linear-gradient(135deg,#F59E0B,#D97706)",
    name: "Pradeep Mehta",
    sebi: "INH000034567",
    tags: ["Equity", "Index"],
    stats: [
      { label: "Hit Rate", value: "71%", highlight: true },
      { label: "Subscribers", value: "189" },
      { label: "Avg. R", value: "+28%", highlight: true },
    ],
    price: "\u20B91,199",
    delay: 2,
  },
  {
    initials: "DV",
    gradient: "linear-gradient(135deg,#10B981,#059669)",
    name: "Deepa Verma",
    sebi: "INH000045678",
    tags: ["Intraday"],
    stats: [
      { label: "Hit Rate", value: "66%", highlight: true },
      { label: "Subscribers", value: "156" },
      { label: "Avg. R", value: "+19%", highlight: true },
    ],
    price: "\u20B9699",
    delay: 0,
  },
  {
    initials: "SK",
    gradient: "linear-gradient(135deg,#EF4444,#DC2626)",
    name: "Sanjay Kumar",
    sebi: "INH000056789",
    tags: ["F&O", "Index"],
    stats: [
      { label: "Hit Rate", value: "70%", highlight: true },
      { label: "Subscribers", value: "273" },
      { label: "Avg. R", value: "+36%", highlight: true },
    ],
    price: "\u20B91,499",
    delay: 1,
  },
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

function AlertCard({
  avatarClass,
  initials,
  name,
  time,
  type,
  symbol,
  cmp,
  entry,
  target,
  stopLoss,
  execute,
}: {
  avatarClass: string;
  initials: string;
  name: string;
  time: string;
  type: "BUY" | "SELL";
  symbol: string;
  cmp: string;
  entry: string;
  target: string;
  stopLoss: string;
  execute?: boolean;
}) {
  const buy = type === "BUY";

  return (
    <div
      className={[
        "relative overflow-hidden rounded-[14px] border-[1.5px] border-[var(--line)] p-4 before:absolute before:inset-y-0 before:left-0 before:w-1 before:content-['']",
        buy ? "before:bg-[var(--green)]" : "before:bg-[var(--red)]",
      ].join(" ")}
    >
      <div className="mb-3 flex items-start justify-between">
        <div className="flex items-center gap-2.5">
          <div
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] text-xs font-extrabold text-white ${avatarClass}`}
          >
            {initials}
          </div>
          <div>
            <div className="text-xs font-bold text-[var(--ink)]">{name}</div>
            <div className="mt-px text-[11px] text-[var(--muted-2)]">{time}</div>
          </div>
        </div>
        <span
          className={[
            "rounded-md px-2.5 py-[3px] text-[11px] font-extrabold tracking-[0.05em]",
            buy
              ? "bg-[var(--green-light)] text-[var(--green)]"
              : "bg-[var(--red-light)] text-[var(--red)]",
          ].join(" ")}
        >
          {type}
        </span>
      </div>

      <div className="flex items-end justify-between gap-3">
        <div>
          <div className="font-sans text-xl font-extrabold leading-none tracking-[-0.5px] text-[var(--ink)]">
            {symbol}
          </div>
          <div className="mt-0.5 text-[11px] text-[var(--muted-2)]">NSE · CMP {cmp}</div>
        </div>
        <div className="flex gap-3">
          <AlertParam label="Entry" value={entry} />
          <AlertParam highlight="green" label="Target" value={target} />
          <AlertParam highlight="red" label="SL" value={stopLoss} />
        </div>
      </div>

      {execute ? (
        <button
          className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[var(--brand)] p-2.5 text-[13px] font-bold text-white transition-colors hover:bg-[var(--brand-dark)]"
          type="button"
        >
          <Icon className="h-4 w-4" name="zap" />
          Execute via Zerodha
        </button>
      ) : null}
    </div>
  );
}

function AlertParam({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: "green" | "red";
}) {
  return (
    <div className="text-center">
      <div className="mb-0.5 text-[10px] text-[var(--muted-2)]">{label}</div>
      <div
        className={[
          "font-sans text-[13px] font-bold text-[var(--ink)]",
          highlight === "green" && "text-[var(--green)]",
          highlight === "red" && "text-[var(--red)]",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {value}
      </div>
    </div>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden bg-white px-10 pb-[100px] pt-[140px] max-[860px]:px-6 max-[860px]:pb-16 max-[860px]:pt-[100px]">
      <div className="absolute inset-0 z-0 bg-[radial-gradient(ellipse_70%_60%_at_60%_20%,rgba(45,91,227,0.06)_0%,transparent_70%)]" />
      <div className="relative z-[1] mx-auto grid max-w-[1200px] grid-cols-2 items-center gap-20 max-[860px]:grid-cols-1 max-[860px]:gap-10">
        <div>
          <div className="mb-5 inline-flex items-center rounded-full border border-[var(--brand-mid)] bg-[var(--brand-light)] px-3.5 py-[5px] text-xs font-bold uppercase tracking-[0.04em] text-[var(--brand)]">
            For Traders
          </div>
          <h1 className="mb-[18px] text-[clamp(32px,4vw,52px)] font-medium leading-[1.15] tracking-[-0.01em] text-[var(--ink)]">
            Get Real-Time Trading &amp; Investing Ideas
            <br />
            from <em className="not-italic text-[var(--brand)]">Verified Experts</em>
          </h1>
          <p className="mb-8 max-w-[480px] text-[clamp(15px,1.6vw,17px)] font-normal leading-[1.65] text-[var(--muted)]">
            Subscribe to SEBI-registered Research Analysts and receive real-time BUY/SELL ideas with
            entry, target &amp; stop-loss - the moment they&apos;re published.
          </p>
          <div className="mb-8 flex flex-wrap gap-2.5 max-[860px]:flex-col">
            <Link className={`${buttonLarge} ${buttonPrimary} max-[860px]:w-full`} href="#">
              Start Free - No Card Needed
              <Icon className="h-4 w-4" name="arrowRight" />
            </Link>
            <Link
              className={`${buttonLarge} ${buttonGhost} max-[860px]:w-full`}
              href="#marketplace"
            >
              Browse Analysts
            </Link>
          </div>
          <div className="flex flex-wrap gap-4 max-[560px]:flex-col max-[560px]:gap-2.5">
            {heroTrust.map((item) => (
              <div
                className="flex items-center gap-1.5 text-[13px] font-medium text-[var(--muted)]"
                key={item.label}
              >
                <Icon className="h-[15px] w-[15px] text-[var(--brand)]" name={item.icon} />
                {item.label}
              </div>
            ))}
          </div>
        </div>

        <div className="relative max-[860px]:hidden">
          <div className="absolute -right-6 -top-[18px] z-10 flex animate-[floatY_3s_ease-in-out_infinite] items-center gap-2.5 rounded-[14px] border-[1.5px] border-[var(--line)] bg-white px-4 py-3 shadow-[0_8px_24px_rgba(0,0,0,0.1)]">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-[var(--green-light)] text-[var(--green)]">
              <Icon className="h-[18px] w-[18px]" name="trendingUp" />
            </div>
            <div>
              <div className="text-[13px] font-bold text-[var(--ink)]">New BUY alert!</div>
              <div className="text-[11px] text-[var(--muted)]">RELIANCE · Arjun Kapoor RA</div>
            </div>
          </div>

          <div className="overflow-hidden rounded-3xl border-[1.5px] border-[var(--line)] bg-white shadow-[0_16px_48px_rgba(0,0,0,0.12)]">
            <div className="flex items-center justify-between border-b border-[var(--line)] bg-[var(--surface)] px-5 py-3.5">
              <div className="flex items-center gap-2 font-sans text-[15px] font-extrabold text-[var(--ink)]">
                <span className="h-[7px] w-[7px] rounded-full bg-[var(--brand)]" />
                Live Alerts
              </div>
              <div className="flex items-center gap-[5px] rounded-full border border-[rgba(5,150,105,0.2)] bg-[rgba(5,150,105,0.1)] px-2.5 py-[3px] text-[11px] font-bold text-[var(--green)]">
                <span className="h-[5px] w-[5px] animate-[blink_1.5s_infinite] rounded-full bg-[var(--green)]" />
                3 new
              </div>
            </div>
            <div className="flex flex-col gap-2.5 p-4">
              <AlertCard
                avatarClass="bg-[linear-gradient(135deg,#3B82F6,#2D5BE3)]"
                cmp={"\u20B92,847"}
                entry={"\u20B92,847"}
                execute
                initials="AK"
                name="Arjun Kapoor RA"
                stopLoss={"\u20B92,800"}
                symbol="RELIANCE"
                target={"\u20B92,940"}
                time="Just now · Intraday"
                type="BUY"
              />
              <AlertCard
                avatarClass="bg-[linear-gradient(135deg,#8B5CF6,#6D28D9)]"
                cmp={"\u20B91,655"}
                entry={"\u20B91,655"}
                initials="RS"
                name="Riya Shah RA"
                stopLoss={"\u20B91,685"}
                symbol="HDFC BANK"
                target={"\u20B91,590"}
                time="12 min ago · Swing"
                type="SELL"
              />
              <div className="py-2 text-center text-xs text-[var(--muted-2)]">
                5 more alerts today · Tap to see all
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Features() {
  return (
    <section className="border-t border-[var(--line)] bg-[var(--surface)] px-10 py-24 max-[860px]:px-6 max-[860px]:py-16 max-[560px]:px-5 max-[560px]:py-14">
      <div className="mx-auto max-w-[1100px]">
        <div className={revealClass(0, "mb-14 text-center")} data-reveal>
          <SectionTag>What you get</SectionTag>
          <h2 className="text-[clamp(24px,3vw,40px)] font-medium leading-[1.2] tracking-[-0.01em] text-[var(--ink)]">
            Everything a serious trader needs.
          </h2>
          <p className="mx-auto mt-3 max-w-[500px] text-[clamp(15px,1.6vw,17px)] leading-[1.65] text-[var(--muted)]">
            Stop chasing tips on Telegram. Get structured, verified, actionable ideas from
            registered professionals.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-4 max-[860px]:grid-cols-1">
          {features.map((feature) => (
            <div
              className={revealClass(
                feature.delay,
                "rounded-lg border border-[var(--line)] bg-white p-8 transition-all hover:-translate-y-1 hover:border-[var(--brand-mid)] hover:shadow-[0_12px_32px_rgba(0,0,0,0.09)]"
              )}
              data-reveal
              key={feature.title}
            >
              <div
                className={`mb-[18px] flex h-11 w-11 items-center justify-center rounded-lg ${feature.iconWrap}`}
              >
                <Icon className={`h-5 w-5 ${feature.iconColor}`} name={feature.icon} />
              </div>
              <h3 className="mb-2.5 text-[17px] font-semibold tracking-[-0.01em] text-[var(--ink)]">
                {feature.title}
              </h3>
              <p className="text-sm leading-[1.7] text-[var(--muted)]">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function TrustCards() {
  return (
    <section className="border-t border-[var(--line)] bg-white px-10 py-[88px] max-[860px]:px-6 max-[860px]:py-16 max-[560px]:px-5 max-[560px]:py-14">
      <div className="mx-auto max-w-[1100px]">
        <div className={revealClass(0, "mb-[52px] text-center")} data-reveal>
          <SectionTag>Why Stoxify</SectionTag>
          <h2 className="text-[clamp(24px,3vw,40px)] font-medium leading-[1.2] tracking-[-0.01em] text-[var(--ink)]">
            Built on trust, regulated by SEBI.
          </h2>
          <p className="mx-auto mt-3 max-w-[500px] text-[clamp(15px,1.6vw,17px)] leading-[1.65] text-[var(--muted)]">
            Every part of Stoxify is designed to protect traders and hold Research Analysts to the
            highest professional standard.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-4 max-[860px]:grid-cols-1">
          {trustCards.map((card) => (
            <div
              className={revealClass(
                card.delay,
                "rounded-lg border border-[var(--line)] bg-[var(--surface)] p-7"
              )}
              data-reveal
              key={card.title}
            >
              <div className="mb-[18px] flex items-center gap-3.5">
                <div
                  className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-[10px] ${card.iconWrap}`}
                >
                  <Icon className={`h-6 w-6 ${card.iconColor}`} name={card.icon} />
                </div>
                <h3 className="m-0 text-base font-semibold tracking-[-0.01em] text-[var(--ink)]">
                  {card.title}
                </h3>
              </div>
              <p className="mb-3.5 text-[13px] leading-[1.6] text-[var(--muted)]">
                {card.description}
              </p>
              <ul className="flex list-none flex-col gap-2">
                {card.bullets.map((bullet) => (
                  <li
                    className="flex items-center gap-2.5 text-[13px] text-[var(--muted)]"
                    key={bullet}
                  >
                    <span className={`block h-1.5 w-1.5 shrink-0 rounded-full ${card.dot}`} />
                    {bullet}
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

function Marketplace() {
  return (
    <section
      className="bg-white px-10 py-24 max-[860px]:px-6 max-[860px]:py-16 max-[560px]:px-5 max-[560px]:py-14"
      id="marketplace"
    >
      <div className="mx-auto max-w-[1200px]">
        <div className={revealClass()} data-reveal>
          <SectionTag>Analyst Marketplace</SectionTag>
          <h2 className="text-[clamp(24px,3vw,40px)] font-medium leading-[1.2] tracking-[-0.01em] text-[var(--ink)]">
            Find your Research Analyst.
          </h2>
          <p className="mt-2.5 text-[clamp(15px,1.6vw,17px)] leading-[1.65] text-[var(--muted)]">
            All listed analysts are SEBI-registered. Performance stats are verified, timestamped,
            and auditable.
          </p>
          <AnalystFilters />
        </div>

        <div className="mt-8 grid grid-cols-3 gap-4 max-[860px]:grid-cols-2 max-[560px]:grid-cols-1">
          {analysts.map((analyst) => (
            <article
              className={revealClass(
                analyst.delay,
                "cursor-pointer rounded-lg border-[1.5px] border-[var(--line)] bg-white p-6 transition-all hover:-translate-y-[3px] hover:border-[var(--brand-mid)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.1)]"
              )}
              data-reveal
              key={analyst.sebi}
            >
              <div className="mb-[18px] flex items-start gap-3.5">
                <div
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[14px] font-sans text-[17px] font-extrabold text-white"
                  style={{ background: analyst.gradient }}
                >
                  {analyst.initials}
                </div>
                <div>
                  <h3 className="mb-[3px] font-sans text-[15px] font-bold tracking-[-0.02em]">
                    {analyst.name}
                  </h3>
                  <div className="text-[11px] font-medium text-[var(--muted-2)]">
                    SEBI RA · {analyst.sebi}
                  </div>
                  <div className="mt-[5px] flex flex-wrap gap-[5px]">
                    {analyst.tags.map((tag, index) => (
                      <span
                        className={
                          index === 0
                            ? "inline-flex items-center rounded-full bg-[var(--brand-light)] px-3 py-1 text-xs font-semibold text-[var(--brand)]"
                            : "inline-flex items-center rounded-full bg-[var(--line-2)] px-3 py-1 text-xs font-semibold text-[var(--muted)]"
                        }
                        key={tag}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mb-4 grid grid-cols-3 gap-2">
                {analyst.stats.map((stat) => (
                  <div
                    className="rounded-lg bg-[var(--surface)] px-2 py-2.5 text-center"
                    key={stat.label}
                  >
                    <div
                      className={[
                        "font-sans text-lg font-extrabold tracking-[-0.5px] text-[var(--ink)]",
                        stat.highlight && "text-[var(--green)]",
                      ]
                        .filter(Boolean)
                        .join(" ")}
                    >
                      {stat.value}
                    </div>
                    <div className="mt-0.5 text-[10px] text-[var(--muted)]">{stat.label}</div>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between gap-3">
                <div>
                  <span className="font-sans text-base font-bold text-[var(--ink)]">
                    {analyst.price}
                  </span>{" "}
                  <span className="text-xs text-[var(--muted)]">/month</span>
                </div>
                <button
                  className="rounded-lg bg-[var(--brand)] px-[18px] py-2 text-[13px] font-bold text-white transition-colors hover:bg-[var(--brand-dark)]"
                  type="button"
                >
                  Subscribe
                </button>
              </div>
            </article>
          ))}

          <article
            className={revealClass(
              2,
              "flex min-h-60 cursor-default items-center justify-center rounded-lg border-2 border-dashed border-[var(--line)] bg-white p-6"
            )}
            data-reveal
          >
            <div className="text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--brand-light)] text-[var(--brand)]">
                <Icon className="h-6 w-6" name="search" />
              </div>
              <div className="mb-1.5 font-sans text-base font-bold">340+ analysts listed</div>
              <div className="mb-4 text-[13px] text-[var(--muted)]">
                Filter by style, returns &amp; more
              </div>
              <Link className={`${buttonBase} ${buttonOutline} px-4 py-[7px]`} href="#">
                Browse All
                <Icon className="h-3.5 w-3.5" name="arrowRight" />
              </Link>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    {
      title: "Sign Up Free",
      body: "Create your Stoxify account in 2 minutes. No credit card required to start.",
      delay: 0,
    },
    {
      title: "Pick Your RAs",
      body: "Browse verified analysts. Compare track records. Subscribe to the ones that fit your trading style.",
      delay: 2,
    },
    {
      title: "Trade in Real Time",
      body: "Get instant alerts. Connect your broker. Execute with one tap and track your positions.",
      delay: 4,
    },
  ];

  return (
    <section className="border-t border-[var(--line)] bg-[var(--surface)] px-10 py-24 max-[860px]:px-6 max-[860px]:py-16 max-[560px]:px-5 max-[560px]:py-14">
      <div className="mx-auto max-w-[900px] text-center">
        <div className={revealClass()} data-reveal>
          <SectionTag>How It Works</SectionTag>
          <h2 className="text-[clamp(24px,3vw,40px)] font-medium leading-[1.2] tracking-[-0.01em] text-[var(--ink)]">
            Up and running in minutes.
          </h2>
          <p className="mx-auto mt-3 max-w-[480px] text-[clamp(15px,1.6vw,17px)] leading-[1.65] text-[var(--muted)]">
            No complex setup. No manual tracking. Just subscribe, get alerted, and trade.
          </p>
        </div>

        <div className="relative mt-12 grid grid-cols-3 gap-3 before:absolute before:left-[calc(16.67%+10px)] before:right-[calc(16.67%+10px)] before:top-9 before:h-0.5 before:bg-[var(--brand-mid)] before:content-[''] max-[860px]:grid-cols-1 max-[860px]:before:hidden">
          {steps.map((step, index) => (
            <div
              className={revealClass(
                step.delay,
                "relative z-[1] rounded-lg border-[1.5px] border-[var(--line)] bg-white px-5 py-7 transition-all hover:-translate-y-1 hover:border-[var(--brand-mid)] hover:shadow-[0_12px_32px_rgba(0,0,0,0.09)]"
              )}
              data-reveal
              key={step.title}
            >
              <div className="mx-auto mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-[var(--brand)] font-sans text-[17px] font-extrabold text-white">
                {index + 1}
              </div>
              <h3 className="mb-2 text-base font-bold tracking-[-0.02em]">{step.title}</h3>
              <p className="text-[13px] leading-[1.6] text-[var(--muted)]">{step.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FinalCta() {
  return (
    <section className="bg-[linear-gradient(135deg,#1a3ab8_0%,#2D5BE3_50%,#3d6ef5_100%)] px-10 py-24 text-center max-[860px]:px-6 max-[860px]:py-16 max-[560px]:px-5 max-[560px]:py-14">
      <h2
        className={revealClass(
          0,
          "mb-3.5 text-[clamp(24px,3vw,40px)] font-medium leading-[1.2] tracking-[-0.01em] text-white"
        )}
        data-reveal
      >
        Start trading smarter today.
      </h2>
      <p className={revealClass(2, "mb-9 text-lg text-white/65")} data-reveal>
        Join 12,000+ traders already using Stoxify.
      </p>
      <div className={revealClass(3)} data-reveal>
        <Link
          className="inline-flex items-center justify-center gap-2 rounded bg-white px-8 py-3.5 text-[15px] font-bold text-[var(--brand)] transition-all hover:-translate-y-0.5 hover:bg-white/90 hover:shadow-[0_12px_32px_rgba(0,0,0,0.2)]"
          href="#"
        >
          Create Free Account
          <Icon className="h-4 w-4" name="arrowRight" />
        </Link>
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
              India&apos;s first real-time trade idea marketplace - SEBI-registered Research
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

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.08] pt-6 max-[860px]:flex-col max-[860px]:items-start max-[860px]:gap-2">
          <div className="text-[13px] text-white/30">
            &copy; 2026 Stoxify Technologies Pvt. Ltd.
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
      <h3 className="mb-4 text-xs font-bold uppercase tracking-[0.1em] text-white/40">{title}</h3>
      <ul className="flex list-none flex-col gap-[9px]">
        {links.map((link) => (
          <li key={link}>
            <Link className="text-sm text-white/55 transition-colors hover:text-white" href="#">
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
      <RevealObserver />
      <StoxifyNav />
      <main>
        <TickerBar />
        <Hero />
        <Features />
        <TrustCards />
        <Marketplace />
        <HowItWorks />
        <FinalCta />
      </main>
      <Footer />
    </>
  );
}
