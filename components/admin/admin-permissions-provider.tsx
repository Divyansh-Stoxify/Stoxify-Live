"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, type ReactNode } from "react";

import { canAccessAdminRoute } from "@/lib/admin/permissions";
import { useAdminStore } from "@/lib/admin/store";

type AdminPermissionsContextValue = {
  canAccess: (path: string) => boolean;
  can: (power: string) => boolean;
  error: string | null;
  isLoading: boolean;
  powers: ReadonlySet<string>;
  roles: ReadonlySet<string>;
};

const AdminPermissionsContext = createContext<AdminPermissionsContextValue | null>(null);

export function AdminPermissionsProvider({ children }: { children: ReactNode }) {
  const error = useAdminStore((state) => state.error);
  const hydrate = useAdminStore((state) => state.hydrate);
  const isHydrated = useAdminStore((state) => state.isHydrated);
  const isLoading = useAdminStore((state) => state.isLoading);
  const powersList = useAdminStore((state) => state.powers);
  const rolesList = useAdminStore((state) => state.roles);
  const can = useAdminStore((state) => state.can);

  useEffect(() => {
    if (!isHydrated) void hydrate();
  }, [hydrate, isHydrated]);

  const powers = useMemo(() => new Set(powersList), [powersList]);
  const roles = useMemo(() => new Set(rolesList), [rolesList]);

  const canAccess = useCallback(
    (path: string) => {
      if (!isHydrated || isLoading) return path === "/dashboard" || path === "/admin-help";
      return canAccessAdminRoute(path, powers);
    },
    [isHydrated, isLoading, powers]
  );

  const value = useMemo(
    () => ({
      canAccess,
      can,
      error,
      isLoading: !isHydrated || isLoading,
      powers,
      roles,
    }),
    [can, canAccess, error, isHydrated, isLoading, powers, roles]
  );

  return (
    <AdminPermissionsContext.Provider value={value}>
      {children}
    </AdminPermissionsContext.Provider>
  );
}

export function useAdminPermissions() {
  const context = useContext(AdminPermissionsContext);
  if (!context) {
    throw new Error("useAdminPermissions must be used within AdminPermissionsProvider.");
  }
  return context;
}

export function Gated({
  allOf,
  anyOf,
  children,
  fallback = null,
  power,
}: {
  allOf?: string[];
  anyOf?: string[];
  children: ReactNode;
  fallback?: ReactNode;
  power?: string;
}) {
  const powers = useAdminStore((state) => state.powers);
  const powerSet = useMemo(() => new Set(powers), [powers]);
  const requiredAll = power ? [power, ...(allOf ?? [])] : allOf ?? [];
  const hasAll = requiredAll.every((item) => powerSet.has(item));
  const hasAny = !anyOf?.length || anyOf.some((item) => powerSet.has(item));

  return hasAll && hasAny ? children : fallback;
}

export function AuthGuard({
  children,
  fallback = null,
  requires,
}: {
  children: ReactNode;
  fallback?: ReactNode;
  requires?: string[];
}) {
  const isAuthenticated = useAdminStore((state) => state.isAuthenticated);
  const isHydrated = useAdminStore((state) => state.isHydrated);
  const isLoading = useAdminStore((state) => state.isLoading);
  const powers = useAdminStore((state) => state.powers);

  if (!isHydrated || isLoading) return fallback;
  if (!isAuthenticated) return fallback;
  if (requires?.length && !requires.every((power) => powers.includes(power))) return fallback;
  return children;
}
