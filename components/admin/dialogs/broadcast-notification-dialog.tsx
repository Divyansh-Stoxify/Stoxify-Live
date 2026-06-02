"use client";

import { useState } from "react";
import type { ReactNode } from "react";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FormDialog } from "./_form-dialog";
import { adminFetch } from "@/lib/admin/client-api";

const AUDIENCE_TYPES = [
  { label: "All users", value: "ALL" },
  { label: "By user type", value: "BY_USER_TYPE" },
  { label: "By subscription", value: "BY_SUBSCRIPTION" },
] as const;

const CHANNELS = ["PUSH", "EMAIL", "WS"] as const;

type Props = {
  refresh: () => void;
  trigger: ReactNode;
};

export function BroadcastNotificationDialog({ refresh, trigger }: Props) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [audienceType, setAudienceType] = useState<string>("ALL");
  const [audienceValue, setAudienceValue] = useState("");
  const [channels, setChannels] = useState<string[]>(["PUSH"]);
  const [confirmInput, setConfirmInput] = useState("");

  function toggleChannel(ch: string) {
    setChannels((prev) =>
      prev.includes(ch) ? prev.filter((c) => c !== ch) : [...prev, ch]
    );
  }

  return (
    <FormDialog
      trigger={trigger}
      title="Broadcast notification"
      description="Send a notification to a group of users."
      submitLabel="Send broadcast"
      wide
      onSubmit={async () => {
        if (!title.trim()) return { ok: false, message: "Title is required", code: "VALIDATION_ERROR" };
        if (!body.trim()) return { ok: false, message: "Body is required", code: "VALIDATION_ERROR" };
        if (channels.length === 0) return { ok: false, message: "Select at least one channel", code: "VALIDATION_ERROR" };
        if (confirmInput !== "SEND") return { ok: false, message: 'Type SEND to confirm', code: "VALIDATION_ERROR" };

        const audience: { type: string; value?: string } = { type: audienceType };
        if (audienceType !== "ALL" && audienceValue) audience.value = audienceValue;

        const res = await adminFetch("/api/admin/notifications/broadcast", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title, body, audience, channels }),
        });
        const data = await res.json().catch(() => ({})) as Record<string, unknown>;
        return { ok: res.ok, message: data.message as string | undefined, code: data.code as string | undefined };
      }}
      onSuccess={refresh}
      onClose={() => { setTitle(""); setBody(""); setAudienceType("ALL"); setAudienceValue(""); setChannels(["PUSH"]); setConfirmInput(""); }}
    >
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium">Title</label>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Notification title" />
      </div>
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium">Body</label>
        <Textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Notification message..." rows={4} />
      </div>
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium">Audience</label>
        <select
          className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none focus-visible:border-ring"
          value={audienceType}
          onChange={(e) => setAudienceType(e.target.value)}
        >
          {AUDIENCE_TYPES.map((a) => (
            <option key={a.value} value={a.value}>{a.label}</option>
          ))}
        </select>
      </div>
      {audienceType !== "ALL" && (
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium">Audience value</label>
          <Input value={audienceValue} onChange={(e) => setAudienceValue(e.target.value)} placeholder={audienceType === "BY_USER_TYPE" ? "ANALYST" : "analyst_id"} />
        </div>
      )}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium">Channels</label>
        <div className="flex gap-3">
          {CHANNELS.map((ch) => (
            <label key={ch} className="flex items-center gap-1.5 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={channels.includes(ch)}
                onChange={() => toggleChannel(ch)}
                className="h-4 w-4 rounded border-input"
              />
              {ch}
            </label>
          ))}
        </div>
      </div>
      <div className="flex flex-col gap-1.5 border-t pt-3">
        <p className="text-sm text-muted-foreground">
          Type <span className="font-mono font-semibold">SEND</span> to confirm the broadcast
        </p>
        <Input value={confirmInput} onChange={(e) => setConfirmInput(e.target.value)} placeholder="SEND" />
      </div>
    </FormDialog>
  );
}
