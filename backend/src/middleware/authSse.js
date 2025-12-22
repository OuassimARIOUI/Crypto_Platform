import admin from "../services/firebaseAdmin.js";
import { prisma } from "../services/dbService.js";

// SSE/EventSource cannot reliably send Authorization headers.
// We accept a token via query string: /realtime/stream?token=...

export async function authSse(req, res, next) {
    const token = (req.query.token ?? "").toString();
    if (!token) return res.status(401).json({ error: "Token manquant" });

    try {
        const decoded = await admin.auth().verifyIdToken(token);

        let resolvedUser = await prisma.users.findUnique({
            where: { firebase_uid: decoded.uid },
        });

        if (!resolvedUser && decoded.email) {
            resolvedUser = await prisma.users.findUnique({
                where: { email: decoded.email },
            });

            if (resolvedUser && !resolvedUser.firebase_uid) {
                resolvedUser = await prisma.users.update({
                    where: { id: resolvedUser.id },
                    data: { firebase_uid: decoded.uid },
                });
            }
        }

        if (!resolvedUser) return res.status(404).json({ error: "User not found" });

        req.dbUser = resolvedUser;
        req.userId = resolvedUser.id;
        req.userRole = resolvedUser.role;

        return next();
    } catch (err) {
        console.log("AUTH SSE ERROR:", err);
        return res.status(401).json({ error: "Token invalide" });
    }
}
