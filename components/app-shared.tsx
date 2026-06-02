import type { ReactNode } from "react";
import {
  BarChart3Icon,
  BellIcon,
  UsersIcon,
  UserCheckIcon,
  KeyRoundIcon,
  LayoutDashboardIcon,
  SettingsIcon,
  ShieldAlertIcon,
  ShieldCheckIcon,
  CandlestickChartIcon,
  BadgeIndianRupeeIcon,
  ReceiptTextIcon,
  ScrollTextIcon,
  HelpCircleIcon,
} from "lucide-react";

export type SidebarNavItem = {
  title: string;
  path?: string;
  icon?: ReactNode;
  isActive?: boolean;
  subItems?: SidebarNavItem[];
};

export type SidebarNavGroup = {
  label?: string;
  items: SidebarNavItem[];
};

export const navGroups: SidebarNavGroup[] = [
  {
    label: "Monitor",
    items: [
      {
        title: "Dashboard",
        path: "#dashboard",
        icon: <LayoutDashboardIcon />,
        isActive: true,
      },
      {
        title: "Analytics",
        path: "#analytics",
        icon: <BarChart3Icon />,
      },
    ],
  },
  {
    label: "People",
    items: [
      {
        title: "Users",
        path: "#users",
        icon: <UsersIcon />,
      },
      {
        title: "Analysts",
        path: "#analysts",
        icon: <UserCheckIcon />,
      },
      {
        title: "Pending Reviews",
        path: "#analysts-pending",
        icon: <ShieldCheckIcon />,
      },
    ],
  },
  {
    label: "Business",
    items: [
      {
        title: "Plans",
        path: "#plans",
        icon: <BadgeIndianRupeeIcon />,
      },
      {
        title: "Subscriptions",
        path: "#subscriptions",
        icon: <ReceiptTextIcon />,
      },
      {
        title: "Trades",
        path: "#trades",
        icon: <CandlestickChartIcon />,
      },
    ],
  },
  {
    label: "Operations",
    items: [
      {
        title: "Notifications",
        path: "#notifications",
        icon: <BellIcon />,
      },
      {
        title: "Security",
        path: "#security",
        icon: <ShieldAlertIcon />,
      },
      {
        title: "System Config",
        path: "#system-config",
        icon: <SettingsIcon />,
      },
    ],
  },
  {
    label: "Access",
    items: [
      {
        title: "Internal Team",
        path: "#internal-team",
        icon: <ShieldCheckIcon />,
      },
      {
        title: "Roles & Access",
        path: "#roles",
        icon: <KeyRoundIcon />,
      },
    ],
  },
];

export const footerNavLinks: SidebarNavItem[] = [
  {
    title: "Admin Help",
    path: "#admin-help",
    icon: <HelpCircleIcon />,
  },
  {
    title: "API Reference",
    path: "#api-reference",
    icon: <ScrollTextIcon />,
  },
];

export const navLinks: SidebarNavItem[] = [
  ...navGroups.flatMap((group) =>
    group.items.flatMap((item) => (item.subItems?.length ? [item, ...item.subItems] : [item]))
  ),
  ...footerNavLinks,
];
