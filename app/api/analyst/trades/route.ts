import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

import { backendUrls, forwardedIpHeaders, signedBackendFetch } from "@/lib/backend/index";
import { userCookieNames } from "@/lib/auth/cookies";

/**
 * GET /api/analyst/trades — List the analyst's own trades (active, closed, pending).
 *
 * Query params forwarded: status, segment, trade_type, limit, page.
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
    status: searchParams.get("status") ?? undefined,
    segment: searchParams.get("segment") ?? undefined,
    trade_type: searchParams.get("trade_type") ?? undefined,
    limit: searchParams.get("limit") ?? "50",
    page: searchParams.get("page") ?? "1",
  };

  try {
    const backendResponse = await signedBackendFetch({
      baseUrl: backendUrls.trade,
      path: "/trades/",
      method: "GET",
      deviceId,
      accessToken,
      query,
      extraHeaders: forwardedIpHeaders(request),
    });

    const data = await backendResponse.json().catch(() => ({}));
    return NextResponse.json(data, { status: backendResponse.status });
  } catch (error) {
    console.error("[analyst/trades] signedBackendFetch failed:", error);
    return NextResponse.json({ error: "Unable to reach trade service" }, { status: 503 });
  }
}

/**
 * POST /api/analyst/trades — Create a new trade.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(userCookieNames.accessToken)?.value;
  const deviceId = cookieStore.get(userCookieNames.deviceId)?.value ?? "user-web-unknown";

  if (!accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  try {
    const backendResponse = await signedBackendFetch({
      baseUrl: backendUrls.trade,
      path: "/trades/",
      method: "POST",
      deviceId,
      accessToken,
      body,
      extraHeaders: forwardedIpHeaders(request),
    });

    const data = await backendResponse.json().catch(() => ({}));
    return NextResponse.json(data, { status: backendResponse.status });
  } catch (error) {
    console.error("[analyst/trades] POST failed:", error);
    return NextResponse.json({ error: "Unable to reach trade service" }, { status: 503 });
  }
}
