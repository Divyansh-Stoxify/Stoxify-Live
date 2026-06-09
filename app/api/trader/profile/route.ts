import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

import { backendUrls, forwardedIpHeaders, signedBackendFetch } from "@/lib/backend/index";
import { rejectCrossOriginPost } from "@/lib/auth/csrf";
import { userCookieNames } from "@/lib/auth/cookies";
import { readUserSessionFromCookies, writeUserTokenCookies } from "@/lib/auth/server-session";

export async function PATCH(request: NextRequest): Promise<NextResponse> {
  const csrfRejection = rejectCrossOriginPost(request);
  if (csrfRejection) return csrfRejection;

  const session = await readUserSessionFromCookies();
  if (!session.authenticated) {
    return NextResponse.json({ error: "Not authenticated", code: "NO_SESSION" }, { status: 401 });
  }

  let body: { name?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request body", code: "BAD_REQUEST" },
      { status: 400 }
    );
  }

  const name = body.name?.trim();
  if (!name || name.length < 2) {
    return NextResponse.json(
      { error: "Name must be at least 2 characters", code: "BAD_REQUEST" },
      { status: 400 }
    );
  }

  const store = await cookies();
  const deviceId = store.get(userCookieNames.deviceId)?.value;
  const refreshToken = store.get(userCookieNames.refreshToken)?.value;

  if (!deviceId) {
    return NextResponse.json(
      { error: "Missing device identity", code: "BAD_REQUEST" },
      { status: 400 }
    );
  }

  try {
    // 1. Call user service PATCH /users/me to update profile name
    const updateResponse = await signedBackendFetch({
      baseUrl: backendUrls.user,
      path: "/users/me",
      method: "PATCH",
      deviceId,
      accessToken: session.accessToken,
      body: { name },
      extraHeaders: forwardedIpHeaders(request),
    });

    if (!updateResponse.ok) {
      const errorData = await updateResponse.json().catch(() => ({}));
      return NextResponse.json(
        { error: errorData.message || "Failed to update profile name" },
        { status: updateResponse.status }
      );
    }

    // 2. Fetch the latest profile to get updated details
    const meResponse = await signedBackendFetch({
      baseUrl: backendUrls.user,
      path: "/users/me",
      method: "GET",
      deviceId,
      accessToken: session.accessToken,
      extraHeaders: forwardedIpHeaders(request),
    });

    if (!meResponse.ok) {
      return NextResponse.json(
        { error: "Failed to fetch updated profile" },
        { status: meResponse.status }
      );
    }

    const meData = (await meResponse.json().catch(() => ({}))) as {
      user_id?: string;
      name?: string;
      email?: string;
      phone?: string;
      state?: string;
    };

    const response = NextResponse.json({ success: true, user: meData });

    // 3. Write user cookies to update userInfo on client side
    writeUserTokenCookies(response, {
      access_token: session.accessToken,
      refresh_token: refreshToken,
      device_id: deviceId,
      user: meData.user_id ? meData : undefined,
    });

    return response;
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unable to reach the user service";
    console.error("Profile update failed:", err);
    return NextResponse.json(
      { error: errorMessage, code: "SERVICE_UNAVAILABLE" },
      { status: 503 }
    );
  }
}
