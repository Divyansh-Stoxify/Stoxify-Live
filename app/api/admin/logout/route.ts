import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

import { backendUrls, signedBackendFetch } from "@/lib/admin/backend";
import { adminCookieNames, adminCookieOptions } from "@/lib/admin/cookies";
import { rejectCrossOriginPost } from "@/lib/admin/csrf";
import { forwardedIpHeaders } from "@/lib/admin/server-session";

export async function POST(request: NextRequest): Promise<NextResponse> {
  const csrfRejection = rejectCrossOriginPost(request);
  if (csrfRejection) {
    return csrfRejection;
  }

  const cookieStore = await cookies();
  const accessToken = cookieStore.get(adminCookieNames.accessToken)?.value;
  const deviceId = cookieStore.get(adminCookieNames.deviceId)?.value;
  const refreshToken = cookieStore.get(adminCookieNames.refreshToken)?.value;

  if (accessToken && deviceId) {
    await signedBackendFetch({
      baseUrl: backendUrls.auth,
      path: "/auth/logout",
      method: "POST",
      accessToken,
      deviceId,
      body: refreshToken ? { refresh_token: refreshToken } : undefined,
      extraHeaders: forwardedIpHeaders(request),
    }).catch(() => undefined);
  }

  const response = NextResponse.json({ ok: true });
  for (const name of Object.values(adminCookieNames)) {
    response.cookies.set(name, "", { ...adminCookieOptions, maxAge: 0 });
  }

  return response;
}
