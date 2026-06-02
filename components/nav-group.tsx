import { useState } from "react";
import type { MouseEvent } from "react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import type { SidebarNavGroup } from "@/components/app-shared";
import { ChevronRightIcon } from "lucide-react";

function handleHashNavigation(event: MouseEvent<HTMLAnchorElement>, path: string | undefined) {
  if (!path) {
    return;
  }

  if (!path.startsWith("#")) {
    return;
  }

  event.preventDefault();
  event.stopPropagation();
  window.history.pushState(null, "", path);
  window.dispatchEvent(new HashChangeEvent("hashchange"));
}

function NavItem({ item }: { item: SidebarNavGroup["items"][number] }) {
  if (!item.subItems?.length) {
    return (
      <SidebarMenuItem>
        <SidebarMenuButton
          isActive={item.isActive}
          render={
            <a href={item.path} onClick={(event) => handleHashNavigation(event, item.path)} />
          }
        >
          {item.icon}
          <span>{item.title}</span>
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  }

  return <NavCollapsibleItem item={item} />;
}

function NavCollapsibleItem({ item }: { item: SidebarNavGroup["items"][number] }) {
  const subItems = item.subItems ?? [];
  const isGroupActive = Boolean(item.isActive || subItems.some((i) => i.isActive));
  const [userOpen, setUserOpen] = useState(false);
  const open = isGroupActive || userOpen;

  return (
    <Collapsible
      className="group/collapsible"
      onOpenChange={setUserOpen}
      open={open}
      render={<SidebarMenuItem />}
    >
      <CollapsibleTrigger render={<SidebarMenuButton isActive={item.isActive} />}>
        {item.icon}
        <span>{item.title}</span>
        <ChevronRightIcon className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <SidebarMenuSub>
          {subItems.map((subItem) => (
            <SidebarMenuSubItem key={subItem.title}>
              <SidebarMenuSubButton
                isActive={subItem.isActive}
                render={
                  <a
                    href={subItem.path}
                    onClick={(event) => handleHashNavigation(event, subItem.path)}
                  />
                }
              >
                {subItem.icon}
                <span>{subItem.title}</span>
              </SidebarMenuSubButton>
            </SidebarMenuSubItem>
          ))}
        </SidebarMenuSub>
      </CollapsibleContent>
    </Collapsible>
  );
}

export function NavGroup({ label, items }: SidebarNavGroup) {
  return (
    <SidebarGroup>
      {label && <SidebarGroupLabel>{label}</SidebarGroupLabel>}
      <SidebarMenu>
        {items.map((item) => (
          <NavItem item={item} key={item.title} />
        ))}
      </SidebarMenu>
    </SidebarGroup>
  );
}
