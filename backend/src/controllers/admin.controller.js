import { prisma } from "../services/dbService.js";
import { createAuditLog } from "../services/auditLogService.js";
import { addDurationToNow } from "../utils/dateDuration.js";

function computeUserSummary(user) {
    const balance = user.portfolio?.balance ?? 0;
    const totalDeposited = user.portfolio?.total_deposited ?? 0;
    const profit = Number(balance) - Number(totalDeposited);

    return {
        id: user.id,
        pseudo: user.pseudo,
        email: user.email,
        role: user.role,
        status: user.status,
        bannedUntil: user.banned_until,
        banReason: user.ban_reason,
        createdAt: user.created_at,
        portfolio: {
            balance,
            totalDeposited,
            profit,
        },
    };
}

export async function listUsersController(req, res) {
    const page = Math.max(1, Number(req.query.page ?? 1));
    const pageSize = Math.min(100, Math.max(5, Number(req.query.pageSize ?? 20)));
    const search = (req.query.search ?? "").toString().trim();
    const role = (req.query.role ?? "").toString().trim();
    const status = (req.query.status ?? "").toString().trim();

    const where = {};
    if (search) {
        where.OR = [
            { email: { contains: search, mode: "insensitive" } },
            { pseudo: { contains: search, mode: "insensitive" } },
        ];
    }
    if (role) where.role = role;
    if (status) where.status = status;

    const [total, users] = await Promise.all([
        prisma.users.count({ where }),
        prisma.users.findMany({
            where,
            orderBy: { created_at: "desc" },
            skip: (page - 1) * pageSize,
            take: pageSize,
            include: { portfolio: true },
        }),
    ]);

    return res.json({
        page,
        pageSize,
        total,
        users: users.map(computeUserSummary),
    });
}

export async function updateUserRoleController(req, res) {
    const targetUserId = Number(req.params.id);
    const { role } = req.body || {};

    if (!targetUserId || Number.isNaN(targetUserId)) {
        return res.status(400).json({ error: "Invalid user id" });
    }

    if (role !== "user" && role !== "moderator") {
        return res.status(400).json({ error: "Role must be 'user' or 'moderator'" });
    }

    const updated = await prisma.users.update({
        where: { id: targetUserId },
        data: { role },
        include: { portfolio: true },
    });

    await createAuditLog({
        actorId: req.userId,
        action: "UPDATE_ROLE",
        targetUserId,
        metadata: { role },
    });

    return res.json({ success: true, user: computeUserSummary(updated) });
}

export async function banUserController(req, res) {
    const targetUserId = Number(req.params.id);
    const { reason, duration } = req.body || {};

    if (!targetUserId || Number.isNaN(targetUserId)) {
        return res.status(400).json({ error: "Invalid user id" });
    }

    const bannedUntil = addDurationToNow(duration);

    const updated = await prisma.users.update({
        where: { id: targetUserId },
        data: {
            status: "banned",
            banned_until: bannedUntil,
            banned_at: new Date(),
            ban_reason: typeof reason === "string" ? reason.trim().slice(0, 500) : null,
            banned_by_id: req.userId,
        },
        include: { portfolio: true },
    });

    await createAuditLog({
        actorId: req.userId,
        action: "BAN_USER",
        targetUserId,
        metadata: { reason: updated.ban_reason, bannedUntil },
    });

    return res.json({ success: true, user: computeUserSummary(updated) });
}

export async function unbanUserController(req, res) {
    const targetUserId = Number(req.params.id);

    if (!targetUserId || Number.isNaN(targetUserId)) {
        return res.status(400).json({ error: "Invalid user id" });
    }

    const updated = await prisma.users.update({
        where: { id: targetUserId },
        data: {
            status: "active",
            banned_until: null,
            banned_at: null,
            ban_reason: null,
            banned_by_id: null,
        },
        include: { portfolio: true },
    });

    await createAuditLog({
        actorId: req.userId,
        action: "UNBAN_USER",
        targetUserId,
    });

    return res.json({ success: true, user: computeUserSummary(updated) });
}
