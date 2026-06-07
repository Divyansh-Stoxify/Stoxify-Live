import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

import { backendUrls, forwardedIpHeaders, signedBackendFetch } from "@/lib/backend/index";
import { adminCookieNames } from "@/lib/admin/cookies";
import { rejectCrossOriginPost } from "@/lib/admin/csrf";

type RouteContext = { params: Promise<{ analystId: string }> };

// Analyst user_ids share the User collection — block is the same state
// transition as for end users. Backend gates on PWR_USER_STATE_CHANGE.
export async function POST(request: NextRequest, context: RouteContext) {
  const reject = rejectCrossOriginPost(request);
  if (reject) return reject;

  const { analystId } = await context.params;

  let body: { reason?: string } = {};
  try {
    body = await request.json();
  } catch {
    // body is optional
  }

  const store = await cookies();
  const accessToken = store.get(adminCookieNames.accessToken)?.value;
  const deviceId = store.get(adminCookieNames.deviceId)?.value;
  if (!accessToken || !deviceId) {
    return NextResponse.json(
      { error: "Admin session required", code: "NO_SESSION" },
      { status: 401 }
    );
  }

  let backendResponse: Response;
  try {
    backendResponse = await signedBackendFetch({
      baseUrl: backendUrls.user,
      path: `/users/${encodeURIComponent(analystId)}/state`,
      method: "PATCH",
      accessToken,
      deviceId,
      body: {
        new_state: "BLOCKED",
        reason: body.reason?.trim() || "Analyst blocked by admin",
      },
      extraHeaders: forwardedIpHeaders(request),
    });
  } catch {
    return NextResponse.json(
      { error: "Unable to reach backend service", code: "SERVICE_UNAVAILABLE" },
      { status: 503 }
    );
  }

  const data = await backendResponse.json().catch(() => ({}));
  return NextResponse.json(data, { status: backendResponse.status });
}
