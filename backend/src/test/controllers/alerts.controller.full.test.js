import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock des dépendances
vi.mock("../../services/alertsService.js", () => ({
    checkAlert: vi.fn(),
    createAlert: vi.fn(),
    listMyAlerts: vi.fn(),
    deleteMyAlert: vi.fn(),
    resetMyAlert: vi.fn(),
}));

vi.mock("../../utils/logger.js", () => ({
    logError: vi.fn(),
    logInfo: vi.fn(),
}));

import {
    alertsController,
    checkAlertController,
    createAlertController,
    listMyAlertsController,
    deleteAlertController,
    resetAlertController,
} from "../../controllers/alerts.controller.js";
import {
    checkAlert,
    createAlert,
    listMyAlerts,
    deleteMyAlert,
    resetMyAlert,
} from "../../services/alertsService.js";
import { logError } from "../../utils/logger.js";

describe("alerts.controller - Full Coverage", () => {
    let req, res;

    beforeEach(() => {
        vi.clearAllMocks();

        req = {
            query: {},
            body: {},
            params: {},
            userId: 1,
        };

        res = {
            status: vi.fn().mockReturnThis(),
            json: vi.fn(),
        };
    });

    describe("checkAlertController / alertsController", () => {
        it("should return 400 if symbol is missing", async () => {
            req.query = {};

            await checkAlertController(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ error: "symbol est requis" });
        });

        it("should call checkAlert with symbol, up and down from query", async () => {
            const symbol = "BTC";
            const up = "5";
            const down = "-5";

            req.query = { symbol, up, down };

            const mockResult = { symbol, alert: true, alertType: "increase_5%" };
            checkAlert.mockResolvedValue(mockResult);

            await checkAlertController(req, res);

            expect(checkAlert).toHaveBeenCalledWith(symbol, up, down);
            expect(res.json).toHaveBeenCalledWith(mockResult);
        });

        it("should use default values when up/down not provided", async () => {
            req.query = { symbol: "ETH" };

            const mockResult = { symbol: "ETH", alert: false };
            checkAlert.mockResolvedValue(mockResult);

            await checkAlertController(req, res);

            expect(checkAlert).toHaveBeenCalledWith("ETH", 0.000001, 0.000001);
        });

        it("should handle error and return 500", async () => {
            req.query = { symbol: "BTC" };
            const error = new Error("Database error");
            checkAlert.mockRejectedValue(error);

            await checkAlertController(req, res);

            expect(logError).toHaveBeenCalledWith("error checkAlertController", error);
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ error: "Erreur interne serveur" });
        });

        it("alertsController should delegate to checkAlertController", async () => {
            req.query = { symbol: "BTC" };
            const mockResult = { symbol: "BTC", alert: false };
            checkAlert.mockResolvedValue(mockResult);

            await alertsController(req, res);

            expect(checkAlert).toHaveBeenCalled();
            expect(res.json).toHaveBeenCalledWith(mockResult);
        });
    });

    describe("createAlertController", () => {
        it("should return 400 if symbol is missing", async () => {
            req.body = { type: "PERCENT_UP", threshold: 5 };

            await createAlertController(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                error: "symbol, type, threshold are required",
            });
        });

        it("should return 400 if type is missing", async () => {
            req.body = { symbol: "BTC", threshold: 5 };

            await createAlertController(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
        });

        it("should return 400 if threshold is missing", async () => {
            req.body = { symbol: "BTC", type: "PERCENT_UP" };

            await createAlertController(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
        });

        it("should return 400 if threshold is null", async () => {
            req.body = { symbol: "BTC", type: "PERCENT_UP", threshold: null };

            await createAlertController(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
        });

        it("should create alert successfully", async () => {
            req.body = { symbol: "BTC", type: "PERCENT_UP", threshold: 10 };
            const mockAlert = { id: 1, crypto_id: 1, alert_type: "PERCENT_UP", threshold: 10 };
            createAlert.mockResolvedValue(mockAlert);

            await createAlertController(req, res);

            expect(createAlert).toHaveBeenCalledWith({
                userId: 1,
                symbol: "BTC",
                type: "PERCENT_UP",
                threshold: 10,
            });
            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith({ success: true, alert: mockAlert });
        });

        it("should return 500 on error", async () => {
            req.body = { symbol: "BTC", type: "INVALID", threshold: 10 };
            createAlert.mockRejectedValue(new Error("Unsupported alert type"));

            await createAlertController(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ error: "Unsupported alert type" });
        });

        it("should handle threshold of 0 as valid", async () => {
            req.body = { symbol: "BTC", type: "PRICE_BELOW", threshold: 0 };
            const mockAlert = { id: 1, threshold: 0 };
            createAlert.mockResolvedValue(mockAlert);

            await createAlertController(req, res);

            expect(res.status).toHaveBeenCalledWith(201);
        });
    });

    describe("listMyAlertsController", () => {
        it("should return list of alerts", async () => {
            const mockAlerts = [
                { id: 1, alert_type: "PERCENT_UP", threshold: 5, cryptos: { symbol: "btc" } },
                { id: 2, alert_type: "PRICE_BELOW", threshold: 50000, cryptos: { symbol: "btc" } },
            ];
            listMyAlerts.mockResolvedValue(mockAlerts);

            await listMyAlertsController(req, res);

            expect(listMyAlerts).toHaveBeenCalledWith(1);
            expect(res.json).toHaveBeenCalledWith(mockAlerts);
        });

        it("should return empty array when no alerts", async () => {
            listMyAlerts.mockResolvedValue([]);

            await listMyAlertsController(req, res);

            expect(res.json).toHaveBeenCalledWith([]);
        });

        it("should return 500 on error", async () => {
            listMyAlerts.mockRejectedValue(new Error("Database error"));

            await listMyAlertsController(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ error: "Erreur interne serveur" });
        });
    });

    describe("deleteAlertController", () => {
        it("should return 400 for invalid id", async () => {
            req.params = { id: "abc" };

            await deleteAlertController(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ error: "Invalid id" });
        });

        it("should return 400 for NaN id", async () => {
            req.params = { id: "NaN" };

            await deleteAlertController(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
        });

        it("should return 400 for Infinity id", async () => {
            req.params = { id: "Infinity" };

            await deleteAlertController(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
        });

        it("should delete alert successfully", async () => {
            req.params = { id: "1" };
            deleteMyAlert.mockResolvedValue();

            await deleteAlertController(req, res);

            expect(deleteMyAlert).toHaveBeenCalledWith({ userId: 1, alertId: 1 });
            expect(res.json).toHaveBeenCalledWith({ success: true });
        });

        it("should return 500 when alert not found", async () => {
            req.params = { id: "999" };
            deleteMyAlert.mockRejectedValue(new Error("Alert not found"));

            await deleteAlertController(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ error: "Alert not found" });
        });
    });

    describe("resetAlertController", () => {
        it("should return 400 for invalid id", async () => {
            req.params = { id: "xyz" };

            await resetAlertController(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ error: "Invalid id" });
        });

        it("should reset alert successfully", async () => {
            req.params = { id: "1" };
            const mockAlert = { id: 1, is_triggered: false, triggered_at: null };
            resetMyAlert.mockResolvedValue(mockAlert);

            await resetAlertController(req, res);

            expect(resetMyAlert).toHaveBeenCalledWith({ userId: 1, alertId: 1 });
            expect(res.json).toHaveBeenCalledWith({ success: true, alert: mockAlert });
        });

        it("should return 500 when alert not found", async () => {
            req.params = { id: "999" };
            resetMyAlert.mockRejectedValue(new Error("Alert not found"));

            await resetAlertController(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ error: "Alert not found" });
        });

        it("should handle error without message", async () => {
            req.params = { id: "1" };
            resetMyAlert.mockRejectedValue(new Error());

            await resetAlertController(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ error: "Erreur interne serveur" });
        });
    });
});
