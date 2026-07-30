"use client";

import { useState, type ReactNode } from "react";
import { PlusIcon, UserCheckIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormDialog, readFormResult, type FormResult } from "./_form-dialog";
import { adminFetch } from "@/lib/admin/client-api";

export type NewAnalystData = {
  name: string;
  email: string;
  phone?: string;
  sebi_license_number?: string;
  experience_years?: number;
  specialization: string[];
  state: string;
};

const SPEC_OPTIONS = ["Equity", "Options", "Futures", "Commodities", "Crypto", "Forex"];

type Props = {
  /** Fired only after the backend confirms the create. Refetch here. */
  onSuccess?: () => void;
  trigger?: ReactNode;
};

export function CreateAnalystDialog({ onSuccess, trigger }: Props) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [sebiLicense, setSebiLicense] = useState("");
  const [experience, setExperience] = useState<number>(3);
  const [selectedSpecs, setSelectedSpecs] = useState<string[]>(["Equity", "Options"]);
  const [state, setState] = useState("PENDING");

  function resetForm() {
    setName("");
    setEmail("");
    setPhone("");
    setSebiLicense("");
    setExperience(3);
    setSelectedSpecs(["Equity", "Options"]);
    setState("PENDING");
  }

  function toggleSpec(spec: string) {
    setSelectedSpecs((prev) =>
      prev.includes(spec) ? prev.filter((s) => s !== spec) : [...prev, spec]
    );
  }

  async function handleSubmit(): Promise<FormResult> {
    if (!name.trim() || !email.trim()) {
      return { ok: false, message: "Name and email are required" };
    }

    const payload: NewAnalystData = {
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim() || undefined,
      sebi_license_number: sebiLicense.trim() || undefined,
      experience_years: Number(experience) || 0,
      specialization: selectedSpecs,
      state,
    };

    try {
      const res = await adminFetch("/api/admin/analysts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) return readFormResult(res);

      onSuccess?.();
      resetForm();
      return readFormResult(res);
    } catch {
      // A dead backend is not a created analyst — say so instead of pretending.
      return { ok: false, message: "Unable to reach the user service", code: "SERVICE_UNAVAILABLE" };
    }
  }

  return (
    <FormDialog
      title="Add New SEBI Analyst"
      description="Register a new analyst on the platform with SEBI credentials and specialization details."
      submitLabel="Create Analyst"
      onSubmit={handleSubmit}
      onClose={resetForm}
      trigger={
        trigger || (
          <Button size="sm" className="gap-1.5 bg-emerald-600 hover:bg-emerald-700">
            <PlusIcon className="size-4" /> Add Analyst
          </Button>
        )
      }
    >
      <div className="space-y-4 py-2 text-xs">
        <div className="space-y-1.5">
          <label className="text-xs font-medium">Full Name *</label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Analyst's full legal name"
            className="h-8 text-xs"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-xs font-medium">Email Address *</label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. rk_damani@example.com"
              className="h-8 text-xs"
              required
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium">Phone Number</label>
            <Input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="e.g. +91 9820012345"
              className="h-8 text-xs"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-xs font-medium">SEBI Registration License No.</label>
            <Input
              value={sebiLicense}
              onChange={(e) => setSebiLicense(e.target.value)}
              placeholder="e.g. INH000009988"
              className="h-8 text-xs font-mono"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium">Experience (Years)</label>
            <Input
              type="number"
              value={experience}
              onChange={(e) => setExperience(Number(e.target.value))}
              placeholder="e.g. 5"
              className="h-8 text-xs"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium">Trading Specializations</label>
          <div className="flex flex-wrap gap-1.5 pt-1">
            {SPEC_OPTIONS.map((spec) => {
              const active = selectedSpecs.includes(spec);
              return (
                <button
                  type="button"
                  key={spec}
                  onClick={() => toggleSpec(spec)}
                  className={`rounded-md px-2.5 py-1 text-xs font-medium transition-all ${
                    active
                      ? "bg-emerald-600 text-white"
                      : "border border-input bg-background text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {spec}
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium">Initial Verification State</label>
          <select
            value={state}
            onChange={(e) => setState(e.target.value)}
            className="h-8 w-full rounded-md border border-input bg-background px-2 text-xs font-medium text-foreground"
          >
            <option value="PENDING">PENDING (Queue for SEBI Verification)</option>
            <option value="ACTIVE">ACTIVE (Verified Analyst)</option>
            <option value="SUSPENDED">SUSPENDED</option>
            <option value="BLOCKED">BLOCKED</option>
          </select>
        </div>
      </div>
    </FormDialog>
  );
}
