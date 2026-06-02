"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { UserIcon, SettingsIcon, LogOutIcon, ChevronDownIcon } from "lucide-react";
import { useAdminStore } from "@/lib/admin/store";

type NavUserProps = {
  logoutAction?: () => Promise<void>;
};

export function NavUser({ logoutAction }: NavUserProps) {
  const storeUser = useAdminStore((state) => state.user);
  const isLoading = useAdminStore((state) => state.isLoading);
  const isHydrated = useAdminStore((state) => state.isHydrated);

  const displayName = storeUser?.name ?? (storeUser?.user_id ? storeUser.user_id : isHydrated && !isLoading ? "Admin" : "Loading…");
  const displayEmail = storeUser?.email ?? storeUser?.user_id ?? "";
  const avatarFallback = storeUser?.name ? storeUser.name.charAt(0).toUpperCase() : "A";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="Open user menu"
        className="inline-flex items-center gap-2 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
        render={<button type="button" />}
      >
        <Avatar className="size-8">
          <AvatarImage src="" alt="" />
          <AvatarFallback>{avatarFallback}</AvatarFallback>
        </Avatar>
        <span className="hidden max-w-[120px] truncate text-sm font-medium md:block">
          {displayName}
        </span>
        <ChevronDownIcon className="hidden size-3.5 text-muted-foreground md:block" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <div className="flex items-center gap-3 px-2 py-2">
          <Avatar className="size-10">
            <AvatarImage src="" alt="" />
            <AvatarFallback>{avatarFallback}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <div className="truncate font-medium text-sm text-foreground">{displayName}</div>
            <div className="truncate text-muted-foreground text-xs">{displayEmail}</div>
          </div>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem
            onClick={() => { window.location.hash = "profile"; }}
          >
            <UserIcon />
            Account
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => { window.location.hash = "system-config"; }}
          >
            <SettingsIcon />
            Settings
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          {logoutAction ? (
            <form action={logoutAction}>
              <DropdownMenuItem
                className="w-full cursor-pointer"
                render={<button type="submit" />}
                nativeButton={true}
                variant="destructive"
              >
                <LogOutIcon />
                Log out
              </DropdownMenuItem>
            </form>
          ) : (
            <DropdownMenuItem className="w-full cursor-pointer" variant="destructive">
              <LogOutIcon />
              Log out
            </DropdownMenuItem>
          )}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
