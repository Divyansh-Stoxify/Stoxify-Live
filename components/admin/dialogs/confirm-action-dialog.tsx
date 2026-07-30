"use client";

import { useState, type ReactNode } from "react";
import { AlertTriangleIcon, Trash2Icon } from "lucide-react";

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
import { toastSuccess } from "./_action-toast";

type Props = {
  title: string;
  description: string;
  requireConfirmText?: string;
  confirmLabel?: string;
  destructive?: boolean;
  trigger?: ReactNode;
  onConfirm: () => void;
};

export function ConfirmActionDialog({
  title,
  description,
  requireConfirmText = "DELETE",
  confirmLabel = "Confirm Action",
  destructive = true,
  trigger,
  onConfirm,
}: Props) {
  const [open, setOpen] = useState(false);
  const [typedInput, setTypedInput] = useState("");

  const isConfirmed = !requireConfirmText || typedInput.trim() === requireConfirmText;

  const handleConfirm = () => {
    if (!isConfirmed) return;
    onConfirm();
    toastSuccess("Action completed");
    setOpen(false);
    setTypedInput("");
  };

  return (
    <>
      <span
        style={{ display: "contents" }}
        onClick={(e) => {
          e.stopPropagation();
          setOpen(true);
        }}
      >
        {trigger || (
          <Button size="sm" variant={destructive ? "destructive" : "outline"}>
            {confirmLabel}
          </Button>
        )}
      </span>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-2 text-destructive">
              <AlertTriangleIcon className="size-5" />
              <DialogTitle>{title}</DialogTitle>
            </div>
            <DialogDescription className="text-xs pt-1">{description}</DialogDescription>
          </DialogHeader>

          {requireConfirmText && (
            <div className="space-y-2 py-2 text-xs">
              <label className="text-xs font-medium">
                To confirm, type <span className="font-mono font-bold text-destructive">{requireConfirmText}</span> below:
              </label>
              <Input
                value={typedInput}
                onChange={(e) => setTypedInput(e.target.value)}
                placeholder={`Type "${requireConfirmText}" to confirm`}
                className="h-8 text-xs font-mono"
              />
            </div>
          )}

          <DialogFooter className="gap-2 sm:justify-end">
            <Button size="sm" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              variant={destructive ? "destructive" : "default"}
              disabled={!isConfirmed}
              onClick={handleConfirm}
            >
              {confirmLabel}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
