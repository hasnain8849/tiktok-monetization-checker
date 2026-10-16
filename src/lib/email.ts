// Email notification abstraction.
//
// Two providers, selected via EMAIL_PROVIDER env var:
//   - "console" (default): logs the would-be email to the server console.
//   - "smtp": uses Nodemailer with SMTP connection details from env vars
//     (SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM).
//
// Every email is also persisted as an EmailLog row (status, recipient,
// subject, body, error) for compliance + debugging.
//
// Two ways to send:
//   1. sendEmail({ to, subject, text }) — plain-text body
//   2. sendTemplateEmail(MyTemplate, { to, subject, ...templateProps }) —
//      renders a React Email template to HTML + a text version, and sends both.

import { db } from "@/lib/db";
import { render } from "@react-email/render";
import * as React from "react";

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
  /** Optional context for honoring per-user notification settings:
   *  - userId: the recipient's user id (so we can look up their settings)
   *  - handle: the handle this email is about (so we can check the mute list) */
  userId?: string;
  handle?: string;
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
  // Honor per-user notification preferences: if the user has muted the
  // tag (payment emails or eligibility alerts) OR the specific handle,
  // we skip the actual send but still log it as "suppressed".
  if (opts.userId) {
    try {
      const settings = await db.notificationSettings.findUnique({
        where: { userId: opts.userId },
      });
      if (settings) {
        const isPaymentTag = opts.tag === "payment_verified";
        const isAlertTag = opts.tag === "eligibility_alert";
        const muted =
          (isPaymentTag && !settings.paymentEmailsEnabled) ||
          (isAlertTag && !settings.eligibilityAlertsEnabled);
        const mutedHandles = JSON.parse(settings.mutedHandlesJson) as string[];
        const handleMuted =
          opts.handle &&
          mutedHandles.includes(opts.handle.replace(/^@/, "").toLowerCase());
        if (muted || handleMuted) {
          await db.emailLog.create({
            data: {
              to: opts.to,
              subject: opts.subject,
              body: opts.text,
              tag: opts.tag ?? null,
              provider: getProviderName(),
              status: "suppressed",
              providerMessageId: null,
              error: "user opted out",
            },
          });
          return { ok: true, provider: getProviderName(), messageId: "suppressed" };
        }
      }
    } catch (e) {
      console.warn("notification settings check failed (continuing with send):", e);
    }
  }

  const provider = getProviderName();
  let result: EmailResult;
  try {
    result = provider === "smtp" ? await sendSmtp(opts) : await sendConsole(opts);
  } catch (e) {
    result = { ok: false, provider, error: (e as Error).message };
  }
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

// Render a React Email template to HTML + a plain-text fallback, then send.
// `Component` must be a React Email template component (e.g., PaymentVerifiedEmail).
// `props` are the template's props. `subject` and `to` are the email envelope.
// Optional `userId` and `handle` props are passed through to sendEmail so
// notification settings can be honored.
export async function sendTemplateEmail<P>(
  Component: React.ComponentType<P>,
  props: P & {
    to?: string;
    subject?: string;
    tag?: string;
    userId?: string;
    handle?: string;
  }
): Promise<EmailResult> {
  const { to, subject, tag, userId, handle, ...templateProps } = props as {
    to?: string;
    subject?: string;
    tag?: string;
    userId?: string;
    handle?: string;
  } & P;
  if (!to || !subject) {
    throw new Error("sendTemplateEmail requires `to` and `subject` props");
  }
  const element = React.createElement(Component, templateProps as P);
  const html = await render(element);
  const text = html
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return sendEmail({ to, subject, text, html, tag, userId, handle });
}
