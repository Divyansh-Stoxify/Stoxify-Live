/**
 * Dashboard shell layout — wraps all /dashboard/* pages.
 *
 * Renders the persistent sidebar (200px fixed, left) and the scrollable
 * main content area with a sticky topbar above it.
 *
 * NOTE: This is a Server Component (no "use client") because the layout
 * itself has no client state. The Sidebar and Topbar are individually
 * marked "use client" where they need hooks.
 */

import { Sidebar } from "@/app/components/dashboard/sidebar";
import { DashboardProvider } from "@/app/components/dashboard/dashboard-context";

export const metadata = {
  title: "Dashboard — Stoxify",
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardProvider>
      <div className="flex min-h-screen bg-[var(--surface)]">
        {/* Fixed 200px dark sidebar */}
        <Sidebar />

        {/*
         * Main content column — offset 200px to the right of the sidebar.
         * The topbar and page content are rendered inside each page via
         * the Topbar component so the title can be dynamic per-page.
         */}
        <main className="ml-[200px] flex min-h-screen flex-1 flex-col">{children}</main>
      </div>
    </DashboardProvider>
  );
}
