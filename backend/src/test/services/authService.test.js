import { describe, it, expect, vi } from "vitest";

import { register, login } from "../../services/authService.js";
import { prisma } from "../../services/dbService.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

//  MOCKS
vi.mock("../services/dbService.js", () => ({
    prisma: {
        users: {
            create: vi.fn(),
            findUnique: vi.fn(),
        },
        portfolios: {
            create: vi.fn(),
        },
    },
}));

vi.mock("bcryptjs");
vi.mock("jsonwebtoken");

describe("AuthService Tests", () => {

    // -----------------------------------------
    // TEST REGISTER
    // -----------------------------------------
    describe("register()", () => {
        it("crée un utilisateur + un portefeuille", async () => {
            bcrypt.hash.mockResolvedValue("hashed123");

            prisma.users.create.mockResolvedValue({
                id: 1,
                email: "test@mail.com",
                pseudo: "youssef",
                password: "hashed123"
            });

            prisma.portfolios.create.mockResolvedValue({
                id: 1,
                user_id: 1,
                balance: 0
            });

            const result = await register("test@mail.com", "password", "youssef");

            expect(bcrypt.hash).toHaveBeenCalled();
            expect(prisma.users.create).toHaveBeenCalledWith({
                data: {
                    email: "test@mail.com",
                    password: "hashed123",
                    pseudo: "youssef",
                },
            });

            expect(prisma.portfolios.create).toHaveBeenCalledWith({
                data: { user_id: 1, balance: 0 },
            });

            expect(result.email).toBe("test@mail.com");
        });
    });

    // -----------------------------------------
    // TEST LOGIN
    // -----------------------------------------
    describe("login()", () => {

        it("retourne null si l'utilisateur n'existe pas", async () => {
            prisma.users.findUnique.mockResolvedValue(null);

            const result = await login("notfound@mail.com", "pass");

            expect(result).toBeNull();
        });

        it("retourne null si le mot de passe ne correspond pas", async () => {
            prisma.users.findUnique.mockResolvedValue({
                id: 10,
                email: "test@mail.com",
                password: "hash"
            });

            bcrypt.compare.mockResolvedValue(false);

            const result = await login("test@mail.com", "wrong");

            expect(result).toBeNull();
        });

        it("retourne un token + user si OK", async () => {
            const fakeUser = {
                id: 10,
                email: "test@mail.com",
                role: "user",
                password: "hash"
            };

            prisma.users.findUnique.mockResolvedValue(fakeUser);
            bcrypt.compare.mockResolvedValue(true);
            jwt.sign.mockReturnValue("FAKE_JWT_TOKEN");

            const result = await login("test@mail.com", "password");

            expect(result).toHaveProperty("token");
            expect(result.token).toBe("FAKE_JWT_TOKEN");
            expect(result.user).toEqual(fakeUser);
        });

    });

});
