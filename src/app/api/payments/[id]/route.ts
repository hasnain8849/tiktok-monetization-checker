import { NextRequest, NextResponse } from "next/server";

// GET /api/payments/[id] — poll the status of a payment attempt.
// Returns { attemptId, status, handle, paymentRef }.
// status is one of "pending" | "verified" | "rejected".
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  const { db } = await import("@/lib/db");
  const attempt = await db.paymentAttempt.findUnique({ where: { id } });
  if (!attempt) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  return NextResponse.json({
    attemptId: attempt.id,
    status: attempt.status,
    handle: attempt.handle,
    paymentRef: attempt.paymentRef,
    amount: attempt.amount,
    currency: attempt.currency,
    createdAt: attempt.createdAt,
  });
}
