import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";

import { userCookieNames } from "@/lib/auth/cookies";
import { readUserSessionFromCookies } from "@/lib/auth/server-session";
import { LogoutButton } from "@/components/logout-button";
import { Icon } from "@/components/stoxify-icon";

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function stateLabel(state: string) {
  switch (state) {
    case "ACTIVE":
      return { text: "Active", color: "bg-[var(--green-light)] text-[var(--green)]" };
    case "KYC_PENDING":
      return { text: "KYC Pending", color: "bg-amber-50 text-amber-700" };
    case "UNVERIFIED":
      return { text: "Unverified", color: "bg-[var(--line-2)] text-[var(--muted)]" };
    default:
      return { text: state, color: "bg-[var(--line-2)] text-[var(--muted)]" };
  }
}

export default async function DashboardPage() {
  const session = await readUserSessionFromCookies();
  if (!session.authenticated) {
    const cookieStore = await cookies();
    const refreshToken = cookieStore.get(userCookieNames.refreshToken)?.value;
    const deviceId = cookieStore.get(userCookieNames.deviceId)?.value;

    if (refreshToken && deviceId) {
      redirect(`/api/auth/refresh-redirect?next=${encodeURIComponent("/dashboard")}`);
    }
    redirect("/login");
  }

  const { user } = session;
  if (user.state === "UNVERIFIED" && user.email) {
    redirect(`/verify-email?email=${encodeURIComponent(user.email)}`);
  }

  const initials = getInitials(user.name || user.email);
  const status = stateLabel(user.state);

  return (
    <div className="min-h-screen bg-[var(--surface)]">
      {/* Top nav */}
      <header className="fixed inset-x-0 top-0 z-50 h-[62px] border-b border-[var(--line)] bg-white/90 backdrop-blur-xl flex items-center px-6">
        <Link
          href="/"
          className="font-sans text-[20px] font-extrabold tracking-[-0.5px] text-[var(--ink)]"
        >
          Stoxify
        </Link>
        <div className="ml-auto flex items-center gap-3">
          <span className="text-[13px] text-[var(--muted)] max-[560px]:hidden">{user.email}</span>
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--brand)] text-[11px] font-extrabold text-white select-none">
            {initials}
          </div>
          <LogoutButton className="rounded-md border border-[var(--line)] px-3 py-1.5 text-[12px] font-semibold text-[var(--muted)] hover:border-[var(--muted-2)] hover:text-[var(--ink)] transition-colors">
            Sign out
          </LogoutButton>
        </div>
      </header>

      <main className="pt-[62px]">
        <div className="mx-auto max-w-[900px] px-6 py-12">
          {/* Profile card */}
          <div className="mb-8 rounded-2xl border border-[var(--line)] bg-white p-8 flex items-start gap-6 max-[560px]:flex-col max-[560px]:items-center max-[560px]:text-center">
            {/* Avatar */}
            <div
              className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl text-2xl font-extrabold text-white select-none"
              style={{ background: "linear-gradient(135deg, #3B82F6, #2D5BE3)" }}
            >
              {initials}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 flex-wrap max-[560px]:justify-center">
                <h1 className="text-[22px] font-bold tracking-[-0.5px] text-[var(--ink)] truncate">
                  {user.name || "Trader"}
                </h1>
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-[3px] text-[11px] font-bold ${status.color}`}
                >
                  {status.text}
                </span>
              </div>

              <p className="mt-1 text-[13px] text-[var(--muted)]">{user.email}</p>
              <p className="mt-0.5 text-[11px] font-mono text-[var(--muted-2)]">{user.user_id}</p>

              <div className="mt-4 flex flex-wrap gap-2 max-[560px]:justify-center">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--line)] px-3 py-1 text-[12px] text-[var(--muted)]">
                  <Icon name="shieldCheck" className="h-3.5 w-3.5 text-[var(--brand)]" />
                  Trader Account
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--line)] px-3 py-1 text-[12px] text-[var(--muted)]">
                  <Icon name="lock" className="h-3.5 w-3.5 text-[var(--green)]" />
                  Session active
                </span>
              </div>
            </div>
          </div>

          {/* Placeholder panels */}
          <div className="grid grid-cols-2 gap-4 mb-6 max-[620px]:grid-cols-1">
            <div className="rounded-xl border border-[var(--line)] bg-white p-6">
              <div className="mb-3 flex items-center gap-2 text-[13px] font-bold text-[var(--ink)]">
                <Icon name="zap" className="h-4 w-4 text-[var(--brand)]" />
                Live Alerts
              </div>
              <p className="text-[13px] text-[var(--muted)] leading-relaxed">
                Subscribe to a SEBI-registered Research Analyst to start receiving real-time trade
                ideas here.
              </p>
              <Link
                href="/#marketplace"
                className="mt-4 inline-flex items-center gap-1.5 text-[12px] font-bold text-[var(--brand)] hover:underline"
              >
                Browse analysts
                <Icon name="arrowRight" className="h-3 w-3" />
              </Link>
            </div>

            <div className="rounded-xl border border-[var(--line)] bg-white p-6">
              <div className="mb-3 flex items-center gap-2 text-[13px] font-bold text-[var(--ink)]">
                <Icon name="listChecks" className="h-4 w-4 text-[var(--brand)]" />
                My Subscriptions
              </div>
              <p className="text-[13px] text-[var(--muted)] leading-relaxed">
                No active subscriptions yet. Pick an analyst and start your free trial.
              </p>
              <Link
                href="/#marketplace"
                className="mt-4 inline-flex items-center gap-1.5 text-[12px] font-bold text-[var(--brand)] hover:underline"
              >
                Explore plans
                <Icon name="arrowRight" className="h-3 w-3" />
              </Link>
            </div>
          </div>

          {/* Account info table */}
          <div className="rounded-xl border border-[var(--line)] bg-white overflow-hidden">
            <div className="px-6 py-4 border-b border-[var(--line)]">
              <h2 className="text-[13px] font-bold text-[var(--ink)]">Account Details</h2>
            </div>
            <dl className="divide-y divide-[var(--line)]">
              {[
                { label: "Full name", value: user.name || "—" },
                { label: "Email address", value: user.email },
                { label: "Account ID", value: user.user_id },
                { label: "Account state", value: status.text },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-center justify-between px-6 py-3.5 gap-4">
                  <dt className="text-[12px] font-semibold text-[var(--muted)] shrink-0">
                    {label}
                  </dt>
                  <dd className="text-[13px] text-[var(--ink)] font-mono text-right truncate">
                    {value}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </main>
    </div>
  );
}
