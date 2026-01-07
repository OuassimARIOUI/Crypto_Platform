import { describe, it, expect, vi, beforeEach } from "vitest";
import {
    normalizeAccountStatus,
    requireRole,
    requireCanTrade,
} from "../../middleware/accessControl.js";

const prismaMock = {
    users: {
        update: vi.fn(),
    },
};

vi.mock("../../services/dbService.js", () => ({
    prisma: prismaMock,
}));

describe("Security - Authorization", () => {
    let req, res, next;

    beforeEach(() => {
        req = { dbUser: null };
        res = {
            status: vi.fn().mockReturnThis(),
            json: vi.fn(),
        };
        next = vi.fn();
        vi.clearAllMocks();
    });

    describe("Account Status Enforcement", () => {
        it("should block banned user from trading", () => {
            req.dbUser = {
                id: 1,
                status: "banned",
                role: "user",
            };
            
            requireCanTrade(req, res, next);
            
            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith({
                error: "Account restricted",
                status: "banned",
            });
            expect(next).not.toHaveBeenCalled();
        });

        it("should block suspended user from trading", () => {
            req.dbUser = {
                id: 1,
                status: "suspended",
                role: "user",
            };
            
            requireCanTrade(req, res, next);
            
            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith({
                error: "Account restricted",
                status: "suspended",
            });
        });

        it("should allow active user to trade", () => {
            req.dbUser = {
                id: 1,
                status: "active",
                role: "user",
            };
            
            requireCanTrade(req, res, next);
            
            expect(next).toHaveBeenCalled();
            expect(res.status).not.toHaveBeenCalled();
        });

        it("should reject trading without authentication", () => {
            req.dbUser = null;
            
            requireCanTrade(req, res, next);
            
            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({ error: "Unauthorized" });
        });
    });

    describe("Role-Based Access Control", () => {
        it("should block user from admin-only route", () => {
            req.dbUser = { id: 1, role: "user" };
            const middleware = requireRole("admin");
            
            middleware(req, res, next);
            
            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith({ error: "Accès refusé" });
            expect(next).not.toHaveBeenCalled();
        });

        it("should allow admin to access admin route", () => {
            req.dbUser = { id: 1, role: "admin" };
            const middleware = requireRole("admin");
            
            middleware(req, res, next);
            
            expect(next).toHaveBeenCalled();
            expect(res.status).not.toHaveBeenCalled();
        });

        it("should allow moderator to access moderator or admin routes", () => {
            req.dbUser = { id: 1, role: "moderator" };
            const middleware = requireRole("moderator", "admin");
            
            middleware(req, res, next);
            
            expect(next).toHaveBeenCalled();
        });

        it("should block user from moderator routes", () => {
            req.dbUser = { id: 1, role: "user" };
            const middleware = requireRole("moderator", "admin");
            
            middleware(req, res, next);
            
            expect(res.status).toHaveBeenCalledWith(403);
        });

        it("should handle missing role gracefully", () => {
            req.dbUser = null;
            const middleware = requireRole("admin");
            
            middleware(req, res, next);
            
            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({ error: "Unauthorized" });
        });

        it("should not allow role escalation via parameter manipulation", () => {
            req.dbUser = { id: 1, role: "user" };
            req.query = { role: "admin" };
            req.body = { role: "admin" };
            
            const middleware = requireRole("admin");
            middleware(req, res, next);
            
            expect(res.status).toHaveBeenCalledWith(403);
        });
    });

    describe("Ban Expiration", () => {
        it("should unban user when ban period expires", async () => {
            const pastDate = new Date(Date.now() - 1000);
            req.dbUser = {
                id: 1,
                status: "banned",
                banned_until: pastDate,
                role: "user",
            };
            
            const updatedUser = {
                id: 1,
                status: "active",
                banned_until: null,
                role: "user",
            };
            
            prismaMock.users.update.mockResolvedValue(updatedUser);
            
            await normalizeAccountStatus(req, res, next);
            
            expect(prismaMock.users.update).toHaveBeenCalledWith({
                where: { id: 1 },
                data: {
                    status: "active",
                    banned_until: null,
                    banned_at: null,
                    ban_reason: null,
                    banned_by_id: null,
                },
            });
            expect(req.dbUser.status).toBe("active");
            expect(next).toHaveBeenCalled();
        });

        it("should keep user banned if ban not expired", async () => {
            const futureDate = new Date(Date.now() + 86400000);
            req.dbUser = {
                id: 1,
                status: "banned",
                banned_until: futureDate,
                role: "user",
            };
            
            await normalizeAccountStatus(req, res, next);
            
            expect(prismaMock.users.update).not.toHaveBeenCalled();
            expect(req.accountStatus).toBe("banned");
            expect(req.isBanned).toBe(true);
            expect(next).toHaveBeenCalled();
        });
    });

    describe("Security Edge Cases", () => {
        it("should handle array of roles properly", () => {
            req.dbUser = { id: 1, role: "admin" };
            const middleware = requireRole(["admin", "moderator"]);
            
            middleware(req, res, next);
            
            expect(next).toHaveBeenCalled();
        });

        it("should filter null roles from allowed list", () => {
            req.dbUser = { id: 1, role: "admin" };
            const middleware = requireRole("admin", null, undefined, "moderator");
            
            middleware(req, res, next);
            
            expect(next).toHaveBeenCalled();
        });

        it("should handle undefined dbUser gracefully", () => {
            req.dbUser = undefined;
            const middleware = requireRole("admin");
            
            middleware(req, res, next);
            
            expect(res.status).toHaveBeenCalledWith(401);
        });

        it("should attach security flags to request", async () => {
            req.dbUser = {
                id: 1,
                status: "active",
                role: "user",
            };
            
            await normalizeAccountStatus(req, res, next);
            
            expect(req.userRole).toBe("user");
            expect(req.accountStatus).toBe("active");
            expect(req.isBanned).toBe(false);
            expect(req.isSuspended).toBe(false);
        });
    });
});
