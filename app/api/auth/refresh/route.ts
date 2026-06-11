import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

import { backendUrls, forwardedIpHeaders, signedBackendFetch } from "@/lib/backend/index";
import { rejectCrossOriginPost } from "@/lib/auth/csrf";
import { userCookieNames } from "@/lib/auth/cookies";
import { clearUserCookies, writeUserTokenCookies } from "@/lib/auth/server-session";

export async function POST(request: NextRequest): Promise<NextResponse> {
  const csrfRejection = rejectCrossOriginPost(request);
  if (csrfRejection) return csrfRejection;

  const store = await cookies();
  const refreshToken = store.get(userCookieNames.refreshToken)?.value;
  const deviceId = store.get(userCookieNames.deviceId)?.value;

  if (!refreshToken || !deviceId) {
    const response = NextResponse.json(
      { error: "No active session", code: "NO_SESSION" },
      { status: 401 }
    );
    await clearUserCookies(response);
    return response;
  }

  let backendResponse: Response;
  try {
    backendResponse = await signedBackendFetch({
      baseUrl: backendUrls.auth,
      path: "/auth/refresh",
      method: "POST",
      deviceId,
      body: { refresh_token: refreshToken },
      extraHeaders: forwardedIpHeaders(request),
    });
  } catch {
    return NextResponse.json(
      { error: "Unable to reach the auth service", code: "SERVICE_UNAVAILABLE" },
      { status: 503 }
    );
  }

  if (!backendResponse.ok) {
    const response = NextResponse.json(
      { error: "Session expired", code: "SESSION_EXPIRED" },
      { status: 401 }
    );
    await clearUserCookies(response);
    return response;
  }

  const data = (await backendResponse.json().catch(() => ({}))) as {
    access_token?: string;
    refresh_token?: string;
  };

  if (!data.access_token) {
    const response = NextResponse.json(
      { error: "Session expired", code: "SESSION_EXPIRED" },
      { status: 401 }
    );
    await clearUserCookies(response);
    return response;
  }

  const response = NextResponse.json({ ok: true });
  writeUserTokenCookies(response, {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    device_id: deviceId,
  });
  return response;
}
