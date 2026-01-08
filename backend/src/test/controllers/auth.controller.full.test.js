import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock dependencies
vi.mock("../../services/authService.js", () => ({
    register: vi.fn(),
    login: vi.fn(),
    sendResetEmail: vi.fn(),
    updatePasswordWithGoogle: vi.fn(),
    validatePseudoForRegistration: vi.fn(),
    assertPseudoAvailable: vi.fn(),
}));

vi.mock("../../services/firebaseAdmin.js", () => ({
    default: {
        auth: vi.fn(() => ({
            verifyIdToken: vi.fn(),
        })),
    },
}));

vi.mock("../../services/dbService.js", () => ({
    prisma: {
        users: {
            findUnique: vi.fn(),
            upsert: vi.fn(),
            update: vi.fn(),
        },
        portfolios: {
            upsert: vi.fn(),
        },
    },
}));

vi.mock("../../utils/logger.js", () => ({
    logError: vi.fn(),
    logInfo: vi.fn(),
}));

vi.mock("jsonwebtoken", () => ({
    default: {
        verify: vi.fn(),
    },
}));

import {
    registerController,
    pseudoAvailabilityController,
    loginController,
    meController,
    resetPasswordController,
    updatePasswordController,
    firebaseSyncController,
    loginFirebase,
    updateMeController,
} from "../../controllers/auth.controller.js";
import { register, login, sendResetEmail, updatePasswordWithGoogle, validatePseudoForRegistration, assertPseudoAvailable } from "../../services/authService.js";
import admin from "../../services/firebaseAdmin.js";
import { prisma } from "../../services/dbService.js";
import jwt from "jsonwebtoken";
import { logInfo } from "../../utils/logger.js";

