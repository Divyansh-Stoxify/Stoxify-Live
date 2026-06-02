"use client";

import { useState } from "react";
import type { ReactNode } from "react";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FormDialog } from "./_form-dialog";
import { adminFetch } from "@/lib/admin/client-api";

type Props = {
  planId: string;
  currentName?: string;
  currentDays?: number;
  currentPrice?: number;
  currentSegment?: string;
  currentDescription?: string;
  refresh: () => void;
  trigger: ReactNode;
};

export function EditPlanDialog({
  planId,
  currentName = "",
  currentDays,
  currentPrice,
  currentSegment = "",
  currentDescription = "",
  refresh,
  trigger,
}: Props) {
  const [name, setName] = useState(currentName);
  const [days, setDays] = useState(String(currentDays ?? ""));
  const [price, setPrice] = useState(String(currentPrice ?? ""));
  const [segment, setSegment] = useState(currentSegment);
  const [description, setDescription] = useState(currentDescription);

  return (
    <FormDialog
      trigger={trigger}
      title="Edit plan"
      description="Only provided fields will be updated."
      submitLabel="Save changes"
      onSubmit={async () => {
        const body: Record<string, unknown> = {};
        if (name !== currentName) body.name = name;
        const d = Number(days);
        if (days && !Number.isNaN(d)) body.days = d;
        const p = Number(price);
        if (price && !Number.isNaN(p)) body.price = p;
        if (segment !== currentSegment) body.segment = segment;
        if (description !== currentDescription) body.description = description;
        const res = await adminFetch(`/api/admin/plans/${encodeURIComponent(planId)}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        const data = await res.json().catch(() => ({})) as Record<string, unknown>;
        return { ok: res.ok, message: data.message as string | undefined, code: data.code as string | undefined };
      }}
      onSuccess={refresh}
      onClose={() => {
        setName(currentName); setDays(String(currentDays ?? "")); setPrice(String(currentPrice ?? ""));
        setSegment(currentSegment); setDescription(currentDescription);
      }}
    >
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium">Plan name</label>
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Plan name" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium">Days</label>
          <Input type="number" value={days} onChange={(e) => setDays(e.target.value)} placeholder="30" min={1} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium">Price (INR)</label>
          <Input type="number" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="999" min={0} />
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium">Segment</label>
        <Input value={segment} onChange={(e) => setSegment(e.target.value)} placeholder="EQUITY" />
      </div>
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium">Description</label>
        <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Plan description..." rows={3} />
      </div>
    </FormDialog>
  );
}
