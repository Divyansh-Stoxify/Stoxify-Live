import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** A trade's `batch` field is a name string, or a list of names when published
 * to several batches at once — normalise to one display string. */
export function formatBatch(batch: string | string[] | undefined | null): string {
  if (Array.isArray(batch)) return batch.filter(Boolean).join(" · ");
  return batch ?? "";
}

/**
 * Formats a raw status string (e.g. "MANUALLY_CLOSED") into a clean, human-readable label
 * (e.g. "Manually Closed").
 */
export function formatStatus(status?: string | null): string {
  if (!status) return "";
  const upper = status.trim().toUpperCase();
  switch (upper) {
    case "LIVE":
    case "ACTIVE":
      return "Live";
    case "MANUALLY_CLOSED":
    case "CLOSED_MANUALLY":
      return "Manually Closed";
    case "TARGET_HIT":
    case "CLOSED_BY_TARGET":
      return "Target Hit";
    case "SL_HIT":
    case "CLOSED_BY_SL":
    case "STOP_LOSS_HIT":
      return "Stop Loss Hit";
    case "PARTIAL_BOOKED":
    case "PARTIAL_TARGET":
    case "PARTIAL_HIT":
      return "Partial Target Hit";
    case "CLOSED":
      return "Closed";
    case "EXPIRED":
      return "Expired";
    case "CANCELLED":
      return "Cancelled";
    case "PENDING":
      return "Pending";
    case "INACTIVE":
      return "Inactive";
    default:
      return upper
        .split("_")
        .map((w) => w.charAt(0) + w.slice(1).toLowerCase())
        .join(" ");
  }
}

export function cleanErrorMessage(
  data:
    | {
        code?: string | number | null;
        error?: string | number | null;
        message?: string | null;
        details?: { reason?: string | null } | null;
      }
    | null
    | undefined,
  defaultMsg: string = "An unexpected error occurred. Please try again."
): string {
  if (!data) return defaultMsg;

  const code = String(data.code ?? data.error ?? "");
  const message = String(data.message ?? "");
  const rawReason = String(data.details?.reason ?? "");

  // 1. Check for specific backend codes
  if (code === "INSUFFICIENT_POWER") {
    if (/KYC_PENDING/i.test(rawReason)) {
      return "Your account KYC is pending verification. Complete KYC before publishing trades.";
    }
    if (/PENDING_VERIFICATION|VERIFICATION_PENDING/i.test(rawReason)) {
      return "Your analyst account is awaiting admin verification. You cannot publish trades until approved.";
    }
    if (/SUSPENDED/i.test(rawReason)) {
      return "Your account is suspended. Contact support to restore publishing access.";
    }
    if (/BLOCKED/i.test(rawReason)) {
      return "Your account is blocked. Contact support for assistance.";
    }
    if (/does not have power/i.test(rawReason)) {
      return "You do not have permission to perform this action. Contact your administrator.";
    }
    if (/does not own/i.test(rawReason)) {
      return "You do not have ownership of this resource.";
    }

    // General parsing of state in the rawReason
    const stateMatch = rawReason.match(/User state is ([A-Z_]+)/i);
    if (stateMatch) {
      const rawState = stateMatch[1].toUpperCase();
      const stateMap: { [key: string]: string } = {
        KYC_PENDING: "pending KYC verification",
        VERIFICATION_PENDING: "awaiting admin verification",
        VERIFICATION_ONGOING: "under review",
        SUSPENDED: "suspended",
        BLOCKED: "blocked",
        UNVERIFIED: "unverified",
      };
      const stateDescription =
        stateMap[rawState] || `in state ${rawState.toLowerCase().replace(/_/g, " ")}`;
      return `Access denied. Your account is currently ${stateDescription}. Please contact support for assistance.`;
    }
    return "Permission denied. You do not have the required permissions.";
  }

  if (code === "UNAUTHORIZED") {
    return "Your session has expired. Please sign in again.";
  }

  if (code === "ANALYST_NOT_ACTIVE") {
    return "Your analyst account is not yet active. Wait for admin approval before publishing trades.";
  }

  if (code === "OUTSIDE_MARKET_HOURS") {
    return "Market is currently closed. Equity & F&O trades can only be published between 9:15 AM – 3:30 PM IST on weekdays.";
  }

  if (code === "BATCH_REQUIRED") {
    return "Please select a subscription batch.";
  }

  if (code === "BATCH_PLAN_MISMATCH") {
    return "Selected subscription batches and plans do not match. Please re-select your subscription batches.";
  }

  if (code === "SEGMENT_MISMATCH") {
    return "The selected batch does not support this market segment. Choose a compatible batch or change the instrument.";
  }

  if (code === "INVALID_BATCH") {
    return "The selected batch was not found. It may have been deleted — please refresh and try again.";
  }

  if (code === "MISSING_FIELDS") {
    return "Required fields are missing. Please fill in all required fields.";
  }

  if (code === "MISSING_TARGET") {
    return "At least one target price must be provided.";
  }

  if (code === "INVALID_PRICE_LEVELS") {
    if (/LONG|BUY/i.test(message)) {
      return "Invalid price levels for a LONG trade. Required order: Stop Loss < Entry/LTP < Target(s).";
    }
    if (/SHORT|SELL/i.test(message)) {
      return "Invalid price levels for a SHORT trade. Required order: Stop Loss > Entry/LTP > Target(s).";
    }
    return "Invalid price levels. Check that stop loss, entry/ltp and targets are in the correct order.";
  }

  if (code === "INVALID_DIRECTION") {
    return "Invalid trade direction. Please select LONG or SHORT.";
  }

  if (code === "INVALID_BOOK_PERCENT") {
    return "Target allocations must add up to exactly 100%.";
  }

  if (code === "MISSING_EXPIRY") {
    return "A contract expiry date is required for F&O trades.";
  }

  if (code === "INVALID_EXPIRY" || code === "INVALID_EXPIRY_FORMAT") {
    return "Invalid or expired contract date. Please select a valid future expiry.";
  }

  if (code === "INTERNAL_ERROR") {
    return "A server error occurred. Please try again in a moment.";
  }

  // 2. Fallback check: sanitize message if it has raw technical details
  const fallbackMsg = String(message || data.error || "");
  if (fallbackMsg) {
    const technicalJargon = [
      /database/i,
      /mongo/i,
      /sql/i,
      /query/i,
      /connection/i,
      /syntax/i,
      /typeerror/i,
      /undefined/i,
      /null/i,
      /failed to serialize/i,
      /validation/i,
      /cast to/i,
      /duplicate key/i,
      /internal server/i,
      /uncaught/i,
      /referenceerror/i,
    ];
    for (const pattern of technicalJargon) {
      if (pattern.test(fallbackMsg)) {
        return "An unexpected system error occurred. Please try again later or contact support.";
      }
    }
    // Clean up raw state message if it matches User state is VERIFICATION_PENDING format
    if (/User state is [A-Z_]+/i.test(fallbackMsg)) {
      return "Access denied. Your account state does not allow this action.";
    }
    if (/PWR_[A-Z_]+/i.test(fallbackMsg) || /[A-Z_]{5,}/.test(fallbackMsg)) {
      if (/VERIFICATION_PENDING/i.test(fallbackMsg)) {
        return "Your account is awaiting admin verification. You cannot perform this action until approved.";
      }
      if (/KYC_PENDING/i.test(fallbackMsg)) {
        return "Your account KYC is pending verification. Complete KYC before proceeding.";
      }
    }
    return fallbackMsg;
  }

  return defaultMsg;
}
