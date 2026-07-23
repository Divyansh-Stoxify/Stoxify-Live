"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useAdminPermissions } from "@/components/admin/admin-permissions-provider";
import { footerNavLinks, navGroups } from "@/components/app-shared";
import { LatestChange } from "@/components/latest-change";
import { NavGroup } from "@/components/nav-group";
import { Logo } from "@/components/logo";
import type { SidebarNavItem } from "@/components/app-shared";

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

function navigateHash(path: string | undefined) {
  if (!path) {
    return;
  }

  window.history.pushState(null, "", path);
  window.dispatchEvent(new HashChangeEvent("hashchange"));
}

function canShowItem(item: SidebarNavItem, canAccess: (path: string) => boolean) {
  return !item.path?.startsWith("#") || canAccess(normalizeHash(item.path));
}

export function AppSidebar() {
  const [activePath, setActivePath] = useState("/dashboard");
  const { canAccess } = useAdminPermissions();

  useEffect(() => {
    const update = () => setActivePath(normalizeHash(window.location.hash));
    update();
    window.addEventListener("hashchange", update);
    return () => window.removeEventListener("hashchange", update);
  }, []);

  const activeGroups = useMemo(
    () =>
      navGroups
        .map((group) => ({
          ...group,
          items: group.items
            .filter((item) => canShowItem(item, canAccess))
            .map((item) => {
              const subItems = item.subItems
                ?.filter((subItem) => canShowItem(subItem, canAccess))
                .map((subItem) => ({
                  ...subItem,
                  isActive: isActivePath(subItem.path, activePath),
                }));
              return {
                ...item,
                isActive:
                  isActivePath(item.path, activePath) ||
                  subItems?.some((subItem) => subItem.isActive),
                subItems,
              };
            }),
        }))
        .filter((group) => group.items.length > 0),
    [activePath, canAccess]
  );

  const activeFooterLinks = useMemo(
    () =>
      footerNavLinks
        .filter((item) => canShowItem(item, canAccess))
        .map((item) => ({
          ...item,
          isActive: isActivePath(item.path, activePath),
        })),
    [activePath, canAccess]
  );

  return (
    <Sidebar
      className={cn(
        "*:data-[slot=sidebar-inner]:bg-background",
        "*:data-[slot=sidebar-inner]:dark:bg-[radial-gradient(60%_18%_at_10%_0%,--theme(--color-foreground/.08),transparent)]",
        "**:data-[slot=sidebar-menu-button]:[&>span]:text-foreground/75"
      )}
      collapsible="icon"
      variant="sidebar"
    >
      <SidebarHeader className="h-14 justify-center border-b px-2">
        <SidebarMenuButton render={<Link href="/admin" />}>
          <Logo size="sm" />
        </SidebarMenuButton>
      </SidebarHeader>
      <SidebarContent data-lenis-prevent-wheel>
        {activeGroups.map((group, index) => (
          <NavGroup key={`sidebar-group-${index}`} {...group} />
        ))}
      </SidebarContent>
      <SidebarFooter className="gap-0 p-0">
        <LatestChange />
        <SidebarMenu className="border-t p-2">
          {activeFooterLinks.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton
                className="text-muted-foreground"
                isActive={item.isActive}
                size="sm"
                render={
                  <a
                    href={item.path}
                    onClick={(event) => {
                      if (!item.path?.startsWith("#")) {
                        return;
                      }

                      event.preventDefault();
                      event.stopPropagation();
                      navigateHash(item.path);
                    }}
                  />
                }
              >
                {item.icon}
                <span>{item.title}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
        <div className="px-4 pt-4 pb-2 transition-opacity group-data-[collapsible=icon]:pointer-events-none group-data-[collapsible=icon]:opacity-0">
          <p className="text-nowrap text-[9px] text-muted-foreground">
            © {new Date().getFullYear()} Stoxify
          </p>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
