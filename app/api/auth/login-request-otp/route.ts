import { randomUUID } from "node:crypto";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

import {
  backendUrls,
  clientIpFromRequest,
  forwardedIpHeaders,
  signedBackendFetch,
} from "@/lib/backend/index";
import { rejectCrossOriginPost } from "@/lib/auth/csrf";
import { userCookieNames } from "@/lib/auth/cookies";
import { checkUserLoginRateLimit } from "@/lib/auth/rate-limit";

export async function POST(request: NextRequest): Promise<NextResponse> {
  const csrfRejection = rejectCrossOriginPost(request);
  if (csrfRejection) return csrfRejection;

  const ip = clientIpFromRequest(request);
  const rateLimit = checkUserLoginRateLimit(ip);
  if (!rateLimit.ok) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later.", code: "RATE_LIMITED" },
      { status: 429, headers: { "Retry-After": String(rateLimit.retryAfterSec) } }
    );
  }

  let body: { identifier?: string; intent?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request body", code: "BAD_REQUEST" },
      { status: 400 }
    );
  }

  if (!body.identifier) {
    return NextResponse.json(
      { error: "Phone number is required", code: "BAD_REQUEST" },
      { status: 400 }
    );
  }

  const identifier = body.identifier.trim();
  if (identifier.includes("@") || /[a-zA-Z]/.test(identifier)) {
    return NextResponse.json(
      { error: "Email login is not supported", code: "BAD_REQUEST" },
      { status: 400 }
    );
  }

  // Reuse the existing device_id cookie if present; otherwise mint one so the
  // backend signature works. The cookie is persisted on success.
  const cookieStore = await cookies();
  const existingDeviceId = cookieStore.get(userCookieNames.deviceId)?.value;
  const deviceId = existingDeviceId ?? `user-web-${randomUUID()}`;

  let backendResponse: Response;
  try {
    backendResponse = await signedBackendFetch({
      baseUrl: backendUrls.auth,
      path: body.intent === "ANALYST" ? "/auth/analyst/request-otp" : "/auth/login/request-otp",
      method: "POST",
      deviceId,
      body: { identifier },
      extraHeaders: forwardedIpHeaders(request),
    });
  } catch (error) {
    console.error("[login-request-otp] signedBackendFetch failed:", error);
    return NextResponse.json(
      { error: "Unable to reach the auth service", code: "SERVICE_UNAVAILABLE" },
      { status: 503 }
    );
  }

  if (!backendResponse.ok) {
    const data = (await backendResponse.json().catch(() => ({}))) as {
      error?: string;
      message?: string;
      code?: string;
    };
    return NextResponse.json(
      { error: data.message ?? data.error ?? "Failed to send code", code: data.code },
      { status: backendResponse.status || 400 }
    );
  }

  // Persist the device_id so verify-otp uses the same one for session creation.
  const response = NextResponse.json({ ok: true });
  if (!existingDeviceId) {
    response.cookies.set(userCookieNames.deviceId, deviceId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
    });
  }
  return response;
}
