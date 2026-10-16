import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionInfo } from "@/lib/auth";
import { recordAudit } from "@/lib/audit";

// PATCH /api/admin/users/[id] — promote or demote a user.
// Body: { role: "admin" | "user" }
// Admins cannot demote themselves (to avoid locking themselves out).
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
  const body = (await req.json()) as { role?: string };
  if (body?.role !== "admin" && body?.role !== "user") {
    return NextResponse.json({ error: "role must be 'admin' or 'user'" }, { status: 400 });
  }

  try {
    const existing = await db.user.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "user not found" }, { status: 404 });

    // Prevent admins from demoting themselves
    if (existing.id === session.userId && body.role !== "admin") {
      return NextResponse.json(
        { error: "You cannot demote yourself" },
        { status: 400 }
      );
    }

    if (existing.role === body.role) {
      return NextResponse.json({ ok: true, changed: false, user: existing });
    }

    const updated = await db.user.update({
      where: { id },
      data: { role: body.role },
    });

    await recordAudit({
      action: body.role === "admin" ? "promote_user" : "demote_user",
      targetType: "user",
      targetId: id,
      metadata: {
        previousRole: existing.role,
        newRole: body.role,
        targetEmail: existing.email,
        by: session.email,
      },
    });

    return NextResponse.json({ ok: true, changed: true, user: updated });
  } catch (e) {
    console.error("admin user update failed:", e);
    return NextResponse.json({ error: "update failed" }, { status: 500 });
  }
}
