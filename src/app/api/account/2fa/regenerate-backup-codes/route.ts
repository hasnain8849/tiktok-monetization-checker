import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionInfo } from "@/lib/auth";
import { verifyTotp, generateBackupCodes } from "@/lib/two-factor";

// POST /api/account/2fa/regenerate-backup-codes
//
// Requires the user to provide a valid TOTP code (or a remaining backup
// code) to prove they still have access to the authenticator app. On
// success, generates a fresh set of 8 backup codes, replaces the old set,
// and returns the new codes (only shown once).
//
// Body: { code: string } — 6-digit TOTP code or one of the remaining
// backup codes.
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

    // Verify the code: accept TOTP OR a remaining backup code (which we burn).
    const providedCode = body.code.trim().toUpperCase();
    const existingBackups = JSON.parse(twoFactor.backupCodes ?? "[]") as string[];
    let usedBackupCode: string | null = null;
    if (existingBackups.includes(providedCode)) {
      usedBackupCode = providedCode;
    } else {
      const isValid = await verifyTotp(body.code, twoFactor.secret);
      if (!isValid) {
        return NextResponse.json({ error: "Invalid code" }, { status: 400 });
      }
    }

    // Generate the fresh set + persist (replacing the old set; if a backup
    // code was used it's automatically gone because the whole array is replaced).
    const freshCodes = generateBackupCodes(8);
    await db.twoFactor.update({
      where: { userId: session.userId },
      data: { backupCodes: JSON.stringify(freshCodes) },
    });

    return NextResponse.json({
      ok: true,
      backupCodes: freshCodes,
      message: "New backup codes generated. Save them — they will only be shown once.",
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "regenerate failed" }, { status: 500 });
  }
}
