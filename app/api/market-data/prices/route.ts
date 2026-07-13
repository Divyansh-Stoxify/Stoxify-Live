import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

import { backendUrls, forwardedIpHeaders, signedBackendFetch } from "@/lib/backend/index";
import { userCookieNames } from "@/lib/auth/cookies";

/** Backend rejects batches larger than this. */
const MAX_BATCH_SYMBOLS = 100;

/**
 * GET /api/market-data/prices?symbols=A,B,C
 *
 * Batched price lookup, proxied to the backend market-data-service. Returns
 * `{ prices: { [symbol]: number } }`; symbols with no known price are absent.
 *
 * Used to seed the dashboard's LTP column with the last traded price so it is
 * populated outside market hours, when no ticks arrive over the WebSocket.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(userCookieNames.accessToken)?.value;
  const deviceId = cookieStore.get(userCookieNames.deviceId)?.value ?? "user-web-unknown";

  if (!accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const symbols = [
    ...new Set(
      (request.nextUrl.searchParams.get("symbols") ?? "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    ),
  ];

  if (symbols.length === 0) {
    return NextResponse.json({ prices: {} }, { status: 200 });
  }

  if (symbols.length > MAX_BATCH_SYMBOLS) {
    return NextResponse.json(
      { error: "Bad Request", message: `At most ${MAX_BATCH_SYMBOLS} symbols per request` },
      { status: 400 }
    );
  }

  try {
    const backendResponse = await signedBackendFetch({
      baseUrl: backendUrls.marketData,
      path: `/market-data/prices?symbols=${encodeURIComponent(symbols.join(","))}`,
      method: "GET",
      deviceId,
      accessToken,
      extraHeaders: forwardedIpHeaders(request),
    });

    const data = await backendResponse.json().catch(() => ({}));
    return NextResponse.json(data, { status: backendResponse.status });
  } catch (error) {
    console.error("[market-data/prices] signedBackendFetch failed:", error);
    return NextResponse.json({ error: "Unable to reach market data service" }, { status: 503 });
  }
}
