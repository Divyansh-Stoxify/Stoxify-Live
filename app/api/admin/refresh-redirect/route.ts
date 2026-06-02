import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

import { backendUrls, signedBackendFetch } from "@/lib/admin/backend";
import { adminCookieNames, adminCookieOptions } from "@/lib/admin/cookies";
import { forwardedIpHeaders } from "@/lib/admin/server-session";

/**
 * GET /api/admin/refresh-redirect
 *
 * Server-component-friendly token refresh. The admin page redirects here when
 * it detects a 401 from the dashboard endpoint and a refresh token is present.
 * This handler calls the backend refresh endpoint, writes fresh cookies, and
 * redirects the browser back to /admin. On failure it redirects to /admin/login
 * and clears all admin cookies.
 *
 * Never expose this URL to end-users; it is an internal implementation detail.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const store = await cookies();
  const refreshToken = store.get(adminCookieNames.refreshToken)?.value;
  const deviceId = store.get(adminCookieNames.deviceId)?.value;

  const loginUrl = new URL("/admin/login", request.nextUrl.origin);
  const adminUrl = new URL("/admin", request.nextUrl.origin);

  if (!refreshToken || !deviceId) {
    return NextResponse.redirect(loginUrl);
  }

  let resp: Response | null = null;
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
    for (const name of Object.values(adminCookieNames)) {
      res.cookies.set(name, "", { ...adminCookieOptions, maxAge: 0 });
    }
    return res;
  }

  let data: { access_token?: string; refresh_token?: string };
  try {
    data = await resp.json();
  } catch {
    return NextResponse.redirect(loginUrl);
  }

  if (!data.access_token) {
    return NextResponse.redirect(loginUrl);
  }

  const res = NextResponse.redirect(adminUrl);
  res.cookies.set(adminCookieNames.accessToken, data.access_token, {
    ...adminCookieOptions,
    maxAge: 60 * 60,
  });
  if (data.refresh_token) {
    res.cookies.set(adminCookieNames.refreshToken, data.refresh_token, {
      ...adminCookieOptions,
      maxAge: 60 * 60 * 24 * 30,
    });
  }
  return res;
}
