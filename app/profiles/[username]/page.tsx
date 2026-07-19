import { notFound } from "next/navigation";
import { AnalystProfile, SubscriptionPlan } from "@/lib/types/analyst";
import Link from "next/link";
import { BadgeCheck, Globe, Box, Star, TrendingUp, Users, Target, Activity } from "lucide-react";
import { BatchListClient } from "@/components/public/BatchListClient";
import { ThemeToggle } from "@/components/public/ThemeToggle";
import { RAEvaluationDashboard } from "@/components/public/RAEvaluationDashboard";

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

  // Mock stats for the stats strip
  const stats = {
    accuracy: 78.5,
    avgReturn: 12.4,
    totalClosedTrades: 142,
    activeBatches: plans.length,
    subscriberCount: 850,
  };

  // Mock reviews
  const reviews = [
    {
      id: 1,
      rating: 5,
      text: "Excellent calls! The risk management is top notch and the analysis provided for each trade gives me a lot of confidence.",
      date: "2023-10-15",
    },
    {
      id: 2,
      rating: 4,
      text: "Very consistent performance. I've been a subscriber for 3 months and the returns have been stable. Sometimes entries are a bit fast.",
      date: "2023-11-02",
    },
    {
      id: 3,
      rating: 5,
      text: "Great transparent approach. All targets and stop losses are clearly mentioned and updated in real time.",
      date: "2023-11-20",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col transition-colors duration-300">
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 py-4 px-6 sticky top-0 z-40">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link
            href="/"
            className="font-bold text-xl text-slate-900 dark:text-white tracking-tight"
          >
            Stoxify
          </Link>
          <ThemeToggle />
        </div>
      </header>

      {/* Hero Section */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 pt-32 pb-12 transition-colors duration-300">
        <div className="max-w-5xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
            {/* Avatar */}
            <div className="h-32 w-32 rounded-full overflow-hidden border-4 border-white dark:border-slate-800 shadow-lg bg-slate-100 dark:bg-slate-800 flex-shrink-0 flex items-center justify-center text-4xl font-bold text-slate-400 dark:text-slate-500">
              {profile.profile_pic_url ? (
                <img
                  src={profile.profile_pic_url}
                  alt={profile.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                profile.name.charAt(0).toUpperCase()
              )}
            </div>

            {/* Profile Info */}
            <div className="flex-1 text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
                <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">
                  {profile.name}
                </h1>
                {profile.state === "ACTIVE" && (
                  <BadgeCheck className="h-6 w-6 text-[var(--brand)]" />
                )}
              </div>
              <p className="text-[15px] font-bold text-[var(--brand)] mb-4">
                SEBI Registered: {profile.sebi_license_number || "Application Pending"}
              </p>
              {profile.bio && (
                <p className="text-[15px] text-slate-600 dark:text-slate-400 max-w-2xl leading-relaxed mb-6">
                  {profile.bio}
                </p>
              )}

              {/* Socials & Contact */}
              <div className="flex items-center justify-center md:justify-start gap-4">
                {profile.twitter_url && (
                  <a
                    href={profile.twitter_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-slate-400 hover:text-[var(--brand)] dark:hover:text-[var(--brand)] transition-colors text-sm font-semibold"
                  >
                    X / Twitter
                  </a>
                )}
                {profile.linkedin_url && (
                  <a
                    href={profile.linkedin_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-slate-400 hover:text-[var(--brand)] dark:hover:text-[var(--brand)] transition-colors text-sm font-semibold"
                  >
                    LinkedIn
                  </a>
                )}
                {profile.website && (
                  <a
                    href={profile.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-slate-400 hover:text-[var(--brand)] dark:hover:text-[var(--brand)] transition-colors"
                  >
                    <Globe className="h-5 w-5" />
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Strip */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 py-6 transition-colors duration-300">
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 divide-x divide-slate-100 dark:divide-slate-800">
            <div className="flex flex-col items-center justify-center px-4">
              <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 mb-1">
                <Target size={14} />
                <span className="text-xs font-semibold uppercase tracking-wider">Accuracy</span>
              </div>
              <span className="text-2xl font-bold text-slate-900 dark:text-white">
                {stats.accuracy}%
              </span>
            </div>
            <div className="flex flex-col items-center justify-center px-4">
              <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 mb-1">
                <TrendingUp size={14} />
                <span className="text-xs font-semibold uppercase tracking-wider">Avg Return</span>
              </div>
              <span className="text-2xl font-bold text-green-500">+{stats.avgReturn}%</span>
            </div>
            <div className="flex flex-col items-center justify-center px-4">
              <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 mb-1">
                <Activity size={14} />
                <span className="text-xs font-semibold uppercase tracking-wider">
                  Closed Trades
                </span>
              </div>
              <span className="text-2xl font-bold text-slate-900 dark:text-white">
                {stats.totalClosedTrades}
              </span>
            </div>
            <div className="flex flex-col items-center justify-center px-4">
              <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 mb-1">
                <Box size={14} />
                <span className="text-xs font-semibold uppercase tracking-wider">Batches</span>
              </div>
              <span className="text-2xl font-bold text-slate-900 dark:text-white">
                {stats.activeBatches}
              </span>
            </div>
            <div className="flex flex-col items-center justify-center px-4">
              <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 mb-1">
                <Users size={14} />
                <span className="text-xs font-semibold uppercase tracking-wider">Subscribers</span>
              </div>
              <span className="text-2xl font-bold text-[var(--brand)]">
                {stats.subscriberCount}+
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Evaluation Dashboard Section */}
      <div className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 py-16 transition-colors duration-300">
        <div className="max-w-5xl mx-auto px-6 animate-reveal">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-8 text-center">
            Analyst Evaluation
          </h2>
          <RAEvaluationDashboard username={resolvedParams.username} />
        </div>
      </div>

      {/* Batches Section */}
      <div className="py-16">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-8 text-center">
            Available Batches
          </h2>

          {plans.length === 0 ? (
            <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 transition-colors duration-300">
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
      <div className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 py-16 transition-colors duration-300">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
              Subscriber Reviews
            </h2>
            <div className="flex items-center justify-center gap-1 text-[var(--brand)]">
              {[1, 2, 3, 4, 5].map((i) => (
                <Star
                  key={i}
                  size={20}
                  fill="currentColor"
                  className={i === 5 ? "text-slate-200 dark:text-slate-700" : ""}
                />
              ))}
              <span className="ml-2 text-slate-700 dark:text-slate-300 font-bold text-lg">4.8</span>
              <span className="ml-1 text-slate-500 dark:text-slate-400 text-sm">
                ({reviews.length} reviews)
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {reviews.map((review) => (
              <div
                key={review.id}
                className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-6 border border-slate-100 dark:border-slate-800"
              >
                <div className="flex items-center gap-1 text-[var(--brand)] mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      size={14}
                      fill={i < review.rating ? "currentColor" : "none"}
                      className={i >= review.rating ? "text-slate-300 dark:text-slate-600" : ""}
                    />
                  ))}
                </div>
                <p className="text-slate-700 dark:text-slate-300 text-[15px] italic leading-relaxed mb-6">
                  "{review.text}"
                </p>
                <div className="flex items-center justify-between text-xs font-semibold text-slate-400 dark:text-slate-500">
                  <span>Verified Subscriber</span>
                  <span>
                    {new Date(review.date).toLocaleDateString("en-US", {
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                </div>
              </div>
            ))}
          </div>
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
