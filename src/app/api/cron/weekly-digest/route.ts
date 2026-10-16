import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sendTemplateEmail } from "@/lib/email";
import WeeklyDigestEmail from "@/emails/weekly-digest-email";

// POST /api/cron/weekly-digest
//
// Bearer-token protected (CRON_SECRET). For every user with saved audits,
// sends a weekly digest email summarizing their audits' statuses + the
// number of new unlocks in the last 7 days. Honors each user's
// NotificationSettings (eligibilityAlertsEnabled + mutedHandles).
export async function POST(req: NextRequest) {
  const auth = req.headers.get("authorization") ?? "";
  const secret = process.env.CRON_SECRET;
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const startedAt = Date.now();
  const stats = { totalUsers: 0, emailsSent: 0, suppressed: 0, errors: 0 };

  try {
    // Group SavedAudit by userId to get one digest per user.
    const auditGroups = await db.savedAudit.groupBy({
      by: ["userId"],
      _count: { _all: true },
    });
    stats.totalUsers = auditGroups.length;

    for (const group of auditGroups) {
      const userId = group.userId;
      if (!userId) continue; // seed rows without a userId
      try {
        const user = await db.user.findUnique({ where: { id: userId } });
        if (!user?.email) continue;
        const settings = await db.notificationSettings.findUnique({
          where: { userId },
        });
        // Honor user's notification preferences. If eligibilityAlertsEnabled
        // is false OR no settings row yet, skip the digest.
        if (settings && !settings.eligibilityAlertsEnabled) {
          stats.suppressed++;
          continue;
        }

        const audits = await db.savedAudit.findMany({
          where: { userId },
          orderBy: { checkedAt: "desc" },
        });
        const eligibleCount = audits.filter((a) => a.status === "eligible").length;
        const restrictedCount = audits.filter((a) => a.status === "restricted").length;
        const mutedHandles = settings
          ? (JSON.parse(settings.mutedHandlesJson) as string[])
          : [];
        const visibleAudits = audits.filter(
          (a) => !mutedHandles.includes(a.handle.replace(/^@/, "").toLowerCase())
        );
        const topHandles = visibleAudits.slice(0, 3).map((a) => ({
          handle: a.handle,
          status: a.status,
          followers: a.followers,
        }));

        // Count new unlocks this week (UnlockedProfile rows paidAt >= 7d ago,
        // owned by this user).
        const weekAgo = new Date(Date.now() - 7 * 86400_000);
        const newUnlocks = await db.unlockedProfile.count({
          where: { userId, paidAt: { gte: weekAgo } },
        });

        await sendTemplateEmail(WeeklyDigestEmail, {
          to: user.email,
          subject: "Your weekly TikTok audit digest",
          tag: "weekly_digest",
          userId: user.id,
          userName: user.name ?? "there",
          totalAudits: audits.length,
          eligibleCount,
          restrictedCount,
          newUnlocks,
          topHandles,
        });
        stats.emailsSent++;
      } catch (e) {
        stats.errors++;
        console.error(`weekly digest for user ${userId} failed:`, e);
      }
    }

    return NextResponse.json({ ok: true, durationMs: Date.now() - startedAt, stats });
  } catch (e) {
    console.error("weekly digest fatal:", e);
    return NextResponse.json({ error: "cron failed", stats }, { status: 500 });
  }
}
