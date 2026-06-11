import "server-only";

import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

import { backendUrls, signedBackendFetch } from "@/lib/backend/index";
import { clientIpFromRequest, forwardedIpHeaders } from "@/lib/backend/index";
import { adminCookieNames, adminCookieOptions } from "@/lib/admin/cookies";
import { adminKnownPowers } from "@/lib/admin/permissions";
import type { AdminSessionPayload, AdminUser } from "@/lib/admin/session-shared";

// Re-export so existing admin route imports don't need to change.
export { clientIpFromRequest, forwardedIpHeaders };

type JwtPayload = {
  user_id?: string;
  user_type?: string;
  state?: string;
  roles?: string[];
  name?: string;
};

type BackendPermissionsResponse = {
  roles?: { role_id?: string; role_name?: string }[];
  powers?: { power_id?: string }[];
};

type PermissionCheckResponse = {
  authorized?: boolean;
};

function normalizeAdminRole(role: string) {
  return role.toUpperCase().replace(/^ROLE_/, "");
}

function isAdminConsoleRole(role: string) {
  const normalized = normalizeAdminRole(role);
  return normalized === "FOUNDER" || normalized === "ADMIN";
}

function isFounderRole(role: string) {
  return normalizeAdminRole(role) === "FOUNDER";
}

async function loadAdminRolesAndPowersFromRbac({
  accessToken,
  deviceId,
  userId,
}: {
  accessToken: string;
  deviceId: string;
  userId: string;
}): Promise<{ roles: string[]; powers: string[] } | null> {
  const permissionsResponse = await signedBackendFetch({
    baseUrl: backendUrls.rbac,
    path: `/rbac/user-permissions/${encodeURIComponent(userId)}`,
    method: "GET",
    accessToken,
    deviceId,
  }).catch(() => null);

  if (!permissionsResponse?.ok) {
    return null;
  }

  const permissions = (await permissionsResponse
    .json()
    .catch(() => ({}))) as BackendPermissionsResponse;

  return {
    roles:
      permissions.roles
        ?.map((role) => role.role_id ?? role.role_name)
        .filter((role): role is string => Boolean(role)) ?? [],
    powers:
      permissions.powers
        ?.map((power) => power.power_id)
        .filter((power): power is string => Boolean(power)) ?? [],
  };
}

async function loadKnownAdminPowers(userId: string, userState?: string): Promise<string[] | null> {
  const internalSecret = process.env.INTERNAL_SECRET?.trim();
  if (!internalSecret) return null;

  const checks = await Promise.all(
    adminKnownPowers.map(async (power) => {
      try {
        const response = await fetch(`${backendUrls.rbac}/rbac/check-permission`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Internal-Secret": internalSecret,
          },
          body: JSON.stringify({
            user_id: userId,
            power,
            context: userState ? { user_state: userState } : undefined,
          }),
          cache: "no-store",
          signal: AbortSignal.timeout(5_000),
        });

        if (!response.ok) {
          return { resolved: false as const };
        }

        const data = (await response.json().catch(() => ({}))) as PermissionCheckResponse;
        return { resolved: true as const, power: data.authorized ? power : undefined };
      } catch {
        return { resolved: false as const };
      }
    })
  );

  const resolvedChecks = checks.filter((check) => check.resolved);
  if (resolvedChecks.length === 0) {
    return null;
  }

  return resolvedChecks
    .map((check) => check.power)
    .filter((power): power is string => Boolean(power));
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
  const hasFounderTokenRole = tokenRoles.some(isFounderRole);

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

  let roles = tokenRoles;
  let powers: string[] | null = null;

  if (hasFounderTokenRole) {
    const founderPermissions = await loadAdminRolesAndPowersFromRbac({
      accessToken,
      deviceId,
      userId: jwt.user_id,
    });

    if (founderPermissions) {
      roles = founderPermissions.roles.length > 0 ? founderPermissions.roles : tokenRoles;
      powers = founderPermissions.powers;
    } else if (user.state === "ACTIVE") {
      // Founder is seeded with every system power in the backend, so use the
      // frontend-known admin power set as a safe fallback when RBAC lookup
      // fails.
      powers = [...adminKnownPowers];
    }
  }

  if (!powers) {
    powers = await loadKnownAdminPowers(jwt.user_id, user.state);
  }

  if (!powers) {
    const permissions = await loadAdminRolesAndPowersFromRbac({
      accessToken,
      deviceId,
      userId: jwt.user_id,
    });

    if (!permissions) {
      return {
        authenticated: false,
        user,
        roles: tokenRoles,
        powers: [],
        error: "Unable to load RBAC permissions.",
        code: "RBAC_PERMISSIONS_FAILED",
      };
    }

    roles = permissions.roles.length > 0 ? permissions.roles : tokenRoles;
    powers = permissions.powers;
  }

  const hasConsoleRole = roles.some(isAdminConsoleRole);
  const hasDashboardPower = powers.includes("PWR_ADMIN_DASHBOARD_VIEW");

  if (!hasConsoleRole && !hasDashboardPower) {
    return {
      authenticated: false,
      user,
      roles,
      powers,
      error: "This internal account does not have a FOUNDER or ADMIN admin-console role.",
      code: "ADMIN_ACCESS_REQUIRED",
    };
  }

  if (!hasDashboardPower) {
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

export async function readAdminSessionFromCookies(): Promise<AdminSessionPayload | null> {
  const store = await cookies();
  const accessToken = store.get(adminCookieNames.accessToken)?.value;
  const deviceId = store.get(adminCookieNames.deviceId)?.value;

  if (!accessToken || !deviceId) {
    return null;
  }

  return readAdminSession({ accessToken, deviceId }).catch(() => null);
}
