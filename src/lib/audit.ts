import { db } from "@/lib/db";
import { getSessionInfo } from "@/lib/auth";

// Audit log helper — used by all admin endpoints to record who did what.
// Always returns void; failures are logged but never throw.

export type AuditAction =
  | "verify_payment"
  | "reject_payment"
  | "promote_user"
  | "demote_user"
  | "delete_audit"
  | "settings_update";

export interface AuditEntry {
  action: AuditAction;
  targetType: "payment" | "user" | "audit";
  targetId?: string;
  targetHandle?: string;
  metadata?: Record<string, unknown>;
}

export async function recordAudit(entry: AuditEntry): Promise<void> {
  try {
    const session = await getSessionInfo();
    const actorEmail = session?.email ?? "anonymous";
    await db.auditLog.create({
      data: {
        actorEmail,
        action: entry.action,
        targetType: entry.targetType,
        targetId: entry.targetId ?? null,
        targetHandle: entry.targetHandle ?? null,
        metadata: JSON.stringify(entry.metadata ?? {}),
      },
    });
  } catch (e) {
    console.error("audit log write failed:", e);
  }
}
