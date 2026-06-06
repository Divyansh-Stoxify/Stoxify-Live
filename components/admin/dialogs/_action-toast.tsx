"use client";

import { toast } from "sonner";

export function toastSuccess(message?: string) {
  toast.success(message ?? "Done", {
    duration: 3000,
    style: { background: "hsl(var(--background))", border: "1px solid hsl(var(--border))" },
  });
}

export function toastError(code?: string, message?: string) {
  const title = message ?? code ?? "Something went wrong";
  const description = code && message ? `Code: ${code}` : undefined;
  toast.error(title, {
    description,
    duration: Infinity,
    style: { background: "hsl(var(--background))", border: "1px solid hsl(var(--destructive))" },
  });
}

export function toastNetworkError() {
  toast.error("Service unavailable", {
    description: "Backend did not respond. Check service health.",
    duration: Infinity,
    style: { background: "hsl(var(--background))", border: "1px solid hsl(var(--destructive))" },
  });
}
