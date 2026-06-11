import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

import { backendUrls, forwardedIpHeaders, signedBackendFetch } from "@/lib/backend/index";
import { rejectCrossOriginPost } from "@/lib/auth/csrf";
import { userCookieNames } from "@/lib/auth/cookies";
import { clearUserCookies } from "@/lib/auth/server-session";

export async function POST(request: NextRequest): Promise<NextResponse> {
  const csrfRejection = rejectCrossOriginPost(request);
  if (csrfRejection) return csrfRejection;

  const store = await cookies();
  const accessToken = store.get(userCookieNames.accessToken)?.value;
  const refreshToken = store.get(userCookieNames.refreshToken)?.value;
  const deviceId = store.get(userCookieNames.deviceId)?.value;

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
  await clearUserCookies(response);
  return response;
}
