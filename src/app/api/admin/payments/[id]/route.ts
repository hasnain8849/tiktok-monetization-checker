import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyPaymentInternal } from "@/app/api/payments/route";
import { getSessionInfo } from "@/lib/auth";
import { recordAudit } from "@/lib/audit";
import { notifyPaymentUpdate } from "@/lib/notify";

// PATCH /api/admin/payments/[id] — manually verify or reject a pending payment.
// Body: { action: "verify" | "reject" }
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSessionInfo();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "admin required" }, { status: 403 });
  }
  const { id } = await params;
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  const body = (await req.json()) as { action: string };
  if (body?.action !== "verify" && body?.action !== "reject") {
    return NextResponse.json(
      { error: "action must be 'verify' or 'reject'" },
      { status: 400 }
    );
  }

  try {
    const existing = await db.paymentAttempt.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "attempt not found" }, { status: 404 });
    }

    if (body.action === "verify") {
      const attempt = await verifyPaymentInternal(id);
      await recordAudit({
        action: "verify_payment",
        targetType: "payment",
        targetId: id,
        targetHandle: existing.handle,
        metadata: {
          paymentRef: existing.paymentRef,
          amount: existing.amount,
          currency: existing.currency,
          previousStatus: existing.status,
          verifiedBy: session.email,
        },
      });
      // Real-time notify (verifyPaymentInternal already notified, but if the
      // row was already verified it would have no-oped, so we re-broadcast).
      await notifyPaymentUpdate({
        handle: existing.handle,
        status: "verified",
        attemptId: id,
      });
      return NextResponse.json({ ok: true, attempt });
    }

    // reject
    const attempt = await db.paymentAttempt.update({
      where: { id },
      data: { status: "rejected" },
    });
    await recordAudit({
      action: "reject_payment",
      targetType: "payment",
      targetId: id,
      targetHandle: existing.handle,
      metadata: {
        paymentRef: existing.paymentRef,
        amount: existing.amount,
        currency: existing.currency,
        previousStatus: existing.status,
        rejectedBy: session.email,
      },
    });
    await notifyPaymentUpdate({
      handle: existing.handle,
      status: "rejected",
      attemptId: id,
    });
    return NextResponse.json({ ok: true, attempt });
  } catch (e) {
    console.error("admin verify/reject failed:", e);
    return NextResponse.json({ error: "update failed" }, { status: 500 });
  }
}
