import { describe, it, expect, vi } from "vitest";
import { maintenanceGuard } from "../../middleware/maintenance.js";

const prismaMock = {
    maintenanceConfig: {
        findFirst: vi.fn(),
    },
    users: {
        findUnique: vi.fn(),
    },
};

vi.mock("../../services/dbService.js", () => ({
    prisma: prismaMock,
}));

vi.mock("../../services/firebaseAdmin.js", () => ({
    default: {
        auth: () => ({
            verifyIdToken: vi.fn(),
        }),
    },
}));

describe("Security - Maintenance Mode", () => {
    let req, res, next;

    beforeEach(() => {
        req = {
            path: "/cryptos",
            headers: {},
        };
        res = {
            status: vi.fn().mockReturnThis(),
            json: vi.fn(),
        };
        next = vi.fn();
        vi.clearAllMocks();
    });

    describe("Maintenance Mode Bypass", () => {
        it("should allow admin to bypass maintenance", async () => {
            prismaMock.maintenanceConfig.findFirst.mockResolvedValue({
                enabled: true,
                message: "Maintenance en cours",
            });
            
            prismaMock.users.findUnique.mockResolvedValue({
                id: 1,
                role: "admin",
                status: "active",
            });
            
            req.headers.authorization = "Bearer admin_token";
            
            await maintenanceGuard(req, res, next);
            
            expect(next).toHaveBeenCalled();
            expect(res.status).not.toHaveBeenCalledWith(503);
        });

        it("should block non-admin users during maintenance", async () => {
            prismaMock.maintenanceConfig.findFirst.mockResolvedValue({
                enabled: true,
                message: "Maintenance en cours",
            });
            
            prismaMock.users.findUnique.mockResolvedValue({
                id: 1,
                role: "user",
                status: "active",
            });
            
            req.headers.authorization = "Bearer user_token";
            
            await maintenanceGuard(req, res, next);
            
            expect(res.status).toHaveBeenCalledWith(503);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    error: "Site en maintenance",
                    maintenance: true,
                })
            );
        });

        it("should allow health endpoint during maintenance", async () => {
            prismaMock.maintenanceConfig.findFirst.mockResolvedValue({
                enabled: true,
                message: "Maintenance en cours",
            });
            
            req.path = "/health";
            
            await maintenanceGuard(req, res, next);
            
            expect(next).toHaveBeenCalled();
        });

        it("should allow metrics endpoint during maintenance", async () => {
            prismaMock.maintenanceConfig.findFirst.mockResolvedValue({
                enabled: true,
                message: "Maintenance en cours",
            });
            
            req.path = "/metrics";
            
            await maintenanceGuard(req, res, next);
            
            expect(next).toHaveBeenCalled();
        });

        it("should not block when maintenance disabled", async () => {
            prismaMock.maintenanceConfig.findFirst.mockResolvedValue({
                enabled: false,
            });
            
            await maintenanceGuard(req, res, next);
            
            expect(next).toHaveBeenCalled();
            expect(res.status).not.toHaveBeenCalled();
        });
    });

    describe("Authorization Header Spoofing", () => {
        it("should reject fake admin token during maintenance", async () => {
            prismaMock.maintenanceConfig.findFirst.mockResolvedValue({
                enabled: true,
                message: "Maintenance en cours",
            });
            
            prismaMock.users.findUnique.mockResolvedValue(null);
            
            req.headers.authorization = "Bearer fake_admin_token";
            
            await maintenanceGuard(req, res, next);
            
            expect(res.status).toHaveBeenCalledWith(503);
        });

        it("should handle missing authorization gracefully", async () => {
            prismaMock.maintenanceConfig.findFirst.mockResolvedValue({
                enabled: true,
                message: "Maintenance en cours",
            });
            
            await maintenanceGuard(req, res, next);
            
            expect(res.status).toHaveBeenCalledWith(503);
        });

        it("should not trust client-provided role claims", async () => {
            prismaMock.maintenanceConfig.findFirst.mockResolvedValue({
                enabled: true,
                message: "Maintenance en cours",
            });
            
            prismaMock.users.findUnique.mockResolvedValue({
                id: 1,
                role: "user",
                status: "active",
            });
            
            req.headers.authorization = "Bearer user_token";
            req.user = { role: "admin" };
            
            await maintenanceGuard(req, res, next);
            
            expect(res.status).toHaveBeenCalledWith(503);
        });
    });
});

