import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionInfo } from "@/lib/auth";

// GET /api/admin/users/[id]/history — admin-only. Returns audit-log entries
// where this user is the actor (actorEmail matches), plus audit entries
// targeting this user (targetId matches user.id). Useful for seeing both
// "what did this user do" and "what was done to this user" in one view.
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSessionInfo();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "admin required" }, { status: 403 });
  }
  const { id } = await params;
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  try {
    const user = await db.user.findUnique({ where: { id } });
    if (!user) return NextResponse.json({ error: "user not found" }, { status: 404 });

    // Actions BY this user (actorEmail matches)
    const byThisUser = await db.auditLog.findMany({
      where: { actorEmail: user.email },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    // Actions AGAINST this user (targetId matches user.id)
    const againstThisUser = await db.auditLog.findMany({
      where: { targetId: user.id },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      byThisUser,
      againstThisUser,
    });
  } catch (e) {
    console.error("user history failed:", e);
    return NextResponse.json({ error: "fetch failed" }, { status: 500 });
  }
}
