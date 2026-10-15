import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/audits — list all saved audits, newest first
export async function GET() {
  try {
    const audits = await db.savedAudit.findMany({
      orderBy: { checkedAt: "desc" },
      take: 100,
    });
    return NextResponse.json({ audits });
  } catch (e) {
    console.error("Failed to list audits:", e);
    return NextResponse.json({ audits: [] });
  }
}

// POST /api/audits — save a new audit
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
  try {
    const body = (await req.json()) as SaveAuditBody;
    if (!body?.handle) {
      return NextResponse.json({ error: "handle required" }, { status: 400 });
    }
    const audit = await db.savedAudit.create({
      data: {
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

// DELETE /api/audits?id=... — delete one audit
export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  try {
    await db.savedAudit.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("Failed to delete audit:", e);
    return NextResponse.json({ error: "delete failed" }, { status: 500 });
  }
}
