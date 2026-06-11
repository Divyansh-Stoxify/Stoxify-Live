import { readUserSessionFromCookies } from "@/lib/auth/server-session";
import { redirect } from "next/navigation";

import { TraderProfile } from "@/components/trader/TraderProfile";

export const metadata = {
  title: "Profile — Stoxify",
};

export default async function ProfilePage() {
  const session = await readUserSessionFromCookies();

  if (!session.authenticated) {
    redirect("/login?next=/trader/profile");
  }

  return <TraderProfile user={session.user} />;
}
