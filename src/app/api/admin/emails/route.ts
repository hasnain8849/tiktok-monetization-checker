import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionInfo } from "@/lib/auth";

// GET /api/admin/emails — admin-only. Returns last 200 outbound emails
// (so admins can see what was sent to users).
export async function GET() {
  const session = await getSessionInfo();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "admin required" }, { status: 403 });
  }
  try {
    const emails = await db.emailLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 200,
    });
    return NextResponse.json({ emails });
  } catch (e) {
    console.error("admin emails list failed:", e);
    return NextResponse.json({ emails: [] });
  }
}
