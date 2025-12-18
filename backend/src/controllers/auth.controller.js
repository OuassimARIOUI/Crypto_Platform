import {register, login, sendResetEmail, updatePasswordWithGoogle} from "../services/authService.js";
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
        return res.status(500).json({ error: "Erreur serveur" });
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
            where: { id: decoded.id }
        });

        return res.json(user);
    } catch (err) {
        // If it's not a backend JWT, it may be a Firebase ID token.
    }

    try {
        const decoded = await admin.auth().verifyIdToken(token);

        let user = await prisma.users.findUnique({
            where: { firebase_uid: decoded.uid },
        });

        if (!user && decoded.email) {
            user = await prisma.users.findUnique({
                where: { email: decoded.email },
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
    const { firebaseUid, email, pseudo } = req.body;

    try {
        if (!firebaseUid || !email || !pseudo) {
            return res.status(400).json({ error: "firebaseUid, email, pseudo are required" });
        }

        // Upsert by email: keeps DB in sync with Firebase as source of truth.
        const user = await prisma.users.upsert({
            where: { email },
            update: {
                firebase_uid: firebaseUid,
                pseudo,
            },
            create: {
                firebase_uid: firebaseUid,
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

        return res.json({ success: true, user });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Sync error" });
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
