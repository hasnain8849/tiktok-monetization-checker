import { NextRequest, NextResponse } from "next/server";

// GET /api/share/[token] — returns the public audit snapshot for a share
// token. NO AUTH REQUIRED (that's the point of a share link). Honors the
// token's expiry + revocation.
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  if (!token) {
    return NextResponse.json({ error: "token required" }, { status: 400 });
  }
  const { db } = await import("@/lib/db");
  const row = await db.shareToken.findUnique({ where: { token } });
  if (!row || row.revokedAt) {
    return NextResponse.json({ error: "share not found" }, { status: 404 });
  }
  if (row.expiresAt && row.expiresAt.getTime() < Date.now()) {
    return NextResponse.json({ error: "share expired" }, { status: 410 });
  }
  let snapshot: Record<string, unknown>;
  try {
    snapshot = JSON.parse(row.snapshotJson) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "snapshot corrupt" }, { status: 500 });
  }
  return NextResponse.json({
    handle: row.handle,
    snapshot,
    createdAt: row.createdAt,
    expiresAt: row.expiresAt,
  });
}
