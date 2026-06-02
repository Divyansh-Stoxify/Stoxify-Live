"use client";

import { useState } from "react";
import { FilterIcon, XIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
  SheetTrigger,
} from "@/components/ui/sheet";

export type FilterDef = {
  key: string;
  label: string;
  options: { label: string; value: string }[];
};

type Props = {
  filters: FilterDef[];
  values: Record<string, string>;
  onChange: (values: Record<string, string>) => void;
};

export function FilterPopover({ filters, values, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Record<string, string>>(values);

  const activeCount = Object.values(values).filter(Boolean).length;

  function handleOpen() {
    setDraft({ ...values });
    setOpen(true);
  }

  function apply() {
    onChange(draft);
    setOpen(false);
  }

  function clear() {
    const cleared: Record<string, string> = {};
    for (const f of filters) cleared[f.key] = "";
    setDraft(cleared);
    onChange(cleared);
    setOpen(false);
  }

  return (
    <Sheet open={open} onOpenChange={(v) => { if (v) handleOpen(); else setOpen(false); }}>
      <SheetTrigger render={<Button variant="outline" />}>
        <FilterIcon />
        Filters
        {activeCount > 0 && (
          <span className="ml-1 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
            {activeCount}
          </span>
        )}
      </SheetTrigger>
      <SheetContent side="left" className="w-72 sm:max-w-72">
        <SheetHeader>
          <SheetTitle>Filters</SheetTitle>
        </SheetHeader>

        <div className="flex flex-col gap-5 overflow-y-auto px-4 py-3">
          {filters.map((f) => (
            <div key={f.key} className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                {f.label}
              </label>
              <select
                className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                value={draft[f.key] ?? ""}
                onChange={(e) => setDraft((prev) => ({ ...prev, [f.key]: e.target.value }))}
              >
                <option value="">All</option>
                {f.options.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>

        <SheetFooter>
          <Button variant="outline" onClick={clear} size="sm">
            <XIcon />
            Clear all
          </Button>
          <Button onClick={apply} size="sm">
            Apply
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
