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

