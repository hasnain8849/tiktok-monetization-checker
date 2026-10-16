import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionInfo } from "@/lib/auth";

// GET /api/admin/emails/[id] — admin-only. Returns the full EmailLog row
// (including the HTML body) so the admin can render a preview.
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSessionInfo();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "admin required" }, { status: 403 });
  }
  const { id } = await params;
  try {
    const email = await db.emailLog.findUnique({ where: { id } });
    if (!email) return NextResponse.json({ error: "not found" }, { status: 404 });
    return NextResponse.json({ email });
  } catch (e) {
    console.error("email fetch failed:", e);
    return NextResponse.json({ error: "fetch failed" }, { status: 500 });
  }
}
