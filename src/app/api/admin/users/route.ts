import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionInfo } from "@/lib/auth";

// GET /api/admin/users — list all users (admin-only). Returns id, email,
// name, role, createdAt, password presence flag, and aggregate counts
// (audits, payment attempts, unlocked profiles).
export async function GET() {
  const session = await getSessionInfo();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "admin required" }, { status: 403 });
  }
  try {
    const users = await db.user.findMany({
      orderBy: { createdAt: "desc" },
      take: 200,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        password: true,
      },
    });

    // Aggregate per-user counts in one round-trip via groupBy.
    const [auditGroups, paymentGroups, unlockGroups] = await Promise.all([
      db.savedAudit.groupBy({ by: ["userId"], _count: { _all: true } }),
      db.paymentAttempt.groupBy({ by: ["userId"], _count: { _all: true } }),
      db.unlockedProfile.groupBy({ by: ["userId"], _count: { _all: true } }),
    ]);

    const auditCount = new Map(auditGroups.map((g) => [g.userId, g._count._all]));
    const paymentCount = new Map(paymentGroups.map((g) => [g.userId, g._count._all]));
    const unlockCount = new Map(unlockGroups.map((g) => [g.userId, g._count._all]));

    const out = users.map((u) => ({
      id: u.id,
      email: u.email,
      name: u.name,
      role: u.role,
      createdAt: u.createdAt,
      hasPassword: !!u.password,
      auditCount: auditCount.get(u.id) ?? 0,
      paymentCount: paymentCount.get(u.id) ?? 0,
      unlockCount: unlockCount.get(u.id) ?? 0,
    }));

    return NextResponse.json({ users: out });
  } catch (e) {
    console.error("admin users list failed:", e);
    return NextResponse.json({ users: [] });
  }
}
