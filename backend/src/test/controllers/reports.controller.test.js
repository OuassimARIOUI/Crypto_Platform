import { describe, it, expect, vi, beforeEach } from "vitest";

import {
    createReportController,
    listReportsController,
    decideReportController,
} from "../../controllers/reports.controller.js";

import { prisma } from "../../services/dbService.js";
import { createAuditLog } from "../../services/auditLogService.js";
import { addDurationToNow } from "../../utils/dateDuration.js";

vi.mock("../../services/dbService.js", () => ({
    prisma: {
        reports: {
            create: vi.fn(),
            count: vi.fn(),
            findMany: vi.fn(),
            findUnique: vi.fn(),
            update: vi.fn(),
        },
        users: {
            update: vi.fn(),
        },
    },
}));

vi.mock("../../services/auditLogService.js", () => ({
    createAuditLog: vi.fn(),
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

describe("Reports Controllers", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe("createReportController()", () => {
        it("should validate reportedUserId", async () => {
            const req = { body: { reportedUserId: "", reasonCategory: "other", reasonText: "x" }, userId: 1 };
            const res = createRes();

            await createReportController(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ error: "reportedUserId is required" });
        });

        it("should create report and audit log", async () => {
            const req = {
                body: { reportedUserId: 99, reasonCategory: "spam", reasonText: "bad", evidence: "url" },
                userId: 1,
            };
            const res = createRes();

            prisma.reports.create.mockResolvedValue({ id: 5, status: "open" });

            await createReportController(req, res);

            expect(prisma.reports.create).toHaveBeenCalled();
            expect(createAuditLog).toHaveBeenCalledWith(
                expect.objectContaining({ actorId: 1, action: "CREATE_REPORT", targetUserId: 99, reportId: 5 })
            );
            expect(res.json).toHaveBeenCalledWith({ success: true, report: { id: 5, status: "open" } });
        });
    });

    describe("listReportsController()", () => {
        it("should list reports with pagination", async () => {
            const req = { query: { page: "2", pageSize: "10", status: "open" } };
            const res = createRes();

            prisma.reports.count.mockResolvedValue(21);
            prisma.reports.findMany.mockResolvedValue([{ id: 1 }, { id: 2 }]);

            await listReportsController(req, res);

            expect(prisma.reports.count).toHaveBeenCalledWith({ where: { status: "open" } });
            expect(prisma.reports.findMany).toHaveBeenCalledWith(
                expect.objectContaining({ skip: 10, take: 10 })
            );
            expect(res.json).toHaveBeenCalledWith({ page: 2, pageSize: 10, total: 21, reports: [{ id: 1 }, { id: 2 }] });
        });
    });

    describe("decideReportController()", () => {
        it("should return 404 when report not found", async () => {
            const req = { params: { id: "123" }, body: { decision: "reject" }, userId: 1 };
            const res = createRes();

            prisma.reports.findUnique.mockResolvedValue(null);

            await decideReportController(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ error: "Report not found" });
        });

        it("should validate decision", async () => {
            const req = { params: { id: "1" }, body: { decision: "something" }, userId: 1 };
            const res = createRes();

            prisma.reports.findUnique.mockResolvedValue({ id: 1, reported_user_id: 9 });

            await decideReportController(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ error: "decision must be 'ban' or 'reject'" });
        });

        it("should ban user and resolve report", async () => {
            const req = {
                params: { id: "1" },
                body: { decision: "ban", banReason: "abuse", duration: "7d", note: "ok" },
                userId: 50,
            };
            const res = createRes();

            prisma.reports.findUnique.mockResolvedValue({ id: 1, reported_user_id: 9 });
            prisma.users.update.mockResolvedValue({ id: 9, status: "banned" });
            prisma.reports.update.mockResolvedValue({ id: 1, status: "resolved", admin_decision_note: "ok" });

            await decideReportController(req, res);

            expect(addDurationToNow).toHaveBeenCalledWith("7d");
            expect(prisma.users.update).toHaveBeenCalled();
            expect(prisma.reports.update).toHaveBeenCalled();
            expect(createAuditLog).toHaveBeenCalledWith(
                expect.objectContaining({ actorId: 50, action: "BAN_USER_FROM_REPORT", reportId: 1, targetUserId: 9 })
            );
            expect(createAuditLog).toHaveBeenCalledWith(
                expect.objectContaining({ actorId: 50, action: "RESOLVE_REPORT_BAN", reportId: 1, targetUserId: 9 })
            );
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({ success: true, report: { id: 1, status: "resolved", admin_decision_note: "ok" } })
            );
        });

        it("should reject report without banning user", async () => {
            const req = {
                params: { id: "2" },
                body: { decision: "reject", note: "nope" },
                userId: 51,
            };
            const res = createRes();

            prisma.reports.findUnique.mockResolvedValue({ id: 2, reported_user_id: 10 });
            prisma.reports.update.mockResolvedValue({ id: 2, status: "rejected", admin_decision_note: "nope" });

            await decideReportController(req, res);

            expect(prisma.users.update).not.toHaveBeenCalled();
            expect(prisma.reports.update).toHaveBeenCalledWith(
                expect.objectContaining({ where: { id: 2 }, data: expect.objectContaining({ status: "rejected" }) })
            );
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({ success: true, report: { id: 2, status: "rejected", admin_decision_note: "nope" } })
            );
        });
    });
});
