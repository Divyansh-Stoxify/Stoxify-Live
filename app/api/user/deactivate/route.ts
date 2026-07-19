import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

import { backendUrls, forwardedIpHeaders, signedBackendFetch } from "@/lib/backend/index";
import { rejectCrossOriginPost } from "@/lib/auth/csrf";
import { userCookieNames, userCookieOptions } from "@/lib/auth/cookies";
import { readUserSessionFromCookies } from "@/lib/auth/server-session";

/**
 * POST /api/user/deactivate
 *
 * Step 2 of self-serve account deletion. Requires the OTP that was sent to the
 * user's phone via `POST /api/user/delete/request-otp`. Proxies to the backend
 * `POST /users/me/delete` route, then clears all session cookies so the user
 * is immediately logged out on the client side.
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

  let body: { otp?: string; reason?: string } = {};
  try {
    body = await request.json();
  } catch {
    // Body is optional — an empty object is fine
  }

  const otp = typeof body.otp === "string" ? body.otp.trim() : "";
  if (!/^\d{6}$/.test(otp)) {
    return NextResponse.json(
      { error: "A valid 6-digit OTP is required", code: "OTP_REQUIRED" },
      { status: 400 }
    );
  }

  try {
    const res = await signedBackendFetch({
      baseUrl: backendUrls.user,
      path: "/users/me/delete",
      method: "POST",
      deviceId,
      accessToken: session.accessToken,
      body: {
        otp,
        reason: body.reason || "User requested account deletion",
      },
      extraHeaders: forwardedIpHeaders(request),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      return NextResponse.json(
        {
          error: errorData.message || errorData.error || "Failed to delete account",
          code: errorData.code,
        },
        { status: res.status }
      );
    }

    // Account deactivated — clear all session cookies to force client-side logout
    const response = NextResponse.json({ success: true, message: "Account deleted successfully" });

    const clearOpts = {
      ...userCookieOptions,
      maxAge: 0,
    };

    response.cookies.set(userCookieNames.accessToken, "", clearOpts);
    response.cookies.set(userCookieNames.refreshToken, "", clearOpts);
    response.cookies.set(userCookieNames.sessionId, "", clearOpts);
    response.cookies.set(userCookieNames.deviceId, "", clearOpts);
    response.cookies.set(userCookieNames.userInfo, "", { ...clearOpts, httpOnly: false });

    return response;
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unable to reach the user service";
    console.error("Account deactivation failed:", err);
    return NextResponse.json({ error: errorMessage, code: "SERVICE_UNAVAILABLE" }, { status: 503 });
  }
}
