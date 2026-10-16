import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionInfo } from "@/lib/auth";

// GET /api/admin/handles/[handle] — list all payment attempts AND audit-log
// entries for a single handle, so an admin can see the full history for one
// profile in one view. Admin-only.
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ handle: string }> }
) {
  const session = await getSessionInfo();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "admin required" }, { status: 403 });
  }
  const { handle: rawHandle } = await params;
  const handle = decodeURIComponent(rawHandle).trim().toLowerCase().replace(/^@/, "");
  if (!handle) {
    return NextResponse.json({ error: "handle required" }, { status: 400 });
  }

  try {
    const [attempts, auditEntries, unlockRow] = await Promise.all([
      db.paymentAttempt.findMany({
        where: { handle: `@${handle}` },
        orderBy: { createdAt: "desc" },
        take: 100,
      }),
      db.auditLog.findMany({
        where: { targetHandle: `@${handle}` },
        orderBy: { createdAt: "desc" },
        take: 100,
      }),
      db.unlockedProfile.findUnique({ where: { handle } }),
    ]);

    return NextResponse.json({
      handle: `@${handle}`,
      attempts,
      auditEntries,
      unlocked: !!unlockRow,
      unlockedAt: unlockRow?.paidAt ?? null,
      paymentRef: unlockRow?.paymentRef ?? null,
    });
  } catch (e) {
    console.error("admin handle history failed:", e);
    return NextResponse.json({ error: "fetch failed" }, { status: 500 });
  }
}
