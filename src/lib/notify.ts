// Notify the payment-notifier mini-service that a payment's status changed.
// The mini-service runs on port 3003 (per the fullstack-dev skill's gateway
// convention). The Next.js app POSTs to it; the mini-service then fans the
// event out via socket.io to any client subscribed to that handle.
//
// Fire-and-forget — failures are logged but never throw. The frontend polls
// /api/payments/[id] as a fallback so we don't lose updates if the websocket
// service is down.

const NOTIFY_URL = "http://localhost:3003/broadcast";

export async function notifyPaymentUpdate(opts: {
  handle: string;
  status: "verified" | "rejected" | "pending";
  attemptId?: string;
}): Promise<void> {
  try {
    await fetch(NOTIFY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        handle: opts.handle.replace(/^@/, "").toLowerCase(),
        status: opts.status,
        attemptId: opts.attemptId,
      }),
      signal: AbortSignal.timeout(1500),
    });
  } catch (e) {
    console.warn("[notifyPaymentUpdate] failed (non-fatal):", e);
  }
}
