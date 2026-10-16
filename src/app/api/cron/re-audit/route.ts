import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { findOrGenerateProfile } from "@/lib/tiktok-data";
import { sendTemplateEmail } from "@/lib/email";
import EligibilityAlertEmail from "@/emails/eligibility-alert-email";

// POST /api/cron/re-audit
//
// Bearer-token protected cron endpoint. Re-audits every saved audit's
// handle and compares the new eligibility status against the stored
// status. If it changed, updates the audit row + fires an email alert
// to the user who saved it.
//
// Suggested schedule: every 6 hours via cron, Vercel Cron, or a systemd timer.
//   curl -X POST -H "Authorization: Bearer $CRON_SECRET" \
//     https://yourdomain.com/api/cron/re-audit
export async function POST(req: NextRequest) {
  const auth = req.headers.get("authorization") ?? "";
  const secret = process.env.CRON_SECRET;
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const startedAt = Date.now();
  const stats = {
    totalAudits: 0,
    changed: 0,
    alertsSent: 0,
    errors: 0,
  };

  try {
    const audits = await db.savedAudit.findMany({
      orderBy: { checkedAt: "desc" },
      take: 1000,
    });
    stats.totalAudits = audits.length;

    for (const audit of audits) {
      try {
        const profile = findOrGenerateProfile(audit.handle);
        const passedCount = profile.checks.filter((c) => c.passed).length;
        const allPassed = passedCount === profile.checks.length;
        const newStatus: "eligible" | "ineligible" | "restricted" = allPassed
          ? "eligible"
          : profile.checks.some((c) => c.actual === "Restricted")
            ? "restricted"
            : "ineligible";

        if (newStatus !== audit.status) {
          stats.changed++;
          // Update the audit row with the new status + followers count.
          await db.savedAudit.update({
            where: { id: audit.id },
            data: {
              status: newStatus,
              eligible: allPassed,
              followers: profile.metrics.followers,
              checkedAt: new Date(),
            },
          });

          // Fire an alert email to the user who saved the audit (if they have
          // an email and the alert is meaningful — i.e., not the first audit).
          if (audit.userId) {
            const user = await db.user.findUnique({
              where: { id: audit.userId },
            });
            if (user?.email) {
              try {
                await sendTemplateEmail(EligibilityAlertEmail, {
                  to: user.email,
                  subject: `${audit.handle} eligibility changed: ${audit.status} → ${newStatus}`,
                  tag: "eligibility_alert",
                  userName: user.name ?? "there",
                  handle: audit.handle,
                  previousStatus: audit.status,
                  newStatus,
                  followers: profile.metrics.followers,
                });
                stats.alertsSent++;
              } catch (e) {
                console.error("alert email failed:", e);
              }
            }
          }
        }
      } catch (e) {
        stats.errors++;
        console.error(`re-audit failed for ${audit.handle}:`, e);
      }
    }

    return NextResponse.json({
      ok: true,
      durationMs: Date.now() - startedAt,
      stats,
    });
  } catch (e) {
    console.error("cron re-audit fatal:", e);
    return NextResponse.json({ error: "cron failed", stats }, { status: 500 });
  }
}
