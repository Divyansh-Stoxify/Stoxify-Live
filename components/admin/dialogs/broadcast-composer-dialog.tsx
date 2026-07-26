"use client";

import { useState, type ReactNode } from "react";
import { BellIcon, CalendarIcon, EyeIcon, SendIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormDialog, type FormResult } from "./_form-dialog";

export type BroadcastData = {
  title: string;
  body: string;
  target_audience: string;
  scheduled_at?: string;
  status: "PENDING_APPROVAL" | "SENT" | "SCHEDULED";
  created_at: string;
};

type Props = {
  onSuccess?: (broadcast: BroadcastData) => void;
  trigger?: ReactNode;
};

export function BroadcastComposerDialog({ onSuccess, trigger }: Props) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [targetAudience, setTargetAudience] = useState("ALL_USERS");
  const [sendOption, setSendOption] = useState<"now" | "schedule">("now");
  const [scheduledDate, setScheduledDate] = useState("");
  const [activeTab, setActiveTab] = useState<"edit" | "preview">("edit");

  function resetForm() {
    setTitle("");
    setBody("");
    setTargetAudience("ALL_USERS");
    setSendOption("now");
    setScheduledDate("");
    setActiveTab("edit");
  }

  async function handleSubmit(): Promise<FormResult> {
    if (!title.trim() || !body.trim()) {
      return { ok: false, message: "Title and message body are required" };
    }

    const payload: BroadcastData = {
      title: title.trim(),
      body: body.trim(),
      target_audience: targetAudience,
      scheduled_at: sendOption === "schedule" ? scheduledDate : undefined,
      status: sendOption === "schedule" ? "SCHEDULED" : "PENDING_APPROVAL",
      created_at: new Date().toISOString(),
    };

    onSuccess?.(payload);
    resetForm();
    return {
      ok: true,
      message:
        sendOption === "schedule"
          ? `Broadcast scheduled for ${targetAudience}`
          : `Broadcast submitted for admin review`,
    };
  }

  return (
    <FormDialog
      title="Compose Platform Broadcast"
      description="Create a broadcast notification with target audience segmentation, live preview, and scheduling options."
      submitLabel="Submit for Approval"
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
                value={targetAudience}
                onChange={(e) => setTargetAudience(e.target.value)}
                className="h-8 w-full rounded-md border border-input bg-background px-2 text-xs font-medium text-foreground"
              >
                <option value="ALL_USERS">All Users (Traders & Analysts)</option>
                <option value="ACTIVE_TRADERS">Active Traders (Subscribers)</option>
                <option value="SEBI_ANALYSTS">SEBI Registered Analysts</option>
                <option value="INTERNAL_TEAM">Internal Team Members</option>
              </select>
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

            {/* Delivery Option */}
            <div className="space-y-2 border-t pt-3">
              <label className="text-xs font-medium">Delivery Schedule</label>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="sendOption"
                    checked={sendOption === "now"}
                    onChange={() => setSendOption("now")}
                  />
                  <span>Submit for Immediate Review & Delivery</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="sendOption"
                    checked={sendOption === "schedule"}
                    onChange={() => setSendOption("schedule")}
                  />
                  <span>Schedule for Future Date</span>
                </label>
              </div>

              {sendOption === "schedule" && (
                <div className="pt-2">
                  <Input
                    type="datetime-local"
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    className="h-8 text-xs max-w-xs"
                  />
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Live Preview Pane */
          <div className="rounded-lg border bg-muted/20 p-6 space-y-3">
            <div className="flex items-center justify-between">
              <Badge variant="outline" className="text-[10px] font-mono">
                Segment: {targetAudience}
              </Badge>
              <span className="text-[10px] text-muted-foreground">Notification Preview</span>
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
