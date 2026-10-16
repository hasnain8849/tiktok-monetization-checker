// Email notification abstraction.
//
// Two providers, selected via EMAIL_PROVIDER env var:
//   - "console" (default): logs the would-be email to the server console.
//     Useful in development / sandboxed environments where SMTP isn't
//     available. The email contents are still rendered and saved as an
//     EmailLog row so they can be inspected.
//   - "smtp": uses Nodemailer with SMTP connection details from env vars
//     (SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM). Point this
//     at Resend / SendGrid / Mailgun / Gmail etc.
//
// Every email is also persisted as an EmailLog row (status, recipient,
// subject, body, error) for compliance + debugging.

import { db } from "@/lib/db";

export type EmailProviderName = "console" | "smtp";

export interface SendEmailOpts {
  to: string;
  subject: string;
  /** Plain-text body. */
  text: string;
  /** Optional HTML body. Falls back to a <pre>-wrapped version of `text`. */
  html?: string;
  /** Optional tag for the EmailLog row (e.g., "payment_verified"). */
  tag?: string;
}

interface EmailResult {
  ok: boolean;
  provider: EmailProviderName;
  messageId?: string;
  error?: string;
}

function getProviderName(): EmailProviderName {
  const v = (process.env.EMAIL_PROVIDER ?? "console").toLowerCase();
  return v === "smtp" ? "smtp" : "console";
}

async function sendConsole(opts: SendEmailOpts): Promise<EmailResult> {
  const msgId = `console_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  console.log(
    `\n[EMAIL-CONSOLE] to=${opts.to} subject=${opts.subject} tag=${opts.tag ?? "—"}\n-----\n${opts.text}\n-----\n`
  );
  return { ok: true, provider: "console", messageId: msgId };
}

async function sendSmtp(opts: SendEmailOpts): Promise<EmailResult> {
  const nodemailer = (await import("nodemailer")).default;
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: (process.env.SMTP_PORT ?? "587") === "465",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
  const info = await transporter.sendMail({
    from: process.env.SMTP_FROM ?? "no-reply@budgetwise.app",
    to: opts.to,
    subject: opts.subject,
    text: opts.text,
    html: opts.html ?? `<pre>${escapeHtml(opts.text)}</pre>`,
  });
  return { ok: true, provider: "smtp", messageId: info.messageId };
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export async function sendEmail(opts: SendEmailOpts): Promise<EmailResult> {
  const provider = getProviderName();
  let result: EmailResult;
  try {
    result = provider === "smtp" ? await sendSmtp(opts) : await sendConsole(opts);
  } catch (e) {
    result = {
      ok: false,
      provider,
      error: (e as Error).message,
    };
  }
  // Persist to EmailLog for compliance.
  try {
    await db.emailLog.create({
      data: {
        to: opts.to,
        subject: opts.subject,
        body: opts.text,
        tag: opts.tag ?? null,
        provider,
        status: result.ok ? "sent" : "failed",
        providerMessageId: result.messageId ?? null,
        error: result.error ?? null,
      },
    });
  } catch (e) {
    console.error("email log write failed:", e);
  }
  return result;
}
