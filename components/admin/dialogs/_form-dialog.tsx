"use client";

import { type ReactNode, useState } from "react";
import { LoaderCircleIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { toastError, toastNetworkError, toastSuccess } from "./_action-toast";

export type FormResult = { ok: boolean; message?: string; code?: string };

type Props = {
  trigger: ReactNode;
  title: string;
  description?: string;
  submitLabel?: string;
  onSubmit: () => Promise<FormResult>;
  onSuccess?: () => void;
  onClose?: () => void;
  children: ReactNode;
  disabled?: boolean;
  wide?: boolean;
};

export function FormDialog({
  trigger,
  title,
  description,
  submitLabel = "Save",
  onSubmit,
  onSuccess,
  onClose,
  children,
  disabled = false,
  wide = false,
}: Props) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [inlineError, setInlineError] = useState<string | null>(null);

  function close() {
    setOpen(false);
    setInlineError(null);
    onClose?.();
  }

  async function handleSubmit() {
    setIsSubmitting(true);
    setInlineError(null);
    try {
      const result = await onSubmit();
      if (result.ok) {
        toastSuccess(result.message ?? "Saved");
        close();
        onSuccess?.();
      } else {
        const msg = result.message ?? result.code ?? "Request failed";
        setInlineError(msg);
        toastError(result.code, result.message);
      }
    } catch {
      setInlineError("Service unavailable");
      toastNetworkError();
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <span
        style={{ display: "contents" }}
        onClick={(e) => {
          if (!disabled) {
            e.stopPropagation();
            setOpen(true);
          }
        }}
      >
        {trigger}
      </span>
      <Sheet
        open={open}
        onOpenChange={(v) => {
          if (!v && !isSubmitting) close();
        }}
      >
        <SheetContent className={wide ? "sm:max-w-2xl" : "sm:max-w-md"}>
          <SheetHeader>
            <SheetTitle>{title}</SheetTitle>
            {description && <SheetDescription>{description}</SheetDescription>}
          </SheetHeader>

          <div className="flex flex-col gap-4 overflow-y-auto px-4 py-2">
            {children}

            {inlineError && (
              <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {inlineError}
              </p>
            )}
          </div>

          <SheetFooter>
            <Button variant="outline" onClick={close} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting || disabled}>
              {isSubmitting && <LoaderCircleIcon className="animate-spin" />}
              {submitLabel}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </>
  );
}
