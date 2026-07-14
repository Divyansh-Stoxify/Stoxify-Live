import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

import { backendUrls, forwardedIpHeaders, signedBackendFetch } from "@/lib/backend/index";
import { userCookieNames } from "@/lib/auth/cookies";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(userCookieNames.accessToken)?.value;
  const deviceId = cookieStore.get(userCookieNames.deviceId)?.value ?? "user-web-unknown";

  if (!accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = request.nextUrl;
  const query: Record<string, string | undefined> = {
    analyst_id: searchParams.get("analyst_id") ?? undefined,
    segments: searchParams.get("segments") ?? searchParams.get("segment") ?? undefined,
    risk_levels: searchParams.get("risk_levels") ?? undefined,
    horizons: searchParams.get("horizons") ?? undefined,
    search: searchParams.get("search") ?? undefined,
    is_active: searchParams.get("is_active") ?? "true",
    require_active_tier: "true",
  };

  try {
    const backendResponse = await signedBackendFetch({
      baseUrl: backendUrls.plan,
      path: "/plans/facets",
      method: "GET",
      deviceId,
      accessToken,
      query,
      extraHeaders: forwardedIpHeaders(request),
    });

    const data = await backendResponse.json().catch(() => ({}));

    return NextResponse.json(data, { status: backendResponse.status });
  } catch (error) {
    console.error("[trader/plans/facets] signedBackendFetch failed:", error);
    return NextResponse.json({ error: "Unable to reach plan service" }, { status: 503 });
  }
}
