import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

import { backendUrls, clientIpFromRequest, forwardedIpHeaders, signedBackendFetch } from "@/lib/backend/index";
import { rejectCrossOriginPost } from "@/lib/auth/csrf";
import { userCookieNames } from "@/lib/auth/cookies";
import { checkUserLoginRateLimit } from "@/lib/auth/rate-limit";

type BackendVerifyResponse = {
  success?: boolean;
  state?: string;
  error?: string;
  message?: string;
  code?: string;
};

const ERROR_MAP: Record<string, string> = {
  INVALID_OTP: "Invalid or expired code. Check your inbox and try again.",
  ALREADY_VERIFIED: "This email has already been verified. You can log in.",
  NOT_FOUND: "We couldn't find an account with that email.",
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
      {
        status: 429,
        headers: { "Retry-After": String(rateLimit.retryAfterSec) },
      }
    );
  }

  let body: { email?: string; otp?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body", code: "BAD_REQUEST" }, { status: 400 });
  }

  if (!body.email || !body.otp) {
    return NextResponse.json(
      { error: "Email and verification code are required", code: "BAD_REQUEST" },
      { status: 400 }
    );
  }

  if (body.otp.length !== 6) {
    return NextResponse.json(
      { error: "Verification code must be 6 digits", code: "BAD_REQUEST" },
      { status: 400 }
    );
  }

  const cookieStore = await cookies();
  const deviceId = cookieStore.get(userCookieNames.deviceId)?.value ?? `user-web-verify`;

  let verifyResponse: Response;
  try {
    verifyResponse = await signedBackendFetch({
      baseUrl: backendUrls.auth,
      path: "/auth/verify-email",
      method: "POST",
      deviceId,
      body: {
        email: body.email.trim(),
        otp: body.otp.trim(),
      },
      extraHeaders: forwardedIpHeaders(request),
    });
  } catch {
    return NextResponse.json(
      { error: "Unable to reach the auth service", code: "SERVICE_UNAVAILABLE" },
      { status: 503 }
    );
  }

  const verifyData = await readBackendJson<BackendVerifyResponse>(verifyResponse);

  if (!verifyResponse.ok) {
    const code = verifyData.code ?? "";
    const userMessage = ERROR_MAP[code] ?? "Verification failed. Please try again.";
    const httpStatus = code === "ALREADY_VERIFIED" ? 200 : verifyResponse.status || 400;

    if (code === "ALREADY_VERIFIED") {
      return NextResponse.json({ ok: true, alreadyVerified: true, redirectTo: "/login" });
    }
    return NextResponse.json({ error: userMessage, code }, { status: httpStatus });
  }

  return NextResponse.json({ ok: true, redirectTo: "/login?verified=1" });
}
