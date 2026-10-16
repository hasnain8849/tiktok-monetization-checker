import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// POST /api/cron/audit-retention
//
// Bearer-token protected (CRON_SECRET). Deletes audit-log entries older than
// AUDIT_RETENTION_DAYS (default 90). Returns the count of deleted rows so
// admins can verify the policy is running.
//
// Suggested schedule: daily at midnight.
//   0 0 * * * curl -X POST -H "Authorization: Bearer $CRON_SECRET" \
//     https://yourdomain.com/api/cron/audit-retention
export async function POST(req: NextRequest) {
  const auth = req.headers.get("authorization") ?? "";
  const secret = process.env.CRON_SECRET;
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const retentionDays = Number(process.env.AUDIT_RETENTION_DAYS ?? 90);
  if (!Number.isFinite(retentionDays) || retentionDays < 1) {
    return NextResponse.json(
      { error: "AUDIT_RETENTION_DAYS must be a positive number" },
      { status: 500 }
    );
  }

  const cutoff = new Date(Date.now() - retentionDays * 86400_000);
  const startedAt = Date.now();

  try {
    const [auditDeleted, emailDeleted, webhookDeleted] = await Promise.all([
      db.auditLog.deleteMany({ where: { createdAt: { lt: cutoff } } }),
      db.emailLog.deleteMany({ where: { createdAt: { lt: cutoff } } }),
      db.webhookDelivery.deleteMany({ where: { createdAt: { lt: cutoff } } }),
    ]);

    return NextResponse.json({
      ok: true,
      durationMs: Date.now() - startedAt,
      retentionDays,
      cutoff: cutoff.toISOString(),
      deleted: {
        auditLog: auditDeleted.count,
        emailLog: emailDeleted.count,
        webhookDelivery: webhookDeleted.count,
      },
    });
  } catch (e) {
    console.error("audit retention failed:", e);
    return NextResponse.json({ error: "retention failed" }, { status: 500 });
  }
}
