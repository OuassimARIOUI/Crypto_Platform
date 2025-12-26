import { describe, it, expect, vi, beforeEach } from "vitest";

import {
    listUsersController,
    setMaintenanceStatusController,
} from "../../controllers/admin.controller.js";

import { prisma } from "../../services/dbService.js";
import { createAuditLog } from "../../services/auditLogService.js";
import { setMaintenanceConfig } from "../../services/appSettingsService.js";
import { publishToRoles } from "../../services/realtimeService.js";

vi.mock("../../services/dbService.js", () => ({
    prisma: {
        users: {
            count: vi.fn(),
            findMany: vi.fn(),
            update: vi.fn(),
        },
    },
}));

vi.mock("../../services/auditLogService.js", () => ({
    createAuditLog: vi.fn(),
}));

vi.mock("../../services/appSettingsService.js", () => ({
    getMaintenanceConfig: vi.fn(),
    setMaintenanceConfig: vi.fn(),
}));

vi.mock("../../services/messagesService.js", () => ({
    formatBanNoticeBody: vi.fn(() => "body"),
    sendTaggedMessageToDirectConversation: vi.fn(),
}));

vi.mock("../../services/realtimeService.js", () => ({
    publishToRoles: vi.fn(),
    publishToUser: vi.fn(),
}));

vi.mock("../../utils/dateDuration.js", () => ({
    addDurationToNow: vi.fn(() => new Date("2025-01-01T00:00:00.000Z")),
}));

function createRes() {
    return {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
    };
}

describe("Admin Controllers", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe("listUsersController()", () => {
        it("should hide admin portfolio details from moderators", async () => {
            const req = {
                query: { page: "1", pageSize: "20" },
                userRole: "moderator",
            };
            const res = createRes();

            prisma.users.count.mockResolvedValue(1);
            prisma.users.findMany.mockResolvedValue([
                {
                    id: 7,
                    pseudo: "root",
                    email: "root@example.com",
                    role: "admin",
                    status: "active",
                    banned_until: null,
                    ban_reason: null,
                    created_at: new Date("2024-01-01T00:00:00.000Z"),
                    portfolio: { balance: 123, total_deposited: 50 },
                },
            ]);

            await listUsersController(req, res);

            expect(prisma.users.count).toHaveBeenCalled();
            expect(prisma.users.findMany).toHaveBeenCalled();

            const payload = res.json.mock.calls[0][0];
            expect(payload.total).toBe(1);
            expect(payload.users).toHaveLength(1);
            expect(payload.users[0].portfolio).toEqual({
                balance: null,
                totalDeposited: null,
                profit: null,
            });
        });

        it("should compute portfolio profit for admins viewing users", async () => {
            const req = {
                query: { page: "1", pageSize: "20" },
                userRole: "admin",
            };
            const res = createRes();

            prisma.users.count.mockResolvedValue(1);
            prisma.users.findMany.mockResolvedValue([
                {
                    id: 8,
                    pseudo: "u1",
                    email: "u1@example.com",
                    role: "user",
                    status: "active",
                    banned_until: null,
                    ban_reason: null,
                    created_at: new Date("2024-01-01T00:00:00.000Z"),
                    portfolio: { balance: 110, total_deposited: 40 },
                },
            ]);

            await listUsersController(req, res);

            const payload = res.json.mock.calls[0][0];
            expect(payload.users[0].portfolio.balance).toBe(110);
            expect(payload.users[0].portfolio.totalDeposited).toBe(40);
            expect(payload.users[0].portfolio.profit).toBe(70);
        });
    });

    describe("setMaintenanceStatusController()", () => {
        it("should return 400 when enabled is not boolean", async () => {
            const req = { body: { enabled: "true" }, userId: 1 };
            const res = createRes();

            await setMaintenanceStatusController(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ error: "enabled must be a boolean" });
            expect(setMaintenanceConfig).not.toHaveBeenCalled();
        });

        it("should set maintenance and publish event", async () => {
            const req = { body: { enabled: true, message: "Upgrading" }, userId: 42 };
            const res = createRes();

            setMaintenanceConfig.mockResolvedValue({
                enabled: true,
                message: "Upgrading",
                updatedAt: "2025-12-25T00:00:00.000Z",
            });

            await setMaintenanceStatusController(req, res);

            expect(setMaintenanceConfig).toHaveBeenCalledWith({ enabled: true, message: "Upgrading" });
            expect(createAuditLog).toHaveBeenCalled();
            expect(publishToRoles).toHaveBeenCalledWith(
                ["admin", "moderator", "user"],
                "maintenance:changed",
                expect.objectContaining({ enabled: true })
            );
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({ success: true, enabled: true, message: "Upgrading" })
            );
        });
    });
});
