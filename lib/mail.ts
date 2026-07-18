import "server-only";

import nodemailer from "nodemailer";

// ─── SMTP Transporter (singleton) ─────────────────────────────────────────────

const smtpHost = process.env.SMTP_HOST;
const smtpPort = Number(process.env.SMTP_PORT || 587);
const smtpUser = process.env.SMTP_USER;
const smtpPass = process.env.SMTP_PASS;
const fromEmail = process.env.FROM_EMAIL || "noreply@stoxify.com";
const supportEmail = process.env.SUPPORT_EMAIL || "support@stoxify.com";

let _transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter | null {
  if (_transporter) return _transporter;

  if (!smtpHost || !smtpUser || !smtpPass) {
    console.warn(
      "[mail] SMTP credentials not configured. Emails will not be sent. " +
      "Set SMTP_HOST, SMTP_USER, SMTP_PASS in environment variables."
    );
    return null;
  }

  _transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpPort === 465,
    auth: { user: smtpUser, pass: smtpPass },
  });

  return _transporter;
}

// ─── Generic send helper ──────────────────────────────────────────────────────

/**
 * Send an email. Returns `true` on success, `false` on failure (logged).
 * Never throws — callers can fire-and-forget.
 */
export async function sendMail(
  to: string,
  subject: string,
  html: string
): Promise<boolean> {
  const transporter = getTransporter();
  if (!transporter) return false;

  try {
    await transporter.sendMail({ from: fromEmail, to, subject, html });
    return true;
  } catch (err) {
    console.error("[mail] Failed to send email:", err);
    return false;
  }
}

// ─── Sanitisation ─────────────────────────────────────────────────────────────

/** Escape HTML to prevent XSS in email templates. */
function esc(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// ─── Ticket types ─────────────────────────────────────────────────────────────

export type SupportTicketData = {
  ticket_id: string;
  user_id?: string;
  name: string;
  email: string;
  phone?: string;
  subject: string;
  category: string;
  message: string;
  created_at: string; // ISO string
};

// ─── Confirmation email → User ────────────────────────────────────────────────

export async function sendTicketConfirmationEmail(
  ticket: SupportTicketData
): Promise<boolean> {
  const date = new Date(ticket.created_at);
  const formattedDate = date.toLocaleDateString("en-IN", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const formattedTime = date.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    timeZone: "Asia/Kolkata",
  });

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /></head>
<body style="margin:0;padding:0;background:#f4f5f7;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table width="100%" cellspacing="0" cellpadding="0" style="background:#f4f5f7;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="560" cellspacing="0" cellpadding="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.06);">
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#1567c2,#1f7ae0);padding:32px 40px;text-align:center;">
              <h1 style="margin:0;font-size:22px;font-weight:800;color:#ffffff;letter-spacing:-0.5px;">Stoxify</h1>
              <p style="margin:8px 0 0;font-size:13px;color:rgba(255,255,255,0.85);font-weight:500;">Help &amp; Support</p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:36px 40px;">
              <p style="margin:0 0 20px;font-size:15px;color:#1a1a1a;line-height:1.6;">
                Hi <strong>${esc(ticket.name)}</strong>,
              </p>
              <p style="margin:0 0 24px;font-size:14px;color:#4a4a4a;line-height:1.7;">
                We have successfully received your support request. Our support team has been notified and will get back to you within the next <strong>24 hours</strong>.
              </p>
              <!-- Ticket Details Card -->
              <table width="100%" cellspacing="0" cellpadding="0" style="background:#f8faf9;border:1px solid #e5e7eb;border-radius:10px;margin-bottom:24px;">
                <tr>
                  <td style="padding:20px 24px;">
                    <table width="100%" cellspacing="0" cellpadding="0">
                      <tr>
                        <td style="padding:6px 0;font-size:12px;color:#6b7280;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Ticket ID</td>
                        <td style="padding:6px 0;font-size:14px;color:#1f7ae0;font-weight:700;text-align:right;">${esc(ticket.ticket_id)}</td>
                      </tr>
                      <tr>
                        <td colspan="2" style="border-top:1px solid #e5e7eb;padding:0;height:1px;"></td>
                      </tr>
                      <tr>
                        <td style="padding:6px 0;font-size:12px;color:#6b7280;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Subject</td>
                        <td style="padding:6px 0;font-size:14px;color:#1a1a1a;font-weight:600;text-align:right;">${esc(ticket.subject)}</td>
                      </tr>
                      <tr>
                        <td colspan="2" style="border-top:1px solid #e5e7eb;padding:0;height:1px;"></td>
                      </tr>
                      <tr>
                        <td style="padding:6px 0;font-size:12px;color:#6b7280;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Submitted</td>
                        <td style="padding:6px 0;font-size:13px;color:#4a4a4a;text-align:right;">${formattedDate} at ${formattedTime} IST</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              <p style="margin:0 0 4px;font-size:13px;color:#6b7280;line-height:1.6;">
                If you have any additional information to share, please reply to this email referencing your Ticket ID above.
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background:#f9fafb;padding:20px 40px;border-top:1px solid #f0f0f0;text-align:center;">
              <p style="margin:0;font-size:11px;color:#9ca3af;">
                &copy; ${new Date().getFullYear()} Stoxify. All rights reserved.
              </p>
              <p style="margin:6px 0 0;font-size:11px;color:#9ca3af;">
                This is an automated message. Please do not reply directly.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  return sendMail(
    ticket.email,
    `Support Request Received — ${ticket.ticket_id}`,
    html
  );
}

