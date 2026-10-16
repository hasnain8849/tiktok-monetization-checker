import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionInfo } from "@/lib/auth";

// DELETE /api/account/share-tokens/[id] — revokes a share token owned by
// the logged-in user. Sets revokedAt to the current time so the public
// share URL stops working immediately. The row is preserved for audit.
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSessionInfo();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { id } = await params;
  try {
    const token = await db.shareToken.findUnique({ where: { id } });
    if (!token) {
      return NextResponse.json({ error: "not found" }, { status: 404 });
    }
    if (token.userId !== session.userId) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }
    await db.shareToken.update({
      where: { id },
      data: { revokedAt: new Date() },
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "revoke failed" }, { status: 500 });
  }
}
