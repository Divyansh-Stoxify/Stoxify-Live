import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { adminCookieNames } from "@/lib/admin/cookies";
import {
  clearAdminCookies,
  readAdminSession,
  refreshAdminCookies,
  writeAdminTokenCookies,
} from "@/lib/admin/server-session";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const cookieStore = await cookies();
  let accessToken = cookieStore.get(adminCookieNames.accessToken)?.value;
  const deviceId = cookieStore.get(adminCookieNames.deviceId)?.value;

  if (!deviceId) return NextResponse.json({ authenticated: false }, { status: 401 });

  let refreshed: Awaited<ReturnType<typeof refreshAdminCookies>> = null;
  if (!accessToken) {
    refreshed = await refreshAdminCookies(request).catch(() => null);
    accessToken = refreshed?.access_token;
  }

  if (!accessToken) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  let session = await readAdminSession({ accessToken, deviceId }).catch(() => null);
  if ((!session || !session.authenticated) && !refreshed) {
    refreshed = await refreshAdminCookies(request).catch(() => null);
    if (refreshed?.access_token) {
      accessToken = refreshed.access_token;
      session = await readAdminSession({ accessToken, deviceId }).catch(() => null);
    }
  }

  if (!session) {
    return NextResponse.json(
      { authenticated: false, error: "Unable to verify admin session" },
      { status: 503 }
    );
  }

  if (!session.authenticated) {
    const response = NextResponse.json(session, { status: 401 });
    return clearAdminCookies(response);
  }

  const response = NextResponse.json(session);
  if (refreshed) {
    writeAdminTokenCookies(response, {
      access_token: refreshed.access_token,
      refresh_token: refreshed.refresh_token,
      device_id: deviceId,
    });
  }
  return response;
}
