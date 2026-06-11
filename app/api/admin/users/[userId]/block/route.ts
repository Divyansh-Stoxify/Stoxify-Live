import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

import { backendUrls, forwardedIpHeaders, signedBackendFetch } from "@/lib/backend/index";
import { adminCookieNames } from "@/lib/admin/cookies";
import { rejectCrossOriginPost } from "@/lib/admin/csrf";

type RouteContext = { params: Promise<{ userId: string }> };

// The backend doesn't expose a dedicated /users/:id/block route — blocking is
// just a state transition. We translate this POST into a PATCH on
// /users/:id/state with new_state=BLOCKED, keeping the admin JWT so the
// backend's PWR_USER_STATE_CHANGE power check still gates the operation.
export async function POST(request: NextRequest, context: RouteContext) {
  const reject = rejectCrossOriginPost(request);
  if (reject) return reject;

  const { userId } = await context.params;

  let body: { reason?: string } = {};
  try {
    body = await request.json();
  } catch {
    // body is optional — backend just needs a non-empty reason.
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
      path: `/users/${encodeURIComponent(userId)}/state`,
      method: "PATCH",
      accessToken,
      deviceId,
      body: {
        new_state: "BLOCKED",
        reason: body.reason?.trim() || "Blocked by admin",
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
