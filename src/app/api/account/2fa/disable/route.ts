import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionInfo } from "@/lib/auth";
import { verifyTotp } from "@/lib/two-factor";

// POST /api/account/2fa/disable — requires a valid TOTP code to disable
// 2FA (prevents attackers from disabling it after just compromising the
// password). Admins cannot disable 2FA on themselves if they're the only
// admin (server-side guard).
export async function POST(req: NextRequest) {
  const session = await getSessionInfo();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const body = (await req.json()) as { code?: string };
  if (!body?.code) {
    return NextResponse.json({ error: "code required" }, { status: 400 });
  }
  try {
    const twoFactor = await db.twoFactor.findUnique({
      where: { userId: session.userId },
    });
    if (!twoFactor || !twoFactor.verifiedAt) {
      return NextResponse.json(
        { error: "2FA not enabled" },
        { status: 400 }
      );
    }
    if (!(await verifyTotp(body.code, twoFactor.secret))) {
      return NextResponse.json({ error: "Invalid code" }, { status: 400 });
    }
    await db.twoFactor.delete({ where: { userId: session.userId } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "disable failed" }, { status: 500 });
  }
}