describe("auth.controller - Full Coverage", () => {
    let req, res;

    beforeEach(() => {
        vi.clearAllMocks();

        req = {
            body: {},
            query: {},
            headers: {},
            userId: 1,
        };

        res = {
            status: vi.fn().mockReturnThis(),
            json: vi.fn(),
        };
    });

    describe("registerController", () => {
        it("registers user successfully", async () => {
            req.body = { email: "test@example.com", password: "password123", pseudo: "testuser" };
            const mockUser = { id: 1, email: "test@example.com", pseudo: "testuser" };
            register.mockResolvedValue(mockUser);

            await registerController(req, res);

            expect(register).toHaveBeenCalledWith("test@example.com", "password123", "testuser");
            expect(res.json).toHaveBeenCalledWith({ success: true, user: mockUser });
        });

        it("returns error with status code from error", async () => {
            req.body = { email: "test@example.com", password: "short", pseudo: "test" };
            const error = new Error("Password too short");
            error.status = 400;
            register.mockRejectedValue(error);

            await registerController(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ error: "Password too short" });
        });

        it("returns 500 for errors without status", async () => {
            req.body = { email: "test@example.com", password: "password", pseudo: "test" };
            register.mockRejectedValue(new Error("Database error"));

            await registerController(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
        });

        it("returns generic error when error has no message", async () => {
            req.body = { email: "test@example.com", password: "password", pseudo: "test" };
            register.mockRejectedValue({});

            await registerController(req, res);

            expect(res.json).toHaveBeenCalledWith({ error: "Erreur serveur" });
        });
    });

    describe("pseudoAvailabilityController", () => {
        it("returns valid and available for valid pseudo", async () => {
            req.query = { pseudo: "validpseudo" };
            assertPseudoAvailable.mockResolvedValue();

            await pseudoAvailabilityController(req, res);

            expect(res.json).toHaveBeenCalledWith({ valid: true, available: true });
        });

        it("returns 400 for invalid pseudo format", async () => {
            req.query = { pseudo: "ab" };
            const error = new Error("Pseudo too short");
            error.status = 400;
            assertPseudoAvailable.mockRejectedValue(error);

            await pseudoAvailabilityController(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ valid: false, available: false, error: "Pseudo too short" });
        });

        it("returns 409 for taken pseudo", async () => {
            req.query = { pseudo: "takenpseudo" };
            const error = new Error("Pseudo already taken");
            error.status = 409;
            assertPseudoAvailable.mockRejectedValue(error);

            await pseudoAvailabilityController(req, res);

            expect(res.status).toHaveBeenCalledWith(409);
            expect(res.json).toHaveBeenCalledWith({ valid: true, available: false, error: "Pseudo already taken" });
        });

        it("returns 500 for other errors", async () => {
            req.query = { pseudo: "test" };
            assertPseudoAvailable.mockRejectedValue(new Error("Database error"));

            await pseudoAvailabilityController(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
        });

        it("handles empty pseudo", async () => {
            req.query = {};
            assertPseudoAvailable.mockResolvedValue();

            await pseudoAvailabilityController(req, res);

            expect(assertPseudoAvailable).toHaveBeenCalledWith("");
        });
    });

    describe("loginController", () => {
        it("returns user on successful login", async () => {
            req.body = { email: "test@example.com", password: "password123" };
            const mockResult = { user: { id: 1 }, token: "jwt-token" };
            login.mockResolvedValue(mockResult);

            await loginController(req, res);

            expect(login).toHaveBeenCalledWith("test@example.com", "password123");
            expect(res.json).toHaveBeenCalledWith(mockResult);
        });

        it("returns 400 for invalid credentials", async () => {
            req.body = { email: "test@example.com", password: "wrong" };
            login.mockResolvedValue(null);

            await loginController(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ error: "Identifiants incorrects" });
        });

        it("returns 500 on error", async () => {
            req.body = { email: "test@example.com", password: "password" };
            login.mockRejectedValue(new Error("Database error"));

            await loginController(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ error: "Erreur serveur" });
        });
    });

    describe("meController", () => {
        it("returns 401 when no token provided", async () => {
            req.headers = {};

            await meController(req, res);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({ error: "No token" });
        });

        it("returns user from JWT token", async () => {
            req.headers = { authorization: "Bearer jwt-token" };
            jwt.verify.mockReturnValue({ id: 1 });
            const mockUser = { id: 1, pseudo: "testuser", email: "test@test.com", role: "user" };
            prisma.users.findUnique.mockResolvedValue(mockUser);

            await meController(req, res);

            expect(jwt.verify).toHaveBeenCalledWith("jwt-token", process.env.JWT_SECRET);
            expect(res.json).toHaveBeenCalledWith(mockUser);
        });

        it("falls back to Firebase token when JWT fails", async () => {
            req.headers = { authorization: "Bearer firebase-token" };
            jwt.verify.mockImplementation(() => {
                throw new Error("Invalid JWT");
            });
            admin.auth.mockReturnValue({
                verifyIdToken: vi.fn().mockResolvedValue({ uid: "firebase-uid", email: "test@test.com" }),
            });
            const mockUser = { id: 1, firebase_uid: "firebase-uid", pseudo: "testuser" };
            prisma.users.findUnique.mockResolvedValue(mockUser);

            await meController(req, res);

            expect(res.json).toHaveBeenCalledWith(mockUser);
        });

        it("returns 404 when user not found", async () => {
            req.headers = { authorization: "Bearer firebase-token" };
            jwt.verify.mockImplementation(() => {
                throw new Error("Invalid JWT");
            });
            admin.auth.mockReturnValue({
                verifyIdToken: vi.fn().mockResolvedValue({ uid: "firebase-uid", email: "test@test.com" }),
            });
            prisma.users.findUnique.mockResolvedValue(null);

            await meController(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ error: "User not found" });
        });

        it("returns 401 when both JWT and Firebase token fail", async () => {
            req.headers = { authorization: "Bearer invalid-token" };
            jwt.verify.mockImplementation(() => {
                throw new Error("Invalid JWT");
            });
            admin.auth.mockReturnValue({
                verifyIdToken: vi.fn().mockRejectedValue(new Error("Invalid Firebase token")),
            });

            await meController(req, res);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({ error: "Invalid token" });
        });
    });

    describe("resetPasswordController", () => {
        it("returns 400 when email is missing", async () => {
            req.body = {};

            await resetPasswordController(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ error: "Email required" });
        });

        it("sends reset email successfully", async () => {
            req.body = { email: "test@example.com" };
            sendResetEmail.mockResolvedValue({ success: true });

            await resetPasswordController(req, res);

            expect(sendResetEmail).toHaveBeenCalledWith("test@example.com");
            expect(logInfo).toHaveBeenCalled();
            expect(res.json).toHaveBeenCalledWith({ success: true, message: "Reset link sent" });
        });

        it("returns 500 on error", async () => {
            req.body = { email: "test@example.com" };
            sendResetEmail.mockRejectedValue(new Error("Email service error"));

            await resetPasswordController(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ error: "Email service error" });
        });
    });

    describe("updatePasswordController", () => {
        it("returns 400 when oobCode is missing", async () => {
            req.body = { newPassword: "newpass123" };

            await updatePasswordController(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ error: "oobCode and password are required" });
        });

        it("returns 400 when newPassword is missing", async () => {
            req.body = { oobCode: "code123" };

            await updatePasswordController(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
        });

        it("updates password successfully", async () => {
            req.body = { oobCode: "code123", newPassword: "newpass123" };
            updatePasswordWithGoogle.mockResolvedValue({ success: true });

            await updatePasswordController(req, res);

            expect(updatePasswordWithGoogle).toHaveBeenCalledWith("code123", "newpass123");
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                message: "Password updated successfully",
                result: { success: true },
            });
        });

        it("returns 500 on error", async () => {
            req.body = { oobCode: "invalid", newPassword: "newpass123" };
            updatePasswordWithGoogle.mockRejectedValue(new Error("Invalid code"));

            await updatePasswordController(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ error: "Invalid code" });
        });
    });

    describe("firebaseSyncController", () => {
        it("returns 400 when required fields are missing", async () => {
            req.body = { firebaseUid: "uid" };

            await firebaseSyncController(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ error: "firebaseUid, email, pseudo are required" });
        });

        it("syncs user successfully", async () => {
            req.body = { firebaseUid: "uid123", email: "test@test.com", pseudo: "testuser" };
            validatePseudoForRegistration.mockReturnValue("testuser");
            prisma.users.findUnique.mockResolvedValue(null);
            assertPseudoAvailable.mockResolvedValue();
            prisma.users.upsert.mockResolvedValue({ id: 1, firebase_uid: "uid123", email: "test@test.com" });
            prisma.portfolios.upsert.mockResolvedValue({});

            await firebaseSyncController(req, res);

            expect(res.json).toHaveBeenCalledWith({ success: true, user: expect.any(Object) });
        });

        it("handles P2002 error on pseudo", async () => {
            req.body = { firebaseUid: "uid123", email: "test@test.com", pseudo: "taken" };
            validatePseudoForRegistration.mockReturnValue("taken");
            prisma.users.findUnique.mockResolvedValue(null);
            assertPseudoAvailable.mockResolvedValue();
            const p2002Error = new Error("Unique constraint violation");
            p2002Error.code = "P2002";
            p2002Error.meta = { target: ["pseudo"] };
            prisma.users.upsert.mockRejectedValue(p2002Error);

            await firebaseSyncController(req, res);

            expect(res.status).toHaveBeenCalledWith(409);
            expect(res.json).toHaveBeenCalledWith({ error: "Ce pseudo existe déjà" });
        });

        it("handles P2002 error on email", async () => {
            req.body = { firebaseUid: "uid123", email: "taken@test.com", pseudo: "testuser" };
            validatePseudoForRegistration.mockReturnValue("testuser");
            prisma.users.findUnique.mockResolvedValue(null);
            assertPseudoAvailable.mockResolvedValue();
            const p2002Error = new Error("Unique constraint violation");
            p2002Error.code = "P2002";
            p2002Error.meta = { target: ["email"] };
            prisma.users.upsert.mockRejectedValue(p2002Error);

            await firebaseSyncController(req, res);

            expect(res.status).toHaveBeenCalledWith(409);
            expect(res.json).toHaveBeenCalledWith({ error: "Cet email existe déjà" });
        });
    });

    describe("loginFirebase", () => {
        it("returns 400 when token is missing", async () => {
            req.body = {};

            await loginFirebase(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ error: "Token required" });
        });

        it("returns user for existing firebase user", async () => {
            req.body = { token: "firebase-token" };
            admin.auth.mockReturnValue({
                verifyIdToken: vi.fn().mockResolvedValue({ uid: "uid123", email: "test@test.com" }),
            });
            prisma.users.findUnique.mockResolvedValue({ id: 1, firebase_uid: "uid123" });

            await loginFirebase(req, res);

            expect(res.json).toHaveBeenCalledWith({ success: true, user: expect.any(Object) });
        });

        it("creates new user if not exists", async () => {
            req.body = { token: "firebase-token" };
            admin.auth.mockReturnValue({
                verifyIdToken: vi.fn().mockResolvedValue({ uid: "uid123", email: "test@test.com", name: "Test" }),
            });
            prisma.users.findUnique.mockResolvedValue(null);
            prisma.users.upsert.mockResolvedValue({ id: 1, firebase_uid: "uid123", pseudo: "Test_uid123" });
            prisma.portfolios.upsert.mockResolvedValue({});

            await loginFirebase(req, res);

            expect(prisma.users.upsert).toHaveBeenCalled();
            expect(res.json).toHaveBeenCalledWith({ success: true, user: expect.any(Object) });
        });

        it("returns 401 for invalid token", async () => {
            req.body = { token: "invalid-token" };
            admin.auth.mockReturnValue({
                verifyIdToken: vi.fn().mockRejectedValue(new Error("Invalid token")),
            });

            await loginFirebase(req, res);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({ error: "Invalid token" });
        });
    });

    describe("updateMeController", () => {
        it("returns 400 when no updatable fields provided", async () => {
            req.body = {};

            await updateMeController(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ error: "No updatable fields provided" });
        });

        it("updates pseudo successfully", async () => {
            req.body = { pseudo: "newpseudo" };
            prisma.users.update.mockResolvedValue({ id: 1, pseudo: "newpseudo" });

            await updateMeController(req, res);

            expect(prisma.users.update).toHaveBeenCalledWith({
                where: { id: 1 },
                data: { pseudo: "newpseudo" },
            });
            expect(res.json).toHaveBeenCalledWith({ success: true, user: expect.any(Object) });
        });

        it("updates discord username", async () => {
            req.body = { discordUsername: "DiscordUser#1234" };
            prisma.users.update.mockResolvedValue({ id: 1, discord_username: "DiscordUser#1234" });

            await updateMeController(req, res);

            expect(prisma.users.update).toHaveBeenCalledWith({
                where: { id: 1 },
                data: { discord_username: "DiscordUser#1234" },
            });
        });

        it("sets discord_username to null for empty string", async () => {
            req.body = { discordUsername: "" };
            prisma.users.update.mockResolvedValue({ id: 1, discord_username: null });

            await updateMeController(req, res);

            expect(prisma.users.update).toHaveBeenCalledWith({
                where: { id: 1 },
                data: { discord_username: null },
            });
        });

        it("returns 500 on error", async () => {
            req.body = { pseudo: "newpseudo" };
            prisma.users.update.mockRejectedValue(new Error("Database error"));

            await updateMeController(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ error: "Database error" });
        });
    });
});
