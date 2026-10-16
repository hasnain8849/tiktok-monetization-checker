import { NextRequest, NextResponse } from "next/server";
import { getSessionInfo } from "@/lib/auth";
import { retryWebhookDelivery } from "@/lib/notify";

// POST /api/payments/retry — admin-only. Re-sends a failed WebhookDelivery
// to the payment-notifier mini-service. Body: { deliveryId }.
export async function POST(req: NextRequest) {
  const session = await getSessionInfo();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "admin required" }, { status: 403 });
  }
  const body = (await req.json()) as { deliveryId?: string };
  if (!body?.deliveryId) {
    return NextResponse.json({ error: "deliveryId required" }, { status: 400 });
  }
  const r = await retryWebhookDelivery(body.deliveryId);
  return NextResponse.json({ ok: r.ok, error: r.error ?? null });
}
