import { describe, it, expect, vi, beforeEach } from "vitest";

import { registerController, loginController, meController } from "../../controllers/auth.controller.js";
import { register, login } from "../../services/authService.js";
import { logError, logInfo } from "../../utils/logger.js";
import jwt from "jsonwebtoken";
import { prisma } from "../../services/dbService.js";

vi.mock("../../services/firebaseAdmin.js", () => ({
    default: {
        auth: () => ({
            verifyIdToken: vi.fn().mockRejectedValue(new Error("Invalid token"))
        })
    }
}));

// Mock des dépendances
vi.mock("../../services/authService.js", () => ({
    register: vi.fn(),
    login: vi.fn()
}));

vi.mock("../../utils/logger.js", () => ({
    logError: vi.fn(),
    logInfo: vi.fn()
}));

vi.mock("jsonwebtoken", () => ({
    default: {
        verify: vi.fn()
    }
}));

vi.mock("../../services/dbService.js", () => ({
    prisma: {
        users: {
            findUnique: vi.fn()
        }
    }
}));

describe("Auth Controllers", () => {

    let req, res;

    beforeEach(() => {
        vi.clearAllMocks();

        req = { body: {}, headers: {} };

        res = {
            status: vi.fn().mockReturnThis(),
            json: vi.fn()
        };
    });

    //
    // -----------------------------
    // registerController
    // -----------------------------
    //
    describe("registerController", () => {

        it("should register a user and return success", async () => {
            req.body = { email: "test@mail.com", password: "1234", pseudo: "achraf" };

            const mockUser = { id: 1, email: "test@mail.com", pseudo: "achraf" };
            register.mockResolvedValue(mockUser);

            await registerController(req, res);

            expect(register).toHaveBeenCalledWith("test@mail.com", "1234", "achraf");
            expect(logInfo).toHaveBeenCalledWith("User registered: achraf");
            expect(res.json).toHaveBeenCalledWith({ success: true, user: mockUser });
        });

        it("should handle register errors", async () => {
            req.body = { email: "x@mail.com", password: "1234", pseudo: "achraf" };

            register.mockRejectedValue(new Error("DB error"));

            await registerController(req, res);

            expect(logError).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ error: "DB error" });
        });

    });

    //
    // -----------------------------
    // loginController
    // -----------------------------
    //
    describe("loginController", () => {

        it("should login successfully", async () => {
            req.body = { email: "test@mail.com", password: "1234" };

            const mockResult = { token: "abc", user: { id: 1 } };
            login.mockResolvedValue(mockResult);

            await loginController(req, res);

            expect(login).toHaveBeenCalledWith("test@mail.com", "1234");
            expect(logInfo).toHaveBeenCalledWith("User login: test@mail.com");
            expect(res.json).toHaveBeenCalledWith(mockResult);
        });

        it("should return 400 for invalid credentials", async () => {
            req.body = { email: "wrong@mail.com", password: "bad" };

            login.mockResolvedValue(null);

            await loginController(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ error: "Identifiants incorrects" });
        });

        it("should handle login errors", async () => {
            req.body = { email: "test@mail.com", password: "1234" };

            login.mockRejectedValue(new Error("DB down"));

            await loginController(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ error: "Erreur serveur" });
        });

    });

    //
    // -----------------------------
    // meController
    // -----------------------------
    //
    describe("meController", () => {

        it("should return 401 if no token", async () => {
            req.headers = {};

            await meController(req, res);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({ error: "No token" });
        });

        it("should return 401 if token invalid", async () => {
            req.headers.authorization = "Bearer invalid";

            jwt.verify.mockImplementation(() => { throw new Error("Invalid token"); });

            await meController(req, res);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({ error: "Invalid token" });
        });

        it("should return user data if token is valid", async () => {
            req.headers.authorization = "Bearer validtoken";

            jwt.verify.mockReturnValue({ id: 1 });

            const mockUser = { id: 1, email: "test@mail.com" };
            prisma.users.findUnique.mockResolvedValue(mockUser);

            await meController(req, res);

            expect(prisma.users.findUnique).toHaveBeenCalledWith(
                expect.objectContaining({ where: { id: 1 } })
            );
            expect(res.json).toHaveBeenCalledWith(mockUser);
        });

    });

});
