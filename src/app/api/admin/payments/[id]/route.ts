import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyPaymentInternal } from "@/app/api/payments/route";
import { getSessionInfo } from "@/lib/auth";

// PATCH /api/admin/payments/[id] — manually verify or reject a pending payment.
// Body: { action: "verify" | "reject" }
//  - "verify" marks the attempt as verified + writes the UnlockedProfile row.
//  - "reject" marks the attempt as rejected.
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
    return NextResponse.json({ error: "action must be 'verify' or 'reject'" }, { status: 400 });
  }

  try {
    if (body.action === "verify") {
      const attempt = await verifyPaymentInternal(id);
      return NextResponse.json({ ok: true, attempt });
    }
    // reject
    const attempt = await db.paymentAttempt.update({
      where: { id },
      data: { status: "rejected" },
    });
    return NextResponse.json({ ok: true, attempt });
  } catch (e) {
    console.error("admin verify/reject failed:", e);
    return NextResponse.json({ error: "update failed" }, { status: 500 });
  }
}
