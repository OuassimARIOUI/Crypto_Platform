import { prisma } from "../services/dbService.js";
import { createAuditLog } from "../services/auditLogService.js";
import { addDurationToNow } from "../utils/dateDuration.js";
import { getMaintenanceConfig, setMaintenanceConfig } from "../services/appSettingsService.js";

function computeUserSummary(user, viewerRole) {
    const isModeratorViewingAdmin = viewerRole === "moderator" && user.role === "admin";

    if (isModeratorViewingAdmin) {
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
                balance: null,
                totalDeposited: null,
                profit: null,
            },
        };
    }

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
        users: users.map((u) => computeUserSummary(u, req.userRole)),
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

    return res.json({ success: true, user: computeUserSummary(updated, req.userRole) });
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

    return res.json({ success: true, user: computeUserSummary(updated, req.userRole) });
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

    return res.json({ success: true, user: computeUserSummary(updated, req.userRole) });
}

export async function getMaintenanceStatusController(req, res) {
    const cfg = await getMaintenanceConfig({ noCache: true });
    return res.json({
        enabled: cfg.enabled,
        message: cfg.message,
        updatedAt: cfg.updatedAt,
    });
}

export async function setMaintenanceStatusController(req, res) {
    const { enabled, message } = req.body || {};

    if (typeof enabled !== "boolean") {
        return res.status(400).json({ error: "enabled must be a boolean" });
    }

    const cfg = await setMaintenanceConfig({ enabled, message });

    await createAuditLog({
        actorId: req.userId,
        action: "SET_MAINTENANCE_MODE",
        metadata: { enabled: cfg.enabled, message: cfg.message },
    });

    return res.json({
        success: true,
        enabled: cfg.enabled,
        message: cfg.message,
        updatedAt: cfg.updatedAt,
    });
}

export async function getUserActivityController(req, res) {
    const targetUserId = Number(req.params.id);
    const limit = Math.min(50, Math.max(5, Number(req.query.limit ?? 20)));

    if (!targetUserId || Number.isNaN(targetUserId)) {
        return res.status(400).json({ error: "Invalid user id" });
    }

    if (req.userRole === "moderator") {
        const target = await prisma.users.findUnique({
            where: { id: targetUserId },
            select: { role: true },
        });

        if (!target) {
            return res.status(404).json({ error: "User not found" });
        }

        if (target.role === "admin") {
            return res.status(403).json({ error: "Moderators cannot view admin activity" });
        }
    }

    const [transactions, auditLogs] = await Promise.all([
        prisma.portfolio_transactions.findMany({
            where: { portfolio: { user_id: targetUserId } },
            include: { crypto: { select: { symbol: true, name: true } } },
            orderBy: { timestamp: "desc" },
            take: limit,
        }),
        prisma.audit_logs.findMany({
            where: {
                OR: [{ actor_id: targetUserId }, { target_user_id: targetUserId }],
            },
            include: {
                actor: { select: { id: true, pseudo: true, role: true } },
                target_user: { select: { id: true, pseudo: true, role: true } },
            },
            orderBy: { created_at: "desc" },
            take: limit,
        }),
    ]);

    const items = [];

    for (const t of transactions) {
        const type = (t.type || "").toString().toLowerCase();
        const action = type === "sell" ? "SELL" : "BUY";
        const symbol = t.crypto?.symbol ?? "";
        const qty = Number(t.quantity);
        const price = Number(t.price_usd);
        const total = Number.isFinite(qty) && Number.isFinite(price) ? qty * price : null;

        items.push({
            kind: "trade",
            id: `trade:${t.id}`,
            at: t.timestamp,
            action,
            title: `${action} ${symbol.toUpperCase()}`.trim(),
            details: {
                symbol,
                quantity: Number.isFinite(qty) ? qty : null,
                priceUsd: Number.isFinite(price) ? price : null,
                totalUsd: Number.isFinite(total) ? total : null,
            },
        });
    }

    for (const l of auditLogs) {
        const actorLabel = l.actor?.pseudo ? `@${l.actor.pseudo}` : null;
        items.push({
            kind: "audit",
            id: `audit:${l.id}`,
            at: l.created_at,
            action: l.action,
            title: l.action,
            actor: l.actor ? { id: l.actor.id, pseudo: l.actor.pseudo, role: l.actor.role } : null,
            target: l.target_user ? { id: l.target_user.id, pseudo: l.target_user.pseudo, role: l.target_user.role } : null,
            subtitle: actorLabel,
            metadata: l.metadata ?? null,
        });
    }

    items.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());

    return res.json({ userId: targetUserId, limit, items: items.slice(0, limit) });
}
