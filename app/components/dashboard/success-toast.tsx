"use client";

import { Icon } from "@/app/components/stoxify-icon";

interface SuccessToastProps {
  title: string;
  message: string;
  onClose: () => void;
}

/**
 * SUCCESS TOAST NOTIFICATION
 *
 * Appears floating in the top-right corner when actions complete successfully.
 * Designed to look premium and aligned with the Stoxify design tokens.
 */
export function SuccessToast({ title, message, onClose }: SuccessToastProps) {
  return (
    <div
      className="fixed right-6 top-[72px] z-[9999] flex w-[420px] max-w-[calc(100vw-48px)] animate-[slideIn_0.3s_ease-out] rounded-xl border border-[var(--green)]/35 bg-white p-4 shadow-[0_12px_32px_-4px_rgba(0,0,0,0.08),0_4px_12px_-2px_rgba(0,0,0,0.03)] transition-all"
      role="alert"
    >
      {/* Green Check Indicator */}
      <div className="mr-3 mt-0.5 text-[var(--green)] shrink-0">
        <Icon className="h-5 w-5" name="circleCheck" />
      </div>

      {/* Content */}
      <div className="flex-1 pr-6">
        <h3 className="text-[13.5px] font-bold text-[var(--ink)] leading-tight">{title}</h3>
        <p className="mt-1.5 text-[12px] leading-relaxed text-[var(--muted)]">{message}</p>
      </div>

      {/* Close Button */}
      <button
        aria-label="Dismiss notification"
        className="absolute right-3 top-3.5 flex h-6 w-6 items-center justify-center rounded-md text-[var(--muted-2)] transition-colors hover:bg-[var(--surface)] hover:text-[var(--ink)]"
        onClick={onClose}
        type="button"
      >
        <Icon className="h-3 w-3" name="x" />
      </button>
    </div>
  );
}
