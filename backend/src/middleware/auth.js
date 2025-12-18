import admin from "../services/firebaseAdmin.js";
import { prisma } from "../services/dbService.js";


export async function auth(req, res, next) {
    const header = req.headers.authorization;

    if (!header) return res.status(401).json({ error: "Token manquant" });

    const token = header.split(" ")[1];

    try {
        const decoded = await admin.auth().verifyIdToken(token);

        // Attach decoded Firebase token
        req.user = decoded;

        // Resolve the matching DB user (our app data source)
        const dbUser = await prisma.users.findUnique({
            where: { firebase_uid: decoded.uid },
        });

        let resolvedUser = dbUser;

        if (!resolvedUser && decoded.email) {
            resolvedUser = await prisma.users.findUnique({
                where: { email: decoded.email },
            });

            // Link existing DB user to this Firebase uid
            if (resolvedUser && !resolvedUser.firebase_uid) {
                resolvedUser = await prisma.users.update({
                    where: { id: resolvedUser.id },
                    data: { firebase_uid: decoded.uid },
                });
            }
        }

        if (!resolvedUser) {
            return res.status(404).json({ error: "User not found" });
        }

        req.dbUser = resolvedUser;
        req.userId = resolvedUser.id;

        next();
    } catch (err) {
        console.log("AUTH ERROR:", err);
        return res.status(401).json({ error: "Token invalide" });
    }
}

export function adminOnly(req, res, next) {
    const role = req.dbUser?.role ?? req.user?.role;
    if (role !== "admin")
        return res.status(403).json({ error: "Accès refusé" });

    next();
}

