"use client";

import { useEffect, useRef, useState } from "react";
import {
  Activity,
  BadgeCheck,
  Box,
  ChevronDown,
  Clock,
  Gauge,
  Globe,
  Layers,
  ShieldCheck,
  Star,
  Target,
  TrendingUp,
  Users,
} from "lucide-react";

export interface ProfileTag {
  label: string;
  kind: "segment" | "horizon" | "risk";
}

interface ProfileHeroProps {
  name: string;
  profilePicUrl?: string;
  bio?: string;
  sebiLicense?: string;
  registrationType?: string;
  isVerified: boolean;
  twitterUrl?: string;
  linkedinUrl?: string;
  website?: string;
  tags: ProfileTag[];
  stats: {
    accuracy: number;
    avgReturn: number;
    totalClosedTrades: number;
    activeBatches: number;
    subscriberCount: number;
  };
}

/** Chips are only meaningful when they say what kind of thing they describe. */
const TAG_ICON = {
  segment: Layers,
  horizon: Clock,
  risk: Gauge,
} as const;

const VISIBLE_TAGS = 4;

/**
 * Collapsed bios get a fade + "Read more", but only when there is something
 * hidden — measuring beats guessing from character count, because the clamp
 * height depends on the container width and the reader's font scale.
 */
function ExpandableBio({ bio }: { bio: string }) {
  const ref = useRef<HTMLParagraphElement>(null);
  const [expanded, setExpanded] = useState(false);
  const [overflows, setOverflows] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const measure = () => setOverflows(el.scrollHeight > el.clientHeight + 4);
    measure();

    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [bio, expanded]);

  return (
    <div className="mt-4">
      <div className="relative">
        <p
          ref={ref}
          id="analyst-bio"
          className={`text-[15px] leading-relaxed text-slate-600 dark:text-slate-400 ${
            expanded ? "" : "line-clamp-3"
          }`}
        >
          {bio}
        </p>
        {!expanded && overflows && (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-white dark:from-slate-900 to-transparent"
          />
        )}
      </div>

      {(overflows || expanded) && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
          aria-controls="analyst-bio"
          className="mt-1 inline-flex min-h-[44px] items-center gap-1 text-sm font-bold text-[var(--brand)] transition-opacity hover:opacity-80"
        >
          {expanded ? "Read less" : "Read more"}
          <ChevronDown
            className={`h-4 w-4 transition-transform ${expanded ? "rotate-180" : ""}`}
            aria-hidden="true"
          />
        </button>
      )}
    </div>
  );
}

function TagChips({ tags }: { tags: ProfileTag[] }) {
  const [showAll, setShowAll] = useState(false);
  const visible = showAll ? tags : tags.slice(0, VISIBLE_TAGS);
  const hidden = tags.length - visible.length;

  return (
    <div className="mt-5 flex flex-wrap items-center gap-2">
      {visible.map((tag) => {
        const Icon = TAG_ICON[tag.kind];
        return (
          <span
            key={`${tag.kind}-${tag.label}`}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-[13px] font-semibold text-slate-700 dark:border-slate-700/70 dark:bg-slate-800/60 dark:text-slate-200"
          >
            <Icon className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500" aria-hidden="true" />
            {tag.label}
          </span>
        );
      })}

      {hidden > 0 && !showAll && (
        <button
          type="button"
          onClick={() => setShowAll(true)}
          className="min-h-[44px] text-[13px] font-bold text-slate-600 underline underline-offset-4 transition-colors hover:text-[var(--brand)] dark:text-slate-400 dark:hover:text-[var(--brand)]"
        >
          +{hidden} more {hidden === 1 ? "strategy" : "strategies"}
        </button>
      )}
    </div>
  );
}

