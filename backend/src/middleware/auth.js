import jwt from "jsonwebtoken";
import admin from "../services/firebaseAdmin.js";


export async function auth(req, res, next) {
    const header = req.headers.authorization;

    if (!header) return res.status(401).json({ error: "Token manquant" });

    const token = header.split(" ")[1];

    try {
        const decoded = await admin.auth().verifyIdToken(token);
        req.user = decoded;
        next();
    } catch (err) {
        console.log("AUTH ERROR:", err);
        return res.status(401).json({ error: "Token invalide" });
    }
}

export function adminOnly(req, res, next) {
    if (req.user.role !== "admin")
        return res.status(403).json({ error: "Accès refusé" });

    next();
}

