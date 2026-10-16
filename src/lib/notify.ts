// Notify the payment-notifier mini-service that a payment's status changed.
// The mini-service runs on port 3003 (per the fullstack-dev skill's gateway
// convention). The Next.js app POSTs to it; the mini-service then fans the
// event out via socket.io to any client subscribed to that handle.
//
// Failures are recorded in the WebhookDelivery table with retry metadata
// so /api/payments/retry can re-send later. Up to 3 retries with exponential
// backoff (1s, 4s, 16s).

import { db } from "@/lib/db";

const NOTIFY_URL = "http://localhost:3003/broadcast";
const MAX_ATTEMPTS = 3;

interface NotifyOpts {
  handle: string;
  status: "verified" | "rejected" | "pending";
  attemptId?: string;
}

// Internal: perform one POST to the mini-service. Returns {ok, error?}.
async function postToNotifier(opts: NotifyOpts): Promise<{ ok: boolean; error?: string }> {
  try {
    const resp = await fetch(NOTIFY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        handle: opts.handle.replace(/^@/, "").toLowerCase(),
        status: opts.status,
        attemptId: opts.attemptId,
      }),
      signal: AbortSignal.timeout(1500),
    });
    if (!resp.ok) {
      return { ok: false, error: `HTTP ${resp.status}` };
    }
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

// Public: notify the payment-notifier with retry + DB tracking.
export async function notifyPaymentUpdate(opts: NotifyOpts): Promise<void> {
  const handle = opts.handle.replace(/^@/, "").toLowerCase();
  // Create a WebhookDelivery row to track this notification.
  const delivery = await db.webhookDelivery.create({
    data: {
      handle,
      attemptId: opts.attemptId ?? null,
      status: "pending",
      attemptCount: 0,
    },
  });

  // Synchronous first attempt — most calls succeed first time.
  const first = await postToNotifier(opts);
  await db.webhookDelivery.update({
    where: { id: delivery.id },
    data: {
      attemptCount: 1,
      status: first.ok ? "delivered" : "pending",
      lastError: first.error ?? null,
      nextRetryAt: first.ok
        ? null
        : new Date(Date.now() + 1000), // retry in 1s
    },
  });
  if (first.ok) return;

  // Schedule retries 2 and 3 with exponential backoff (1s, 4s, 16s).
  const delays = [1000, 4000, 16000];
  for (let i = 0; i < delays.length; i++) {
    await new Promise((res) => setTimeout(res, delays[i]));
    const r = await postToNotifier(opts);
    const nextAttempt = i + 2; // we're on attempt #2 or #3
    const final = nextAttempt >= MAX_ATTEMPTS;
    await db.webhookDelivery.update({
      where: { id: delivery.id },
      data: {
        attemptCount: nextAttempt,
        status: r.ok ? "delivered" : final ? "failed" : "pending",
        lastError: r.error ?? null,
        nextRetryAt: r.ok || final ? null : new Date(Date.now() + delays[i + 1]),
      },
    });
    if (r.ok) return;
  }
  console.warn(`[notifyPaymentUpdate] all ${MAX_ATTEMPTS} attempts failed for ${handle}`);
}

// Manual retry — used by /api/payments/retry when an admin sees a failed
// WebhookDelivery and wants to re-send.
export async function retryWebhookDelivery(deliveryId: string): Promise<{ ok: boolean; error?: string }> {
  const delivery = await db.webhookDelivery.findUnique({ where: { id: deliveryId } });
  if (!delivery) return { ok: false, error: "not found" };
  if (delivery.status === "delivered") return { ok: true };

  const r = await postToNotifier({
    handle: delivery.handle,
    status: "verified", // retry assumes verified for now — extend if needed
    attemptId: delivery.attemptId ?? undefined,
  });
  await db.webhookDelivery.update({
    where: { id: delivery.id },
    data: {
      attemptCount: { increment: 1 },
      status: r.ok ? "delivered" : "failed",
      lastError: r.error ?? null,
      nextRetryAt: r.ok ? null : new Date(Date.now() + 16000),
    },
  });
  return r;
}
