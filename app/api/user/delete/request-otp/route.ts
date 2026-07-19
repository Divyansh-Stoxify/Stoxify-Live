import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

import { backendUrls, forwardedIpHeaders, signedBackendFetch } from "@/lib/backend/index";
import { rejectCrossOriginPost } from "@/lib/auth/csrf";
import { userCookieNames } from "@/lib/auth/cookies";
import { readUserSessionFromCookies } from "@/lib/auth/server-session";

/**
 * POST /api/user/delete/request-otp
 *
 * Step 1 of self-serve account deletion: sends a confirmation OTP to the
 * user's registered phone. Proxies to backend `POST /users/me/delete/request-otp`.
 * Returns `{ phone_masked }` so the UI can tell the user where the code went.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const csrfRejection = rejectCrossOriginPost(request);
  if (csrfRejection) return csrfRejection;

  const session = await readUserSessionFromCookies();
  if (!session.authenticated) {
    return NextResponse.json({ error: "Not authenticated", code: "NO_SESSION" }, { status: 401 });
  }

  const store = await cookies();
  const deviceId = store.get(userCookieNames.deviceId)?.value;

  if (!deviceId) {
    return NextResponse.json(
      { error: "Missing device identity", code: "BAD_REQUEST" },
      { status: 400 }
    );
  }

  try {
    const res = await signedBackendFetch({
      baseUrl: backendUrls.user,
      path: "/users/me/delete/request-otp",
      method: "POST",
      deviceId,
      accessToken: session.accessToken,
      extraHeaders: forwardedIpHeaders(request),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      return NextResponse.json(
        {
          error: data.message || data.error || "Failed to send deletion OTP",
          code: data.code,
        },
        { status: res.status }
      );
    }

    return NextResponse.json({ success: true, phone_masked: data.phone_masked });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unable to reach the user service";
    console.error("Deletion OTP request failed:", err);
    return NextResponse.json({ error: errorMessage, code: "SERVICE_UNAVAILABLE" }, { status: 503 });
  }
}
