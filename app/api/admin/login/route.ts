import { randomUUID } from "node:crypto";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

import { adminCookieNames, adminCookieOptions } from "@/lib/admin/cookies";
import { backendUrls, signedBackendFetch } from "@/lib/admin/backend";
import { rejectCrossOriginPost } from "@/lib/admin/csrf";
import { checkAdminLoginRateLimit } from "@/lib/admin/rate-limit";
import {
  clearAdminCookies,
  clientIpFromRequest,
  forwardedIpHeaders,
  readAdminSession,
  writeAdminTokenCookies,
} from "@/lib/admin/server-session";

type BackendLoginResponse = {
  access_token?: string;
  refresh_token?: string;
  session_id?: string;
  user?: {
    user_id?: string;
    email?: string;
    name?: string;
    state?: string;
  };
  error?: string;
  message?: string;
  code?: string;
};

type AdminLoginRequestBody = {
  action?: "request_otp" | "verify_otp";
  device_fingerprint?: Record<string, unknown>;
  device_id?: string;
  device_name?: string;
  device_type?: "WEB";
  email?: string;
  otp?: string;
};

const KNOWN_ERROR_CODES = new Set([
  "ACCOUNT_INACTIVE",
  "INVALID_OTP",
  "INVALID_SIGNATURE",
  "ADMIN_ACCESS_REQUIRED",
  "RATE_LIMITED",
]);

async function readBackendJson<T>(response: Response): Promise<T> {
  try {
    return (await response.json()) as T;
  } catch {
    return {} as T;
  }
}

function safeErrorResponse(
  data: BackendLoginResponse,
  httpStatus: number,
  fallbackMessage = "Unable to sign in"
): NextResponse {
  const isKnown = Boolean(data.code && KNOWN_ERROR_CODES.has(data.code));
  if (!isKnown) {
    console.error("[admin-login] Upstream auth error:", {
      status: httpStatus,
      code: data.code,
      message: data.message,
    });
  }
  const payload = isKnown
    ? { error: data.error ?? data.message ?? "Authentication failed", code: data.code }
    : { error: fallbackMessage, code: "AUTH_FAILED" };
  return NextResponse.json(payload, { status: httpStatus });
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const csrfRejection = rejectCrossOriginPost(request);
  if (csrfRejection) {
    return csrfRejection;
  }

  const ip = clientIpFromRequest(request);

  const rateLimit = checkAdminLoginRateLimit(ip);
  if (!rateLimit.ok) {
    console.warn("[admin-login] Rate limit exceeded", {
      ip,
      retryAfterSec: rateLimit.retryAfterSec,
    });
    return NextResponse.json(
      {
        error: "Too many login attempts. Please try again later.",
        code: "RATE_LIMITED",
      },
      {
        status: 429,
        headers: {
          "Retry-After": String(rateLimit.retryAfterSec),
          "X-RateLimit-Reset": String(Math.ceil(rateLimit.resetAt / 1000)),
        },
      }
    );
  }

  let credentials: AdminLoginRequestBody;
  try {
    credentials = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request body", code: "BAD_REQUEST" },
      { status: 400 }
    );
  }

  const email = credentials.email?.trim().toLowerCase();
  if (!email) {
    return NextResponse.json({ error: "Email is required", code: "BAD_REQUEST" }, { status: 400 });
  }

  const cookieStore = await cookies();
  const deviceId =
    credentials.device_id?.trim() ||
    cookieStore.get(adminCookieNames.deviceId)?.value ||
    `admin-web-${randomUUID()}`;
  const deviceType = credentials.device_type ?? "WEB";
  const deviceName = credentials.device_name?.trim() || "Stoxify Admin Console";
  const action = credentials.action === "verify_otp" ? "verify_otp" : "request_otp";
  const otp = credentials.otp?.trim();

  if (action === "verify_otp" && (!otp || otp.length !== 6)) {
    return NextResponse.json(
      { error: "A valid 6-digit verification code is required", code: "BAD_REQUEST" },
      { status: 400 }
    );
  }

  let loginResponse: Response;
  try {
    loginResponse = await signedBackendFetch({
      baseUrl: backendUrls.auth,
      path: action === "verify_otp" ? "/auth/login/verify-otp" : "/auth/login/request-otp",
      method: "POST",
      deviceId,
      body:
        action === "verify_otp"
          ? {
              identifier: email,
              otp,
              device_type: deviceType,
              device_name: deviceName,
            }
          : {
              identifier: email,
            },
      extraHeaders: forwardedIpHeaders(request),
    });
  } catch {
    return NextResponse.json(
      { error: "Unable to reach the auth service", code: "SERVICE_UNAVAILABLE" },
      { status: 503 }
    );
  }

  const loginData = await readBackendJson<BackendLoginResponse>(loginResponse);

  console.info("[admin-login] Login attempt", {
    ip,
    action,
    email,
    status: loginResponse.status,
    code: loginData.code,
  });

  if (action === "request_otp") {
    if (!loginResponse.ok) {
      return safeErrorResponse(loginData, loginResponse.status, "Unable to send verification code");
    }

    const response = NextResponse.json({
      ok: true,
      challenge: "otp",
      email,
    });
    response.cookies.set(adminCookieNames.deviceId, deviceId, {
      ...adminCookieOptions,
      maxAge: 60 * 60 * 24 * 365,
    });
    return response;
  }

  if (!loginResponse.ok || !loginData.access_token) {
    return safeErrorResponse(loginData, loginResponse.status);
  }

  let session;
  try {
    session = await readAdminSession({
      accessToken: loginData.access_token,
      deviceId,
      userOverride: loginData.user ?? null,
    });
  } catch {
    await signedBackendFetch({
      baseUrl: backendUrls.auth,
      path: "/auth/logout",
      method: "POST",
      accessToken: loginData.access_token,
      deviceId,
      body: loginData.refresh_token ? { refresh_token: loginData.refresh_token } : undefined,
      extraHeaders: forwardedIpHeaders(request),
    }).catch(() => undefined);

    return NextResponse.json(
      { error: "Unable to verify admin access", code: "SERVICE_UNAVAILABLE" },
      { status: 503 }
    );
  }

  if (!session.authenticated || !session.user) {
    console.warn("[admin-login] Admin gate denied", {
      ip,
      email,
      code: session.code,
    });

    await signedBackendFetch({
      baseUrl: backendUrls.auth,
      path: "/auth/logout",
      method: "POST",
      accessToken: loginData.access_token,
      deviceId,
      body: loginData.refresh_token ? { refresh_token: loginData.refresh_token } : undefined,
      extraHeaders: forwardedIpHeaders(request),
    }).catch(() => undefined);

    const response = NextResponse.json(
      {
        error: session.error ?? "This account does not have admin dashboard access.",
        code: session.code ?? "ADMIN_ACCESS_REQUIRED",
      },
      { status: session.code === "RBAC_PERMISSIONS_FAILED" ? 503 : 403 }
    );
    return clearAdminCookies(response);
  }

  const response = NextResponse.json({
    ok: true,
    authenticated: true,
    user: session.user,
    roles: session.roles,
    powers: session.powers,
    redirectTo: session.redirectTo ?? "/admin",
  });
  writeAdminTokenCookies(response, {
    access_token: loginData.access_token,
    refresh_token: loginData.refresh_token,
    session_id: loginData.session_id,
    device_id: deviceId,
  });

  return response;
}
