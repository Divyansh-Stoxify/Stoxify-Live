import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

import { backendUrls, forwardedIpHeaders, signedBackendFetch } from "@/lib/backend/index";
import { rejectCrossOriginPost } from "@/lib/auth/csrf";
import { userCookieNames } from "@/lib/auth/cookies";

/**
 * POST /api/analyst/avatar — Upload a profile picture.
 *
 * The browser sends the image as base64 JSON so it flows through the existing
 * ECDSA-signed backend fetch. Forwards to POST /users/me/avatar on the
 * user-service, which hosts the bytes on Azure Blob and returns the public URL.
 * The caller then persists that URL via PATCH /api/analyst/profile.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const csrfRejection = rejectCrossOriginPost(request);
  if (csrfRejection) return csrfRejection;

  const cookieStore = await cookies();
  const accessToken = cookieStore.get(userCookieNames.accessToken)?.value;
  const deviceId = cookieStore.get(userCookieNames.deviceId)?.value ?? "user-web-unknown";

  if (!accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  if (!body || typeof body.image_base64 !== "string" || typeof body.content_type !== "string") {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  try {
    const backendResponse = await signedBackendFetch({
      baseUrl: backendUrls.user,
      path: "/users/me/avatar",
      method: "POST",
      deviceId,
      accessToken,
      body: { image_base64: body.image_base64, content_type: body.content_type },
      extraHeaders: forwardedIpHeaders(request),
      // Uploads can be larger/slower than a normal JSON call.
      timeoutMs: 30_000,
    });

    const data = await backendResponse.json().catch(() => ({}));
    return NextResponse.json(data, { status: backendResponse.status });
  } catch (error) {
    console.error("[analyst/avatar] POST failed:", error);
    return NextResponse.json({ error: "Unable to reach user service" }, { status: 503 });
  }
}
