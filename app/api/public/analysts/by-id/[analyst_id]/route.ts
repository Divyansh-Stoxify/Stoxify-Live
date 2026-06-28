import { NextRequest, NextResponse } from "next/server";
import { backendUrls, forwardedIpHeaders, signedBackendFetch } from "@/lib/backend/index";

/**
 * GET /api/public/analysts/by-id/[analyst_id] — Fetch a public analyst profile by id.
 * Calls GET /users/public/analysts/by-id/:user_id on the user-service.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ analyst_id: string }> }
): Promise<NextResponse> {
  const { analyst_id } = await params;

  try {
    const backendResponse = await signedBackendFetch({
      baseUrl: backendUrls.user,
      path: `/users/public/analysts/by-id/${analyst_id}`,
      method: "GET",
      deviceId: "public-request",
      extraHeaders: forwardedIpHeaders(request),
    });

    const data = await backendResponse.json().catch(() => ({}));
    return NextResponse.json(data, { status: backendResponse.status });
  } catch (error) {
    console.error("[public/analysts/by-id] GET failed:", error);
    return NextResponse.json({ error: "Unable to reach user service" }, { status: 503 });
  }
}
