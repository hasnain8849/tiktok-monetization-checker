import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionInfo } from "@/lib/auth";

// GET /api/admin/audit-log/export?format=csv|json — admin-only. Returns all
// audit-log entries as a downloadable file. CSV is RFC 4180 compliant
// (quoted fields, CRLF line endings); JSON is a flat array.
export async function GET(req: NextRequest) {
  const session = await getSessionInfo();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "admin required" }, { status: 403 });
  }
  const url = new URL(req.url);
  const format = (url.searchParams.get("format") ?? "csv").toLowerCase();

  try {
    const entries = await db.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 5000,
    });

    if (format === "json") {
      return new NextResponse(JSON.stringify(entries, null, 2), {
        status: 200,
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          "Content-Disposition": `attachment; filename="audit-log-${Date.now()}.json"`,
        },
      });
    }

    // CSV
    const headers = [
      "id",
      "createdAt",
      "actorEmail",
      "action",
      "targetType",
      "targetId",
      "targetHandle",
      "metadata",
    ];
    const csvEscape = (v: unknown) => {
      const s = v == null ? "" : String(v);
      if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
      return s;
    };
    const rows = entries.map((e) =>
      [
        e.id,
        e.createdAt.toISOString(),
        e.actorEmail,
        e.action,
        e.targetType,
        e.targetId,
        e.targetHandle,
        e.metadata,
      ]
        .map(csvEscape)
        .join(",")
    );
    const csv = [headers.join(","), ...rows].join("\r\n") + "\r\n";

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="audit-log-${Date.now()}.csv"`,
      },
    });
  } catch (e) {
    console.error("audit-log export failed:", e);
    return NextResponse.json({ error: "export failed" }, { status: 500 });
  }
}
