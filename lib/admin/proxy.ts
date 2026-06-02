import "server-only";

import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

import { backendUrls, signedBackendFetch } from "@/lib/admin/backend";
import { adminCookieNames } from "@/lib/admin/cookies";
import { rejectCrossOriginPost } from "@/lib/admin/csrf";
import { forwardedIpHeaders } from "@/lib/admin/server-session";

type BackendKey = keyof typeof backendUrls;

function isMutatingMethod(method: string) {
  return !["GET", "HEAD", "OPTIONS"].includes(method.toUpperCase());
}

function queryFromRequest(request: NextRequest) {
  const query: Record<string, string> = {};
  request.nextUrl.searchParams.forEach((value, key) => {
    query[key] = value;
  });
  return Object.keys(query).length ? query : undefined;
}

async function bodyFromRequest(request: NextRequest) {
  if (!isMutatingMethod(request.method)) {
    return undefined;
  }

  const text = await request.text();
  if (!text) {
    return undefined;
  }

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

async function proxyResponse(response: Response) {
  const contentType = response.headers.get("content-type") ?? "";
  const headers = new Headers();
  if (contentType) {
    headers.set("content-type", contentType);
  }

  if (contentType.includes("application/json")) {
    const data = await response.json().catch(() => ({}));
    return NextResponse.json(data, { status: response.status });
  }

  const text = await response.text().catch(() => "");
  return new NextResponse(text, { status: response.status, headers });
}

export async function proxyAdminRequest({
  request,
  backend,
  path,
  method,
}: {
  request: NextRequest;
  backend: BackendKey;
  path: string;
  method?: string;
}) {
  if (isMutatingMethod(method ?? request.method)) {
    const reject = rejectCrossOriginPost(request);
    if (reject) return reject;
  }

  const cookieStore = await cookies();
  const accessToken = cookieStore.get(adminCookieNames.accessToken)?.value;
  const deviceId = cookieStore.get(adminCookieNames.deviceId)?.value;

  if (!accessToken || !deviceId) {
    return NextResponse.json(
      { error: "Admin session required", code: "NO_SESSION" },
      { status: 401 }
    );
  }

  let response: Response;
  try {
    response = await signedBackendFetch({
      baseUrl: backendUrls[backend],
      path,
      method: method ?? request.method,
      accessToken,
      deviceId,
      query: queryFromRequest(request),
      body: await bodyFromRequest(request),
      extraHeaders: forwardedIpHeaders(request),
    });
  } catch {
    return NextResponse.json(
      { error: "Unable to reach backend service", code: "SERVICE_UNAVAILABLE" },
      { status: 503 }
    );
  }

  return proxyResponse(response);
}
