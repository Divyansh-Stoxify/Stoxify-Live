"use client";

import { useState, type ReactNode } from "react";
import {
  AwardIcon,
  BriefcaseIcon,
  CalendarIcon,
  CheckCircle2Icon,
  ClockIcon,
  FileTextIcon,
  MailIcon,
  PencilIcon,
  PhoneIcon,
  ShieldAlertIcon,
  ShieldCheckIcon,
  ShieldOffIcon,
  SlidersHorizontalIcon,
  TrendingUpIcon,
  Trash2Icon,
  UserCheckIcon,
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
import { BlockAnalystDialog } from "./block-analyst-dialog";
import { ChangeAnalystStateDialog } from "./change-analyst-state-dialog";
import { EditAnalystProfileDialog } from "./edit-analyst-profile-dialog";
import { VerifyAnalystDialog } from "./verify-analyst-dialog";
import { ConfirmDialog } from "./_confirm-dialog";

export type AnalystRecord = {
  user_id: string;
  name: string;
  email: string;
  phone?: string;
  sebi_license_number?: string;
  specialization?: string[];
  experience_years?: number;
  state: string;
  profile_pic_url?: string;
  created_at?: string;
  performance?: {
    average_pnl_percent?: number;
    win_rate?: number;
    trades_count?: number;
    active_plans_count?: number;
  };
};

type Props = {
  analyst: AnalystRecord;
  trigger?: ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onRefresh?: () => void;
  onDelete?: (analystId: string) => void;
};

export function AnalystDetailCardDialog({
  analyst,
  trigger,
  open: externalOpen,
  onOpenChange: externalOnOpenChange,
  onRefresh,
  onDelete,
}: Props) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isOpen = externalOpen !== undefined ? externalOpen : internalOpen;
  const setOpen = externalOnOpenChange || setInternalOpen;

  const isBlocked = /BLOCKED/i.test(analyst.state);
  const isPending = /PENDING|ONGOING/i.test(analyst.state);
  const isActive = /ACTIVE/i.test(analyst.state);

  const stateVariant = isBlocked
    ? "destructive"
    : isPending
      ? "outline"
      : isActive
        ? "default"
        : "secondary";

  const specs = Array.isArray(analyst.specialization) ? analyst.specialization : [];

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
                <div className="flex size-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold text-lg">
                  {analyst.name ? analyst.name.slice(0, 2).toUpperCase() : "AN"}
                </div>
                <div>
                  <SheetTitle className="text-lg font-bold flex items-center gap-2">
                    {analyst.name || "Analyst Details"}
                    <Badge variant="outline" className="text-[10px] font-mono">
                      {analyst.experience_years ? `${analyst.experience_years}Y Exp` : "Analyst"}
                    </Badge>
                  </SheetTitle>
                  <SheetDescription className="text-xs font-mono text-muted-foreground mt-0.5">
                    SEBI Reg: {analyst.sebi_license_number || "PENDING"}
                  </SheetDescription>
                </div>
              </div>
              <Badge variant={stateVariant} className="uppercase text-[11px] font-semibold">
                {analyst.state || "PENDING"}
              </Badge>
            </div>
          </SheetHeader>

          <div className="space-y-6 py-6 text-sm">
            {/* Quick Performance Grid */}
            <div className="grid grid-cols-3 gap-3 rounded-lg border bg-emerald-500/5 p-3 text-center text-xs">
              <div>
                <span className="text-muted-foreground text-[10px]">Avg PnL %</span>
                <p className="mt-0.5 text-base font-bold text-emerald-600 dark:text-emerald-400">
                  {typeof analyst.performance?.average_pnl_percent === "number"
                    ? `${analyst.performance.average_pnl_percent}%`
                    : "—"}
                </p>
              </div>
              <div>
                <span className="text-muted-foreground text-[10px]">Win Rate %</span>
                <p className="mt-0.5 text-base font-bold text-blue-600 dark:text-blue-400">
                  {typeof analyst.performance?.win_rate === "number"
                    ? `${analyst.performance.win_rate}%`
                    : "—"}
                </p>
              </div>
              <div>
                <span className="text-muted-foreground text-[10px]">Active Plans</span>
                <p className="mt-0.5 text-base font-bold text-foreground">
                  {analyst.performance?.active_plans_count ?? 0}
                </p>
              </div>
            </div>

            {/* SEBI & License Details */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                SEBI License & Credentials
              </h3>
              <div className="space-y-2 rounded-md border p-3.5 text-xs">
                <div className="flex items-center justify-between py-1 border-b border-border/50">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <FileTextIcon className="size-3.5" /> SEBI License No.
                  </span>
                  <span className="font-mono font-bold text-foreground">
                    {analyst.sebi_license_number || "Not Registered"}
                  </span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-border/50">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <AwardIcon className="size-3.5" /> Experience
                  </span>
                  <span className="font-medium text-foreground">
                    {analyst.experience_years ? `${analyst.experience_years} Years` : "—"}
                  </span>
                </div>
                <div className="flex items-center justify-between py-1">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <ShieldCheckIcon className="size-3.5" /> Verification State
                  </span>
                  <Badge variant={isActive ? "default" : "outline"}>
                    {isActive ? "SEBI Verified" : "Pending Verification"}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Specialization Tags */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Market Specialization
              </h3>
              <div className="flex flex-wrap gap-2 rounded-md border p-3.5">
                {specs.length > 0 ? (
                  specs.map((spec) => (
                    <Badge key={spec} variant="secondary" className="text-xs font-medium">
                      {spec}
                    </Badge>
                  ))
                ) : (
                  <span className="text-xs text-muted-foreground">No specializations configured</span>
                )}
              </div>
            </div>

            {/* Contact Information */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Contact & Analyst Profile
              </h3>
              <div className="space-y-2 rounded-md border p-3.5 text-xs">
                <div className="flex items-center justify-between py-1 border-b border-border/50">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <MailIcon className="size-3.5" /> Email
                  </span>
                  <span className="font-medium text-foreground">{analyst.email}</span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-border/50">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <PhoneIcon className="size-3.5" /> Phone
                  </span>
                  <span className="font-medium text-foreground">{analyst.phone || "—"}</span>
                </div>
                <div className="flex items-center justify-between py-1">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <CalendarIcon className="size-3.5" /> Registration Date
                  </span>
                  <span className="font-medium text-foreground">
                    {analyst.created_at ? new Date(analyst.created_at).toLocaleDateString("en-IN") : "Recent"}
                  </span>
                </div>
              </div>
            </div>

            {/* CRUD Operations Bar */}
            <div className="border-t pt-4 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                CRUD Actions & Verification Controls
              </h3>
              <div className="flex flex-wrap items-center gap-2">
                {isPending && (
                  <VerifyAnalystDialog
                    analystId={analyst.user_id}
                    refresh={() => {
                      onRefresh?.();
                    }}
                    trigger={
                      <Button size="sm" variant="default" className="gap-1.5 bg-emerald-600 hover:bg-emerald-700">
                        <UserCheckIcon className="size-3.5" /> Verify SEBI License
                      </Button>
                    }
                  />
                )}

                <EditAnalystProfileDialog
                  analystId={analyst.user_id}
                  currentName={analyst.name}
                  currentPhone={analyst.phone}
                  currentProfilePicUrl={analyst.profile_pic_url}
                  currentExperienceYears={analyst.experience_years}
                  currentSpecialization={specs}
                  refresh={() => {
                    onRefresh?.();
                  }}
                  trigger={
                    <Button size="sm" variant="outline" className="gap-1.5">
                      <PencilIcon className="size-3.5" /> Edit Profile
                    </Button>
                  }
                />

                <ChangeAnalystStateDialog
                  analystId={analyst.user_id}
                  currentState={analyst.state}
                  refresh={() => {
                    onRefresh?.();
                  }}
                  trigger={
                    <Button size="sm" variant="outline" className="gap-1.5">
                      <SlidersHorizontalIcon className="size-3.5" /> Change State
                    </Button>
                  }
                />

                <BlockAnalystDialog
                  analystId={analyst.user_id}
                  currentState={analyst.state}
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
                      {isBlocked ? "Unblock Analyst" : "Block Analyst"}
                    </Button>
                  }
                />

                <ConfirmDialog
                  title="Delete Analyst Record"
                  description={`Are you sure you want to permanently delete analyst "${analyst.name}" (${analyst.user_id})? This action cannot be undone.`}
                  confirmLabel="Delete Analyst"
                  destructive
                  onConfirm={async () => {
                    onDelete?.(analyst.user_id);
                    setOpen(false);
                    return { ok: true, message: "Analyst record deleted" };
                  }}
                  trigger={
                    <Button size="sm" variant="ghost" className="gap-1.5 text-destructive hover:bg-destructive/10">
                      <Trash2Icon className="size-3.5" /> Delete Analyst
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
