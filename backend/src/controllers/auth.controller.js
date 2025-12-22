import {
    register,
    login,
    sendResetEmail,
    updatePasswordWithGoogle,
    validatePseudoForRegistration,
    assertPseudoAvailable,
} from "../services/authService.js";
import { logError, logInfo } from "../utils/logger.js";
import jwt from "jsonwebtoken";
import {prisma} from "../services/dbService.js";
import admin from "../services/firebaseAdmin.js";

export async function registerController(req, res) {
    const { email, password, pseudo } = req.body;
    console.log("REQ BODY FRONT:", req.body);

    try {
        const user = await register(email, password, pseudo);
        logInfo(`User registered: ${pseudo}`);
        return res.json({ success: true, user });
    } catch (err) {
        console.log(err);
        logError("Failed to register user", err);
        const status = err?.status && Number.isFinite(Number(err.status)) ? Number(err.status) : 500;
        return res.status(status).json({ error: err?.message || "Erreur serveur" });
    }
}

export async function pseudoAvailabilityController(req, res) {
    const pseudo = (req.query.pseudo ?? "").toString();

    try {
        await assertPseudoAvailable(pseudo);
        return res.json({ valid: true, available: true });
    } catch (err) {
        const status = err?.status && Number.isFinite(Number(err.status)) ? Number(err.status) : 500;
        if (status === 400) return res.status(400).json({ valid: false, available: false, error: err.message });
        if (status === 409) return res.status(409).json({ valid: true, available: false, error: err.message });
        return res.status(status).json({ error: err?.message || "Erreur serveur" });
    }
}

export async function loginController(req, res) {
    const { email, password } = req.body;
    console.log("REQ BODY FRONT:", req.body);

    try {
        const result = await login(email, password);

        if (!result) {
            return res.status(400).json({ error: "Identifiants incorrects" });
        }

        logInfo(`User login: ${email}`);
        return res.json(result);

    } catch (err) {
        console.error("LOGIN ERROR =>", err);
        return res.status(500).json({ error: "Erreur serveur" });
    }

}

export async function meController(req, res) {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) return res.status(401).json({ error: "No token" });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await prisma.users.findUnique({
            where: { id: decoded.id },
            select: {
                id: true,
                pseudo: true,
                email: true,
                role: true,
                status: true,
                banned_until: true,
                ban_reason: true,
                created_at: true,
                discord_username: true,
                discord_user_id: true,
                discord_connected_at: true,
                firebase_uid: true,
            },
        });

        return res.json(user);
    } catch (err) {
        // If it's not a backend JWT, it may be a Firebase ID token.
    }

    try {
        const decoded = await admin.auth().verifyIdToken(token);

        let user = await prisma.users.findUnique({
            where: { firebase_uid: decoded.uid },
            select: {
                id: true,
                pseudo: true,
                email: true,
                role: true,
                status: true,
                banned_until: true,
                ban_reason: true,
                created_at: true,
                discord_username: true,
                discord_user_id: true,
                discord_connected_at: true,
                firebase_uid: true,
            },
        });

        if (!user && decoded.email) {
            user = await prisma.users.findUnique({
                where: { email: decoded.email },
                select: {
                    id: true,
                    pseudo: true,
                    email: true,
                    role: true,
                    status: true,
                    banned_until: true,
                    ban_reason: true,
                    created_at: true,
                    discord_username: true,
                    discord_user_id: true,
                    discord_connected_at: true,
                    firebase_uid: true,
                },
            });
        }

        if (!user) return res.status(404).json({ error: "User not found" });

        return res.json(user);
    } catch (err) {
        return res.status(401).json({ error: "Invalid token" });
    }
}

export async function resetPasswordController(req, res) {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ error: "Email required" });
    }

    try {
        const response = await sendResetEmail(email);
        logInfo(`Reset password email sent to: ${email}`);
        return res.json({ success: true, message: "Reset link sent" });
    } catch (err) {
        console.error("RESET ERROR =>", err.message);
        return res.status(500).json({ error: err.message });

    }
}



