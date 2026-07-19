import { NextRequest, NextResponse } from "next/server";
import { rejectCrossOriginPost } from "@/lib/auth/csrf";
import {
  sendTicketConfirmationEmail,
  sendTicketNotificationEmail,
  type SupportTicketData,
} from "@/lib/mail";

// ─── Ticket ID Generator ─────────────────────────────────────────────────────

/** In-memory daily counter — resets across server restarts, but that's fine
 *  since the date prefix guarantees uniqueness within a day at our scale. */
let lastDate = "";
let dailyCounter = 0;

function generateTicketId(): string {
  const now = new Date();
  const dateStr = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
  ].join("");

  if (dateStr !== lastDate) {
    lastDate = dateStr;
    dailyCounter = 0;
  }

  dailyCounter += 1;
  return `TKT-${dateStr}-${String(dailyCounter).padStart(4, "0")}`;
}

// ─── Validation helpers ───────────────────────────────────────────────────────

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Strip control characters that could be used for header injection. */
function sanitize(value: string): string {
  return value.replace(/[\r\n\t\x00-\x1f]/g, "").trim();
}

type ValidationError = { field: string; message: string };

function validateTicketPayload(body: Record<string, unknown>): {
  errors: ValidationError[];
  data: {
    user_id?: string;
    name: string;
    email: string;
    phone?: string;
    subject: string;
    category: string;
    message: string;
  } | null;
} {
  const errors: ValidationError[] = [];

  const name = sanitize(String(body.name ?? ""));
  const email = sanitize(String(body.email ?? ""));
  const phone = body.phone ? sanitize(String(body.phone)) : undefined;
  const subject = sanitize(String(body.subject ?? ""));
  const category = sanitize(String(body.category ?? "general"));
  const message = sanitize(String(body.message ?? ""));
  const user_id = body.user_id ? sanitize(String(body.user_id)) : undefined;

  if (!name) errors.push({ field: "name", message: "Name is required." });
  if (!email) {
    errors.push({ field: "email", message: "Email is required." });
  } else if (!EMAIL_RE.test(email)) {
    errors.push({ field: "email", message: "Invalid email format." });
  }
  if (!subject) {
    errors.push({ field: "subject", message: "Subject is required." });
  }
  if (!message || message.length < 10) {
    errors.push({
      field: "message",
      message: "Description must be at least 10 characters.",
    });
  }

  if (errors.length > 0) return { errors, data: null };

  return {
    errors: [],
    data: { user_id, name, email, phone, subject, category, message },
  };
}

// ─── POST /api/help-support ───────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  // CSRF check
  const csrfRejection = rejectCrossOriginPost(request);
  if (csrfRejection) return csrfRejection;

  // Parse body
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  // Validate
  const { errors, data } = validateTicketPayload(body);
  if (!data) {
    return NextResponse.json({ error: "Validation failed.", details: errors }, { status: 422 });
  }

  // Generate ticket
  const ticketId = generateTicketId();
  const createdAt = new Date().toISOString();

  const ticket: SupportTicketData = {
    ticket_id: ticketId,
    user_id: data.user_id,
    name: data.name,
    email: data.email,
    phone: data.phone,
    subject: data.subject,
    category: data.category,
    message: data.message,
    created_at: createdAt,
  };

  // Send emails (fire-and-forget — never block the response)
  const emailPromises = [
    sendTicketConfirmationEmail(ticket).catch((err) => {
      console.error("[help-support] Confirmation email failed:", err);
      return false;
    }),
    sendTicketNotificationEmail(ticket).catch((err) => {
      console.error("[help-support] Notification email failed:", err);
      return false;
    }),
  ];

  // We await but never fail the response based on email delivery
  const [confirmSent, notifySent] = await Promise.all(emailPromises);

  console.info(
    `[help-support] Ticket ${ticketId} created. ` +
      `Confirmation email: ${confirmSent ? "sent" : "failed"}. ` +
      `Notification email: ${notifySent ? "sent" : "failed"}.`
  );

  return NextResponse.json(
    {
      success: true,
      ticket_id: ticketId,
      message: "Support ticket raised successfully.",
    },
    { status: 201 }
  );
}
