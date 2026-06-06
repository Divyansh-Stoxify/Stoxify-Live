"use client";

import { useState } from "react";
import type { ReactNode } from "react";

import { Input } from "@/components/ui/input";
import { FormDialog } from "./_form-dialog";
import { adminFetch } from "@/lib/admin/client-api";

type Props = {
  userId: string;
  currentName?: string;
  currentPhone?: string;
  currentProfilePicUrl?: string;
  refresh: () => void;
  trigger: ReactNode;
};

export function EditUserProfileDialog({
  userId,
  currentName = "",
  currentPhone = "",
  currentProfilePicUrl = "",
  refresh,
  trigger,
}: Props) {
  const [name, setName] = useState(currentName);
  const [phone, setPhone] = useState(currentPhone);
  const [profilePicUrl, setProfilePicUrl] = useState(currentProfilePicUrl);

  return (
    <FormDialog
      trigger={trigger}
      title="Edit user profile"
      description="Only provided fields will be updated."
      submitLabel="Save changes"
      onSubmit={async () => {
        const body: Record<string, string> = {};
        if (name !== currentName) body.name = name;
        if (phone !== currentPhone) body.phone = phone;
        if (profilePicUrl !== currentProfilePicUrl) body.profile_pic_url = profilePicUrl;
        const res = await adminFetch(`/api/admin/users/${encodeURIComponent(userId)}/profile`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
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
    </FormDialog>
  );
}
