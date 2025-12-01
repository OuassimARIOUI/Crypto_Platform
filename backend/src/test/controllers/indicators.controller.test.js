import { describe, it, expect, vi, beforeEach } from "vitest";

import { indicatorsController } from "../../controllers/indicators.controller.js";
import { getIndicatorsBySymbol } from "../../services/indicatorService.js";
import { logError } from "../../utils/logger.js";

// Mock des dépendances
vi.mock("../../services/indicatorService.js", () => ({
    getIndicatorsBySymbol: vi.fn(),
}));

vi.mock("../../utils/logger.js", () => ({
    logError: vi.fn(),
}));

describe("indicatorsController", () => {
    let req, res;

    beforeEach(() => {
        vi.clearAllMocks();

        req = { params: {} };

        res = {
            json: vi.fn(),
            status: vi.fn().mockReturnThis(),
        };
    });

    //
    // -----------------------------
    // TEST 1 — Contrôleur retourne un résultat valide
    // -----------------------------
    //
    it("should return indicators result when available", async () => {
        req.params = { symbol: "btc" };

        const mockResult = { rsi: 48, macd: 0.002 };
        getIndicatorsBySymbol.mockResolvedValue(mockResult);

        await indicatorsController(req, res);

        expect(getIndicatorsBySymbol).toHaveBeenCalledWith("btc");
        expect(res.json).toHaveBeenCalledWith(mockResult);
    });

    //
    // -----------------------------
    // TEST 2 — Si result = null, log une erreur
    // -----------------------------
    //
    it("should log error when result is null", async () => {
        req.params = { symbol: "eth" };

        getIndicatorsBySymbol.mockResolvedValue(null);

        await indicatorsController(req, res);

        expect(logError).toHaveBeenCalledWith(
            "Indicators Controller  : Error getIndicatorsBySymbol symbol: eth"
        );
        expect(res.json).toHaveBeenCalledWith(null);
    });

    //
    // -----------------------------
    // TEST 3 — Gestion des erreurs dans le try/catch
    // -----------------------------
    //
    it("should catch and log errors", async () => {
        req.params = { symbol: "xrp" };

        const fakeError = new Error("Boom");
        getIndicatorsBySymbol.mockRejectedValue(fakeError);

        await indicatorsController(req, res);

        expect(logError).toHaveBeenCalledWith(
            "Indicators Controller  : catch error : ",
            fakeError
        );

        // ⚠ ton controller ne renvoie PAS de réponse en cas d'erreur
        // pour être fidèle à ton code, on vérifie juste qu'il n'y a pas de crash
        expect(res.json).not.toHaveBeenCalledWith(expect.anything());
    });

});
