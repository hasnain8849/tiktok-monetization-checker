import { NextRequest, NextResponse } from "next/server";
import { verifyPaymentInternal } from "../route";
import { getPaymentProvider } from "@/lib/payment-provider";
import { db } from "@/lib/db";

// POST /api/payments/webhook — entry point for external bank/webhook calls.
//
// Three supported payload shapes:
//   1. Simulated (PAYMENT_PROVIDER=simulated): { attemptId } or { paymentRef, handle }
//   2. Stripe (PAYMENT_PROVIDER=stripe): Stripe-signed webhook event, with
//      the signature in the `stripe-signature` header. The body must be the
//      raw request body (not parsed) so Stripe's signature can be verified.
export async function POST(req: NextRequest) {
  try {
    const provider = await getPaymentProvider();

    // Stripe path: verify signature + extract intent id from event.
    if (provider.name === "stripe") {
      const sig = req.headers.get("stripe-signature") ?? "";
      const rawBody = await req.text();
      try {
        const event = (await provider.verifyWebhook({
          rawBody,
          signature: sig,
        })) as { type?: string; data?: { object?: { metadata?: { handle?: string; paymentRef?: string }; id?: string } } };

        // Only treat succeeded events as verification.
        if (event?.type !== "payment_intent.succeeded") {
          return NextResponse.json({
            received: true,
            ignored: true,
            type: event?.type,
          });
        }

        const meta = event?.data?.object?.metadata;
        const handle = meta?.handle;
        const paymentRef = meta?.paymentRef ?? event?.data?.object?.id ?? "";
        if (!handle) {
          return NextResponse.json(
            { error: "no handle in stripe event metadata" },
            { status: 400 }
          );
        }
        // Find the matching attempt and verify it.
        const attempt = await db.paymentAttempt.findFirst({
          where: { handle, paymentRef },
          orderBy: { createdAt: "desc" },
        });
        if (!attempt) {
          return NextResponse.json(
            { error: "no matching attempt", handle, paymentRef },
            { status: 404 }
          );
        }
        await verifyPaymentInternal(attempt.id);
        return NextResponse.json({ ok: true, status: "verified", attemptId: attempt.id });
      } catch (e) {
        console.error("Stripe webhook verification failed:", e);
        return NextResponse.json(
          { error: "invalid signature" },
          { status: 400 }
        );
      }
    }

    // Simulated path: simple JSON body.
    const body = await req.json();
    if (body?.attemptId) {
      const attempt = await verifyPaymentInternal(body.attemptId);
      return NextResponse.json({ ok: true, status: "verified", attemptId: attempt.id });
    }
    if (body?.paymentRef && body?.handle) {
      const handle = String(body.handle).trim().toLowerCase().replace(/^@/, "");
      const attempt = await db.paymentAttempt.findFirst({
        where: { paymentRef: body.paymentRef, handle: `@${handle}` },
        orderBy: { createdAt: "desc" },
      });
      if (!attempt) {
        return NextResponse.json({ error: "no matching attempt" }, { status: 404 });
      }
      await verifyPaymentInternal(attempt.id);
      return NextResponse.json({ ok: true, status: "verified", attemptId: attempt.id });
    }
    return NextResponse.json(
      { error: "attemptId OR (paymentRef + handle) required" },
      { status: 400 }
    );
  } catch (e) {
    console.error("Webhook failed:", e);
    return NextResponse.json({ error: "webhook failed" }, { status: 500 });
  }
}
