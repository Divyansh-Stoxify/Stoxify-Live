import { cn } from "@/lib/utils";
import { AdminPermissionsProvider } from "@/components/admin/admin-permissions-provider";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppHeader } from "@/components/app-header";
import { AppSidebar } from "@/components/app-sidebar";

type AppShellProps = {
  children: React.ReactNode;
  logoutAction?: () => Promise<void>;
};

export function AppShell({ children, logoutAction }: AppShellProps) {
  return (
    <AdminPermissionsProvider>
      <SidebarProvider className={cn("[--app-wrapper-max-width:80rem]")}>
        <AppSidebar />
        <SidebarInset>
          <AppHeader logoutAction={logoutAction} />
          <div
            className={cn(
              "flex flex-1 flex-col p-4 md:p-6",
              "mx-auto w-full max-w-(--app-wrapper-max-width)"
            )}
          >
            {children}
          </div>
        </SidebarInset>
      </SidebarProvider>
    </AdminPermissionsProvider>
  );
}