// ─── Notification email → Support Team ────────────────────────────────────────

export async function sendTicketNotificationEmail(
  ticket: SupportTicketData
): Promise<boolean> {
  const date = new Date(ticket.created_at);
  const formattedDate = date.toLocaleDateString("en-IN", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  });
  const formattedTime = date.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    timeZone: "Asia/Kolkata",
  });

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table width="100%" cellspacing="0" cellpadding="0" style="background:#f1f5f9;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellspacing="0" cellpadding="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.06);">
          <!-- Header -->
          <tr>
            <td style="background:#0f172a;padding:24px 40px;">
              <h1 style="margin:0;font-size:18px;font-weight:700;color:#ffffff;">New Support Ticket</h1>
              <p style="margin:6px 0 0;font-size:13px;color:#94a3b8;font-weight:500;">${esc(ticket.ticket_id)} · ${formattedDate} at ${formattedTime} IST</p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:28px 40px;">
              <table width="100%" cellspacing="0" cellpadding="0" style="font-size:13px;color:#334155;">
                <tr>
                  <td style="padding:8px 0;font-weight:700;color:#64748b;width:130px;vertical-align:top;">Ticket ID</td>
                  <td style="padding:8px 0;font-weight:700;color:#1f7ae0;">${esc(ticket.ticket_id)}</td>
                </tr>
                ${ticket.user_id ? `<tr>
                  <td style="padding:8px 0;font-weight:700;color:#64748b;vertical-align:top;">User ID</td>
                  <td style="padding:8px 0;">${esc(ticket.user_id)}</td>
                </tr>` : ""}
                <tr>
                  <td style="padding:8px 0;font-weight:700;color:#64748b;vertical-align:top;">Name</td>
                  <td style="padding:8px 0;">${esc(ticket.name)}</td>
                </tr>
                <tr>
                  <td style="padding:8px 0;font-weight:700;color:#64748b;vertical-align:top;">Email</td>
                  <td style="padding:8px 0;"><a href="mailto:${esc(ticket.email)}" style="color:#2563eb;text-decoration:none;">${esc(ticket.email)}</a></td>
                </tr>
                ${ticket.phone ? `<tr>
                  <td style="padding:8px 0;font-weight:700;color:#64748b;vertical-align:top;">Phone</td>
                  <td style="padding:8px 0;">${esc(ticket.phone)}</td>
                </tr>` : ""}
                <tr>
                  <td style="padding:8px 0;font-weight:700;color:#64748b;vertical-align:top;">Category</td>
                  <td style="padding:8px 0;">${esc(ticket.category)}</td>
                </tr>
                <tr>
                  <td style="padding:8px 0;font-weight:700;color:#64748b;vertical-align:top;">Subject</td>
                  <td style="padding:8px 0;font-weight:600;color:#0f172a;">${esc(ticket.subject)}</td>
                </tr>
                <tr>
                  <td colspan="2" style="padding:12px 0 4px;">
                    <div style="font-weight:700;color:#64748b;margin-bottom:8px;">Message</div>
                    <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:16px;font-size:13px;color:#334155;line-height:1.7;white-space:pre-wrap;">${esc(ticket.message)}</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background:#f8fafc;padding:16px 40px;border-top:1px solid #f0f0f0;text-align:center;">
              <p style="margin:0;font-size:11px;color:#94a3b8;">
                Stoxify Internal Support Notification · Auto-generated
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  return sendMail(
    supportEmail,
    `New Help & Support Ticket — ${ticket.ticket_id}`,
    html
  );
}
