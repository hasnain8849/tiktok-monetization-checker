import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionInfo } from "@/lib/auth";

// GET /api/admin/metrics — admin-only. Computes key business metrics:
//   - Total users, total audits, total payment attempts, total unlocks
//   - Unlock rate (% of payment attempts that ended in verified)
//   - Average time-to-verify (createdAt → paidAt on UnlockedProfile)
//   - MRR-style: sum of all verified payment amounts in the last 30 days
//   - Per-handle unlock counts (top 10)
//   - Daily revenue trend (last 7 days)
export async function GET() {
  const session = await getSessionInfo();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "admin required" }, { status: 403 });
  }
  try {
    const [
      totalUsers,
      totalAudits,
      totalAttempts,
      totalUnlocks,
      verifiedAttempts,
      recentVerifications,
      topUnlockedRows,
    ] = await Promise.all([
      db.user.count(),
      db.savedAudit.count(),
      db.paymentAttempt.count(),
      db.unlockedProfile.count(),
      db.paymentAttempt.count({ where: { status: "verified" } }),
      // Unlocked profiles created in the last 30 days — for time-to-verify + MRR
      db.unlockedProfile.findMany({
        where: { paidAt: { gte: new Date(Date.now() - 30 * 86400_000) } },
      }),
      // Group PaymentAttempt by handle where status=verified, top 10
      db.paymentAttempt.groupBy({
        by: ["handle"],
        where: { status: "verified" },
        _count: { _all: true },
        orderBy: { _count: { handle: "desc" } },
        take: 10,
      }),
    ]);

    // Time-to-verify: average (paidAt - createdAt) on UnlockedProfile.
    // We approximate by joining on PaymentAttempt createdAt via the
    // paymentRef, but for simplicity we just compute paidAt - (min
    // matching attempt createdAt) per row.
    const timeToVerifyMs: number[] = [];
    for (const unlock of recentVerifications) {
      const earliest = await db.paymentAttempt.findFirst({
        where: { handle: unlock.handle, paymentRef: unlock.paymentRef ?? undefined },
        orderBy: { createdAt: "asc" },
      });
      if (earliest) {
        timeToVerifyMs.push(unlock.paidAt.getTime() - earliest.createdAt.getTime());
      }
    }
    const avgTimeToVerifyMs =
      timeToVerifyMs.length > 0
        ? Math.round(timeToVerifyMs.reduce((s, x) => s + x, 0) / timeToVerifyMs.length)
        : 0;

    // MRR-style: sum of verified payment amounts in the last 30 days
    const thirtyDaysAgo = new Date(Date.now() - 30 * 86400_000);
    const recentVerifiedAttempts = await db.paymentAttempt.findMany({
      where: { status: "verified", createdAt: { gte: thirtyDaysAgo } },
    });
    const revenueLast30Days = recentVerifiedAttempts.reduce(
      (sum, a) => sum + a.amount,
      0
    );

    // Daily revenue trend (last 7 days)
    const dailyRevenue: { day: string; revenue: number; unlocks: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const dayStart = new Date();
      dayStart.setHours(0, 0, 0, 0);
      dayStart.setDate(dayStart.getDate() - i);
      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayEnd.getDate() + 1);
      const dayAttempts = await db.paymentAttempt.findMany({
        where: {
          status: "verified",
          createdAt: { gte: dayStart, lt: dayEnd },
        },
      });
      dailyRevenue.push({
        day: dayStart.toLocaleDateString("en-US", { weekday: "short" }),
        revenue: dayAttempts.reduce((s, a) => s + a.amount, 0),
        unlocks: dayAttempts.length,
      });
    }

    const unlockRate =
      totalAttempts > 0 ? Math.round((verifiedAttempts / totalAttempts) * 1000) / 10 : 0;

    return NextResponse.json({
      kpis: {
        totalUsers,
        totalAudits,
        totalAttempts,
        totalUnlocks,
        verifiedAttempts,
        unlockRate, // %
        avgTimeToVerifyMs,
        revenueLast30Days,
      },
      dailyRevenue,
      topUnlocked: topUnlockedRows.map((r) => ({
        handle: r.handle,
        unlockCount: r._count._all,
      })),
    });
  } catch (e) {
    console.error("admin metrics failed:", e);
    return NextResponse.json({ error: "metrics failed" }, { status: 500 });
  }
}
