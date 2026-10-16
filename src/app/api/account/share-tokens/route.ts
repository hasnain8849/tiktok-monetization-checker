import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionInfo } from "@/lib/auth";

// GET /api/account/share-tokens — list all share tokens created by the
// logged-in user (newest first, last 100).
export async function GET() {
  const session = await getSessionInfo();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  try {
    const tokens = await db.shareToken.findMany({
      where: { userId: session.userId },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    return NextResponse.json({ tokens });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ tokens: [] });
  }
}
