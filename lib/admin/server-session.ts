import "server-only";

import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

import { backendUrls, signedBackendFetch } from "@/lib/admin/backend";
import { adminCookieNames, adminCookieOptions } from "@/lib/admin/cookies";
import type { AdminSessionPayload, AdminUser } from "@/lib/admin/session-shared";

type JwtPayload = {
  user_id?: string;
  user_type?: string;
  state?: string;
  roles?: string[];
  name?: string;
};

type BackendPermission = {
  power_id?: string;
};

type BackendPermissionsResponse = {
  powers?: BackendPermission[];
  roles?: { role_id?: string; role_name?: string }[];
};

function isAdminConsoleRole(role: string) {
  const normalized = role.toUpperCase().replace(/^ROLE_/, "");
  return normalized === "FOUNDER" || normalized === "ADMIN";
}

export function decodeJwtPayload(token: string): JwtPayload | null {
  const payload = token.split(".")[1];
  if (!payload) return null;

  try {
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(Buffer.from(normalized, "base64").toString("utf8")) as JwtPayload;
  } catch {
    return null;
  }
}

export function clientIpFromRequest(request: NextRequest) {
  return request.headers.get("x-forwarded-for")?.split(",")[0].trim() || request.headers.get("x-real-ip") || "unknown";
}

export function forwardedIpHeaders(request: NextRequest) {
  const ip = clientIpFromRequest(request);
  return {
    "X-Forwarded-For": ip,
    "X-Real-IP": ip,
  };
}

export async function clearAdminCookies(response: NextResponse) {
  for (const name of Object.values(adminCookieNames)) {
    response.cookies.set(name, "", { ...adminCookieOptions, maxAge: 0 });
  }
  return response;
}

export function writeAdminTokenCookies(
  response: NextResponse,
  data: { access_token: string; refresh_token?: string; session_id?: string; device_id?: string }
) {
  response.cookies.set(adminCookieNames.accessToken, data.access_token, {
    ...adminCookieOptions,
    maxAge: 60 * 60,
  });
  if (data.refresh_token) {
    response.cookies.set(adminCookieNames.refreshToken, data.refresh_token, {
      ...adminCookieOptions,
      maxAge: 60 * 60 * 24 * 30,
    });
  }
  if (data.session_id) {
    response.cookies.set(adminCookieNames.sessionId, data.session_id, {
      ...adminCookieOptions,
      maxAge: 60 * 60 * 24 * 30,
    });
  }
  if (data.device_id) {
    response.cookies.set(adminCookieNames.deviceId, data.device_id, {
      ...adminCookieOptions,
      maxAge: 60 * 60 * 24 * 365,
    });
  }
}

export async function refreshAdminCookies(request?: NextRequest) {
  const store = await cookies();
  const refreshToken = store.get(adminCookieNames.refreshToken)?.value;
  const deviceId = store.get(adminCookieNames.deviceId)?.value;

  if (!refreshToken || !deviceId) return null;

  const response = await signedBackendFetch({
    baseUrl: backendUrls.auth,
    path: "/auth/refresh",
    method: "POST",
    deviceId,
    body: { refresh_token: refreshToken },
    extraHeaders: request ? forwardedIpHeaders(request) : undefined,
  });

  if (!response.ok) return null;

  const data = (await response.json().catch(() => ({}))) as {
    access_token?: string;
    refresh_token?: string;
  };

  if (!data.access_token) return null;
  return { ...data, access_token: data.access_token, device_id: deviceId };
}

export async function readAdminSession({
  accessToken,
  deviceId,
  userOverride,
}: {
  accessToken: string;
  deviceId: string;
  userOverride?: Partial<AdminUser> | null;
}): Promise<AdminSessionPayload> {
  const jwt = decodeJwtPayload(accessToken);
  if (!jwt?.user_id) {
    return { authenticated: false, powers: [], roles: [], error: "Unable to read admin token" };
  }

  const user: AdminUser = {
    user_id: jwt.user_id,
    user_type: jwt.user_type ?? userOverride?.user_type ?? "",
    state: jwt.state ?? userOverride?.state,
    name: jwt.name ?? userOverride?.name,
    email: userOverride?.email,
  };
  const tokenRoles = Array.isArray(jwt.roles) ? jwt.roles : [];

  if (user.user_type !== "INTERNAL_TEAM") {
    return {
      authenticated: false,
      user,
      roles: tokenRoles,
      powers: [],
      error: "This account is not an internal team account.",
      code: "ADMIN_ACCESS_REQUIRED",
    };
  }

  const permissionsResponse = await signedBackendFetch({
    baseUrl: backendUrls.rbac,
    path: `/rbac/user-permissions/${encodeURIComponent(jwt.user_id)}`,
    method: "GET",
    accessToken,
    deviceId,
  });

  if (!permissionsResponse.ok) {
    return {
      authenticated: false,
      user,
      roles: tokenRoles,
      powers: [],
      error: "Unable to load RBAC permissions.",
      code: "RBAC_PERMISSIONS_FAILED",
    };
  }

  const permissions = (await permissionsResponse.json().catch(() => ({}))) as BackendPermissionsResponse;
  const roles =
    permissions.roles
      ?.map((role) => role.role_id ?? role.role_name)
      .filter((role): role is string => Boolean(role)) ?? tokenRoles;
  const powers = permissions.powers?.map((power) => power.power_id).filter((power): power is string => Boolean(power)) ?? [];

  if (!roles.some(isAdminConsoleRole)) {
    return {
      authenticated: false,
      user,
      roles,
      powers,
      error: "This internal account does not have a FOUNDER or ADMIN admin-console role.",
      code: "ADMIN_ACCESS_REQUIRED",
    };
  }

  if (!powers.includes("PWR_ADMIN_DASHBOARD_VIEW")) {
    return {
      authenticated: false,
      user,
      roles,
      powers,
      error: "This account does not have admin dashboard access.",
      code: "ADMIN_ACCESS_REQUIRED",
    };
  }

  return {
    authenticated: true,
    ok: true,
    user,
    roles,
    powers,
    redirectTo: "/admin",
  };
}
