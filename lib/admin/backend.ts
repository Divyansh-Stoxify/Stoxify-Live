import "server-only";

import { randomUUID } from "node:crypto";

import { buildSignedHeaders } from "@/lib/auth/signRequest";

const defaultTimeoutMs = Number(process.env.BACKEND_FETCH_TIMEOUT_MS ?? 10_000);

function getBackendUrl(envName: "AUTH_SERVICE_URL" | "USER_SERVICE_URL", fallback: string) {
  const value = process.env[envName];

  if (!value && process.env.NODE_ENV === "production") {
    throw new Error(`${envName} is required in production.`);
  }

  return value ?? fallback;
}

export const backendUrls = {
  get auth() {
    return getBackendUrl("AUTH_SERVICE_URL", "http://localhost:8001");
  },
  get user() {
    return getBackendUrl("USER_SERVICE_URL", "http://localhost:8002");
  },
};

/**
 * Sends a signed JSON request to a backend service using the admin web device ID.
 * Non-GET/HEAD requests serialize the provided body into the signed payload.
 */
export async function signedBackendFetch({
  baseUrl,
  path,
  method = "GET",
  body,
  accessToken,
  deviceId,
  timeoutMs = defaultTimeoutMs,
}: {
  baseUrl: string;
  path: string;
  method?: string;
  body?: unknown;
  accessToken?: string;
  deviceId?: string;
  timeoutMs?: number;
}): Promise<Response> {
  const normalizedMethod = method.toUpperCase();
  const bodyText =
    normalizedMethod === "GET" || normalizedMethod === "HEAD" ? "{}" : JSON.stringify(body ?? {});
  const resolvedDeviceId = deviceId ?? `admin-web-${randomUUID()}`;

  return fetch(`${baseUrl}${path}`, {
    method: normalizedMethod,
    headers: buildSignedHeaders({
      method: normalizedMethod,
      path,
      body: bodyText,
      deviceId: resolvedDeviceId,
      jwt: accessToken,
    }),
    body: normalizedMethod === "GET" || normalizedMethod === "HEAD" ? undefined : bodyText,
    cache: "no-store",
    signal: AbortSignal.timeout(timeoutMs),
  });
}
