import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

import { backendUrls, forwardedIpHeaders, signedBackendFetch } from "@/lib/backend/index";
import { rejectCrossOriginPost } from "@/lib/auth/csrf";
import { userCookieNames } from "@/lib/auth/cookies";
import { readUserSessionFromCookies, writeUserTokenCookies } from "@/lib/auth/server-session";

export async function POST(request: NextRequest): Promise<NextResponse> {
  const csrfRejection = rejectCrossOriginPost(request);
  if (csrfRejection) return csrfRejection;

  const session = await readUserSessionFromCookies();
  if (!session.authenticated) {
    return NextResponse.json({ error: "Not authenticated", code: "NO_SESSION" }, { status: 401 });
  }

  let body: { aadhaar_number?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request body", code: "BAD_REQUEST" },
      { status: 400 }
    );
  }

  const aadhaarNumber = body.aadhaar_number?.trim();
  if (!aadhaarNumber || aadhaarNumber.length < 12 || aadhaarNumber.length > 14) {
    return NextResponse.json(
      { error: "Aadhaar number must be between 12 and 14 digits", code: "BAD_REQUEST" },
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

  // 1. Call user service to submit KYC
  let kycResponse: Response;
  try {
    kycResponse = await signedBackendFetch({
      baseUrl: backendUrls.user,
      path: "/users/kyc/submit",
      method: "POST",
      deviceId,
      accessToken: session.accessToken,
      body: { aadhaar_number: aadhaarNumber },
      extraHeaders: forwardedIpHeaders(request),
    });
  } catch (err) {
    console.error("KYC submission backend call failed:", err);
    return NextResponse.json(
      { error: "Unable to reach the user service", code: "SERVICE_UNAVAILABLE" },
      { status: 503 }
    );
  }

  const kycData = (await kycResponse.json().catch(() => ({}))) as {
    success?: boolean;
    state?: string;
    error?: string;
    message?: string;
    code?: string;
  };

  if (!kycResponse.ok || !kycData.success) {
    return NextResponse.json(
      {
        error: kycData.message || kycData.error || "KYC verification failed",
        code: kycData.code || "KYC_FAILED",
      },
      { status: kycResponse.status || 400 }
    );
  }

  // 2. KYC succeeded on backend (state is now ACTIVE).
  // We must now refresh tokens to obtain a new Access Token with state: ACTIVE.
  if (!refreshToken) {
    return NextResponse.json({ ok: true, state: "ACTIVE" });
  }

  let refreshResponse: Response;
  try {
    refreshResponse = await signedBackendFetch({
      baseUrl: backendUrls.auth,
      path: "/auth/refresh",
      method: "POST",
      deviceId,
      body: { refresh_token: refreshToken },
      extraHeaders: forwardedIpHeaders(request),
    });
  } catch (err) {
    console.error("Token refresh failed after KYC activation:", err);
    return NextResponse.json({ ok: true, state: "ACTIVE" });
  }

  if (!refreshResponse.ok) {
    return NextResponse.json({ ok: true, state: "ACTIVE" });
  }

  const refreshData = (await refreshResponse.json().catch(() => ({}))) as {
    access_token?: string;
    refresh_token?: string;
  };

  if (!refreshData.access_token) {
    return NextResponse.json({ ok: true, state: "ACTIVE" });
  }

  // 3. Fetch latest user profile using the new access token to update the userInfo cookie
  let meResponse: Response;
  try {
    meResponse = await signedBackendFetch({
      baseUrl: backendUrls.user,
      path: "/users/me",
      method: "GET",
      deviceId,
      accessToken: refreshData.access_token,
      extraHeaders: forwardedIpHeaders(request),
    });
  } catch (err) {
    console.error("Failed to fetch profile after refresh:", err);
    const response = NextResponse.json({ ok: true, state: "ACTIVE" });
    writeUserTokenCookies(response, {
      access_token: refreshData.access_token,
      refresh_token: refreshData.refresh_token,
      device_id: deviceId,
    });
    return response;
  }

  const meData = (await meResponse.json().catch(() => ({}))) as {
    user_id?: string;
    name?: string;
    email?: string;
    phone?: string;
    state?: string;
  };

  const response = NextResponse.json({ ok: true, state: meData.state || "ACTIVE" });
  writeUserTokenCookies(response, {
    access_token: refreshData.access_token,
    refresh_token: refreshData.refresh_token,
    device_id: deviceId,
    user: meResponse.ok && meData.user_id ? meData : undefined,
  });

  return response;
}