function SocialLink({
  href,
  label,
  children,
}: {
  href: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      title={label}
      className="flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition-colors hover:border-[var(--brand)] hover:text-[var(--brand)] dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-400 dark:hover:border-[var(--brand)]"
    >
      {children}
    </a>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
  tone = "default",
}: {
  icon: typeof Target;
  label: string;
  value: string;
  tone?: "default" | "positive" | "negative" | "brand";
}) {
  const valueTone =
    tone === "positive"
      ? "text-green-600 dark:text-green-400"
      : tone === "negative"
        ? "text-red-600 dark:text-red-400"
        : tone === "brand"
          ? "text-[var(--brand)]"
          : "text-slate-900 dark:text-white";

  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4 transition-colors hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700">
      <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
        <Icon size={14} aria-hidden="true" />
        <span className="text-[11px] font-bold uppercase tracking-wider">{label}</span>
      </div>
      <div className={`mt-1.5 text-2xl font-extrabold tracking-tight ${valueTone}`}>{value}</div>
    </div>
  );
}

export function ProfileHero({
  name,
  profilePicUrl,
  bio,
  sebiLicense,
  registrationType,
  isVerified,
  twitterUrl,
  linkedinUrl,
  website,
  tags,
  stats,
}: ProfileHeroProps) {
  const firstName = name.trim().split(/\s+/)[0];
  const hasSocials = Boolean(twitterUrl || linkedinUrl || website);
  const registrationLabel =
    registrationType === "investment_advisors" ? "Investment Adviser" : "Research Analyst";

  return (
    <section className="mx-auto max-w-5xl px-6 pt-10 pb-4 md:pt-14">
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        {/* Identity card */}
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
          <div
            aria-hidden="true"
            className="h-20 bg-gradient-to-r from-[var(--brand-light)] via-white to-[var(--brand-light)] dark:from-[var(--brand)]/20 dark:via-slate-900 dark:to-[var(--brand)]/10"
          />

          <div className="px-6 pb-6 sm:px-8 sm:pb-8">
            <div className="-mt-12 flex flex-col gap-5 sm:flex-row sm:items-end">
              <div className="relative flex-shrink-0">
                <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-2xl bg-slate-100 text-3xl font-extrabold text-slate-400 ring-4 ring-white dark:bg-slate-800 dark:text-slate-500 dark:ring-slate-900">
                  {profilePicUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={profilePicUrl}
                      alt={name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    name.charAt(0).toUpperCase()
                  )}
                </div>
                {isVerified && (
                  <span className="absolute -bottom-1.5 -right-1.5 rounded-full bg-white p-0.5 dark:bg-slate-900">
                    <BadgeCheck
                      className="h-6 w-6 text-[var(--brand)]"
                      aria-label="Verified analyst"
                    />
                  </span>
                )}
              </div>

              <div className="min-w-0 flex-1 sm:pb-1">
                <h1 className="truncate text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-[34px]">
                  {name}
                </h1>
                <p className="mt-1 text-sm font-medium text-slate-500 dark:text-slate-400">
                  SEBI Registered {registrationLabel}
                </p>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--brand-light)] px-3 py-1.5 text-[13px] font-bold text-[var(--brand-dark)] dark:bg-[var(--brand)]/15 dark:text-[#7db4ee]">
                <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
                SEBI Reg. No. {sebiLicense || "Application Pending"}
              </span>
              {stats.subscriberCount > 0 && (
                <span className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-[13px] font-semibold text-slate-600 dark:border-slate-700 dark:text-slate-300">
                  <Users className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
                  {stats.subscriberCount} subscriber{stats.subscriberCount === 1 ? "" : "s"}
                </span>
              )}
            </div>

            {bio && <ExpandableBio bio={bio} />}

            {tags.length > 0 && <TagChips tags={tags} />}

            {hasSocials && (
              <div className="mt-6 flex items-center gap-3 border-t border-slate-100 pt-5 dark:border-slate-800">
                <span className="text-[13px] font-semibold text-slate-400 dark:text-slate-500">
                  Connect
                </span>
                {twitterUrl && (
                  <SocialLink href={twitterUrl} label={`${name} on X (Twitter)`}>
                    <svg
                      viewBox="0 0 24 24"
                      className="h-4 w-4 fill-current"
                      aria-hidden="true"
                    >
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                    </svg>
                  </SocialLink>
                )}
                {linkedinUrl && (
                  <SocialLink href={linkedinUrl} label={`${name} on LinkedIn`}>
                    {/* lucide-react no longer ships brand marks, so this is inlined. */}
                    <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden="true">
                      <path d="M6.94 5a2 2 0 1 1-4-.002 2 2 0 0 1 4 .002zM7 8.48H3V21h4V8.48zm6.32 0H9.34V21h3.94v-6.57c0-3.66 4.77-4 4.77 0V21H22v-7.93c0-6.17-7.06-5.94-8.72-2.91l.04-1.68z" />
                    </svg>
                  </SocialLink>
                )}
                {website && (
                  <SocialLink href={website} label={`${name}'s website`}>
                    <Globe className="h-4 w-4" aria-hidden="true" />
                  </SocialLink>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Conversion rail */}
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">
              Subscribe to {firstName}
            </h2>
            <p className="mt-2 text-[13px] leading-relaxed text-slate-500 dark:text-slate-400">
              Get every entry, target and stop-loss the moment it goes live — on the app and on
              Telegram.
            </p>

            <a
              href="#batches"
              className="mt-5 flex min-h-[44px] w-full items-center justify-center rounded-xl bg-[var(--brand)] px-4 text-[15px] font-bold text-white transition-colors hover:bg-[var(--brand-dark)]"
            >
              {stats.activeBatches > 0 ? "See all batches" : "View subscription details"}
            </a>
            <a
              href="#reviews"
              className="mt-3 flex min-h-[44px] w-full items-center justify-center gap-1.5 rounded-xl border border-slate-200 px-4 text-[15px] font-bold text-slate-700 transition-colors hover:border-[var(--brand)] hover:text-[var(--brand)] dark:border-slate-700 dark:text-slate-200"
            >
              <Star className="h-4 w-4" aria-hidden="true" />
              Read reviews
            </a>

            <dl className="mt-6 space-y-3 border-t border-slate-100 pt-5 dark:border-slate-800">
              <div className="flex items-baseline justify-between gap-3">
                <dt className="text-[13px] font-medium text-slate-500 dark:text-slate-400">
                  Active batches
                </dt>
                <dd className="text-[15px] font-bold text-slate-900 dark:text-white">
                  {stats.activeBatches}
                </dd>
              </div>
              <div className="flex items-baseline justify-between gap-3">
                <dt className="text-[13px] font-medium text-slate-500 dark:text-slate-400">
                  Win rate
                </dt>
                <dd className="text-[15px] font-bold text-slate-900 dark:text-white">
                  {stats.accuracy}%
                </dd>
              </div>
              <div className="flex items-baseline justify-between gap-3">
                <dt className="text-[13px] font-medium text-slate-500 dark:text-slate-400">
                  Calls closed
                </dt>
                <dd className="text-[15px] font-bold text-slate-900 dark:text-white">
                  {stats.totalClosedTrades}
                </dd>
              </div>
            </dl>
          </div>
        </aside>
      </div>

      {/* Track record */}
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <Stat icon={Target} label="Accuracy" value={`${stats.accuracy}%`} />
        <Stat
          icon={TrendingUp}
          label="Avg Return"
          value={`${stats.avgReturn >= 0 ? "+" : ""}${stats.avgReturn}%`}
          tone={stats.avgReturn < 0 ? "negative" : "positive"}
        />
        <Stat icon={Activity} label="Closed Trades" value={`${stats.totalClosedTrades}`} />
        <Stat icon={Box} label="Batches" value={`${stats.activeBatches}`} />
        <Stat
          icon={Users}
          label="Subscribers"
          value={`${stats.subscriberCount}`}
          tone="brand"
        />
      </div>
    </section>
  );
}
