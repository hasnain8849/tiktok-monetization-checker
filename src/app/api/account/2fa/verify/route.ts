import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionInfo } from "@/lib/auth";
import { verifyTotp, generateBackupCodes } from "@/lib/two-factor";

// POST /api/account/2fa/verify — confirms a 6-digit TOTP code from the
// user's authenticator app against the secret stored in TwoFactor. If
// the code is valid, marks 2FA as verified + generates 8 backup codes
// (returned in the response — only shown once).
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
    if (!twoFactor) {
      return NextResponse.json(
        { error: "Call /setup first to generate a secret" },
        { status: 400 }
      );
    }
    if (twoFactor.verifiedAt) {
      return NextResponse.json(
        { error: "2FA already verified" },
        { status: 400 }
      );
    }
    if (!(await verifyTotp(body.code, twoFactor.secret))) {
      return NextResponse.json({ error: "Invalid code" }, { status: 400 });
    }
    const backupCodes = generateBackupCodes(8);
    await db.twoFactor.update({
      where: { userId: session.userId },
      data: {
        verifiedAt: new Date(),
        backupCodes: JSON.stringify(backupCodes),
      },
    });
    return NextResponse.json({
      ok: true,
      backupCodes,
      message: "2FA enabled. Save these backup codes — they will only be shown once.",
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "verify failed" }, { status: 500 });
  }
}
