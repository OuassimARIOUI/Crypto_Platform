import { prisma } from "../services/dbService.js";

function isBanExpired(user) {
    if (!user) return false;
    if (user.status !== "banned") return false;
    if (!user.banned_until) return false;
    return new Date(user.banned_until).getTime() <= Date.now();
}

export async function normalizeAccountStatus(req, res, next) {
    try {
        const dbUser = req.dbUser;
        if (!dbUser) return next();

        if (isBanExpired(dbUser)) {
            const updated = await prisma.users.update({
                where: { id: dbUser.id },
                data: {
                    status: "active",
                    banned_until: null,
                    banned_at: null,
                    ban_reason: null,
                    banned_by_id: null,
                },
            });
            req.dbUser = updated;
        }

        req.userRole = req.dbUser.role;
        req.accountStatus = req.dbUser.status;
        req.isBanned = req.accountStatus === "banned";
        req.isSuspended = req.accountStatus === "suspended";
        req.bannedUntil = req.dbUser.banned_until;

        return next();
    } catch (err) {
        return res.status(500).json({ error: "Failed to validate account status" });
    }
}

export function requireRole(...allowedRoles) {
    const normalizedAllowed = allowedRoles.flat().filter(Boolean);

    return (req, res, next) => {
        const role = req.dbUser?.role;
        if (!role) return res.status(401).json({ error: "Unauthorized" });

        if (!normalizedAllowed.includes(role)) {
            return res.status(403).json({ error: "Accès refusé" });
        }

        return next();
    };
}

export function requireCanTrade(req, res, next) {
    const status = req.dbUser?.status;
    if (!status) return res.status(401).json({ error: "Unauthorized" });

    if (status === "banned" || status === "suspended") {
        return res.status(403).json({
            error: "Account restricted",
            status,
        });
    }

    return next();
}
