"use client";

import { useState } from "react";
import type { ReactNode } from "react";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FormDialog } from "./_form-dialog";
import { adminFetch } from "@/lib/admin/client-api";

type Props = {
  analystId: string;
  currentName?: string;
  currentPhone?: string;
  currentProfilePicUrl?: string;
  currentExperienceYears?: number;
  currentSpecialization?: string[];
  refresh: () => void;
  trigger: ReactNode;
};

export function EditAnalystProfileDialog({
  analystId,
  currentName = "",
  currentPhone = "",
  currentProfilePicUrl = "",
  currentExperienceYears,
  currentSpecialization = [],
  refresh,
  trigger,
}: Props) {
  const [name, setName] = useState(currentName);
  const [phone, setPhone] = useState(currentPhone);
  const [profilePicUrl, setProfilePicUrl] = useState(currentProfilePicUrl);
  const [experienceYears, setExperienceYears] = useState(String(currentExperienceYears ?? ""));
  const [specialization, setSpecialization] = useState(currentSpecialization.join(", "));

  return (
    <FormDialog
      trigger={trigger}
      title="Edit analyst profile"
      description="Only provided fields will be updated."
      submitLabel="Save changes"
      onSubmit={async () => {
        const body: Record<string, unknown> = {};
        if (name !== currentName) body.name = name;
        if (phone !== currentPhone) body.phone = phone;
        if (profilePicUrl !== currentProfilePicUrl) body.profile_pic_url = profilePicUrl;
        const exp = Number(experienceYears);
        if (experienceYears && !Number.isNaN(exp)) body.experience_years = exp;
        if (specialization) {
          body.specialization = specialization
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean);
        }
        const res = await adminFetch(
          `/api/admin/analysts/${encodeURIComponent(analystId)}/profile`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          }
        );
        const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
        return {
          ok: res.ok,
          message: data.message as string | undefined,
          code: data.code as string | undefined,
        };
      }}
      onSuccess={refresh}
      onClose={() => {
        setName(currentName);
        setPhone(currentPhone);
        setProfilePicUrl(currentProfilePicUrl);
        setExperienceYears(String(currentExperienceYears ?? ""));
        setSpecialization(currentSpecialization.join(", "));
      }}
    >
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium">Name</label>
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" />
      </div>
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium">Phone</label>
        <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91..." />
      </div>
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium">Profile picture URL</label>
        <Input
          value={profilePicUrl}
          onChange={(e) => setProfilePicUrl(e.target.value)}
          placeholder="https://..."
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium">Experience (years)</label>
        <Input
          type="number"
          value={experienceYears}
          onChange={(e) => setExperienceYears(e.target.value)}
          placeholder="5"
          min={0}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium">Specialization (comma separated)</label>
        <Textarea
          value={specialization}
          onChange={(e) => setSpecialization(e.target.value)}
          placeholder="EQUITY, DERIVATIVES, CRYPTO"
          rows={2}
        />
      </div>
    </FormDialog>
  );
}