export async function updatePasswordController(req, res) {
    const { oobCode, newPassword } = req.body;

    if (!oobCode || !newPassword) {
        return res.status(400).json({ error: "oobCode and password are required" });
    }

    try {
        const result = await updatePasswordWithGoogle(oobCode, newPassword);

        return res.json({
            success: true,
            message: "Password updated successfully",
            result
        });

    } catch (err) {
        console.error("UPDATE PASSWORD ERROR =>", err);
        return res.status(500).json({ error: err.message || "Failed to update password" });
    }
}

export async function firebaseSyncController(req, res) {
    const { firebaseUid, email, pseudo, discordUsername } = req.body;

    try {
        if (!firebaseUid || !email || !pseudo) {
            return res.status(400).json({ error: "firebaseUid, email, pseudo are required" });
        }

        const normalizedPseudo = validatePseudoForRegistration(pseudo);

        const existingByEmail = await prisma.users.findUnique({
            where: { email },
            select: { id: true },
        });

        await assertPseudoAvailable(normalizedPseudo, { exceptUserId: existingByEmail?.id });

        // Upsert by email: keeps DB in sync with Firebase as source of truth.
        let user;
        try {
            user = await prisma.users.upsert({
            where: { email },
            update: {
                firebase_uid: firebaseUid,
                pseudo: normalizedPseudo,
                discord_username: discordUsername ?? undefined,
            },
            create: {
                firebase_uid: firebaseUid,
                email,
                pseudo: normalizedPseudo,
                password: null,
                discord_username: discordUsername ?? null,
            },
            });
        } catch (err) {
            if (err?.code === "P2002") {
                const target = Array.isArray(err?.meta?.target) ? err.meta.target.join(",") : String(err?.meta?.target || "");
                if (target.includes("pseudo")) return res.status(409).json({ error: "Ce pseudo existe déjà" });
                if (target.includes("email")) return res.status(409).json({ error: "Cet email existe déjà" });
                return res.status(409).json({ error: "Conflit: données déjà utilisées" });
            }
            throw err;
        }

        await prisma.portfolios.upsert({
            where: { user_id: user.id },
            update: {},
            create: {
                user_id: user.id,
                balance: 0,
            },
        });

        return res.json({ success: true, user });
    } catch (error) {
        console.error(error);
        const status = error?.status && Number.isFinite(Number(error.status)) ? Number(error.status) : 500;
        return res.status(status).json({ error: error?.message || "Sync error" });
    }
}



export async function loginFirebase(req, res) {
    const { token } = req.body;

    try {
        if (!token) return res.status(400).json({ error: "Token required" });
        const decoded = await admin.auth().verifyIdToken(token);

        const email = decoded.email;
        const uid = decoded.uid;

        if (!uid) return res.status(401).json({ error: "Invalid token" });

        // If user doesn't exist in our DB yet, create it now.
        let user = await prisma.users.findUnique({
            where: { firebase_uid: uid },
        });

        if (!user && email) {
            // Create (or update) by email to avoid duplicates.
            const basePseudo = (decoded.name || email.split("@")[0] || "user")
                .toString()
                .trim()
                .slice(0, 30);

            const pseudo = `${basePseudo}_${uid.slice(0, 6)}`;

            user = await prisma.users.upsert({
                where: { email },
                update: { firebase_uid: uid },
                create: {
                    firebase_uid: uid,
                    email,
                    pseudo,
                    password: null,
                },
            });

            await prisma.portfolios.upsert({
                where: { user_id: user.id },
                update: {},
                create: {
                    user_id: user.id,
                    balance: 0,
                },
            });
        }

        if (!user) return res.status(404).json({ error: "User not found" });

        return res.json({ success: true, user });
    } catch (err) {
        return res.status(401).json({ error: "Invalid token" });
    }
}


export async function updateMeController(req, res) {
    const { pseudo, discordUsername } = req.body || {};

    try {
        const data = {};
        if (typeof pseudo === "string" && pseudo.trim()) data.pseudo = pseudo.trim();
        if (typeof discordUsername === "string") data.discord_username = discordUsername.trim() || null;

        if (Object.keys(data).length === 0) {
            return res.status(400).json({ error: "No updatable fields provided" });
        }

        const user = await prisma.users.update({
            where: { id: req.userId },
            data,
        });

        return res.json({ success: true, user });
    } catch (err) {
        return res.status(500).json({ error: err.message || "Failed to update profile" });
    }
}
