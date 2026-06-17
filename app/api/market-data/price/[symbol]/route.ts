import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

import { backendUrls, forwardedIpHeaders, signedBackendFetch } from "@/lib/backend/index";
import { userCookieNames } from "@/lib/auth/cookies";

type RouteContext = { params: Promise<{ symbol: string }> };

/**
 * GET /api/market-data/price/[symbol]
 *
 * Proxies a price lookup to the backend market-data-service.
 * Returns `{ symbol, price }` or `{ symbol, price: null }` if unavailable.
 */
export async function GET(request: NextRequest, context: RouteContext): Promise<NextResponse> {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(userCookieNames.accessToken)?.value;
  const deviceId = cookieStore.get(userCookieNames.deviceId)?.value ?? "user-web-unknown";

  if (!accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { symbol } = await context.params;

  try {
    const backendResponse = await signedBackendFetch({
      baseUrl: backendUrls.marketData,
      path: `/market-data/price/${encodeURIComponent(symbol)}`,
      method: "GET",
      deviceId,
      accessToken,
      extraHeaders: forwardedIpHeaders(request),
    });

    const data = await backendResponse.json().catch(() => ({}));
    return NextResponse.json(data, { status: backendResponse.status });
  } catch (error) {
    console.error("[market-data/price] signedBackendFetch failed:", error);
    return NextResponse.json({ error: "Unable to reach market data service" }, { status: 503 });
  }
}
