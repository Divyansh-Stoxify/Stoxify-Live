import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

import { backendUrls, forwardedIpHeaders, signedBackendFetch } from "@/lib/backend/index";
import { userCookieNames } from "@/lib/auth/cookies";

/**
 * GET /api/analyst/payouts — the analyst's own settlement history.
 * Calls GET /users/analysts/me/payouts on the user-service.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(userCookieNames.accessToken)?.value;
  const deviceId = cookieStore.get(userCookieNames.deviceId)?.value ?? "user-web-unknown";

  if (!accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const limit = request.nextUrl.searchParams.get("limit");

  try {
    const backendResponse = await signedBackendFetch({
      baseUrl: backendUrls.user,
      path: "/users/analysts/me/payouts",
      method: "GET",
      deviceId,
      accessToken,
      query: limit ? { limit } : undefined,
      extraHeaders: forwardedIpHeaders(request),
    });

    const data = await backendResponse.json().catch(() => ({}));
    return NextResponse.json(data, { status: backendResponse.status });
  } catch (error) {
    console.error("[analyst/payouts] GET failed:", error);
    return NextResponse.json({ error: "Unable to reach user service" }, { status: 503 });
  }
}
