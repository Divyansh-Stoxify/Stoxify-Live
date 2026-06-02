import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

import { backendUrls, signedBackendFetch } from "@/lib/admin/backend";
import { adminCookieNames, adminCookieOptions } from "@/lib/admin/cookies";
import { rejectCrossOriginPost } from "@/lib/admin/csrf";
import {
  forwardedIpHeaders,
  readAdminSession,
  writeAdminTokenCookies,
} from "@/lib/admin/server-session";

export async function POST(request: NextRequest): Promise<NextResponse> {
  const reject = rejectCrossOriginPost(request);
  if (reject) return reject;

  const store = await cookies();
  const refreshToken = store.get(adminCookieNames.refreshToken)?.value;
  const deviceId = store.get(adminCookieNames.deviceId)?.value;

  if (!refreshToken || !deviceId) {
    return NextResponse.json({ ok: false, code: "NO_SESSION" }, { status: 401 });
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
    return NextResponse.json({ ok: false, code: "SERVICE_UNAVAILABLE" }, { status: 503 });
  }

  if (!resp.ok) {
    const res = NextResponse.json({ ok: false, code: "REFRESH_FAILED" }, { status: 401 });
    for (const name of Object.values(adminCookieNames)) {
      res.cookies.set(name, "", { ...adminCookieOptions, maxAge: 0 });
    }
    return res;
  }

  let data: { access_token?: string; refresh_token?: string };
  try {
    data = await resp.json();
  } catch {
    return NextResponse.json({ ok: false, code: "INVALID_RESPONSE" }, { status: 502 });
  }

  if (!data.access_token) {
    return NextResponse.json({ ok: false, code: "REFRESH_FAILED" }, { status: 401 });
  }

  const session = await readAdminSession({ accessToken: data.access_token, deviceId }).catch(
    () => null
  );
  if (!session?.authenticated) {
    return NextResponse.json({ ok: false, code: "ADMIN_ACCESS_REQUIRED" }, { status: 403 });
  }

  const res = NextResponse.json(session);
  writeAdminTokenCookies(res, {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
  });
  return res;
}
