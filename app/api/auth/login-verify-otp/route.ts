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
import { writeUserTokenCookies, decodeJwtPayload } from "@/lib/auth/server-session";

type BackendVerifyResponse = {
  access_token?: string;
  refresh_token?: string;
  session_id?: string;
  is_new_user?: boolean;
  registration_token?: string;
  user?: {
    user_id?: string;
    name?: string;
    email?: string;
    phone?: string;
    state?: string;
    user_type?: string;
  };
  error?: string;
  message?: string;
  code?: string;
};

const ERROR_MAP: Record<string, string> = {
  INVALID_OTP: "Invalid or expired code. If you haven't signed up yet, create an account first.",
  ACCOUNT_INACTIVE: "This account is suspended. Contact support.",
  RATE_LIMITED: "Too many attempts. Please try again later.",
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
      { error: "Too many attempts. Please try again later.", code: "RATE_LIMITED" },
      { status: 429, headers: { "Retry-After": String(rateLimit.retryAfterSec) } }
    );
  }

  let body: { identifier?: string; otp?: string; device_name?: string; intent?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request body", code: "BAD_REQUEST" },
      { status: 400 }
    );
  }

  if (!body.identifier || !body.otp) {
    return NextResponse.json(
      { error: "Identifier and code are required", code: "BAD_REQUEST" },
      { status: 400 }
    );
  }

  if (body.otp.length !== 6) {
    return NextResponse.json(
      { error: "Code must be 6 digits", code: "BAD_REQUEST" },
      { status: 400 }
    );
  }

  const cookieStore = await cookies();
  const deviceId = cookieStore.get(userCookieNames.deviceId)?.value ?? `user-web-${randomUUID()}`;

  let backendResponse: Response;
  try {
    backendResponse = await signedBackendFetch({
      baseUrl: backendUrls.auth,
      path: body.intent === "ANALYST" ? "/auth/analyst/verify-otp" : "/auth/login/verify-otp",
      method: "POST",
      deviceId,
      body: {
        identifier: body.identifier.trim(),
        otp: body.otp.trim(),
        device_type: "WEB",
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

  const data = await readBackendJson<BackendVerifyResponse>(backendResponse);

  console.info("[user-login] OTP verify", {
    ip,
    identifier: body.identifier.trim(),
    status: backendResponse.status,
    code: data.code,
  });

  if (!backendResponse.ok || (!data.access_token && !data.is_new_user)) {
    const code = data.code ?? "";
    const message = ERROR_MAP[code] ?? data.error ?? "Unable to sign in";
    return NextResponse.json({ error: message, code }, { status: backendResponse.status || 401 });
  }

  // If this is a new user in the Analyst flow, return the registration token
  // to the frontend so it can display the registration form.
  if (data.is_new_user && data.registration_token) {
    return NextResponse.json({
      ok: true,
      is_new_user: true,
      registration_token: data.registration_token,
    });
  }

  // Try to decode user_type from the JWT in case the backend is running an older version
  // that doesn't include user_type directly in the user object response.
  let actualUserType = data.user?.user_type;
  if (!actualUserType && data.access_token) {
    const jwt = decodeJwtPayload(data.access_token);
    actualUserType = jwt?.user_type;
  }

  console.info("[user-login] user_type resolution", {
    intent: body.intent,
    backendUserType: data.user?.user_type,
    jwtUserType: data.access_token ? decodeJwtPayload(data.access_token)?.user_type : "no-token",
    actualUserType,
    redirectTo: actualUserType === "ANALYST" ? "/dashboard" : "/trader/dashboard",
  });

  // If the login intent was specifically for an Analyst, but the user is not an Analyst, reject it.
  if (body.intent === "ANALYST" && actualUserType !== "ANALYST") {
    // Note: The backend already created a session, so ideally we would revoke it, but for now
    // we simply don't write the cookies so the frontend remains unauthenticated.
    return NextResponse.json(
      {
        error: "This account is not registered as a Research Analyst. Please use the Trader login.",
        code: "INVALID_USER_TYPE",
      },
      { status: 403 }
    );
  }

  const response = NextResponse.json({
    ok: true,
    user: { ...data.user, user_type: actualUserType },
    redirectTo: actualUserType === "ANALYST" ? "/dashboard" : "/trader/dashboard",
  });

  writeUserTokenCookies(response, {
    access_token: data.access_token!,
    refresh_token: data.refresh_token,
    session_id: data.session_id,
    device_id: deviceId,
    user: { ...data.user, user_type: actualUserType },
  });

  return response;
}
