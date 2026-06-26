import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

import { backendUrls, forwardedIpHeaders, signedBackendFetch } from "@/lib/backend/index";
import { rejectCrossOriginPost } from "@/lib/auth/csrf";
import { userCookieNames } from "@/lib/auth/cookies";

/**
 * GET /api/analyst/notifications/preferences
 * Fetch the authenticated user's notification preferences.
 * Proxies GET /notifications/me/preferences on the notification-service.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(userCookieNames.accessToken)?.value;
  const deviceId = cookieStore.get(userCookieNames.deviceId)?.value ?? "user-web-unknown";

  if (!accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const backendResponse = await signedBackendFetch({
      baseUrl: backendUrls.notification,
      path: "/notifications/me/preferences",
      method: "GET",
      deviceId,
      accessToken,
      extraHeaders: forwardedIpHeaders(request),
    });

    const data = await backendResponse.json().catch(() => ({}));
    return NextResponse.json(data, { status: backendResponse.status });
  } catch (error) {
    console.error("[analyst/notifications/preferences] GET failed:", error);
    return NextResponse.json({ error: "Unable to reach notification service" }, { status: 503 });
  }
}

/**
 * PATCH /api/analyst/notifications/preferences
 * Update the authenticated user's notification preferences.
 * Proxies PATCH /notifications/me/preferences on the notification-service.
 */
export async function PATCH(request: NextRequest): Promise<NextResponse> {
  const csrfRejection = rejectCrossOriginPost(request);
  if (csrfRejection) return csrfRejection;

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
      baseUrl: backendUrls.notification,
      path: "/notifications/me/preferences",
      method: "PATCH",
      deviceId,
      accessToken,
      body,
      extraHeaders: forwardedIpHeaders(request),
    });

    const data = await backendResponse.json().catch(() => ({}));
    return NextResponse.json(data, { status: backendResponse.status });
  } catch (error) {
    console.error("[analyst/notifications/preferences] PATCH failed:", error);
    return NextResponse.json({ error: "Unable to reach notification service" }, { status: 503 });
  }
}
