"use client";

import { useState } from "react";
import { ExternalLinkIcon, FileTextIcon, LoaderIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { adminFetch } from "@/lib/admin/client-api";

/**
 * Loads a short-lived SAS link on demand and renders the bank proof document
 * (cancelled cheque, passbook page, or statement).
 *
 * Shared by the review dialog — where it's the evidence behind an approval —
 * and the payout dialog, where it's what you check the transfer against before
 * sending money. Nothing loads until asked, so an idle tab isn't holding
 * someone's bank document on screen.
 */
export function ProofDocumentViewer({
  bankAccountId,
  label = "View proof document",
}: {
  bankAccountId: string;
  label?: string;
}) {
  const [state, setState] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [url, setUrl] = useState("");
  const [contentType, setContentType] = useState("");

  const load = async () => {
    setState("loading");
    try {
      const res = await adminFetch(
        `/api/admin/bank-accounts/${encodeURIComponent(bankAccountId)}/document`
      );
      const data = (await res.json().catch(() => ({}))) as Record<string, string>;
      if (!res.ok || !data.url) {
        setState("error");
        return;
      }
      setUrl(data.url);
      setContentType(data.content_type ?? "");
      setState("ready");
    } catch {
      setState("error");
    }
  };

  if (state === "ready") {
    return (
      <div className="space-y-2">
        <div className="overflow-hidden rounded-lg border bg-muted/20">
          {contentType === "application/pdf" ? (
            <iframe src={url} title="Proof document" className="h-[420px] w-full" />
          ) : (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={url} alt="Proof document" className="max-h-[420px] w-full object-contain" />
          )}
        </div>
        <div className="flex items-center justify-between gap-2">
          <p className="text-[10px] text-muted-foreground">
            Time-boxed link — expires shortly. Every view is logged against your account.
          </p>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="shrink-0 gap-1.5 text-xs"
            onClick={() => window.open(url, "_blank", "noopener,noreferrer")}
          >
            <ExternalLinkIcon className="size-3.5" />
            Full size
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      <Button
        type="button"
        size="sm"
        variant="outline"
        className="w-full gap-1.5 text-xs"
        disabled={state === "loading"}
        onClick={load}
      >
        {state === "loading" ? (
          <LoaderIcon className="size-3.5 animate-spin" />
        ) : (
          <FileTextIcon className="size-3.5" />
        )}
        {state === "loading" ? "Loading document…" : label}
      </Button>
      {state === "error" && (
        <p className="text-[11px] font-semibold text-red-600 dark:text-red-400">
          Couldn&apos;t load the document. It may not have finished uploading.
        </p>
      )}
    </div>
  );
}
