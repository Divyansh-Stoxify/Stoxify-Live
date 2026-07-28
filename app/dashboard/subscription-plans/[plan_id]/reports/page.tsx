"use client";

import React, { use, useState } from "react";
import { Icon } from "@/components/stoxify-icon";

export default function BatchReportsPage({ params }: { params: Promise<{ plan_id: string }> }) {
  const { plan_id } = use(params);
  
  const [range, setRange] = useState<"TODAY" | "LAST_7_DAYS" | "THIS_MONTH" | "CURRENT_FY" | "CUSTOM">("THIS_MONTH");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  
  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDownload = async () => {
    if (range === "CUSTOM" && (!fromDate || !toDate)) {
      setError("Please select both start and end dates for a custom range.");
      return;
    }
    
    setIsDownloading(true);
    setError(null);
    
    try {
      const url = new URL(`/api/analyst/plans/${plan_id}/reports`, window.location.origin);
      url.searchParams.set("range", range);
      if (range === "CUSTOM") {
        url.searchParams.set("from", fromDate);
        url.searchParams.set("to", toDate);
      }
      
      const res = await fetch(url.toString());
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        throw new Error(errorData?.message || "Failed to generate report");
      }
      
      const blob = await res.blob();
      
      console.log('[Report Download] Blob size:', blob.size, 'bytes');
      console.log('[Report Download] Content-Type:', res.headers.get("Content-Type"));

      // Validate blob size
      if (blob.size === 0) {
        throw new Error("Downloaded file is empty. Please try again.");
      }

      if (blob.size < 1024) {
        // Check if it's an error response that was sent as blob
        try {
          const text = await blob.text();
          const errorJson = JSON.parse(text);
          throw new Error(errorJson.message || errorJson.error || "Downloaded file is too small. This may indicate a server error.");
        } catch (parseError) {
          throw new Error("Downloaded file is too small. This may indicate a server error.");
        }
      }

      // Validate Content-Type
      const contentType = res.headers.get("Content-Type");
      if (!contentType?.includes("spreadsheetml") && !contentType?.includes("xlsx")) {
        throw new Error(`Invalid file type received: ${contentType || 'unknown'}`);
      }

      // Extract filename with RFC 6266 support
      let filename = "Batch_Performance_Statement.xlsx";
      const contentDisposition = res.headers.get("Content-Disposition");
      
      if (contentDisposition) {
        // Try UTF-8 encoded filename* first
        const filenameStarMatch = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i);
        if (filenameStarMatch?.[1]) {
          try {
            filename = decodeURIComponent(filenameStarMatch[1]);
          } catch {
            // Fallback to regular filename
          }
        }
        
        // Fallback to regular filename parameter
        if (!filenameStarMatch) {
          const filenameMatch = contentDisposition.match(/filename=["']?([^"';]+)["']?/i);
          if (filenameMatch?.[1]) {
            filename = filenameMatch[1];
          }
        }
      }
      
      const downloadUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = downloadUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(downloadUrl);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred during download.");
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 animate-[fadeIn_0.3s_ease-out]">
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-[20px] font-black text-[var(--ink)] tracking-tight mb-1">
            Performance Reports
          </h1>
          <p className="text-[13px] text-[var(--muted-2)] font-medium">
            Generate and download bank-statement-style XLSX performance reports for this batch.
          </p>
        </div>
        
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex gap-3 text-[13px] text-blue-900 shadow-sm">
          <Icon className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" name="helpCircle" />
          <div className="flex flex-col gap-1">
            <span className="font-bold">SEBI Record-Keeping Notice</span>
            <span className="opacity-90 leading-relaxed">
              These reports are structured to assist with 5-year record retention and self-review. All P&amp;L % and R:R values are embedded as live Excel formulas, allowing for easy verification.
            </span>
          </div>
        </div>
        
        <div className="bg-white border border-[var(--line)] rounded-xl p-6 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
          <h2 className="text-[15px] font-bold text-[var(--ink)] mb-4">Export Statement</h2>
          
          {error && (
            <div className="mb-5 bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-lg text-[13px] font-medium flex items-start gap-2">
              <Icon className="h-4 w-4 shrink-0 mt-0.5" name="ban" />
              <span>{error}</span>
            </div>
          )}
          
          <div className="space-y-5">
            <div>
              <label className="block text-[12px] font-bold text-[var(--muted)] uppercase tracking-wider mb-2">
                Date Range
              </label>
              <div className="flex flex-wrap gap-2">
                {(["TODAY", "LAST_7_DAYS", "THIS_MONTH", "CURRENT_FY", "CUSTOM"] as const).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRange(r)}
                    className={`px-4 py-2 rounded-lg text-[13px] font-semibold transition-all duration-200 border
                      ${range === r 
                        ? "bg-[var(--brand-light)] border-[var(--brand)]/30 text-[var(--brand)] shadow-sm" 
                        : "bg-[var(--surface)] border-transparent text-[var(--muted)] hover:bg-[var(--surface-hover)] hover:text-[var(--ink)]"
                      }`}
                  >
                    {r.replace(/_/g, " ")}
                  </button>
                ))}
              </div>
            </div>
            
            {range === "CUSTOM" && (
              <div className="flex gap-4 p-4 bg-[var(--surface)] rounded-xl border border-[var(--line)]/50 animate-[fadeIn_0.2s_ease-out]">
                <div className="flex-1">
                  <label className="block text-[11px] font-bold text-[var(--muted)] uppercase tracking-wider mb-1.5">
                    From Date
                  </label>
                  <input
                    type="date"
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                    max={toDate || undefined}
                    className="w-full h-10 px-3 rounded-lg border border-[var(--line)] bg-white text-[13px] text-[var(--ink)] focus:border-[var(--brand)] focus:ring-1 focus:ring-[var(--brand)] outline-none transition-all"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-[11px] font-bold text-[var(--muted)] uppercase tracking-wider mb-1.5">
                    To Date
                  </label>
                  <input
                    type="date"
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                    min={fromDate || undefined}
                    className="w-full h-10 px-3 rounded-lg border border-[var(--line)] bg-white text-[13px] text-[var(--ink)] focus:border-[var(--brand)] focus:ring-1 focus:ring-[var(--brand)] outline-none transition-all"
                  />
                </div>
              </div>
            )}
            
            <div className="pt-4 border-t border-[var(--line)]/50 flex justify-end">
              <button
                type="button"
                onClick={handleDownload}
                disabled={isDownloading}
                className="flex items-center justify-center gap-2 h-10 px-6 rounded-lg bg-[var(--brand)] text-white text-[13px] font-bold hover:bg-[var(--brand-dark)] transition-colors active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed shadow-sm min-w-[140px]"
              >
                {isDownloading ? (
                  <>
                    <Icon className="h-4 w-4 animate-spin" name="loader" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Icon className="h-4 w-4" name="download" />
                    Download XLSX
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
