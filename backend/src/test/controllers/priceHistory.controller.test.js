import { describe, it, expect, vi, beforeEach } from "vitest";

import { getPriceHistoryController } from "../../controllers/PriceHistory.controller.js";
import { getHistoryService } from "../../services/getHistoryService.js";

// Mock service
vi.mock("../../services/getHistoryService.js", () => ({
    getHistoryService: vi.fn()
}));

describe("getPriceHistoryController", () => {

    let req, res;

    beforeEach(() => {
        vi.clearAllMocks();

        req = {
            params: {},
            query: {}
        };

        res = {
            json: vi.fn(),
            status: vi.fn().mockReturnThis()
        };
    });

    //
    // -----------------------------
    // TEST 1 — Appel normal
    // -----------------------------
    //
    it("should return price history", async () => {
        req.params.symbol = "btc";
        req.query.timeframe = "7d";

        const mockData = [
            { time: "2025-01-01", price: 45000 },
            { time: "2025-01-02", price: 46000 }
        ];

        getHistoryService.mockResolvedValue(mockData);

        await getPriceHistoryController(req, res);

        expect(getHistoryService).toHaveBeenCalledWith("btc", "7d");
        expect(res.json).toHaveBeenCalledWith(mockData);
    });

    //
    // -----------------------------
    // TEST 2 — Timeframe par défaut (24h)
    // -----------------------------
    //
    it("should use default timeframe when not provided", async () => {
        req.params.symbol = "eth";  // pas de req.query.timeframe

        const mockData = [{ time: "x", price: 100 }];
        getHistoryService.mockResolvedValue(mockData);

        await getPriceHistoryController(req, res);

        expect(getHistoryService).toHaveBeenCalledWith("eth", "24h");
        expect(res.json).toHaveBeenCalledWith(mockData);
    });

    //
    // -----------------------------
    // TEST 3 — Gestion des erreurs
    // -----------------------------
    //
    it("should handle errors and respond with 500", async () => {
        req.params.symbol = "btc";

        getHistoryService.mockRejectedValue(new Error("fail"));

        await getPriceHistoryController(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({
            error: "Erreur interne serveur"
        });
    });

});
