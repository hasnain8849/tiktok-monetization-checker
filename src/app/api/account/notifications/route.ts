import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionInfo } from "@/lib/auth";

// GET /api/account/notifications — return the logged-in user's settings.
// Auto-creates a default-all-on row if the user doesn't have one yet.
export async function GET() {
  const session = await getSessionInfo();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  try {
    let settings = await db.notificationSettings.findUnique({
      where: { userId: session.userId },
    });
    if (!settings) {
      settings = await db.notificationSettings.create({
        data: { userId: session.userId },
      });
    }
    return NextResponse.json({
      settings: {
        paymentEmailsEnabled: settings.paymentEmailsEnabled,
        eligibilityAlertsEnabled: settings.eligibilityAlertsEnabled,
        mutedHandles: JSON.parse(settings.mutedHandlesJson) as string[],
      },
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "fetch failed" }, { status: 500 });
  }
}

type PatchBody = {
  paymentEmailsEnabled?: boolean;
  eligibilityAlertsEnabled?: boolean;
  mutedHandles?: string[];
};

// PATCH /api/account/notifications — update the user's notification settings.
export async function PATCH(req: NextRequest) {
  const session = await getSessionInfo();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  try {
    const body = (await req.json()) as PatchBody;
    const updates: {
      paymentEmailsEnabled?: boolean;
      eligibilityAlertsEnabled?: boolean;
      mutedHandlesJson?: string;
    } = {};
    if (typeof body.paymentEmailsEnabled === "boolean") {
      updates.paymentEmailsEnabled = body.paymentEmailsEnabled;
    }
    if (typeof body.eligibilityAlertsEnabled === "boolean") {
      updates.eligibilityAlertsEnabled = body.eligibilityAlertsEnabled;
    }
    if (Array.isArray(body.mutedHandles)) {
      // Normalize each handle (strip leading @, lowercase, dedupe).
      const normalized = Array.from(
        new Set(
          body.mutedHandles
            .map((h) => h.trim().toLowerCase().replace(/^@/, ""))
            .filter(Boolean)
        )
      );
      updates.mutedHandlesJson = JSON.stringify(normalized);
    }
    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ ok: true, changed: false });
    }
    const settings = await db.notificationSettings.upsert({
      where: { userId: session.userId },
      create: {
        userId: session.userId,
        ...updates,
      },
      update: updates,
    });
    return NextResponse.json({
      ok: true,
      changed: true,
      settings: {
        paymentEmailsEnabled: settings.paymentEmailsEnabled,
        eligibilityAlertsEnabled: settings.eligibilityAlertsEnabled,
        mutedHandles: JSON.parse(settings.mutedHandlesJson) as string[],
      },
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "update failed" }, { status: 500 });
  }
}
