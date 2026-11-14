import { db } from "../db";
import { auditLogsTable } from "../db/schema";

export async function logAuditEvent(params: {
  userId?: string | null;
  event: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
}) {
  try {
    await db.insert(auditLogsTable).values({
      userId: params.userId ?? null,
      event: params.event,
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
      metadata: params.metadata ?? null,
    });
  } catch (err) {
    console.error("[Audit] Failed to write audit log:", err);
  }
}
