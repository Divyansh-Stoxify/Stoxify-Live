"use client";

import { type ReactNode, useState } from "react";
import { LoaderCircleIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toastError, toastNetworkError, toastSuccess } from "./_action-toast";

export type ConfirmResult = { ok: boolean; message?: string; code?: string };

type Props = {
  trigger: ReactNode;
  title: string;
  description?: string;
  confirmLabel?: string;
  destructive?: boolean;
  requireConfirmText?: string;
  onConfirm: () => Promise<ConfirmResult>;
  onSuccess?: () => void;
  onClose?: () => void;
  children?: ReactNode;
  disabled?: boolean;
};

export function ConfirmDialog({
  trigger,
  title,
  description,
  confirmLabel = "Confirm",
  destructive = false,
  requireConfirmText,
  onConfirm,
  onSuccess,
  onClose,
  children,
  disabled = false,
}: Props) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [inlineError, setInlineError] = useState<string | null>(null);
  const [confirmInput, setConfirmInput] = useState("");

  function close() {
    setOpen(false);
    setInlineError(null);
    setConfirmInput("");
    onClose?.();
  }

  async function handleConfirm() {
    if (requireConfirmText && confirmInput !== requireConfirmText) return;
    setIsSubmitting(true);
    setInlineError(null);
    try {
      const result = await onConfirm();
      if (result.ok) {
        toastSuccess(result.message ?? "Done");
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

  const confirmDisabled =
    isSubmitting ||
    disabled ||
    (!!requireConfirmText && confirmInput !== requireConfirmText);

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
      <Dialog open={open} onOpenChange={(v) => { if (!v && !isSubmitting) close(); }}>
        <DialogContent showCloseButton={!isSubmitting}>
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            {description && <DialogDescription>{description}</DialogDescription>}
          </DialogHeader>

          <div className="flex flex-col gap-3">
            {children}

            {requireConfirmText && (
              <div className="flex flex-col gap-1.5">
                <p className="text-sm text-muted-foreground">
                  Type{" "}
                  <span className="font-mono font-semibold">{requireConfirmText}</span>{" "}
                  to confirm
                </p>
                <Input
                  value={confirmInput}
                  onChange={(e) => setConfirmInput(e.target.value)}
                  placeholder={requireConfirmText}
                  disabled={isSubmitting}
                />
              </div>
            )}

            {inlineError && (
              <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {inlineError}
              </p>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={close} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              variant={destructive ? "destructive" : "default"}
              onClick={handleConfirm}
              disabled={confirmDisabled}
            >
              {isSubmitting && <LoaderCircleIcon className="animate-spin" />}
              {confirmLabel}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
