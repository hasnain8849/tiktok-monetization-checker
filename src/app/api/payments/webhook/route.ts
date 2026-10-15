import { NextRequest, NextResponse } from "next/server";
import { verifyPaymentInternal } from "../route";

// POST /api/payments/webhook — simulates an external bank webhook.
//
// In production the bank's API would call this endpoint with a signed payload
// when a wire transfer is received. Here we accept a simple JSON body with
// either { attemptId } or { paymentRef, handle } and verify the matching
// PaymentAttempt.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (body?.attemptId) {
      const attempt = await verifyPaymentInternal(body.attemptId);
      return NextResponse.json({ ok: true, status: "verified", attemptId: attempt.id });
    }
    if (body?.paymentRef && body?.handle) {
      const { db } = await import("@/lib/db");
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
