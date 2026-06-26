import { notFound } from "next/navigation";
import { AnalystProfile, SubscriptionPlan } from "@/lib/types/analyst";
import Link from "next/link";
import { BadgeCheck, Globe, Box } from "lucide-react";

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

  const plansData = profile.state === 'ACTIVE' && (profile as any).user_id ? await getAnalystPlans((profile as any).user_id) : { plans: [] };
  const plans = plansData?.plans || [];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-white border-b py-4 px-6">
        <div className="max-w-5xl mx-auto flex items-center">
          <Link href="/" className="font-bold text-xl text-slate-900 tracking-tight">Stoxify</Link>
        </div>
      </header>
      
      {/* Hero Section */}
      <div className="bg-white border-b border-slate-200 pt-32 pb-12">
        <div className="max-w-5xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
            {/* Avatar */}
            <div className="h-32 w-32 rounded-full overflow-hidden border-4 border-white shadow-lg bg-slate-100 flex-shrink-0 flex items-center justify-center text-4xl font-bold text-slate-400">
              {profile.profile_pic_url ? (
                <img src={profile.profile_pic_url} alt={profile.name} className="h-full w-full object-cover" />
              ) : (
                profile.name.charAt(0).toUpperCase()
              )}
            </div>

            {/* Profile Info */}
            <div className="flex-1 text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
                <h1 className="text-3xl font-extrabold text-slate-900">{profile.name}</h1>
                {profile.state === 'ACTIVE' && (
                  <BadgeCheck className="h-6 w-6 text-blue-500" />
                )}
              </div>
              <p className="text-[15px] font-bold text-[var(--brand)] mb-4">
                SEBI Registered: {profile.sebi_license_number || "Application Pending"}
              </p>
              {plans.length > 0 && (
                <div className="flex items-center gap-2 mb-4">
                  <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-1 rounded-md">
                    {plans.length} Active {plans.length === 1 ? 'Plan' : 'Plans'}
                  </span>
                </div>
              )}
              {profile.bio && (
                <p className="text-[15px] text-slate-600 max-w-2xl leading-relaxed mb-6">
                  {profile.bio}
                </p>
              )}
              
              {/* Socials & Contact */}
              <div className="flex items-center justify-center md:justify-start gap-4">
                {profile.twitter_url && (
                  <a href={profile.twitter_url} target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-slate-600 transition-colors text-sm font-semibold">
                    X / Twitter
                  </a>
                )}
                {profile.linkedin_url && (
                  <a href={profile.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-slate-600 transition-colors text-sm font-semibold">
                    LinkedIn
                  </a>
                )}
                {profile.website && (
                  <a href={profile.website} target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-slate-600 transition-colors">
                    <Globe className="h-5 w-5" />
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Batches Section */}
      <div className="flex-1 py-16">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-2xl font-bold text-slate-900 mb-8 text-center">Available Subscription Plans</h2>
          
          {plans.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
              <Box className="h-12 w-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500 font-medium">No active plans available at the moment.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {plans.map(plan => (
                <div key={plan.plan_id} className="bg-white rounded-xl border border-slate-200 p-6 flex flex-col h-full hover:shadow-lg transition-shadow">
                  <div className="mb-4">
                    <h3 className="text-xl font-bold text-slate-900">{plan.name}</h3>
                    {plan.description && (
                      <p className="text-[13px] text-slate-500 mt-2 line-clamp-2">{plan.description}</p>
                    )}
                  </div>
                  
                  <div className="mt-auto pt-6 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <span className="text-2xl font-bold text-slate-900">₹{plan.price}</span>
                      {plan.batches?.[0]?.billing_cycle && (
                        <span className="text-[12px] text-slate-500 font-medium ml-1">
                          / {plan.batches[0].billing_cycle.toLowerCase()}
                        </span>
                      )}
                    </div>
                    <Link
                      href={`/checkout/${plan.plan_id}`}
                      className="px-4 py-2 bg-[var(--brand)] text-white text-[13px] font-bold rounded-lg hover:bg-[var(--brand-dark)] transition-colors"
                    >
                      Subscribe
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Simple Footer */}
      <footer className="bg-white border-t border-slate-200 py-8 text-center text-[13px] text-slate-500 font-medium">
        Powered by <span className="font-bold text-[var(--brand)]">Stoxify</span>
      </footer>
    </div>
  );
}
