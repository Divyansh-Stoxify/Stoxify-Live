import { NextResponse } from "next/server";

import { readUserSessionFromCookies } from "@/lib/auth/server-session";

export async function GET(): Promise<NextResponse> {
  const session = await readUserSessionFromCookies();

  if (!session.authenticated) {
    return NextResponse.json({ error: "Not authenticated", code: "NO_SESSION" }, { status: 401 });
  }

  return NextResponse.json({ ok: true, user: session.user });
}
