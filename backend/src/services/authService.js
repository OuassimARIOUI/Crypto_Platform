import { prisma } from "./dbService.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

function createHttpError(status, message) {
    const err = new Error(message);
    err.status = status;
    return err;
}

function normalizePseudo(pseudo) {
    return (pseudo ?? "").toString().trim();
}

function validatePseudoFormatOrThrow(pseudo) {
    const value = normalizePseudo(pseudo);
    if (!value) {
        throw createHttpError(400, "Pseudo requis");
    }

    if (!/^[A-Za-z0-9]+$/.test(value)) {
        throw createHttpError(400, "Pseudo invalide: uniquement lettres et chiffres");
    }

    if (value.length < 6) {
        throw createHttpError(400, "Pseudo invalide: minimum 6 caractères");
    }

    const letters = (value.match(/[A-Za-z]/g) || []).length;
    const digits = (value.match(/[0-9]/g) || []).length;
    if (letters < 3 || digits < 3) {
        throw createHttpError(400, "Pseudo invalide: minimum 3 lettres et 3 chiffres (ex: abc123)");
    }

    return value;
}

export function validatePseudoForRegistration(pseudo) {
    return validatePseudoFormatOrThrow(pseudo);
}

export async function assertPseudoAvailable(pseudo, { exceptUserId } = {}) {
    const normalized = validatePseudoFormatOrThrow(pseudo);

    const existing = await prisma.users.findFirst({
        where: {
            pseudo: {
                equals: normalized,
                mode: "insensitive",
            },
        },
        select: { id: true },
    });

    if (existing && (!exceptUserId || existing.id !== exceptUserId)) {
        throw createHttpError(409, "Ce pseudo existe déjà");
    }

    return normalized;
}

export async function register(email, password , pseudo) {
    const normalizedPseudo = await assertPseudoAvailable(pseudo);
    const hashed = await bcrypt.hash(password, 10);

    let user;
    try {
        user = await prisma.users.create({
            data: { email, password: hashed, pseudo: normalizedPseudo }
        });
    } catch (err) {
        if (err?.code === "P2002") {
            const target = Array.isArray(err?.meta?.target) ? err.meta.target.join(",") : String(err?.meta?.target || "");
            if (target.includes("pseudo")) throw createHttpError(409, "Ce pseudo existe déjà");
            if (target.includes("email")) throw createHttpError(409, "Cet email existe déjà");
            throw createHttpError(409, "Conflit: données déjà utilisées");
        }
        throw err;
    }

    await prisma.portfolios.create({
        data: { user_id: user.id, balance: 0 }
    });

    return user;
}

export async function login(email, password) {
    const user = await prisma.users.findUnique({
        where: { email }
    });

    if (!user) return null;
    if (!user.password) return null;

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return null;

    const token = jwt.sign(
        { id: user.id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: "2h" }
    );

    return { token, user };
}

export async function sendResetEmail(email) {
    const API_GOOGLE_KEY = process.env.API_GOOGLE_KEY;

    const payload = {
        requestType: "PASSWORD_RESET",
        email
    };

    const response = await fetch(
        `https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key=${API_GOOGLE_KEY}`,
        {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        }
    );

    const data = await response.json();
    if (data.error) {
        throw new Error(data.error.message);
    }

    return data;
}

export async function updatePasswordWithGoogle(oobCode, newPassword) {
    const API_GOOGLE_KEY = process.env.API_GOOGLE_KEY;

    const payload = {
        oobCode,
        newPassword
    };

    const response = await fetch(
        `https://identitytoolkit.googleapis.com/v1/accounts:resetPassword?key=${API_GOOGLE_KEY}`,
        {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        }
    );

    const data = await response.json();

    if (data.error) {
        console.log("Firebase password reset error:", data.error);
        throw new Error(data.error.message);
    }

    return data;
}
