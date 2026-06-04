import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

import { backendUrls, forwardedIpHeaders, signedBackendFetch } from "@/lib/backend/index";
import { rejectCrossOriginPost } from "@/lib/auth/csrf";
import { userCookieNames } from "@/lib/auth/cookies";

export async function POST(request: NextRequest): Promise<NextResponse> {
  const csrfRejection = rejectCrossOriginPost(request);
  if (csrfRejection) return csrfRejection;

  let body: { email?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body", code: "BAD_REQUEST" }, { status: 400 });
  }

  if (!body.email) {
    return NextResponse.json({ error: "Email address is required", code: "BAD_REQUEST" }, { status: 400 });
  }

  const cookieStore = await cookies();
  const deviceId = cookieStore.get(userCookieNames.deviceId)?.value ?? "user-web-resend";

  let response: Response;
  try {
    response = await signedBackendFetch({
      baseUrl: backendUrls.auth,
      path: "/auth/request-email-otp",
      method: "POST",
      deviceId,
      body: {
        email: body.email.trim().toLowerCase(),
      },
      extraHeaders: forwardedIpHeaders(request),
    });
  } catch {
    return NextResponse.json(
      { error: "Unable to reach the auth service", code: "SERVICE_UNAVAILABLE" },
      { status: 503 }
    );
  }

  if (!response.ok) {
    const data = (await response.json().catch(() => ({}))) as { error?: string; code?: string };
    const userMessage = data.error ?? "Failed to resend verification code.";
    return NextResponse.json({ error: userMessage, code: data.code }, { status: response.status || 400 });
  }

  return NextResponse.json({ ok: true });
}
