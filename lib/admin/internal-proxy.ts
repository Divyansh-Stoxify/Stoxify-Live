import "server-only";

import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

import { backendUrls, forwardedIpHeaders, signedBackendFetch } from "@/lib/backend/index";
import { adminCookieNames } from "@/lib/admin/cookies";
import { rejectCrossOriginPost } from "@/lib/admin/csrf";
import { readAdminSession } from "@/lib/admin/server-session";

type BackendKey = keyof typeof backendUrls;

/**
 * Some operations only have a backend handler behind `interServiceAuth`
 * (X-Internal-Secret) — broadcast notifications, market-data instrument
 * mutations, etc. For those, the admin BFF authenticates the admin against
 * the cookies + RBAC powers, then re-signs the request to the backend with
 * the shared internal secret.
 *
 * We never accept the internal secret from the client. The check is:
 *   1. Admin must hold a valid session cookie.
 *   2. Admin's RBAC powers must include `requiredPower`.
 *   3. INTERNAL_SECRET must be configured in the BFF env.
 * If any of those fail, we 401/403/503 BEFORE reaching out.
 */
export async function proxyAdminInternalRequest({
  request,
  backend,
  path,
  method,
  requiredPower,
  query,
  bodyTransform,
}: {
  request: NextRequest;
  backend: BackendKey;
  path: string;
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  requiredPower: string;
  query?: Record<string, string | number | undefined>;
  /** Optional transform applied to the body the client sent (already parsed). */
  bodyTransform?: (body: unknown) => unknown;
}): Promise<NextResponse> {
  if (method !== "GET") {
    const reject = rejectCrossOriginPost(request);
    if (reject) return reject;
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

  // RBAC check happens HERE — the backend handler runs under interServiceAuth,
  // which does not enforce per-power authorization on its own.
  const session = await readAdminSession({ accessToken, deviceId }).catch(() => null);
  if (!session?.authenticated) {
    return NextResponse.json(
      { error: "Admin session expired", code: "NO_SESSION" },
      { status: 401 }
    );
  }
  if (!session.powers?.includes(requiredPower)) {
    return NextResponse.json(
      { error: "Insufficient permissions", code: "FORBIDDEN" },
      { status: 403 }
    );
  }

  const internalSecret = process.env.INTERNAL_SECRET;
  if (!internalSecret) {
    console.error(
      "[admin-internal] INTERNAL_SECRET is not set; cannot proxy to internal backend endpoints"
    );
    return NextResponse.json(
      {
        error:
          "Server is not configured for this operation. Set INTERNAL_SECRET in the frontend env.",
        code: "INTERNAL_SECRET_MISSING",
      },
      { status: 503 }
    );
  }

  let body: unknown = undefined;
  if (method !== "GET") {
    try {
      body = await request.json();
    } catch {
      body = {};
    }
    if (bodyTransform) body = bodyTransform(body);
  }

  let upstream: Response;
  try {
    upstream = await signedBackendFetch({
      baseUrl: backendUrls[backend],
      path,
      method,
      deviceId,
      query,
      body,
      extraHeaders: {
        ...forwardedIpHeaders(request),
        "X-Internal-Secret": internalSecret,
      },
    });
    console.log(
      `[PROXY ADMIN] Fetched ${backendUrls[backend]}${path} - Status: ${upstream.status}`
    );
  } catch (error) {
    console.error(`[PROXY ADMIN] Fetch error for ${backendUrls[backend]}${path}:`, error);
    return NextResponse.json(
      { error: "Unable to reach backend service", code: "SERVICE_UNAVAILABLE" },
      { status: 503 }
    );
  }

  const contentType = upstream.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    const data = await upstream.json().catch(() => ({}));
    return NextResponse.json(data, { status: upstream.status });
  }
  const text = await upstream.text().catch(() => "");
  return new NextResponse(text, {
    status: upstream.status,
    headers: { "content-type": contentType || "text/plain" },
  });
}
