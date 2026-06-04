import { randomUUID } from "node:crypto";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

import { backendUrls, clientIpFromRequest, forwardedIpHeaders, signedBackendFetch } from "@/lib/backend/index";
import { rejectCrossOriginPost } from "@/lib/auth/csrf";
import { userCookieNames } from "@/lib/auth/cookies";
import { checkUserLoginRateLimit } from "@/lib/auth/rate-limit";

type BackendRegisterResponse = {
  user_id?: string;
  email?: string;
  state?: string;
  error?: string;
  message?: string;
  code?: string;
};

type RegisterRequestBody = {
  name?: string;
  email?: string;
  password?: string;
  phone?: string;
};

const ERROR_MAP: Record<string, string> = {
  EMAIL_EXISTS: "An account with this email already exists. Try logging in.",
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
    return NextResponse.json(
      { error: "Too many requests. Please try again later.", code: "RATE_LIMITED" },
      {
        status: 429,
        headers: {
          "Retry-After": String(rateLimit.retryAfterSec),
          "X-RateLimit-Reset": String(Math.ceil(rateLimit.resetAt / 1000)),
        },
      }
    );
  }

  let body: RegisterRequestBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body", code: "BAD_REQUEST" }, { status: 400 });
  }

  if (!body.name || !body.email || !body.password) {
    return NextResponse.json(
      { error: "Name, email and password are required", code: "BAD_REQUEST" },
      { status: 400 }
    );
  }

  const cookieStore = await cookies();
  const deviceId =
    cookieStore.get(userCookieNames.deviceId)?.value ?? `user-web-${randomUUID()}`;

  let registerResponse: Response;
  try {
    registerResponse = await signedBackendFetch({
      baseUrl: backendUrls.auth,
      path: "/auth/register",
      method: "POST",
      deviceId,
      body: {
        name: body.name.trim(),
        email: body.email.trim(),
        password: body.password,
        device_id: deviceId,
      },
      extraHeaders: forwardedIpHeaders(request),
    });
  } catch {
    return NextResponse.json(
      { error: "Unable to reach the auth service", code: "SERVICE_UNAVAILABLE" },
      { status: 503 }
    );
  }

  const registerData = await readBackendJson<BackendRegisterResponse>(registerResponse);

  console.info("[user-register] Registration attempt", {
    ip,
    email: body.email.trim(),
    status: registerResponse.status,
    code: registerData.code,
  });

  if (!registerResponse.ok) {
    const code = registerData.code ?? "";
    const userMessage = ERROR_MAP[code] ?? "Unable to create account";
    return NextResponse.json({ error: userMessage, code }, { status: registerResponse.status || 400 });
  }

  const redirectTo = `/verify-email?email=${encodeURIComponent(body.email.trim())}`;

  const response = NextResponse.json({ ok: true, redirectTo });
  response.cookies.set(userCookieNames.deviceId, deviceId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });

  return response;
}
