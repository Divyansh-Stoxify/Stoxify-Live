import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

import { backendUrls, forwardedIpHeaders, signedBackendFetch } from "@/lib/backend/index";
import { userCookieNames } from "@/lib/auth/cookies";

/**
 * POST /api/market-data/watch
 *
 * Proxies a watch request to the backend market-data-service. Watching a
 * symbol subscribes it to the live Angel One feed for a short TTL so ticks
 * stream to the client over the WebSocket; the client renews while the
 * symbol is on screen. Returns `{ symbol, price, watch_ttl_seconds }`.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(userCookieNames.accessToken)?.value;
  const deviceId = cookieStore.get(userCookieNames.deviceId)?.value ?? "user-web-unknown";

  if (!accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const symbol = typeof body?.symbol === "string" ? body.symbol.trim() : "";
  if (!symbol) {
    return NextResponse.json({ error: "Bad Request", message: "symbol is required" }, { status: 400 });
  }

  try {
    const backendResponse = await signedBackendFetch({
      baseUrl: backendUrls.marketData,
      path: "/market-data/watch",
      method: "POST",
      body: { symbol },
      deviceId,
      accessToken,
      extraHeaders: forwardedIpHeaders(request),
    });

    const data = await backendResponse.json().catch(() => ({}));
    return NextResponse.json(data, { status: backendResponse.status });
  } catch (error) {
    console.error("[market-data/watch] signedBackendFetch failed:", error);
    return NextResponse.json({ error: "Unable to reach market data service" }, { status: 503 });
  }
}
