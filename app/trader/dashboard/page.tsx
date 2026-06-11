import { readUserSessionFromCookies } from "@/lib/auth/server-session";
import { redirect } from "next/navigation";

import { TraderDashboard } from "@/components/trader/TraderDashboard";
import { DashboardOnboarding } from "@/components/dashboard-onboarding";

export const metadata = {
  title: "Dashboard — Stoxify",
};

export default async function TraderDashboardPage() {
  const session = await readUserSessionFromCookies();

  if (!session.authenticated) {
    redirect("/login?next=/trader/dashboard");
  }

  // If user hasn't completed KYC, show onboarding
  if (session.user.state !== "ACTIVE") {
    return <DashboardOnboarding user={session.user} />;
  }

  return <TraderDashboard user={session.user} />;
}
