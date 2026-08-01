import { notFound } from "next/navigation";
import { AnalystProfile, SubscriptionPlan } from "@/lib/types/analyst";
import Link from "next/link";
import { Box } from "lucide-react";
import { BatchListClient } from "@/components/public/BatchListClient";
import { ThemeToggle } from "@/components/public/ThemeToggle";
import { OpenInAppBanner } from "@/components/public/OpenInAppBanner";
import { ProfileHero, ProfileTag } from "@/components/public/ProfileHero";
import { ReviewsSection } from "@/components/public/ReviewsSection";

interface PageProps {
  params: Promise<{
    username: string;
  }>;
}

import { backendUrls, signedBackendFetch } from "@/lib/backend/index";

async function getAnalystProfile(username: string): Promise<AnalystProfile | null> {
  try {
    const res = await signedBackendFetch({
      baseUrl: backendUrls.user,
      path: `/users/public/analysts/${username}`,
      method: "GET",
      deviceId: "public-ssr",
    });
    if (!res.ok) return null;
    return res.json();
  } catch (err) {
    console.error("Failed to fetch profile in SSR:", err);
    return null;
  }
}

async function getAnalystPlans(analystId: string): Promise<{ plans: SubscriptionPlan[] } | null> {
  try {
    const res = await signedBackendFetch({
      baseUrl: backendUrls.plan,
      path: `/plans/public/analysts/${analystId}`,
      method: "GET",
      deviceId: "public-ssr",
    });
    if (!res.ok) return null;
    return res.json();
  } catch (err) {
    console.error("Failed to fetch plans in SSR:", err);
    return null;
  }
}

/** "LONG TERM" / "FNO" read as database values; the page should read as English. */
function titleCase(value: string): string {
  if (value.toUpperCase() === "FNO") return "F&O";
  return value
    .toLowerCase()
    .split(/[\s_]+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/**
 * The analyst's batches are the only place segments, horizons and risk appetite
 * are recorded, so the profile's strategy chips are the union across them.
 */
function deriveTags(plans: SubscriptionPlan[]): ProfileTag[] {
  const seen = new Set<string>();
  const tags: ProfileTag[] = [];

  const push = (kind: ProfileTag["kind"], raw?: string) => {
    if (!raw) return;
    const label = kind === "risk" ? `${titleCase(raw)} risk` : titleCase(raw);
    const key = `${kind}:${label.toLowerCase()}`;
    if (seen.has(key)) return;
    seen.add(key);
    tags.push({ kind, label });
  };

  for (const plan of plans) plan.segments?.forEach((segment) => push("segment", segment));
  for (const plan of plans) plan.horizons?.forEach((horizon) => push("horizon", horizon));
  for (const plan of plans) push("risk", plan.risk_level);

  return tags;
}

export default async function AnalystLandingPage({ params }: PageProps) {
  const resolvedParams = await params;
  const profile = await getAnalystProfile(resolvedParams.username);

  if (!profile) {
    notFound();
  }

  const plansData =
    profile.state === "ACTIVE" && (profile as any).user_id
      ? await getAnalystPlans((profile as any).user_id)
      : { plans: [] };
  const plans = plansData?.plans || [];

  const perf = (profile as any)?.performance;
  const subscriberCount = perf?.total_subscribers ?? 0;

  const stats = {
    accuracy:
      perf && perf.total_trades > 0
        ? Math.round((perf.winning_trades / perf.total_trades) * 1000) / 10
        : 0,
    avgReturn: perf?.avg_return || 0,
    totalClosedTrades: perf?.total_trades || 0,
    activeBatches: plans.length,
    subscriberCount,
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col transition-colors duration-300">
      <header className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-lg border-b border-slate-200/60 dark:border-slate-800/60 py-4 px-6 sticky top-0 z-40">
        <div className="max-w-5xl mx-auto grid grid-cols-3 items-center">
          <div />
          <Link
            href="/"
            className="font-bold text-xl text-slate-900 dark:text-white tracking-tight justify-self-center"
          >
            Stoxify
          </Link>
          <div className="justify-self-end">
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Mobile-only hand-off to the app. Renders nothing on desktop, and is
          only load-bearing inside in-app browsers (Telegram) where App Links /
          Universal Links never fire. */}
      <OpenInAppBanner username={resolvedParams.username} />

      <ProfileHero
        name={profile.name}
        profilePicUrl={profile.profile_pic_url}
        bio={profile.bio}
        sebiLicense={profile.sebi_license_number || profile.sebi_registration_number}
        registrationType={profile.registration_type}
        isVerified={profile.state === "ACTIVE"}
        twitterUrl={profile.twitter_url}
        linkedinUrl={profile.linkedin_url}
        website={profile.website}
        tags={deriveTags(plans)}
        stats={stats}
      />

      {/* Batches Section */}
      <div id="batches" className="py-16 scroll-mt-24">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-8 text-center">
            Available Batches
          </h2>

          {plans.length === 0 ? (
            <div className="text-center py-12 bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl rounded-2xl border border-slate-200 dark:border-slate-800 transition-colors duration-300">
              <Box className="h-12 w-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
              <p className="text-slate-500 dark:text-slate-400 font-medium">
                No active batches available at the moment.
              </p>
            </div>
          ) : (
            <BatchListClient plans={plans} />
          )}
        </div>
      </div>

      {/* Reviews Section */}
      <div
        id="reviews"
        className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 py-16 scroll-mt-24 transition-colors duration-300"
      >
        <div className="max-w-5xl mx-auto px-6">
          <ReviewsSection
            analystId={profile.user_id as string}
            analystName={profile.name}
          />
        </div>
      </div>

      {/* Simple Footer */}
      <footer className="bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 py-8 text-center text-[13px] text-slate-500 dark:text-slate-400 font-medium transition-colors duration-300">
        <p className="mb-2">Registration Type: Research Analyst</p>
        <p className="mb-4 text-xs max-w-3xl mx-auto px-6">
          Investment in securities market are subject to market risks. Read all the related
          documents carefully before investing. Registration granted by SEBI, membership of BASL (in
          case of IAs) and certification from NISM in no way guarantee performance of the
          intermediary or provide any assurance of returns to investors.
        </p>
        Powered by <span className="font-bold text-[var(--brand)]">Stoxify</span>
      </footer>
    </div>
  );
}