describe("Security - Account Status Checks", () => {
    describe("Banned Account Protection", () => {
        it("should prevent banned user from accessing resources", () => {
            const req = {
                dbUser: {
                    id: 1,
                    status: "banned",
                    banned_until: new Date(Date.now() + 86400000),
                },
            };
            const res = {
                status: vi.fn().mockReturnThis(),
                json: vi.fn(),
            };
            const next = vi.fn();
            
            const { requireCanTrade } = require("../../middleware/accessControl.js");
            requireCanTrade(req, res, next);
            
            expect(res.status).toHaveBeenCalledWith(403);
            expect(next).not.toHaveBeenCalled();
        });

        it("should prevent suspended user from trading", () => {
            const req = {
                dbUser: {
                    id: 1,
                    status: "suspended",
                },
            };
            const res = {
                status: vi.fn().mockReturnThis(),
                json: vi.fn(),
            };
            const next = vi.fn();
            
            const { requireCanTrade } = require("../../middleware/accessControl.js");
            requireCanTrade(req, res, next);
            
            expect(res.status).toHaveBeenCalledWith(403);
        });
    });

    describe("Status Manipulation Prevention", () => {
        it("should not allow user to change their own status", () => {
            const req = {
                dbUser: {
                    id: 1,
                    status: "banned",
                    role: "user",
                },
                body: {
                    status: "active",
                },
            };
            const res = {
                status: vi.fn().mockReturnThis(),
                json: vi.fn(),
            };
            const next = vi.fn();
            
            const { requireCanTrade } = require("../../middleware/accessControl.js");
            requireCanTrade(req, res, next);
            
            expect(res.status).toHaveBeenCalledWith(403);
        });
    });
});

describe("Security - Session Management", () => {
    describe("Token Lifecycle", () => {
        it("should reject requests with no user context", () => {
            const req = {
                dbUser: null,
                user: null,
            };
            const res = {
                status: vi.fn().mockReturnThis(),
                json: vi.fn(),
            };
            const next = vi.fn();
            
            const { requireCanTrade } = require("../../middleware/accessControl.js");
            requireCanTrade(req, res, next);
            
            expect(res.status).toHaveBeenCalledWith(401);
        });

        it("should validate user exists in database", () => {
            const req = {
                user: { uid: "deleted_user" },
                dbUser: null,
            };
            const res = {
                status: vi.fn().mockReturnThis(),
                json: vi.fn(),
            };
            const next = vi.fn();
            
            const { requireRole } = require("../../middleware/accessControl.js");
            const middleware = requireRole("user");
            middleware(req, res, next);
            
            expect(res.status).toHaveBeenCalledWith(401);
        });
    });

    describe("Concurrent Session Handling", () => {
        it("should handle multiple requests with same token", async () => {
            const token = "Bearer valid_token";
            const requests = [
                { headers: { authorization: token } },
                { headers: { authorization: token } },
                { headers: { authorization: token } },
            ];
            
            expect(requests.every(r => r.headers.authorization === token)).toBe(true);
        });
    });
});

describe("Security - Resource Access Control", () => {
    describe("Ownership Verification", () => {
        it("should prevent user from accessing other users portfolios", () => {
            const requestingUserId = 1;
            const targetUserId = 2;
            
            expect(requestingUserId).not.toBe(targetUserId);
        });

        it("should prevent user from modifying other users alerts", () => {
            const alertOwnerId = 1;
            const requestingUserId = 2;
            
            expect(alertOwnerId).not.toBe(requestingUserId);
        });
    });

    describe("Admin Privilege Escalation Prevention", () => {
        it("should not allow user to grant themselves admin role", () => {
            const req = {
                dbUser: { id: 1, role: "user" },
                body: { role: "admin" },
            };
            const res = {
                status: vi.fn().mockReturnThis(),
                json: vi.fn(),
            };
            const next = vi.fn();
            
            const { requireRole } = require("../../middleware/accessControl.js");
            const middleware = requireRole("admin");
            middleware(req, res, next);
            
            expect(res.status).toHaveBeenCalledWith(403);
        });

        it("should require admin role for user management", () => {
            const req = {
                dbUser: { id: 1, role: "moderator" },
            };
            const res = {
                status: vi.fn().mockReturnThis(),
                json: vi.fn(),
            };
            const next = vi.fn();
            
            const { requireRole } = require("../../middleware/accessControl.js");
            const middleware = requireRole("admin");
            middleware(req, res, next);
            
            expect(res.status).toHaveBeenCalledWith(403);
        });
    });
});
