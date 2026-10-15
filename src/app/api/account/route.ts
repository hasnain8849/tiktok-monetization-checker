import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { getSessionInfo } from "@/lib/auth";
import { recordAudit } from "@/lib/audit";

// GET /api/account — return the logged-in user's profile
export async function GET() {
  const session = await getSessionInfo();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  try {
    const user = await db.user.findUnique({ where: { id: session.userId } });
    if (!user) return NextResponse.json({ error: "not found" }, { status: 404 });
    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        createdAt: user.createdAt,
      },
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "fetch failed" }, { status: 500 });
  }
}

// PATCH /api/account — update name, change password, or both.
// Body: { name?: string, currentPassword?: string, newPassword?: string }
// currentPassword is required only when newPassword is provided.
type PatchBody = {
  name?: string;
  currentPassword?: string;
  newPassword?: string;
};

const MIN_PWD = 8;

export async function PATCH(req: NextRequest) {
  const session = await getSessionInfo();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  try {
    const body = (await req.json()) as PatchBody;
    const user = await db.user.findUnique({ where: { id: session.userId } });
    if (!user) return NextResponse.json({ error: "not found" }, { status: 404 });

    const updates: { name?: string; password?: string } = {};

    // Name update
    if (body.name !== undefined) {
      const trimmed = body.name.trim();
      if (trimmed.length === 0) {
        return NextResponse.json({ error: "Name cannot be empty" }, { status: 400 });
      }
      if (trimmed.length > 80) {
        return NextResponse.json({ error: "Name too long" }, { status: 400 });
      }
      if (trimmed !== user.name) updates.name = trimmed;
    }

    // Password change
    if (body.newPassword) {
      if (!body.currentPassword) {
        return NextResponse.json(
          { error: "Current password is required to set a new password" },
          { status: 400 }
        );
      }
      if (!user.password) {
        return NextResponse.json(
          { error: "No password is currently set — sign up again" },
          { status: 400 }
        );
      }
      const ok = await bcrypt.compare(body.currentPassword, user.password);
      if (!ok) {
        return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 });
      }
      if (body.newPassword.length < MIN_PWD) {
        return NextResponse.json(
          { error: `New password must be at least ${MIN_PWD} characters` },
          { status: 400 }
        );
      }
      if (!/\d/.test(body.newPassword)) {
        return NextResponse.json(
          { error: "New password must contain at least one digit" },
          { status: 400 }
        );
      }
      updates.password = await bcrypt.hash(body.newPassword, 10);
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ ok: true, changed: false });
    }

    await db.user.update({ where: { id: user.id }, data: updates });
    await recordAudit({
      action: "settings_update",
      targetType: "user",
      targetId: user.id,
      metadata: {
        fields: Object.keys(updates),
        by: session.email,
      },
    });

    return NextResponse.json({ ok: true, changed: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "update failed" }, { status: 500 });
  }
}
