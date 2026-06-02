import { randomUUID } from "node:crypto";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

import { adminCookieNames } from "@/lib/admin/cookies";
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
  device_fingerprint?: Record<string, unknown>;
  device_id?: string;
  device_name?: string;
  device_type?: "WEB";
  email?: string;
  password?: string;
};

const KNOWN_ERROR_CODES = new Set([
  "INVALID_CREDENTIALS",
  "ACCOUNT_LOCKED",
  "ACCOUNT_INACTIVE",
  "INVALID_SIGNATURE",
  "ADMIN_ACCESS_REQUIRED",
]);

async function readBackendJson<T>(response: Response): Promise<T> {
  try {
    return (await response.json()) as T;
  } catch {
    return {} as T;
  }
}

function safeErrorResponse(data: BackendLoginResponse, httpStatus: number): NextResponse {
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
    : { error: "Unable to sign in", code: "AUTH_FAILED" };
  return NextResponse.json(payload, { status: httpStatus });
}

async function logAdminGateDenied({
  ip,
  email,
  deviceId,
  userId,
  dashboardStatus,
}: {
  ip: string;
  email: string;
  deviceId: string;
  userId?: string;
  dashboardStatus: number;
}): Promise<void> {
  const internalSecret = process.env.INTERNAL_SECRET;
  if (!internalSecret) {
    console.warn("[admin-login] INTERNAL_SECRET missing; admin gate denial not persisted", {
      ip,
      email,
      dashboardStatus,
    });
    return;
  }

  try {
    await fetch(`${backendUrls.auth}/auth/security/log-admin-denied`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Internal-Secret": internalSecret,
      },
      body: JSON.stringify({
        email,
        ip_address: ip,
        device_id: deviceId,
        user_id: userId,
        dashboard_status: dashboardStatus,
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(5_000),
    });
  } catch (error) {
    console.error("[admin-login] Failed to persist admin gate denial", { error });
  }
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
    return NextResponse.json({ error: "Invalid request body", code: "BAD_REQUEST" }, { status: 400 });
  }

  if (!credentials.email || !credentials.password) {
    return NextResponse.json(
      { error: "Email and password are required", code: "BAD_REQUEST" },
      { status: 400 }
    );
  }

  const cookieStore = await cookies();
  const deviceId =
    credentials.device_id?.trim() ||
    cookieStore.get(adminCookieNames.deviceId)?.value ||
    `admin-web-${randomUUID()}`;

  let loginResponse: Response;
  try {
    loginResponse = await signedBackendFetch({
      baseUrl: backendUrls.auth,
      path: "/auth/login",
      method: "POST",
      deviceId,
      body: {
        email: credentials.email.trim(),
        password: credentials.password,
        device_fingerprint: credentials.device_fingerprint,
        device_type: credentials.device_type ?? "WEB",
        device_name: credentials.device_name ?? "Stoxify Admin Console",
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
    email: credentials.email.trim(),
    status: loginResponse.status,
    code: loginData.code,
  });

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
      email: credentials.email.trim(),
      code: session.code,
    });

    if (session.code === "ADMIN_ACCESS_REQUIRED") {
      await logAdminGateDenied({
        ip,
        email: credentials.email.trim(),
        deviceId,
        userId: loginData.user?.user_id ?? session.user?.user_id,
        dashboardStatus: 403,
      });
    }

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
