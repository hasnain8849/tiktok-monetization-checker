import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionInfo } from "@/lib/auth";

// GET /api/admin/audit-log — list all admin actions, newest first.
// Admin-only. Returns last 200 entries.
export async function GET() {
  const session = await getSessionInfo();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "admin required" }, { status: 403 });
  }
  try {
    const entries = await db.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 200,
    });
    return NextResponse.json({ entries });
  } catch (e) {
    console.error("audit log list failed:", e);
    return NextResponse.json({ entries: [] });
  }
}
