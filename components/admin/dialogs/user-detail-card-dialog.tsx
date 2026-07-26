"use client";

import { useState, type ReactNode } from "react";
import {
  CalendarIcon,
  CheckCircle2Icon,
  ClockIcon,
  CreditCardIcon,
  MailIcon,
  PencilIcon,
  PhoneIcon,
  ShieldAlertIcon,
  ShieldCheckIcon,
  ShieldOffIcon,
  SlidersHorizontalIcon,
  Trash2Icon,
  UserIcon,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { BlockUserDialog } from "./block-user-dialog";
import { ChangeUserStateDialog } from "./change-user-state-dialog";
import { EditUserProfileDialog } from "./edit-user-profile-dialog";
import { ConfirmDialog } from "./_confirm-dialog";

export type UserRecord = {
  user_id: string;
  name: string;
  email: string;
  phone?: string;
  user_type: string;
  state: string;
  profile_pic_url?: string;
  created_at?: string;
  last_active?: string;
  kyc?: {
    aadhaar_verified?: boolean;
    pan_number?: string;
    risk_level?: string;
  };
  metrics?: {
    subscriptions_count?: number;
    active_subscriptions_count?: number;
    total_spent?: number;
  };
};

type Props = {
  user: UserRecord;
  trigger?: ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onRefresh?: () => void;
  onDelete?: (userId: string) => void;
};

export function UserDetailCardDialog({
  user,
  trigger,
  open: externalOpen,
  onOpenChange: externalOnOpenChange,
  onRefresh,
  onDelete,
}: Props) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isOpen = externalOpen !== undefined ? externalOpen : internalOpen;
  const setOpen = externalOnOpenChange || setInternalOpen;

  const isBlocked = /BLOCKED/i.test(user.state);
  const isSuspended = /SUSPENDED/i.test(user.state);
  const isActive = /ACTIVE/i.test(user.state);

  const stateVariant = isBlocked
    ? "destructive"
    : isSuspended
      ? "outline"
      : isActive
        ? "default"
        : "secondary";

  return (
    <>
      {trigger && (
        <span
          style={{ display: "contents" }}
          onClick={(e) => {
            e.stopPropagation();
            setOpen(true);
          }}
        >
          {trigger}
        </span>
      )}
      <Sheet open={isOpen} onOpenChange={setOpen}>
        <SheetContent className="w-full max-w-xl overflow-y-auto sm:max-w-xl">
          <SheetHeader className="border-b pb-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex size-12 items-center justify-center rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold text-lg">
                  {user.name ? user.name.slice(0, 2).toUpperCase() : "US"}
                </div>
                <div>
                  <SheetTitle className="text-lg font-bold">{user.name || "User Details"}</SheetTitle>
                  <SheetDescription className="text-xs font-mono text-muted-foreground mt-0.5">
                    ID: {user.user_id}
                  </SheetDescription>
                </div>
              </div>
              <Badge variant={stateVariant} className="uppercase text-[11px] font-semibold">
                {user.state || "UNVERIFIED"}
              </Badge>
            </div>
          </SheetHeader>

          <div className="space-y-6 py-6 text-sm">
            {/* Quick Summary Grid */}
            <div className="grid grid-cols-2 gap-3 rounded-lg border bg-muted/30 p-3 text-xs">
              <div className="space-y-1">
                <span className="text-muted-foreground">User Type</span>
                <p className="font-semibold text-foreground">{user.user_type || "END_USER"}</p>
              </div>
              <div className="space-y-1">
                <span className="text-muted-foreground">Aadhaar KYC</span>
                <p className="font-semibold text-foreground flex items-center gap-1">
                  {user.kyc?.aadhaar_verified ? (
                    <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <CheckCircle2Icon className="size-3.5" /> Verified
                    </span>
                  ) : (
                    <span className="text-amber-600 dark:text-amber-400 flex items-center gap-1">
                      <ClockIcon className="size-3.5" /> Pending
                    </span>
                  )}
                </p>
              </div>
            </div>

            {/* Contact & Identity Section */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Contact & Identity Information
              </h3>
              <div className="space-y-2 rounded-md border p-3.5 text-xs">
                <div className="flex items-center justify-between py-1 border-b border-border/50">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <MailIcon className="size-3.5" /> Email
                  </span>
                  <span className="font-medium text-foreground">{user.email}</span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-border/50">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <PhoneIcon className="size-3.5" /> Phone
                  </span>
                  <span className="font-medium text-foreground">{user.phone || "—"}</span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-border/50">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <UserIcon className="size-3.5" /> User ID
                  </span>
                  <span className="font-mono text-foreground">{user.user_id}</span>
                </div>
                <div className="flex items-center justify-between py-1">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <CalendarIcon className="size-3.5" /> Joined Date
                  </span>
                  <span className="font-medium text-foreground">
                    {user.created_at ? new Date(user.created_at).toLocaleDateString("en-IN") : "Recent"}
                  </span>
                </div>
              </div>
            </div>

            {/* KYC & Compliance Section */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                KYC & Compliance
              </h3>
              <div className="space-y-2 rounded-md border p-3.5 text-xs">
                <div className="flex items-center justify-between py-1 border-b border-border/50">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <ShieldCheckIcon className="size-3.5" /> Aadhaar Verification
                  </span>
                  <Badge variant={user.kyc?.aadhaar_verified ? "default" : "outline"}>
                    {user.kyc?.aadhaar_verified ? "Verified" : "Unverified"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-border/50">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <CreditCardIcon className="size-3.5" /> PAN Number
                  </span>
                  <span className="font-mono text-foreground">{user.kyc?.pan_number || "—"}</span>
                </div>
                <div className="flex items-center justify-between py-1">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <ShieldAlertIcon className="size-3.5" /> Risk Level
                  </span>
                  <Badge variant="outline">{user.kyc?.risk_level || "Low Risk"}</Badge>
                </div>
              </div>
            </div>

            {/* Account Activity Section */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Account Activity & Subscriptions
              </h3>
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-md border p-3 text-center">
                  <span className="text-[11px] text-muted-foreground">Total Subscriptions</span>
                  <p className="mt-1 text-lg font-bold text-foreground">
                    {user.metrics?.subscriptions_count ?? 0}
                  </p>
                </div>
                <div className="rounded-md border p-3 text-center">
                  <span className="text-[11px] text-muted-foreground">Active Subscriptions</span>
                  <p className="mt-1 text-lg font-bold text-emerald-600">
                    {user.metrics?.active_subscriptions_count ?? 0}
                  </p>
                </div>
                <div className="rounded-md border p-3 text-center">
                  <span className="text-[11px] text-muted-foreground">Total Spent</span>
                  <p className="mt-1 text-lg font-bold text-blue-600">
                    ₹{user.metrics?.total_spent ?? 0}
                  </p>
                </div>
              </div>
            </div>

            {/* CRUD Operations Bar */}
            <div className="border-t pt-4 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                CRUD Actions & Administrative Controls
              </h3>
              <div className="flex flex-wrap items-center gap-2">
                <EditUserProfileDialog
                  userId={user.user_id}
                  currentName={user.name}
                  currentPhone={user.phone}
                  currentProfilePicUrl={user.profile_pic_url}
                  refresh={() => {
                    onRefresh?.();
                  }}
                  trigger={
                    <Button size="sm" variant="outline" className="gap-1.5">
                      <PencilIcon className="size-3.5" /> Edit Profile
                    </Button>
                  }
                />

                <ChangeUserStateDialog
                  userId={user.user_id}
                  currentState={user.state}
                  refresh={() => {
                    onRefresh?.();
                  }}
                  trigger={
                    <Button size="sm" variant="outline" className="gap-1.5">
                      <SlidersHorizontalIcon className="size-3.5" /> Change State
                    </Button>
                  }
                />

                <BlockUserDialog
                  userId={user.user_id}
                  currentState={user.state}
                  refresh={() => {
                    onRefresh?.();
                  }}
                  trigger={
                    <Button
                      size="sm"
                      variant={isBlocked ? "outline" : "destructive"}
                      className="gap-1.5"
                    >
                      <ShieldOffIcon className="size-3.5" />
                      {isBlocked ? "Unblock User" : "Block User"}
                    </Button>
                  }
                />

                <ConfirmDialog
                  title="Delete User Record"
                  description={`Are you sure you want to permanently delete user "${user.name}" (${user.user_id})? This action cannot be undone.`}
                  confirmLabel="Delete User"
                  destructive
                  onConfirm={async () => {
                    onDelete?.(user.user_id);
                    setOpen(false);
                    return { ok: true, message: "User record deleted" };
                  }}
                  trigger={
                    <Button size="sm" variant="ghost" className="gap-1.5 text-destructive hover:bg-destructive/10">
                      <Trash2Icon className="size-3.5" /> Delete User
                    </Button>
                  }
                />
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
