import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

import { backendUrls, forwardedIpHeaders, signedBackendFetch } from "@/lib/backend/index";
import { userCookieNames } from "@/lib/auth/cookies";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(userCookieNames.accessToken)?.value;
  const deviceId = cookieStore.get(userCookieNames.deviceId)?.value ?? "user-web-unknown";

  if (!accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = request.nextUrl;
  const query: Record<string, string | undefined> = {
    type: searchParams.get("type") ?? undefined,
    read: searchParams.get("read") ?? undefined,
    limit: searchParams.get("limit") ?? "20",
    offset: searchParams.get("offset") ?? "0",
  };
  console.log("NEXTJS RECEIVED READ:", searchParams.get("read"));


  try {
    const backendResponse = await signedBackendFetch({
      baseUrl: backendUrls.notification,
      path: "/notifications/",
      method: "GET",
      deviceId,
      accessToken,
      query,
      extraHeaders: forwardedIpHeaders(request),
    });

    const data = await backendResponse.json().catch(() => ({}));
    console.log("GET /notifications RESPONSE:", data);

    return NextResponse.json(data, { status: backendResponse.status });
  } catch {
    return NextResponse.json({ error: "Unable to reach notification service" }, { status: 503 });
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(userCookieNames.accessToken)?.value;
  const deviceId = cookieStore.get(userCookieNames.deviceId)?.value ?? "user-web-unknown";

  if (!accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { notification_id?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  if (!body.notification_id) {
    return NextResponse.json({ error: "notification_id required" }, { status: 400 });
  }

  try {
    const backendResponse = await signedBackendFetch({
      baseUrl: backendUrls.notification,
      path: `/notifications/${body.notification_id}/read`,
      method: "POST",
      deviceId,
      accessToken,
      body: {},
      extraHeaders: forwardedIpHeaders(request),
    });

    const data = await backendResponse.json().catch(() => ({}));

    console.log("MARK READ BACKEND RESPONSE:", backendResponse.status, data);

    return NextResponse.json(data, { status: backendResponse.status });
  } catch {
    return NextResponse.json({ error: "Unable to reach notification service" }, { status: 503 });
  }
}
