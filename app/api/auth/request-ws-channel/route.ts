import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

import { backendUrls, forwardedIpHeaders, signedBackendFetch } from "@/lib/backend/index";
import { userCookieNames } from "@/lib/auth/cookies";

/**
 * POST /api/auth/request-ws-channel
 *
 * Requests a one-time WebSocket channel_id from the auth service.
 * The returned channel_id is used as a query parameter when opening
 * the WebSocket connection to the gateway.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(userCookieNames.accessToken)?.value;
  const deviceId = cookieStore.get(userCookieNames.deviceId)?.value ?? "user-web-unknown";

  if (!accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const backendResponse = await signedBackendFetch({
      baseUrl: backendUrls.auth,
      path: "/auth/request-ws-channel",
      method: "POST",
      deviceId,
      accessToken,
      extraHeaders: forwardedIpHeaders(request),
    });

    const data = await backendResponse.json().catch(() => ({}));
    return NextResponse.json(data, { status: backendResponse.status });
  } catch (error) {
    console.error("[auth/request-ws-channel] signedBackendFetch failed:", error);
    return NextResponse.json({ error: "Unable to reach auth service" }, { status: 503 });
  }
}
