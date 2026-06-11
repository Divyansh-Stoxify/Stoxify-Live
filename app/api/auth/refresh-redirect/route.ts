import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

import { backendUrls, forwardedIpHeaders, signedBackendFetch } from "@/lib/backend/index";
import { userCookieNames } from "@/lib/auth/cookies";
import { clearUserCookies, writeUserTokenCookies } from "@/lib/auth/server-session";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const store = await cookies();
  const refreshToken = store.get(userCookieNames.refreshToken)?.value;
  const deviceId = store.get(userCookieNames.deviceId)?.value;

  const searchParams = request.nextUrl.searchParams;
  const next = searchParams.get("next") || "/dashboard";
  const loginUrl = new URL(`/login?next=${encodeURIComponent(next)}`, request.nextUrl.origin);
  const targetUrl = new URL(next, request.nextUrl.origin);

  if (!refreshToken || !deviceId) {
    return NextResponse.redirect(loginUrl);
  }

  let resp: Response;
  try {
    resp = await signedBackendFetch({
      baseUrl: backendUrls.auth,
      path: "/auth/refresh",
      method: "POST",
      deviceId,
      body: { refresh_token: refreshToken },
      extraHeaders: forwardedIpHeaders(request),
    });
  } catch {
    return NextResponse.redirect(loginUrl);
  }

  if (!resp.ok) {
    const res = NextResponse.redirect(loginUrl);
    await clearUserCookies(res);
    return res;
  }

  const data = (await resp.json().catch(() => ({}))) as {
    access_token?: string;
    refresh_token?: string;
  };

  if (!data.access_token) {
    const res = NextResponse.redirect(loginUrl);
    await clearUserCookies(res);
    return res;
  }

  const res = NextResponse.redirect(targetUrl);
  writeUserTokenCookies(res, {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    device_id: deviceId,
  });

  return res;
}
