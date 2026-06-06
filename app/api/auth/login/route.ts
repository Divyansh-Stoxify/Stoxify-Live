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
import { writeUserTokenCookies } from "@/lib/auth/server-session";

type BackendLoginResponse = {
  access_token?: string;
  refresh_token?: string;
  session_id?: string;
  user?: {
    user_id?: string;
    name?: string;
    email?: string;
    state?: string;
  };
  error?: string;
  message?: string;
  code?: string;
};

type LoginRequestBody = {
  email?: string;
  password?: string;
  device_fingerprint?: Record<string, unknown>;
  device_type?: "WEB" | "ANDROID" | "IOS";
  device_name?: string;
};

const ERROR_MAP: Record<string, string> = {
  INVALID_CREDENTIALS: "Email or password is incorrect",
  ACCOUNT_LOCKED: "Account locked. Try again in 15 minutes.",
  ACCOUNT_INACTIVE: "This account is suspended. Contact support.",
};

async function readBackendJson<T>(response: Response): Promise<T> {
  try {
    return (await response.json()) as T;
  } catch {
    return {} as T;
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const csrfRejection = rejectCrossOriginPost(request);
  if (csrfRejection) return csrfRejection;

  const ip = clientIpFromRequest(request);

  const rateLimit = checkUserLoginRateLimit(ip);
  if (!rateLimit.ok) {
    console.warn("[user-login] Rate limit exceeded", {
      ip,
      retryAfterSec: rateLimit.retryAfterSec,
    });
    return NextResponse.json(
      { error: "Too many login attempts. Please try again later.", code: "RATE_LIMITED" },
      {
        status: 429,
        headers: {
          "Retry-After": String(rateLimit.retryAfterSec),
          "X-RateLimit-Reset": String(Math.ceil(rateLimit.resetAt / 1000)),
        },
      }
    );
  }

  let body: LoginRequestBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request body", code: "BAD_REQUEST" },
      { status: 400 }
    );
  }

  if (!body.email || !body.password) {
    return NextResponse.json(
      { error: "Email and password are required", code: "BAD_REQUEST" },
      { status: 400 }
    );
  }

  const cookieStore = await cookies();
  const deviceId = cookieStore.get(userCookieNames.deviceId)?.value ?? `user-web-${randomUUID()}`;

  let loginResponse: Response;
  try {
    loginResponse = await signedBackendFetch({
      baseUrl: backendUrls.auth,
      path: "/auth/login",
      method: "POST",
      deviceId,
      body: {
        email: body.email.trim(),
        password: body.password,
        device_fingerprint: body.device_fingerprint,
        device_type: body.device_type ?? "WEB",
        device_name: body.device_name ?? "Stoxify Web",
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

  console.info("[user-login] Login attempt", {
    ip,
    email: body.email.trim(),
    status: loginResponse.status,
    code: loginData.code,
  });

  if (!loginResponse.ok || !loginData.access_token) {
    const code = loginData.code ?? "";
    const userMessage = ERROR_MAP[code] ?? "Unable to sign in";
    return NextResponse.json({ error: userMessage, code }, { status: loginResponse.status || 401 });
  }

  const userState = loginData.user?.state ?? "";
  if (userState === "BLOCKED" || userState === "SUSPENDED") {
    return NextResponse.json(
      { error: ERROR_MAP["ACCOUNT_INACTIVE"], code: "ACCOUNT_INACTIVE" },
      { status: 403 }
    );
  }

  const response = NextResponse.json({
    ok: true,
    user: loginData.user,
    redirectTo: "/dashboard",
  });

  writeUserTokenCookies(response, {
    access_token: loginData.access_token,
    refresh_token: loginData.refresh_token,
    session_id: loginData.session_id,
    device_id: deviceId,
    user: loginData.user,
  });

  return response;
}
