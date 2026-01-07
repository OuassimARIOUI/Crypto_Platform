import admin from "../services/firebaseAdmin.js";
import { prisma } from "../services/dbService.js";


export async function auth(req, res, next) {
    const header = req.headers.authorization;

    if (!header) return res.status(401).json({ error: "Token manquant" });

    // PERF-ONLY bypass (to load-test authenticated routes without real Firebase)
    // Enabled only when PERF_TEST=true AND not in production.
    if (
        process.env.PERF_TEST === "true" &&
        process.env.NODE_ENV !== "production" &&
        header.startsWith("Bearer ")
    ) {
        const token = header.split(" ")[1];
        const expected = process.env.PERF_TEST_TOKEN || "perf_test_token";

        if (token === expected) {
            const uid = process.env.PERF_TEST_UID || "perf_uid";
            const email = process.env.PERF_TEST_EMAIL || "perf_test@mail.com";

            // Pseudo must be alphanumeric only.
            const basePseudo = (process.env.PERF_TEST_PSEUDO || "perfuser1").replace(/[^a-zA-Z0-9]/g, "");

            let user;
            try {
                user = await prisma.users.upsert({
                    where: { email },
                    update: {
                        firebase_uid: uid,
                        status: "active",
                        role: "user",
                    },
                    create: {
                        email,
                        pseudo: basePseudo || `perfuser${Date.now().toString(36).slice(-6)}`,
                        firebase_uid: uid,
                        password: null,
                        status: "active",
                        role: "user",
                    },
                });
            } catch (err) {
                // If pseudo collision happens, retry with a random alphanumeric pseudo.
                if (err?.code === "P2002") {
                    user = await prisma.users.upsert({
                        where: { email },
                        update: {
                            firebase_uid: uid,
                            status: "active",
                            role: "user",
                        },
                        create: {
                            email,
                            pseudo: `perfuser${Date.now().toString(36).slice(-6)}`,
                            firebase_uid: uid,
                            password: null,
                            status: "active",
                            role: "user",
                        },
                    });
                } else {
                    throw err;
                }
            }

            await prisma.portfolios.upsert({
                where: { user_id: user.id },
                update: {},
                create: { user_id: user.id, balance: 0, total_deposited: 0 },
            });

            req.user = { uid, email };
            req.dbUser = user;
            req.userId = user.id;
            return next();
        }
    }

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
        if (err.code === 'auth/id-token-expired') {
            return res.status(401).json({ 
                error: "Token expired", 
                code: "TOKEN_EXPIRED",
                message: "Firebase token has expired. Please refresh your token." 
            });
        }
        if (err.code === 'auth/id-token-revoked') {
            return res.status(401).json({ 
                error: "Token revoked", 
                code: "TOKEN_REVOKED" 
            });
        }
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

