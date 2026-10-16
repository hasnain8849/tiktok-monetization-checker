import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthUserId } from "@/lib/auth";

// GET /api/audits — list all saved audits for the logged-in user (or all
// audits if no session, for backwards compatibility with seeded data).
export async function GET() {
  const userId = await getAuthUserId();
  try {
    const where = userId ? { OR: [{ userId }, { userId: null }] } : undefined;
    const audits = await db.savedAudit.findMany({
      where,
      orderBy: { checkedAt: "desc" },
      take: 100,
    });
    return NextResponse.json({ audits });
  } catch (e) {
    console.error("Failed to list audits:", e);
    return NextResponse.json({ audits: [] });
  }
}

// POST /api/audits — save a new audit (scoped to the logged-in user)
type SaveAuditBody = {
  handle: string;
  avatarInitials: string;
  followers: number;
  eligible: boolean;
  status: "eligible" | "ineligible" | "restricted";
  checksPassed: number;
  checksTotal: number;
};

export async function POST(req: NextRequest) {
  const userId = await getAuthUserId();
  try {
    const body = (await req.json()) as SaveAuditBody;
    if (!body?.handle) {
      return NextResponse.json({ error: "handle required" }, { status: 400 });
    }
    const audit = await db.savedAudit.create({
      data: {
        userId: userId ?? null,
        handle: body.handle,
        avatarInitials: body.avatarInitials ?? "??",
        followers: body.followers ?? 0,
        eligible: body.eligible ?? false,
        status: body.status ?? "ineligible",
        checksPassed: body.checksPassed ?? 0,
        checksTotal: body.checksTotal ?? 6,
      },
    });
    return NextResponse.json({ audit }, { status: 201 });
  } catch (e) {
    console.error("Failed to save audit:", e);
    return NextResponse.json({ error: "save failed" }, { status: 500 });
  }
}

// DELETE /api/audits?id=...
export async function DELETE(req: NextRequest) {
  const userId = await getAuthUserId();
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  try {
    // Allow delete only if the audit belongs to the user OR is unscoped
    const audit = await db.savedAudit.findUnique({ where: { id } });
    if (!audit) return NextResponse.json({ error: "not found" }, { status: 404 });
    if (userId && audit.userId && audit.userId !== userId) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }
    await db.savedAudit.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("Failed to delete audit:", e);
    return NextResponse.json({ error: "delete failed" }, { status: 500 });
  }
}
