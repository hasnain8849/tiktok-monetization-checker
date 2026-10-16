import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/unlocks?handle=@prankzlife — check if a profile is unlocked
export async function GET(req: NextRequest) {
  const h = req.nextUrl.searchParams.get("handle");
  if (!h) return NextResponse.json({ error: "handle required" }, { status: 400 });
  const handle = h.trim().toLowerCase().replace(/^@/, "");
  try {
    const row = await db.unlockedProfile.findUnique({ where: { handle } });
    return NextResponse.json({ unlocked: !!row, paidAt: row?.paidAt ?? null });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ unlocked: false }, { status: 200 });
  }
}
