"use client";

import { useEffect, useMemo, useState } from "react";
import { BellIcon } from "lucide-react";

import { AppBreadcrumbs } from "@/components/app-breadcrumbs";
import { navLinks } from "@/components/app-shared";
import { CustomSidebarTrigger } from "@/components/custom-sidebar-trigger";
import { DecorIcon } from "@/components/decor-icon";
import { NavUser } from "@/components/nav-user";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

type AppHeaderProps = {
  logoutAction?: () => Promise<void>;
};

function normalizeHash(hash: string) {
  const clean = hash.replace(/^#\/?/, "") || "dashboard";
  const path = `/${clean}`;
  const legacyRoutes: Record<string, string> = {
    "/analysts/pending": "/analysts-pending",
    "/security/threats": "/security-threats",
    "/security/logs": "/security-logs",
    "/security/sessions": "/security-sessions",
    "/security/ip-blocks": "/security-ip-blocks",
  };
  return legacyRoutes[path] ?? path;
}

function isActivePath(itemPath: string | undefined, activePath: string) {
  return itemPath === `#${activePath.slice(1)}` || itemPath === `#${activePath}`;
}

export function AppHeader({ logoutAction }: AppHeaderProps) {
  const [activePath, setActivePath] = useState("/dashboard");

  useEffect(() => {
    const update = () => setActivePath(normalizeHash(window.location.hash));
    update();
    window.addEventListener("hashchange", update);
    return () => window.removeEventListener("hashchange", update);
  }, []);

  const activeItem = useMemo(
    () => navLinks.find((item) => isActivePath(item.path, activePath)) ?? navLinks[0],
    [activePath]
  );

  return (
    <header
      className={cn(
        "sticky top-0 z-50 flex h-14 shrink-0 items-center justify-between gap-2 border-b px-4 md:px-6",
        "bg-background/95 backdrop-blur-sm supports-backdrop-filter:bg-background/50"
      )}
    >
      <DecorIcon className="hidden md:block" position="bottom-left" />
      <div className="flex items-center gap-3">
        <CustomSidebarTrigger />
        <Separator
          className="mr-2 h-4 data-[orientation=vertical]:self-center"
          orientation="vertical"
        />
        <AppBreadcrumbs page={activeItem} />
      </div>
      <div className="flex items-center gap-3">
        <Button
          aria-label="Notifications"
          size="icon-sm"
          variant="outline"
          onClick={() => { window.location.hash = "notifications"; }}
        >
          <BellIcon />
        </Button>
        <Separator className="h-4 data-[orientation=vertical]:self-center" orientation="vertical" />
        <NavUser logoutAction={logoutAction} />
      </div>
    </header>
  );
}
