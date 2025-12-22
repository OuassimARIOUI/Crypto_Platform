import admin from "../services/firebaseAdmin.js";
import { prisma } from "../services/dbService.js";
import { getMaintenanceConfig } from "../services/appSettingsService.js";

const ALWAYS_ALLOWED_PATH_PREFIXES = [
    "/admin/maintenance",
    "/auth/login",
    "/auth/firebase-login",
];

function isAllowedPath(pathname) {
    return ALWAYS_ALLOWED_PATH_PREFIXES.some((p) => pathname.startsWith(p));
}

async function resolveDbUserFromAuthHeader(authHeader) {
    if (!authHeader) return null;
    const parts = authHeader.split(" ");
    if (parts.length < 2) return null;

    const token = parts[1];
    if (!token) return null;

    const decoded = await admin.auth().verifyIdToken(token);

    let dbUser = await prisma.users.findUnique({
        where: { firebase_uid: decoded.uid },
    });

    if (!dbUser && decoded.email) {
        dbUser = await prisma.users.findUnique({
            where: { email: decoded.email },
        });

        if (dbUser && !dbUser.firebase_uid) {
            dbUser = await prisma.users.update({
                where: { id: dbUser.id },
                data: { firebase_uid: decoded.uid },
            });
        }
    }

    return dbUser;
}

export async function maintenanceGuard(req, res, next) {
    try {
        const cfg = await getMaintenanceConfig();
        if (!cfg.enabled) return next();

        const pathname = req.path || req.originalUrl || "";
        if (isAllowedPath(pathname)) return next();

        const dbUser = await resolveDbUserFromAuthHeader(req.headers.authorization);
        const role = dbUser?.role;

        if (role === "admin") {
            req.dbUser = req.dbUser ?? dbUser;
            req.userId = req.userId ?? dbUser?.id;
            return next();
        }

        return res.status(503).json({
            error: "Site en maintenance",
            maintenance: true,
            message: cfg.message,
        });
    } catch (err) {
        return res.status(503).json({
            error: "Site en maintenance",
            maintenance: true,
        });
    }
}
