import { describe, it, expect, vi, beforeEach } from "vitest";

import { normalizeAccountStatus, requireRole, requireCanTrade } from "../../middleware/accessControl.js";
import { prisma } from "../../services/dbService.js";

vi.mock("../../services/dbService.js", () => ({
    prisma: {
        users: {
            update: vi.fn(),
        },
    },
}));

function createRes() {
    return {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
    };
}

describe("accessControl middleware", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe("normalizeAccountStatus()", () => {
        it("should call next when req.dbUser missing", async () => {
            const req = {};
            const res = createRes();
            const next = vi.fn();

            await normalizeAccountStatus(req, res, next);

            expect(next).toHaveBeenCalled();
        });

        it("should unban expired bans and set role/status flags", async () => {
            const req = {
                dbUser: {
                    id: 1,
                    role: "user",
                    status: "banned",
                    banned_until: new Date(Date.now() - 1000).toISOString(),
                },
            };
            const res = createRes();
            const next = vi.fn();

            prisma.users.update.mockResolvedValue({
                id: 1,
                role: "user",
                status: "active",
                banned_until: null,
            });

            await normalizeAccountStatus(req, res, next);

            expect(prisma.users.update).toHaveBeenCalled();
            expect(req.userRole).toBe("user");
            expect(req.accountStatus).toBe("active");
            expect(req.isBanned).toBe(false);
            expect(next).toHaveBeenCalled();
        });

        it("should return 500 if prisma throws", async () => {
            const req = {
                dbUser: {
                    id: 1,
                    role: "user",
                    status: "banned",
                    banned_until: new Date(Date.now() - 1000).toISOString(),
                },
            };
            const res = createRes();
            const next = vi.fn();

            prisma.users.update.mockRejectedValue(new Error("DB down"));

            await normalizeAccountStatus(req, res, next);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ error: "Failed to validate account status" });
        });
    });

    describe("requireRole()", () => {
        it("should return 401 when not authenticated", () => {
            const req = { dbUser: null };
            const res = createRes();
            const next = vi.fn();

            requireRole("admin")(req, res, next);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({ error: "Unauthorized" });
            expect(next).not.toHaveBeenCalled();
        });

        it("should return 403 when role not allowed", () => {
            const req = { dbUser: { role: "user" } };
            const res = createRes();
            const next = vi.fn();

            requireRole("admin")(req, res, next);

            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith({ error: "Accès refusé" });
            expect(next).not.toHaveBeenCalled();
        });

        it("should call next when role allowed", () => {
            const req = { dbUser: { role: "admin" } };
            const res = createRes();
            const next = vi.fn();

            requireRole("admin", "moderator")(req, res, next);

            expect(next).toHaveBeenCalled();
        });
    });

    describe("requireCanTrade()", () => {
        it("should return 403 for banned accounts", () => {
            const req = { dbUser: { status: "banned" } };
            const res = createRes();
            const next = vi.fn();

            requireCanTrade(req, res, next);

            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith({ error: "Account restricted", status: "banned" });
        });

        it("should call next for active accounts", () => {
            const req = { dbUser: { status: "active" } };
            const res = createRes();
            const next = vi.fn();

            requireCanTrade(req, res, next);

            expect(next).toHaveBeenCalled();
        });
    });
});
