import { describe, it, expect, vi, beforeEach } from "vitest";

import { alertsController } from "../../controllers/alerts.controller.js";
import { checkAlert } from "../../services/alertsService.js";
import { logError } from "../../utils/logger.js";

// Mock correct des dépendances
vi.mock("../../services/alertsService.js", () => ({
    checkAlert: vi.fn()
}));

vi.mock("../../utils/logger.js", () => ({
    logError: vi.fn()
}));

describe("alertsController", () => {

    let req, res;

    beforeEach(() => {
        checkAlert.mockClear();
        logError.mockClear();

        req = { query: {} };

        res = {
            status: vi.fn().mockReturnThis(),
            json: vi.fn()
        };
    });

    it("should return 400 if symbol is missing", async () => {
        req.query = {};

        await alertsController(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ error: "symbol est requis" });
    });

    it("should call checkAlert with symbol, up and down from query", async () => {
        const symbol = "AAPL";
        const up = "0.000002";
        const down = "0.000001";

        req.query = { symbol, up, down };

        const mockResult = { alert: "success" };
        checkAlert.mockResolvedValue(mockResult);

        await alertsController(req, res);

        expect(checkAlert).toHaveBeenCalledWith(symbol, up, down);
        expect(res.json).toHaveBeenCalledWith(mockResult);
    });

    it("should use default values when up/down not provided", async () => {
        const symbol = "AAPL";

        req.query = { symbol };

        const mockResult = { alert: "success" };
        checkAlert.mockResolvedValue(mockResult);

        await alertsController(req, res);

        expect(checkAlert).toHaveBeenCalledWith(symbol, 0.000001, 0.000001);
        expect(res.json).toHaveBeenCalledWith(mockResult);
    });

    it("should handle error and return 500", async () => {
        const symbol = "AAPL";

        req.query = { symbol };

        const error = new Error("test error");
        checkAlert.mockRejectedValue(error);

        await alertsController(req, res);

        expect(logError).toHaveBeenCalledWith("error AlertsController", error);
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ error: "Erreur interne serveur" });
    });

});
