"use client";

import { useState, type ReactNode } from "react";
import { BellIcon, EyeIcon, SmartphoneIcon, ZapIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { adminFetch } from "@/lib/admin/client-api";
import { FormDialog, readFormResult, type FormResult } from "./_form-dialog";

/**
 * Audience segments the notification-service actually resolves
 * (handleBroadcastNotification). Anything outside this set is rejected
 * upstream with UNSUPPORTED_AUDIENCE, so don't offer it.
 */
const AUDIENCES: { label: string; type: string; value?: string }[] = [
  { label: "All Users (Traders & Analysts)", type: "ALL" },
  { label: "All Traders", type: "ALL_TRADERS" },
  { label: "All Analysts", type: "ALL_ANALYSTS" },
  { label: "Internal Team", type: "BY_USER_TYPE", value: "INTERNAL_TEAM" },
];

/**
 * Only PUSH and WS are wired end to end. The router resolves an EMAIL
 * preference but ChannelRouter never dispatches it, so an email checkbox here
 * would silently do nothing.
 */
const CHANNELS = [
  { id: "WS", label: "In-app (live)", icon: ZapIcon },
  { id: "PUSH", label: "Mobile push", icon: SmartphoneIcon },
] as const;

export type BroadcastResult = {
  broadcast_id: string;
  total: number;
  sent: number;
  failed: number;
};

type Props = {
  /** Called after a broadcast actually lands, so the caller can refetch. */
  onSuccess?: (result: BroadcastResult) => void;
  trigger?: ReactNode;
};

export function BroadcastComposerDialog({ onSuccess, trigger }: Props) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [audienceLabel, setAudienceLabel] = useState<string>(AUDIENCES[0].label);
  const [channels, setChannels] = useState<string[]>(["WS", "PUSH"]);
  const [confirmInput, setConfirmInput] = useState("");
  const [activeTab, setActiveTab] = useState<"edit" | "preview">("edit");

  const audience = AUDIENCES.find((a) => a.label === audienceLabel) ?? AUDIENCES[0];

  function resetForm() {
    setTitle("");
    setBody("");
    setAudienceLabel(AUDIENCES[0].label);
    setChannels(["WS", "PUSH"]);
    setConfirmInput("");
    setActiveTab("edit");
  }

  function toggleChannel(id: string) {
    setChannels((prev) => (prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]));
  }

  async function handleSubmit(): Promise<FormResult> {
    if (!title.trim() || !body.trim()) {
      return { ok: false, message: "Title and message body are required" };
    }
    if (channels.length === 0) {
      return { ok: false, message: "Select at least one delivery channel" };
    }
    // Fan-out is immediate and irreversible — every recipient gets a row and a
    // push the moment this returns. Make the operator spell it out.
    if (confirmInput.trim().toUpperCase() !== "SEND") {
      return { ok: false, message: 'Type SEND to confirm this broadcast' };
    }

    const res = await adminFetch("/api/admin/notifications/broadcast", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: title.trim(),
        body: body.trim(),
        audience: audience.value ? { type: audience.type, value: audience.value } : { type: audience.type },
        channels,
      }),
    });

    if (!res.ok) return readFormResult(res);

    const data = (await res.json().catch(() => ({}))) as Partial<BroadcastResult>;
    const result: BroadcastResult = {
      broadcast_id: data.broadcast_id ?? "UNKNOWN",
      total: data.total ?? 0,
      sent: data.sent ?? 0,
      failed: data.failed ?? 0,
    };

    if (result.total === 0) {
      return { ok: false, message: `No active users matched ${audience.label} — nothing was sent.` };
    }

    onSuccess?.(result);
    resetForm();
    return {
      ok: true,
      message:
        result.failed > 0
          ? `Delivered to ${result.sent} of ${result.total} users (${result.failed} failed)`
          : `Delivered to ${result.sent} users`,
    };
  }

  return (
    <FormDialog
      title="Compose Platform Broadcast"
      description="Sends immediately to every active user in the selected segment. There is no approval step and no undo."
      submitLabel="Send Broadcast"
      onSubmit={handleSubmit}
      onClose={resetForm}
      wide
      trigger={
        trigger || (
          <Button size="sm" className="gap-1.5">
            <BellIcon className="size-4" /> Compose Broadcast
          </Button>
        )
      }
    >
      <div className="space-y-4 py-2 text-xs">
        {/* Editor / Preview Switcher Tabs */}
        <div className="flex items-center gap-2 border-b pb-2">
          <button
            type="button"
            onClick={() => setActiveTab("edit")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
              activeTab === "edit"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Draft Editor
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("preview")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md flex items-center gap-1.5 transition-all ${
              activeTab === "preview"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <EyeIcon className="size-3.5" /> Live Preview
          </button>
        </div>

        {activeTab === "edit" ? (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium">Broadcast Title *</label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Important Market Update: RBI Rate Decision Announced"
                className="h-8 text-xs"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium">Target Audience Segment</label>
              <select
                value={audienceLabel}
                onChange={(e) => setAudienceLabel(e.target.value)}
                className="h-8 w-full rounded-md border border-input bg-background px-2 text-xs font-medium text-foreground"
              >
                {AUDIENCES.map((a) => (
                  <option key={a.label} value={a.label}>
                    {a.label}
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-muted-foreground">
                Only users in the ACTIVE state receive broadcasts.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium">Message Body *</label>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Write your broadcast content here..."
                rows={4}
                className="w-full rounded-md border border-input bg-background p-2.5 text-xs font-medium text-foreground focus:outline-hidden"
                required
              />
            </div>

            <div className="space-y-2 border-t pt-3">
              <label className="text-xs font-medium">Delivery Channels</label>
              <div className="flex flex-wrap items-center gap-3">
                {CHANNELS.map((ch) => {
                  const Icon = ch.icon;
                  return (
                    <label key={ch.id} className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={channels.includes(ch.id)}
                        onChange={() => toggleChannel(ch.id)}
                      />
                      <Icon className="size-3.5 text-muted-foreground" />
                      <span>{ch.label}</span>
                    </label>
                  );
                })}
              </div>
              <p className="text-[11px] text-muted-foreground">
                A recipient who disabled a channel in their own preferences still won&apos;t get it there.
                The in-app inbox entry is always created.
              </p>
            </div>

            <div className="space-y-1.5 border-t pt-3">
              <label className="text-xs font-medium">
                Type <span className="font-mono font-bold">SEND</span> to confirm *
              </label>
              <Input
                value={confirmInput}
                onChange={(e) => setConfirmInput(e.target.value)}
                placeholder="SEND"
                className="h-8 max-w-[200px] text-xs font-mono"
              />
            </div>
          </div>
        ) : (
          /* Live Preview Pane */
          <div className="rounded-lg border bg-muted/20 p-6 space-y-3">
            <div className="flex items-center justify-between">
              <Badge variant="outline" className="text-[10px] font-mono">
                Segment: {audience.value ?? audience.type}
              </Badge>
              <span className="text-[10px] text-muted-foreground">
                {channels.length > 0 ? channels.join(" + ") : "No channel selected"}
              </span>
            </div>
            <div className="rounded-md border bg-background p-4 shadow-xs space-y-2">
              <div className="flex items-center gap-2">
                <BellIcon className="size-4 text-blue-500" />
                <h4 className="font-bold text-foreground text-sm">
                  {title || "Untitled Notification"}
                </h4>
              </div>
              <p className="text-xs text-muted-foreground whitespace-pre-wrap">
                {body || "No message body written yet."}
              </p>
            </div>
          </div>
        )}
      </div>
    </FormDialog>
  );
}
