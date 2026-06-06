export type AdminPermissionRule = {
  anyOf?: string[];
  allOf?: string[];
};

export const adminRoutePermissionRules: Record<string, AdminPermissionRule> = {
  "/dashboard": { anyOf: ["PWR_ADMIN_DASHBOARD_VIEW"] },
  "/profile": { anyOf: ["PWR_ADMIN_DASHBOARD_VIEW"] },
  "/analytics": { anyOf: ["PWR_ADMIN_ANALYTICS_VIEW"] },
  "/users": { anyOf: ["PWR_USER_READ_ALL"] },
  "/analysts": { anyOf: ["PWR_ANALYST_READ_ALL"] },
  "/analysts-pending": { anyOf: ["PWR_ANALYST_VERIFY"] },
  "/internal-team": { anyOf: ["PWR_USER_READ_ALL"] },
  "/plans": { anyOf: ["PWR_PLAN_READ_ALL"] },
  "/subscriptions": {
    anyOf: ["PWR_SUBSCRIPTION_READ_ALL", "PWR_SUBSCRIPTION_READ_OWN"],
  },
  "/trades": { anyOf: ["PWR_TRADE_READ_ALL"] },
  "/market-instruments": { anyOf: ["PWR_MARKET_DATA_MANAGE"] },
  "/notifications": { anyOf: ["PWR_NOTIFICATION_SEND_BROADCAST"] },
  "/roles": { anyOf: ["PWR_ADMIN_ROLE_MANAGE"] },
  "/powers": { anyOf: ["PWR_ADMIN_ROLE_MANAGE"] },
  "/role-assignments": {
    allOf: ["PWR_ADMIN_ROLE_MANAGE", "PWR_ADMIN_USER_ROLE_ASSIGN"],
  },
  "/security": { anyOf: ["PWR_SECURITY_THREAT_INVESTIGATE"] },
  "/security-threats": { anyOf: ["PWR_SECURITY_THREAT_INVESTIGATE"] },
  "/security-logs": { anyOf: ["PWR_SECURITY_LOGS_VIEW"] },
  "/security-sessions": { anyOf: ["PWR_SECURITY_DEVICE_REVOKE"] },
  "/security-ip-blocks": { anyOf: ["PWR_SECURITY_IP_BLOCK"] },
  "/system-config": { anyOf: ["PWR_ADMIN_SYSTEM_CONFIG"] },
  "/admin-help": { anyOf: ["PWR_ADMIN_DASHBOARD_VIEW"] },
  "/api-reference": { anyOf: ["PWR_ADMIN_ROLE_MANAGE"] },
};

export const adminKnownPowers = Array.from(
  new Set(
    Object.values(adminRoutePermissionRules).flatMap((rule) => [
      ...(rule.anyOf ?? []),
      ...(rule.allOf ?? []),
    ])
  )
);

export function canAccessAdminRoute(path: string, powers: ReadonlySet<string>) {
  const rule = adminRoutePermissionRules[path];
  if (!rule) return true;

  const hasAny = !rule.anyOf?.length || rule.anyOf.some((power) => powers.has(power));
  const hasAll = !rule.allOf?.length || rule.allOf.every((power) => powers.has(power));

  return hasAny && hasAll;
}
