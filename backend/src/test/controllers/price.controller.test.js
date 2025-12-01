import { describe, it, expect, vi, beforeEach } from "vitest";

import { getLatestPricesController } from "../../controllers/price.controller.js";
import { getLatestPrices } from "../../services/getPricesService.js";
import { logInfo, logError } from "../../utils/logger.js";

// Mock services + logger
vi.mock("../../services/getPricesService.js", () => ({
    getLatestPrices: vi.fn()
}));

vi.mock("../../utils/logger.js", () => ({
    logInfo: vi.fn(),
    logError: vi.fn()
}));

describe("getLatestPricesController", () => {

    let req, res;

    beforeEach(() => {
        vi.clearAllMocks();

        req = {}; // Pas besoin de body/params

        res = {
            json: vi.fn(),
            status: vi.fn().mockReturnThis(),
        };
    });

    //
    // -----------------------------
    // TEST 1 — Succès
    // -----------------------------
    //
    it("should return latest prices and log info", async () => {
        const mockPrices = [
            { id: 1, price_usd: "45000" },
            { id: 2, price_usd: "3000" }
        ];

        getLatestPrices.mockResolvedValue(mockPrices);

        await getLatestPricesController(req, res);

        expect(getLatestPrices).toHaveBeenCalled();
        expect(logInfo).toHaveBeenCalledWith("Connexion prisma + PostgreSQL établie !");
        expect(res.json).toHaveBeenCalledWith(mockPrices);
    });

    //
    // -----------------------------
    // TEST 2 — Erreur dans le service
    // -----------------------------
    //
    it("should log error when exception occurs", async () => {
        const fakeError = new Error("db error");

        getLatestPrices.mockRejectedValue(fakeError);

        await getLatestPricesController(req, res);

        expect(logError).toHaveBeenCalledWith(fakeError);

        expect(res.json).not.toHaveBeenCalled();
    });

});
