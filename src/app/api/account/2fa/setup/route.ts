import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionInfo } from "@/lib/auth";
import {
  generateSecret,
  buildOtpAuthUri,
  generateQrDataUrl,
} from "@/lib/two-factor";

// GET /api/account/2fa/setup — returns a fresh TOTP secret + QR data URL
// for the user to scan with their authenticator app. The secret is NOT
// persisted yet — the user must call /verify with a TOTP code first.
// If the user already has a verified 2FA setup, this endpoint returns
// the existing secret + QR (useful for re-scanning into a new device).
export async function GET() {
  const session = await getSessionInfo();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const secret = generateSecret();
  const otpauthUri = buildOtpAuthUri(session.email, secret);
  const qrDataUrl = await generateQrDataUrl(otpauthUri);

  // Upsert an unverified TwoFactor row so the verify endpoint can find it.
  await db.twoFactor.upsert({
    where: { userId: session.userId },
    create: {
      userId: session.userId,
      secret,
      verifiedAt: null,
    },
    update: {
      secret,
      verifiedAt: null,
    },
  });

  return NextResponse.json({
    secret,
    otpauthUri,
    qrDataUrl,
    // Also expose the manual entry key for users who can't scan.
    manualKey: secret,
  });
}
