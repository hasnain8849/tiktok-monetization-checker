import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sendTemplateEmail } from "@/lib/email";
import ShareViewEmail from "@/emails/share-view-email";
import { getSessionInfo } from "@/lib/auth";

// GET /api/share/[token] — returns the public audit snapshot for a share
// token. NO AUTH REQUIRED (that's the point of a share link). Honors the
// token's expiry + revocation.
//
// As a side effect: records the viewer's IP + UA in ShareViewLog and
// sends an email notification to the share-link creator (so they know
// someone looked at their shared audit). The email is fire-and-forget.
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  if (!token) {
    return NextResponse.json({ error: "token required" }, { status: 400 });
  }
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

  // Record this view. Don't email the creator if the creator is viewing
  // their own share link — that would be self-spam.
  const viewerIp = req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? null;
  const viewerUa = req.headers.get("user-agent") ?? null;
  try {
    // Check if the viewer is the creator (same session user).
    const session = await getSessionInfo();
    const isCreator = session?.userId === row.userId;
    await db.shareViewLog.create({
      data: { shareTokenId: row.id, viewerIp, viewerUa },
    });
    if (row.userId && !isCreator) {
      // Fire-and-forget email to the creator.
      const creator = await db.user.findUnique({ where: { id: row.userId } });
      if (creator?.email) {
        sendTemplateEmail(ShareViewEmail, {
          to: creator.email,
          subject: `Someone viewed your shared audit for ${row.handle}`,
          tag: "share_viewed",
          userId: creator.id,
          handle: row.handle,
          userName: creator.name ?? "there",
          viewerIp: viewerIp ?? "unknown",
          viewerUa: viewerUa ?? "unknown",
          shareUrl: `/share/${row.token}`,
          handle: row.handle,
        }).catch((e) => console.warn("share-view email failed:", e));
      }
    }
  } catch (e) {
    console.warn("share-view log failed:", e);
  }

  return NextResponse.json({
    handle: row.handle,
    snapshot,
    createdAt: row.createdAt,
    expiresAt: row.expiresAt,
  });
}
