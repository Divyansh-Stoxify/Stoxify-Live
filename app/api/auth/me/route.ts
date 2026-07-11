import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

import { userCookieNames } from "@/lib/auth/cookies";
import {
  buildUserSessionFromToken,
  readUserSessionFromCookies,
  refreshUserTokens,
  writeUserTokenCookies,
} from "@/lib/auth/server-session";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const session = await readUserSessionFromCookies();

  if (session.authenticated) {
    return NextResponse.json({ ok: true, user: session.user });
  }

  // The access-token cookie is short-lived (1h). When it has expired but a
  // valid refresh token is still present, silently mint a new access token so
  // idle users aren't spuriously logged out. Mirrors /api/auth/refresh-redirect.
  const refreshed = await refreshUserTokens(request);
  if (!refreshed) {
    return NextResponse.json({ error: "Not authenticated", code: "NO_SESSION" }, { status: 401 });
  }

  const store = await cookies();
  const refreshedSession = buildUserSessionFromToken(
    refreshed.access_token,
    store.get(userCookieNames.userInfo)?.value
  );
  if (!refreshedSession.authenticated) {
    return NextResponse.json({ error: "Not authenticated", code: "NO_SESSION" }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true, user: refreshedSession.user });
  writeUserTokenCookies(response, {
    access_token: refreshed.access_token,
    refresh_token: refreshed.refresh_token,
    device_id: refreshed.deviceId,
  });
  return response;
}
