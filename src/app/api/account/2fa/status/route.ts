import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionInfo } from "@/lib/auth";

// GET /api/account/2fa/status — returns whether the user has 2FA enabled.
// Does NOT expose the secret.
export async function GET() {
  const session = await getSessionInfo();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const twoFactor = await db.twoFactor.findUnique({
    where: { userId: session.userId },
  });
  return NextResponse.json({
    enabled: !!twoFactor?.verifiedAt,
    setupAt: twoFactor?.verifiedAt ?? null,
  });
}
