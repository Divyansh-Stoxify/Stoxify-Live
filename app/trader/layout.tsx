import { redirect } from "next/navigation";

import { readUserSessionFromCookies } from "@/lib/auth/server-session";
import { TraderShell } from "@/components/trader/TraderShell";

export const metadata = {
  title: "Dashboard — Stoxify",
  description:
    "Your trading dashboard — live trades, subscriptions, and alerts from SEBI-registered analysts.",
};

export default async function TraderLayout({ children }: { children: React.ReactNode }) {
  const session = await readUserSessionFromCookies();

  if (!session.authenticated) {
    redirect("/");
  }

  if (session.user.user_type === "ANALYST") {
    redirect("/dashboard");
  }

  return <TraderShell user={session.user}>{children}</TraderShell>;
}
