"use client";

import { useState, type ReactNode } from "react";
import {
  CalendarIcon,
  CheckCircle2Icon,
  ClockIcon,
  CreditCardIcon,
  FileTextIcon,
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { BlockUserDialog } from "./block-user-dialog";
import { ChangeUserStateDialog } from "./change-user-state-dialog";
import { EditUserProfileDialog } from "./edit-user-profile-dialog";
import { VerificationDocViewerDialog } from "./verification-doc-viewer-dialog";
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
      <Dialog open={isOpen} onOpenChange={setOpen}>
        <DialogContent className="w-full max-w-xl max-h-[90vh] overflow-y-auto sm:max-w-xl rounded-xl p-6">
          <DialogHeader className="border-b pb-4 pr-8">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold text-lg">
                  {user.name ? user.name.slice(0, 2).toUpperCase() : "US"}
                </div>
                <div>
                  <DialogTitle className="text-lg font-bold flex items-center gap-2">
                    {user.name || "User Details"}
                    <Badge variant="outline" className="text-[10px] font-mono">
                      {user.user_type || "END_USER"}
                    </Badge>
                  </DialogTitle>
                  <DialogDescription className="text-xs font-mono text-muted-foreground mt-0.5">
                    User ID: {user.user_id}
                  </DialogDescription>
                </div>
              </div>
              <Badge variant={stateVariant} className="uppercase text-[11px] font-semibold shrink-0">
                {user.state || "ACTIVE"}
              </Badge>
            </div>
          </DialogHeader>

          <div className="space-y-6 py-4 text-sm">
            {/* Quick Metrics Grid */}
            <div className="grid grid-cols-3 gap-3 rounded-lg border bg-blue-500/5 p-3 text-center text-xs">
              <div>
                <span className="text-muted-foreground text-[10px]">Active Subscriptions</span>
                <p className="mt-0.5 text-base font-bold text-foreground">
                  {user.metrics?.active_subscriptions_count ?? 0}
                </p>
              </div>
              <div>
                <span className="text-muted-foreground text-[10px]">Total Subscriptions</span>
                <p className="mt-0.5 text-base font-bold text-foreground">
                  {user.metrics?.subscriptions_count ?? 0}
                </p>
              </div>
              <div>
                <span className="text-muted-foreground text-[10px]">Total Spent</span>
                <p className="mt-0.5 text-base font-bold text-emerald-600 dark:text-emerald-400">
                  ₹{(user.metrics?.total_spent ?? 0).toLocaleString("en-IN")}
                </p>
              </div>
            </div>

            {/* Account & Profile Details */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Contact & Account Information
              </h3>
              <div className="space-y-2 rounded-md border p-3.5 text-xs">
                <div className="flex items-center justify-between py-1 border-b border-border/50">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <MailIcon className="size-3.5" /> Email Address
                  </span>
                  <span className="font-medium text-foreground">{user.email}</span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-border/50">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <PhoneIcon className="size-3.5" /> Phone Number
                  </span>
                  <span className="font-mono text-foreground">{user.phone || "—"}</span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-border/50">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <UserIcon className="size-3.5" /> Account Type
                  </span>
                  <Badge variant="outline" className="text-[10px] font-mono">
                    {user.user_type}
                  </Badge>
                </div>
                <div className="flex items-center justify-between py-1">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <CalendarIcon className="size-3.5" /> Registration Date
                  </span>
                  <span className="text-muted-foreground">
                    {user.created_at
                      ? new Date(user.created_at).toLocaleDateString("en-IN")
                      : "—"}
                  </span>
                </div>
              </div>
            </div>

            {/* KYC & Identity Status */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Identity & KYC Compliance
              </h3>
              <div className="space-y-2 rounded-md border p-3.5 text-xs">
                <div className="flex items-center justify-between py-1 border-b border-border/50">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <ShieldCheckIcon className="size-3.5" /> Aadhaar Verification
                  </span>
                  {user.kyc?.aadhaar_verified ? (
                    <Badge variant="default" className="bg-emerald-600 text-white text-[10px]">
                      Verified
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-amber-600 border-amber-500/40 text-[10px]">
                      Pending Verification
                    </Badge>
                  )}
                </div>
                <div className="flex items-center justify-between py-1 border-b border-border/50">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <CreditCardIcon className="size-3.5" /> PAN Number
                  </span>
                  <span className="font-mono text-foreground">{user.kyc?.pan_number || "—"}</span>
                </div>
                <div className="flex items-center justify-between py-1">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <ShieldAlertIcon className="size-3.5" /> Security Risk Assessment
                  </span>
                  <Badge variant="secondary" className="text-[10px]">
                    {user.kyc?.risk_level || "Low Risk"}
                  </Badge>
                </div>
                <VerificationDocViewerDialog
                  applicantName={user.name}
                  sebiLicenseNumber="N/A"
                  trigger={
                    <Button size="sm" variant="outline" className="gap-1.5 w-full text-xs font-semibold mt-2 border-blue-500/40 text-blue-600 dark:text-blue-400 hover:bg-blue-500/10">
                      <FileTextIcon className="size-3.5" /> Inspect Submitted Documents (Aadhaar, PAN Card)
                    </Button>
                  }
                />
              </div>
            </div>

            {/* Action Controls */}
            <div className="space-y-3 pt-2 border-t">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                CRUD Actions & Account Controls
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
                  title="Delete User Account"
                  description={`Are you sure you want to permanently delete user "${user.name}" (${user.user_id})? This action cannot be undone.`}
                  confirmLabel="Delete User"
                  destructive
                  onConfirm={async () => {
                    onDelete?.(user.user_id);
                    setOpen(false);
                    return { ok: true, message: "User account deleted" };
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
        </DialogContent>
      </Dialog>
    </>
  );
}
