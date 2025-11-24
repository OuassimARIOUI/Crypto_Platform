import { register, login } from "../services/authService.js";
import { logError, logInfo } from "../utils/logger.js";
import jwt from "jsonwebtoken";
import {prisma} from "../services/dbService.js";

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
        return res.status(401).json({ error: "Invalid token" });
    }
}

