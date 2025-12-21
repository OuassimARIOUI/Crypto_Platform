import { prisma } from "./dbService.js";

export async function createAuditLog({
    actorId,
    action,
    targetUserId,
    reportId,
    metadata,
}) {
    return prisma.audit_logs.create({
        data: {
            actor_id: actorId ?? null,
            action,
            target_user_id: targetUserId ?? null,
            report_id: reportId ?? null,
            metadata: metadata ?? undefined,
        },
    });
}
