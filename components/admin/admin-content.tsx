"use client";

import { useEffect, useState } from "react";
import type { ComponentType } from "react";
import { Toaster } from "sonner";

import { AdminPageLayout } from "@/components/admin/admin-page-layout";
import { useAdminPermissions } from "@/components/admin/admin-permissions-provider";
import { Dashboard } from "@/components/dashboard";
import { AdminHelpPage } from "@/components/admin/pages/admin-help-page";
import { AnalyticsPage } from "@/components/admin/pages/analytics-page";
import { AnalystsPage } from "@/components/admin/pages/analysts-page";
import { ApiReferencePage } from "@/components/admin/pages/api-reference-page";
import { InternalTeamPage } from "@/components/admin/pages/internal-team-page";
import { IpBlocksPage } from "@/components/admin/pages/ip-blocks-page";
import { MarketInstrumentsPage } from "@/components/admin/pages/market-instruments-page";
import { NotificationsPage } from "@/components/admin/pages/notifications-page";
import { PendingAnalystsPage } from "@/components/admin/pages/pending-analysts-page";
import { PlansPage } from "@/components/admin/pages/plans-page";
import { PowersPage } from "@/components/admin/pages/powers-page";
import { RoleAssignmentsPage } from "@/components/admin/pages/role-assignments-page";
import { RolesPage } from "@/components/admin/pages/roles-page";
import { SecurityLogsPage } from "@/components/admin/pages/security-logs-page";
import { SecurityOverviewPage } from "@/components/admin/pages/security-overview-page";
import { SecuritySessionsPage } from "@/components/admin/pages/security-sessions-page";
import { SecurityThreatsPage } from "@/components/admin/pages/security-threats-page";
import { SubscriptionsPage } from "@/components/admin/pages/subscriptions-page";
import { SystemConfigPage } from "@/components/admin/pages/system-config-page";
import { TradesPage } from "@/components/admin/pages/trades-page";
import { UsersPage } from "@/components/admin/pages/users-page";
import { ProfilePage } from "@/components/admin/pages/profile-page";

const adminRoutes: Record<string, ComponentType> = {
  "/profile": ProfilePage,
  "/dashboard": Dashboard,
  "/analytics": AnalyticsPage,
  "/users": UsersPage,
  "/analysts": AnalystsPage,
  "/analysts-pending": PendingAnalystsPage,
  "/internal-team": InternalTeamPage,
  "/plans": PlansPage,
  "/subscriptions": SubscriptionsPage,
  "/trades": TradesPage,
  "/market-instruments": MarketInstrumentsPage,
  "/notifications": NotificationsPage,
  "/roles": RolesPage,
  "/powers": PowersPage,
  "/role-assignments": RoleAssignmentsPage,
  "/security": SecurityOverviewPage,
  "/security-threats": SecurityThreatsPage,
  "/security-logs": SecurityLogsPage,
  "/security-sessions": SecuritySessionsPage,
  "/security-ip-blocks": IpBlocksPage,
  "/system-config": SystemConfigPage,
  "/admin-help": AdminHelpPage,
  "/api-reference": ApiReferencePage,
};

const legacyHashRoutes: Record<string, string> = {
  "/analysts/pending": "/analysts-pending",
  "/security/threats": "/security-threats",
  "/security/logs": "/security-logs",
  "/security/sessions": "/security-sessions",
  "/security/ip-blocks": "/security-ip-blocks",
};

function normalizeHash(hash: string) {
  const clean = hash.replace(/^#\/?/, "") || "dashboard";
  const [pathPart] = clean.split("?");
  const path = `/${pathPart}`;
  return legacyHashRoutes[path] ?? path;
}

function useAdminHash() {
  const [hash, setHash] = useState("/dashboard");

  useEffect(() => {
    const update = () => setHash(normalizeHash(window.location.hash));
    update();
    window.addEventListener("hashchange", update);
    return () => window.removeEventListener("hashchange", update);
  }, []);

  return hash;
}

export function AdminContent() {
  const hash = useAdminHash();
  const { canAccess, isLoading } = useAdminPermissions();
  const route = adminRoutes[hash] ? hash : "/api-reference";
  const Page = adminRoutes[route] ?? ApiReferencePage;

  if (isLoading) {
    return <AdminAccessLoading />;
  }

  if (!canAccess(route)) {
    return <AdminAccessDenied route={route} />;
  }

  return (
    <>
      <Toaster position="bottom-right" />
      <Page />
    </>
  );
}

function AdminAccessLoading() {
  return (
    <AdminPageLayout
      page={{
        eyebrow: "Access",
        title: "Loading access",
        description: "Checking the admin powers for this session.",
        variant: "reference",
        metrics: [
          { label: "Status", value: "Pending", detail: "RBAC permissions are loading" },
          { label: "Rows", value: "0", detail: "No protected data requested yet" },
        ],
        columns: ["Check", "State"],
        rows: [],
        isLoading: true,
      }}
    />
  );
}

function AdminAccessDenied({ route }: { route: string }) {
  return (
    <AdminPageLayout
      page={{
        eyebrow: "Access",
        title: "Access denied",
        description: "This admin account does not have the backend power required for this page.",
        variant: "security",
        metrics: [
          { label: "Route", value: route, detail: "Requested admin page" },
          { label: "Status", value: "Blocked", detail: "Backend RBAC does not allow this view" },
          { label: "Rows", value: "0", detail: "No protected request was sent" },
          { label: "Mode", value: "Live", detail: "Backend permissions only" },
        ],
        columns: ["Route", "Status"],
        rows: [{ Route: route, Status: "Access denied" }],
      }}
    />
  );
}
