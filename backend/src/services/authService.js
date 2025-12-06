import { prisma } from "./dbService.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export async function register(email, password , pseudo) {
    const hashed = await bcrypt.hash(password, 10);

    const user = await prisma.users.create({
        data: { email, password: hashed, pseudo }
    });

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
