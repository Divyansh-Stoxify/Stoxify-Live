import "server-only";

import { NextRequest } from "next/server";

import { buildSignedHeaders } from "@/lib/auth/signRequest";

const defaultTimeoutMs = Number(process.env.BACKEND_FETCH_TIMEOUT_MS ?? 10_000);

type BackendEnvName =
  | "AUTH_SERVICE_URL"
  | "USER_SERVICE_URL"
  | "TRADE_SERVICE_URL"
  | "RBAC_SERVICE_URL"
  | "PLAN_SERVICE_URL"
  | "MARKET_DATA_SERVICE_URL"
  | "NOTIFICATION_SERVICE_URL"
  | "SUBSCRIPTION_SERVICE_URL";

function getBackendUrl(envName: BackendEnvName, fallback: string) {
  const value = process.env[envName];

  if (!value && process.env.NODE_ENV !== "development") {
    throw new Error(`${envName} is required outside of development.`);
  }

  return value ?? fallback;
}

export const backendUrls = {
  get auth() {
    return getBackendUrl("AUTH_SERVICE_URL", "https://stoxify-backend-monolith.onrender.com");
  },
  get user() {
    return getBackendUrl("USER_SERVICE_URL", "https://stoxify-backend-monolith.onrender.com");
  },
  get trade() {
    return getBackendUrl("TRADE_SERVICE_URL", "https://stoxify-backend-monolith.onrender.com");
  },
  get rbac() {
    return getBackendUrl("RBAC_SERVICE_URL", "https://stoxify-backend-monolith.onrender.com");
  },
  get plan() {
    return getBackendUrl("PLAN_SERVICE_URL", "https://stoxify-backend-monolith.onrender.com");
  },
  get marketData() {
    return getBackendUrl(
      "MARKET_DATA_SERVICE_URL",
      "https://stoxify-backend-monolith.onrender.com"
    );
  },
  get notification() {
    return getBackendUrl(
      "NOTIFICATION_SERVICE_URL",
      "https://stoxify-backend-monolith.onrender.com"
    );
  },
  get subscription() {
    return getBackendUrl(
      "SUBSCRIPTION_SERVICE_URL",
      "https://stoxify-backend-monolith.onrender.com"
    );
  },
};

export async function signedBackendFetch({
  baseUrl,
  path,
  method = "GET",
  body,
  accessToken,
  deviceId,
  query,
  extraHeaders,
  timeoutMs = defaultTimeoutMs,
}: {
  baseUrl: string;
  path: string;
  method?: string;
  body?: unknown;
  accessToken?: string;
  deviceId: string;
  query?: Record<string, string | number | undefined>;
  extraHeaders?: Record<string, string | undefined>;
  timeoutMs?: number;
}): Promise<Response> {
  const normalizedMethod = method.toUpperCase();
  const qs = query
    ? "?" +
      new URLSearchParams(
        Object.entries(query)
          .filter((entry): entry is [string, string | number] => entry[1] !== undefined)
          .map(([k, v]) => [k, String(v)])
      ).toString()
    : "";
  const fullPath = `${path}${qs}`;
  const bodyText =
    normalizedMethod === "GET" || normalizedMethod === "HEAD" ? "{}" : JSON.stringify(body ?? {});

  return fetch(`${baseUrl}${fullPath}`, {
    method: normalizedMethod,
    headers: {
      ...buildSignedHeaders({
        method: normalizedMethod,
        path: fullPath,
        body: bodyText,
        deviceId,
        jwt: accessToken,
      }),
      ...Object.fromEntries(
        Object.entries(extraHeaders ?? {}).filter((entry): entry is [string, string] =>
          Boolean(entry[1])
        )
      ),
    },
    body: normalizedMethod === "GET" || normalizedMethod === "HEAD" ? undefined : bodyText,
    cache: "no-store",
    signal: AbortSignal.timeout(timeoutMs),
  });
}

export function clientIpFromRequest(request: NextRequest): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

export function forwardedIpHeaders(request: NextRequest): Record<string, string> {
  const ip = clientIpFromRequest(request);
  return {
    "X-Forwarded-For": ip,
    "X-Real-IP": ip,
  };
}
