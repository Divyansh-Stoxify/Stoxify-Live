import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

import { backendUrls, forwardedIpHeaders, signedBackendFetch } from "@/lib/backend/index";
import { rejectCrossOriginPost } from "@/lib/auth/csrf";
import { userCookieNames } from "@/lib/auth/cookies";

/**
 * GET /api/analyst/bank-account — the analyst's payout account.
 *
 * Returns the account currently receiving payouts, any submission still under
 * review, and the most recent rejection (so the UI can show why).
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(userCookieNames.accessToken)?.value;
  const deviceId = cookieStore.get(userCookieNames.deviceId)?.value ?? "user-web-unknown";

  if (!accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const backendResponse = await signedBackendFetch({
      baseUrl: backendUrls.user,
      path: "/users/analysts/me/bank-account",
      method: "GET",
      deviceId,
      accessToken,
      extraHeaders: forwardedIpHeaders(request),
    });

    const data = await backendResponse.json().catch(() => ({}));
    return NextResponse.json(data, { status: backendResponse.status });
  } catch (error) {
    console.error("[analyst/bank-account] GET failed:", error);
    return NextResponse.json({ error: "Unable to reach user service" }, { status: 503 });
  }
}

/**
 * POST /api/analyst/bank-account — submit bank details + proof document.
 *
 * Creates a new PENDING_REVIEW record. The live payout destination is not
 * touched until a reviewer approves it. Generous timeout because the body
 * carries a base64 document of up to 10 MB.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const csrfRejection = rejectCrossOriginPost(request);
  if (csrfRejection) return csrfRejection;

  const cookieStore = await cookies();
  const accessToken = cookieStore.get(userCookieNames.accessToken)?.value;
  const deviceId = cookieStore.get(userCookieNames.deviceId)?.value ?? "user-web-unknown";

  if (!accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  if (!body || typeof body.account_number !== "string" || typeof body.proof_doc_base64 !== "string") {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  try {
    const backendResponse = await signedBackendFetch({
      baseUrl: backendUrls.user,
      path: "/users/analysts/me/bank-account",
      method: "POST",
      deviceId,
      accessToken,
      body,
      extraHeaders: forwardedIpHeaders(request),
      timeoutMs: 45_000,
    });

    const data = await backendResponse.json().catch(() => ({}));
    return NextResponse.json(data, { status: backendResponse.status });
  } catch (error) {
    console.error("[analyst/bank-account] POST failed:", error);
    return NextResponse.json({ error: "Unable to reach user service" }, { status: 503 });
  }
}
