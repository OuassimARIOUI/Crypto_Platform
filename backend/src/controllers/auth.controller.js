import { register, login } from "../services/authService.js";
import { logError, logInfo } from "../utils/logger.js";

export async function registerController(req, res) {
    const { email, password, pseudo } = req.body;

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

    try {
        const result = await login(email, password);

        if (!result) {
            return res.status(400).json({ error: "Identifiants incorrects" });
        }


        res.cookie("token", result.token, {
            httpOnly: true,
            secure: false,
            sameSite: "lax",
            maxAge: 7 * 24 * 60 * 60 * 1000
        });
        logInfo(`User login: ${email}`);
        return res.json({
            success: true,
            user: result.user
        });

    } catch (err) {
        console.error("LOGIN ERROR =>", err);
        return res.status(500).json({ error: "Erreur serveur" });
    }
}

export function logoutController(req, res) {
    res.clearCookie("token");
    return res.json({ success: true });
}
