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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { BlockAnalystDialog } from "./block-analyst-dialog";
import { ChangeAnalystStateDialog } from "./change-analyst-state-dialog";
import { EditAnalystProfileDialog } from "./edit-analyst-profile-dialog";
import { VerifyAnalystDialog } from "./verify-analyst-dialog";
import { ViewAnalystDocumentsDialog } from "./view-analyst-documents-dialog";
import { ConfirmDialog } from "./_confirm-dialog";
import { realDocUrl } from "@/lib/utils";

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
  // Verification documents the analyst uploaded (Azure Blob URLs).
  aadhar_doc_url?: string;
  pan_doc_url?: string;
  sebi_license_doc_url?: string;
  verification?: {
    submitted_at?: string;
    reviewed_at?: string;
    rejection_reason?: string;
    documents?: { type?: string; url?: string; uploaded_at?: string }[];
  };
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

  const uploadedDocCount = [
    analyst.aadhar_doc_url,
    analyst.pan_doc_url,
    analyst.sebi_license_doc_url,
  ].filter((url) => realDocUrl(url)).length;

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
                <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold text-lg">
                  {analyst.name ? analyst.name.slice(0, 2).toUpperCase() : "AN"}
                </div>
                <div>
                  <DialogTitle className="text-lg font-bold flex items-center gap-2">
                    {analyst.name || "Analyst Details"}
                    <Badge variant="outline" className="text-[10px] font-mono">
                      {analyst.experience_years ? `${analyst.experience_years}Y Exp` : "Analyst"}
                    </Badge>
                  </DialogTitle>
                  <DialogDescription className="text-xs font-mono text-muted-foreground mt-0.5">
                    SEBI Reg: {analyst.sebi_license_number || "Not provided"}
                  </DialogDescription>
                </div>
              </div>
              <Badge variant={stateVariant} className="uppercase text-[11px] font-semibold shrink-0">
                {analyst.state || "—"}
              </Badge>
            </div>
          </DialogHeader>

          <div className="space-y-6 py-4 text-sm">
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
                  {analyst.performance?.active_plans_count ?? "—"}
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
                    {analyst.sebi_license_number || "Not provided"}
                  </span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-border/50">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <BriefcaseIcon className="size-3.5" /> Experience
                  </span>
                  <span className="font-semibold text-foreground">
                    {analyst.experience_years ? `${analyst.experience_years} Years` : "—"}
                  </span>
                </div>
                <div className="flex items-center justify-between py-1">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <ShieldCheckIcon className="size-3.5" /> Verification State
                  </span>
                  <Badge variant={stateVariant} className="text-[10px]">
                    {analyst.state || "—"}
                  </Badge>
                </div>
                <ViewAnalystDocumentsDialog
                  analyst={analyst}
                  trigger={
                    <Button size="sm" variant="outline" className="gap-1.5 w-full text-xs font-semibold mt-2 border-emerald-500/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10">
                      <FileTextIcon className="size-3.5" /> Inspect Submitted Documents ({uploadedDocCount} of 3 uploaded)
                    </Button>
                  }
                />
              </div>
            </div>

            {/* Specializations */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Market Specialization
              </h3>
              <div className="flex flex-wrap gap-1.5 rounded-md border p-3.5 text-xs">
                {specs.length > 0 ? (
                  specs.map((spec) => (
                    <Badge key={spec} variant="secondary" className="text-xs px-2 py-0.5">
                      {spec}
                    </Badge>
                  ))
                ) : (
                  <span className="text-muted-foreground text-xs italic">
                    No specializations configured
                  </span>
                )}
              </div>
            </div>

            {/* Contact & Analyst Profile */}
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
                  <span className="font-mono text-foreground">{analyst.phone || "—"}</span>
                </div>
                <div className="flex items-center justify-between py-1">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <CalendarIcon className="size-3.5" /> Registration Date
                  </span>
                  <span className="text-muted-foreground">
                    {analyst.created_at
                      ? new Date(analyst.created_at).toLocaleDateString("en-IN")
                      : "—"}
                  </span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3 pt-2 border-t">
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
        </DialogContent>
      </Dialog>
    </>
  );
}
