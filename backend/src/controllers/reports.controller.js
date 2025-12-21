import { prisma } from "../services/dbService.js";
import { createAuditLog } from "../services/auditLogService.js";
import { addDurationToNow } from "../utils/dateDuration.js";

export async function createReportController(req, res) {
    const { reportedUserId, reasonCategory, reasonText, evidence } = req.body || {};

    const reported_user_id = Number(reportedUserId);
    if (!reported_user_id || Number.isNaN(reported_user_id)) {
        return res.status(400).json({ error: "reportedUserId is required" });
    }

    if (!reasonCategory || typeof reasonCategory !== "string") {
        return res.status(400).json({ error: "reasonCategory is required" });
    }

    if (!reasonText || typeof reasonText !== "string" || !reasonText.trim()) {
        return res.status(400).json({ error: "reasonText is required" });
    }

    const report = await prisma.reports.create({
        data: {
            reported_user_id,
            reported_by_id: req.userId,
            reason_category: reasonCategory,
            reason_text: reasonText.trim().slice(0, 2000),
            evidence: typeof evidence === "string" ? evidence.trim().slice(0, 2000) : null,
            status: "open",
        },
        include: {
            reported_user: { select: { id: true, pseudo: true, email: true } },
            reported_by: { select: { id: true, pseudo: true, email: true } },
        },
    });

    await createAuditLog({
        actorId: req.userId,
        action: "CREATE_REPORT",
        targetUserId: reported_user_id,
        reportId: report.id,
        metadata: { reasonCategory },
    });

    return res.json({ success: true, report });
}

export async function listReportsController(req, res) {
    const page = Math.max(1, Number(req.query.page ?? 1));
    const pageSize = Math.min(100, Math.max(5, Number(req.query.pageSize ?? 20)));
    const status = (req.query.status ?? "").toString().trim();

    const where = {};
    if (status) where.status = status;

    const [total, reports] = await Promise.all([
        prisma.reports.count({ where }),
        prisma.reports.findMany({
            where,
            orderBy: { created_at: "desc" },
            skip: (page - 1) * pageSize,
            take: pageSize,
            include: {
                reported_user: { select: { id: true, pseudo: true, email: true, status: true, role: true } },
                reported_by: { select: { id: true, pseudo: true, email: true } },
                admin_decision_by: { select: { id: true, pseudo: true, email: true } },
            },
        }),
    ]);

    return res.json({ page, pageSize, total, reports });
}

export async function decideReportController(req, res) {
    const reportId = Number(req.params.id);
    const { decision, note, banReason, duration } = req.body || {};

    if (!reportId || Number.isNaN(reportId)) {
        return res.status(400).json({ error: "Invalid report id" });
    }

    const report = await prisma.reports.findUnique({
        where: { id: reportId },
    });

    if (!report) return res.status(404).json({ error: "Report not found" });

    if (decision !== "ban" && decision !== "reject") {
        return res.status(400).json({ error: "decision must be 'ban' or 'reject'" });
    }

    let updatedUser = null;

    if (decision === "ban") {
        const bannedUntil = addDurationToNow(duration);
        updatedUser = await prisma.users.update({
            where: { id: report.reported_user_id },
            data: {
                status: "banned",
                banned_until: bannedUntil,
                banned_at: new Date(),
                ban_reason: typeof banReason === "string" ? banReason.trim().slice(0, 500) : "Banned after report",
                banned_by_id: req.userId,
            },
        });

        await createAuditLog({
            actorId: req.userId,
            action: "BAN_USER_FROM_REPORT",
            targetUserId: report.reported_user_id,
            reportId,
            metadata: { bannedUntil },
        });
    }

    const updatedReport = await prisma.reports.update({
        where: { id: reportId },
        data: {
            status: decision === "ban" ? "resolved" : "rejected",
            admin_decision_by_id: req.userId,
            admin_decision_at: new Date(),
            admin_decision_note: typeof note === "string" ? note.trim().slice(0, 2000) : null,
        },
        include: {
            reported_user: { select: { id: true, pseudo: true, email: true, status: true } },
            reported_by: { select: { id: true, pseudo: true, email: true } },
            admin_decision_by: { select: { id: true, pseudo: true, email: true } },
        },
    });

    await createAuditLog({
        actorId: req.userId,
        action: decision === "ban" ? "RESOLVE_REPORT_BAN" : "REJECT_REPORT",
        targetUserId: report.reported_user_id,
        reportId,
        metadata: { note: updatedReport.admin_decision_note },
    });

    return res.json({ success: true, report: updatedReport, user: updatedUser });
}
