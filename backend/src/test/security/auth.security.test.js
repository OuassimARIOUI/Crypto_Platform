import { describe, it, expect, vi, beforeEach } from "vitest";
import { auth, adminOnly } from "../../middleware/auth.js";

const { verifyIdTokenMock, prismaMock } = vi.hoisted(() => ({
    verifyIdTokenMock: vi.fn(),
    prismaMock: {
        users: {
            findUnique: vi.fn(),
            upsert: vi.fn(),
        },
        portfolios: {
            upsert: vi.fn(),
        },
    },
}));

vi.mock("../../services/firebaseAdmin.js", () => ({
    default: {
        auth: () => ({
            verifyIdToken: verifyIdTokenMock,
        }),
    },
}));

vi.mock("../../services/dbService.js", () => ({
    prisma: prismaMock,
}));

describe("Security - Authentication", () => {
    let req, res, next;

    beforeEach(() => {
        req = { headers: {} };
        res = {
            status: vi.fn().mockReturnThis(),
            json: vi.fn(),
        };
        next = vi.fn();
        vi.clearAllMocks();
    });

    describe("Token Validation", () => {
        it("should reject request without authorization header", async () => {
            await auth(req, res, next);
            
            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({ error: "Token manquant" });
            expect(next).not.toHaveBeenCalled();
        });

        it("should reject malformed authorization header", async () => {
            req.headers.authorization = "InvalidFormat";
            
            await auth(req, res, next);
            
            expect(res.status).toHaveBeenCalledWith(401);
        });

        it("should reject empty bearer token", async () => {
            req.headers.authorization = "Bearer ";
            verifyIdTokenMock.mockRejectedValue(new Error("Invalid token"));
            
            await auth(req, res, next);
            
            expect(res.status).toHaveBeenCalledWith(401);
        });

        it("should reject expired token", async () => {
            req.headers.authorization = "Bearer expired_token";
            verifyIdTokenMock.mockRejectedValue(new Error("auth/id-token-expired"));
            
            await auth(req, res, next);
            
            expect(res.status).toHaveBeenCalledWith(401);
            expect(next).not.toHaveBeenCalled();
        });

        it("should reject revoked token", async () => {
            req.headers.authorization = "Bearer revoked_token";
            verifyIdTokenMock.mockRejectedValue(new Error("auth/id-token-revoked"));
            
            await auth(req, res, next);
            
            expect(res.status).toHaveBeenCalledWith(401);
        });

        it("should reject tampered token", async () => {
            req.headers.authorization = "Bearer tampered.token.here";
            verifyIdTokenMock.mockRejectedValue(new Error("Invalid signature"));
            
            await auth(req, res, next);
            
            expect(res.status).toHaveBeenCalledWith(401);
        });
    });

    describe("SQL Injection Prevention", () => {
        it("should safely handle malicious email in token", async () => {
            req.headers.authorization = "Bearer valid_token";
            const maliciousEmail = "admin'--";
            
            verifyIdTokenMock.mockResolvedValue({
                uid: "uid123",
                email: maliciousEmail,
            });
            
            prismaMock.users.findUnique.mockResolvedValue(null);
            
            await auth(req, res, next);
            
            expect(prismaMock.users.findUnique).toHaveBeenCalledWith({
                where: { firebase_uid: "uid123" },
            });
        });

        it("should handle SQL injection patterns in uid", async () => {
            req.headers.authorization = "Bearer valid_token";
            const maliciousUid = "uid'; DROP TABLE users; --";
            
            verifyIdTokenMock.mockResolvedValue({
                uid: maliciousUid,
                email: "test@mail.com",
            });
            
            prismaMock.users.findUnique.mockResolvedValue(null);
            
            await auth(req, res, next);
            
            expect(prismaMock.users.findUnique).toHaveBeenCalledWith({
                where: { firebase_uid: maliciousUid },
            });
        });
    });

    describe("Authorization Bypass Attempts", () => {
        it("should not allow role escalation via token manipulation", async () => {
            req.headers.authorization = "Bearer valid_token";
            
            verifyIdTokenMock.mockResolvedValue({
                uid: "uid123",
                email: "user@mail.com",
                role: "admin",
            });
            
            const mockUser = {
                id: 1,
                role: "user",
                status: "active",
                firebase_uid: "uid123",
            };
            
            prismaMock.users.findUnique.mockResolvedValue(mockUser);
            
            await auth(req, res, next);
            
            expect(req.dbUser.role).toBe("user");
        });

        it("should block admin access for non-admin users", () => {
            req.dbUser = { role: "user" };
            req.user = { role: "user" };
            
            adminOnly(req, res, next);
            
            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith({ error: "Accès refusé" });
            expect(next).not.toHaveBeenCalled();
        });

        it("should block moderator from admin-only endpoints", () => {
            req.dbUser = { role: "moderator" };
            req.user = { role: "moderator" };
            
            adminOnly(req, res, next);
            
            expect(res.status).toHaveBeenCalledWith(403);
        });
    });

    describe("Session Security", () => {
        it("should validate user still exists in database", async () => {
            req.headers.authorization = "Bearer valid_token";
            
            verifyIdTokenMock.mockResolvedValue({
                uid: "deleted_user_uid",
                email: "deleted@mail.com",
            });
            
            prismaMock.users.findUnique.mockResolvedValue(null);
            
            await auth(req, res, next);
            
            expect(res.status).toHaveBeenCalledWith(401);
        });

        it("should attach correct user data to request", async () => {
            req.headers.authorization = "Bearer valid_token";
            
            const mockDecoded = {
                uid: "uid123",
                email: "user@mail.com",
            };
            
            const mockUser = {
                id: 1,
                firebase_uid: "uid123",
                email: "user@mail.com",
                role: "user",
                status: "active",
            };
            
            verifyIdTokenMock.mockResolvedValue(mockDecoded);
            prismaMock.users.findUnique.mockResolvedValue(mockUser);
            
            await auth(req, res, next);
            
            expect(req.user).toEqual(mockDecoded);
            expect(req.dbUser).toEqual(mockUser);
            expect(req.userId).toBe(1);
            expect(next).toHaveBeenCalled();
        });
    });

    describe("Performance Mode Bypass Security", () => {
        it("should reject perf bypass in production", async () => {
            const originalEnv = process.env.NODE_ENV;
            const originalPerfTest = process.env.PERF_TEST;
            
            process.env.NODE_ENV = "production";
            process.env.PERF_TEST = "true";
            req.headers.authorization = "Bearer perf_test_token";
            
            verifyIdTokenMock.mockRejectedValue(new Error("Invalid token"));
            
            await auth(req, res, next);
            
            expect(res.status).toHaveBeenCalledWith(401);
            
            process.env.NODE_ENV = originalEnv;
            process.env.PERF_TEST = originalPerfTest;
        });

        it("should only allow perf bypass with correct token", async () => {
            const originalEnv = process.env.NODE_ENV;
            const originalPerfTest = process.env.PERF_TEST;
            
            process.env.NODE_ENV = "test";
            process.env.PERF_TEST = "true";
            process.env.PERF_TEST_TOKEN = "secret_perf_token";
            req.headers.authorization = "Bearer wrong_token";
            
            verifyIdTokenMock.mockRejectedValue(new Error("Invalid token"));
            
            await auth(req, res, next);
            
            expect(res.status).toHaveBeenCalledWith(401);
            
            process.env.NODE_ENV = originalEnv;
            process.env.PERF_TEST = originalPerfTest;
        });
    });
});
