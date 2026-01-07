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

describe("Sécurité - Authentification", () => {
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

    describe("Validation du token", () => {
        it("devrait rejeter une requête sans en-tête d'autorisation", async () => {
            await auth(req, res, next);
            
            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({ error: "Token manquant" });
            expect(next).not.toHaveBeenCalled();
        });

        it("devrait rejeter un en-tête d'autorisation mal formé", async () => {
            req.headers.authorization = "InvalidFormat";
            
            await auth(req, res, next);
            
            expect(res.status).toHaveBeenCalledWith(401);
        });

        it("devrait rejeter un token bearer vide", async () => {
            req.headers.authorization = "Bearer ";
            verifyIdTokenMock.mockRejectedValue(new Error("Invalid token"));
            
            await auth(req, res, next);
            
            expect(res.status).toHaveBeenCalledWith(401);
        });

        it("devrait rejeter un token expiré", async () => {
            req.headers.authorization = "Bearer expired_token";
            verifyIdTokenMock.mockRejectedValue(new Error("auth/id-token-expired"));
            
            await auth(req, res, next);
            
            expect(res.status).toHaveBeenCalledWith(401);
            expect(next).not.toHaveBeenCalled();
        });

        it("devrait rejeter un token révoqué", async () => {
            req.headers.authorization = "Bearer revoked_token";
            verifyIdTokenMock.mockRejectedValue(new Error("auth/id-token-revoked"));
            
            await auth(req, res, next);
            
            expect(res.status).toHaveBeenCalledWith(401);
        });

        it("devrait rejeter un token modifié", async () => {
            req.headers.authorization = "Bearer tampered.token.here";
            verifyIdTokenMock.mockRejectedValue(new Error("Invalid signature"));
            
            await auth(req, res, next);
            
            expect(res.status).toHaveBeenCalledWith(401);
        });
    });

    describe("Prévention de l'injection SQL", () => {
        it("devrait gérer en toute sécurité un email malveillant dans le token", async () => {
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

        it("devrait gérer les modèles d'injection SQL dans l'uid", async () => {
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

    describe("Tentatives de contournement d'autorisation", () => {
        it("ne devrait pas permettre l'élévation de rôle via manipulation du token", async () => {
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

        it("devrait bloquer l'accès admin pour les utilisateurs non-admin", () => {
            req.dbUser = { role: "user" };
            req.user = { role: "user" };
            
            adminOnly(req, res, next);
            
            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith({ error: "Accès refusé" });
            expect(next).not.toHaveBeenCalled();
        });

        it("devrait bloquer un modérateur des endpoints réservés aux admins", () => {
            req.dbUser = { role: "moderator" };
            req.user = { role: "moderator" };
            
            adminOnly(req, res, next);
            
            expect(res.status).toHaveBeenCalledWith(403);
        });
    });

    describe("Sécurité des sessions", () => {
        it("devrait valider que l'utilisateur existe toujours dans la base de données", async () => {
            req.headers.authorization = "Bearer valid_token";
            
            verifyIdTokenMock.mockResolvedValue({
                uid: "deleted_user_uid",
                email: "deleted@mail.com",
            });
            
            prismaMock.users.findUnique.mockResolvedValue(null);
            
            await auth(req, res, next);
            
            // Expecting 404 when user doesn't exist in database
            expect(res.status).toHaveBeenCalledWith(404);
        });

        it("devrait attacher les données utilisateur correctes à la requête", async () => {
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

    describe("Sécurité du contournement en mode performance", () => {
        it("devrait rejeter le contournement perf en production", async () => {
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

        it("devrait autoriser le contournement perf uniquement avec le token correct", async () => {
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
