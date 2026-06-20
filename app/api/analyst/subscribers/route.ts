import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

import { backendUrls, forwardedIpHeaders, signedBackendFetch } from "@/lib/backend/index";
import { userCookieNames } from "@/lib/auth/cookies";

/**
 * GET /api/analyst/subscribers — List subscribers across the analyst's plans.
 *
 * Query params forwarded: plan_id, limit, page.
 * The subscription-service filters results to plans owned by the JWT caller.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(userCookieNames.accessToken)?.value;
  const deviceId = cookieStore.get(userCookieNames.deviceId)?.value ?? "user-web-unknown";

  if (!accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = request.nextUrl;
  const query: Record<string, string | undefined> = {
    plan_id: searchParams.get("plan_id") ?? undefined,
    status: searchParams.get("status") ?? undefined,
    limit: searchParams.get("limit") ?? "50",
    page: searchParams.get("page") ?? "1",
  };

  try {
    const backendResponse = await signedBackendFetch({
      baseUrl: backendUrls.subscription,
      path: "/subscriptions/",
      method: "GET",
      deviceId,
      accessToken,
      query,
      extraHeaders: forwardedIpHeaders(request),
    });

    const data = await backendResponse.json().catch(() => ({}));
    return NextResponse.json(data, { status: backendResponse.status });
  } catch (error) {
    console.error("[analyst/subscribers] GET failed:", error);
    return NextResponse.json({ error: "Unable to reach subscription service" }, { status: 503 });
  }
}
