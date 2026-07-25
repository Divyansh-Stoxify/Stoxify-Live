import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { backendUrls, forwardedIpHeaders, signedBackendFetch } from "@/lib/backend/index";
import { userCookieNames } from "@/lib/auth/cookies";
import { decodeJwtPayload } from "@/lib/auth/server-session";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ plan_id: string }> }
): Promise<NextResponse> {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(userCookieNames.accessToken)?.value;
  const deviceId = cookieStore.get(userCookieNames.deviceId)?.value ?? "user-web-unknown";

  if (!accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { plan_id } = await params;
  if (!plan_id) {
    return NextResponse.json({ error: "Missing plan_id" }, { status: 400 });
  }

  const searchParams = request.nextUrl.searchParams;
  const batch_id = searchParams.get("batch_id") ?? plan_id;
  
  let analystId = searchParams.get("analyst_id");
  if (!analystId) {
    const decoded = decodeJwtPayload(accessToken);
    if (decoded?.user_id) {
      analystId = decoded.user_id;
    }
  }
  
  if (!analystId) {
    return NextResponse.json({ error: "Missing analyst_id" }, { status: 400 });
  }

  const query: Record<string, string | undefined> = {
    range: searchParams.get("range") ?? "TODAY",
    from: searchParams.get("from") ?? undefined,
    to: searchParams.get("to") ?? undefined,
    format: "xlsx",
  };

  try {
    const backendResponse = await signedBackendFetch({
      baseUrl: backendUrls.trade,
      path: `/trades/analysts/${analystId}/batches/${batch_id}/report/export`,
      method: "GET",
      deviceId,
      accessToken,
      query,
      extraHeaders: forwardedIpHeaders(request),
      timeoutMs: 60_000,
    });

    if (!backendResponse.ok) {
      const errorJson = await backendResponse.json().catch(() => null);
      return NextResponse.json(
        errorJson || { error: "Failed to generate report" }, 
        { status: backendResponse.status }
      );
    }

    const contentDisposition = backendResponse.headers.get("Content-Disposition") ?? "";
    
    return new NextResponse(backendResponse.body, {
      status: backendResponse.status,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": contentDisposition,
      },
    });
  } catch (error) {
    console.error("[analyst/plans/[plan_id]/reports] GET failed:", error);
    return NextResponse.json({ error: "Unable to reach trade service" }, { status: 503 });
  }
}
