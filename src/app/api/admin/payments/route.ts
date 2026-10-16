import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionInfo } from "@/lib/auth";

// GET /api/admin/payments — list all PaymentAttempts (admin only).
// Supports ?status=pending|verified|rejected filter.
export async function GET(req: Request) {
  const session = await getSessionInfo();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "admin required" }, { status: 403 });
  }
  const url = new URL(req.url);
  const status = url.searchParams.get("status");
  try {
    const where = status ? { status } : undefined;
    const attempts = await db.paymentAttempt.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 200,
    });
    return NextResponse.json({ attempts });
  } catch (e) {
    console.error("admin payments list failed:", e);
    return NextResponse.json({ attempts: [] });
  }
}
