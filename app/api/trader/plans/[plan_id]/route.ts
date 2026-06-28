import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

import { backendUrls, forwardedIpHeaders, signedBackendFetch } from "@/lib/backend/index";
import { userCookieNames } from "@/lib/auth/cookies";

/**
 * GET /api/trader/plans/[plan_id]
 * Fetches details of a single plan for a trader. Traders hold PWR_PLAN_READ_ALL
 * (same power the discovery list uses), which the backend GET /plans/:plan_id
 * route also requires — so this passthrough works for trader sessions.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ plan_id: string }> }
): Promise<NextResponse> {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(userCookieNames.accessToken)?.value;
  const deviceId = cookieStore.get(userCookieNames.deviceId)?.value ?? "user-web-unknown";

  if (!accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { plan_id } = await params;
  if (!plan_id) {
    return NextResponse.json({ error: "Missing plan_id" }, { status: 400 });
  }

  try {
    const backendResponse = await signedBackendFetch({
      baseUrl: backendUrls.plan,
      path: `/plans/${plan_id}`,
      method: "GET",
      deviceId,
      accessToken,
      extraHeaders: forwardedIpHeaders(request),
    });

    const data = await backendResponse.json().catch(() => ({}));
    return NextResponse.json(data, { status: backendResponse.status });
  } catch (error) {
    console.error("[trader/plans/[plan_id]] GET failed:", error);
    return NextResponse.json({ error: "Unable to reach plan service" }, { status: 503 });
  }
}
