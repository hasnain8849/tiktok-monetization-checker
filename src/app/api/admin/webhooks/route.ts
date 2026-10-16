import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionInfo } from "@/lib/auth";

// GET /api/admin/webhooks — admin-only. Lists all WebhookDelivery rows
// (latest first) so admins can see which notifications were sent and
// which failed.
export async function GET() {
  const session = await getSessionInfo();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "admin required" }, { status: 403 });
  }
  try {
    const deliveries = await db.webhookDelivery.findMany({
      orderBy: { createdAt: "desc" },
      take: 200,
    });
    return NextResponse.json({ deliveries });
  } catch (e) {
    console.error("admin webhooks list failed:", e);
    return NextResponse.json({ deliveries: [] });
  }
}
