import { describe, it, expect, vi, beforeEach } from "vitest";

import {
    getMyPortfolioController,
    buyCryptoController,
    sellCryptoController,
    addFundsController
} from "../../controllers/portfolio.controller.js";

import { getMyPortfolio, buyCrypto, sellCrypto } from "../../services/portfolioService.js";
import { addFunds } from "../../services/addFundsService.js";

import { logError } from "../../utils/logger.js";

// Mock des services
vi.mock("../../services/portfolioService.js", () => ({
    getMyPortfolio: vi.fn(),
    buyCrypto: vi.fn(),
    sellCrypto: vi.fn()
}));

vi.mock("../../services/addFundsService.js", () => ({
    addFunds: vi.fn()
}));

vi.mock("../../utils/logger.js", () => ({
    logError: vi.fn()
}));

describe("Portfolio Controllers", () => {

    let req, res;

    beforeEach(() => {
        vi.clearAllMocks();

        req = {
            user: { id: 10 },
            body: {}
        };

        res = {
            status: vi.fn().mockReturnThis(),
            json: vi.fn()
        };
    });

    //
    // -----------------------------
    // TEST getMyPortfolioController
    // -----------------------------
    //
    describe("getMyPortfolioController", () => {

        it("should return portfolio result", async () => {
            const mockPortfolio = { balance: 2000, holdings: {} };

            getMyPortfolio.mockResolvedValue(mockPortfolio);

            await getMyPortfolioController(req, res);

            expect(getMyPortfolio).toHaveBeenCalledWith(10);
            expect(res.json).toHaveBeenCalledWith(mockPortfolio);
        });

        it("should handle errors", async () => {
            getMyPortfolio.mockRejectedValue(new Error("DB error"));

            await getMyPortfolioController(req, res);

            expect(logError).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ error: "Erreur serveur" });
        });

    });

    //
    // -----------------------------
    // TEST buyCryptoController
    // -----------------------------
    //
    describe("buyCryptoController", () => {

        it("should return 400 if symbol or quantity missing", async () => {
            req.body = { symbol: "btc" }; // quantity missing

            await buyCryptoController(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                error: "symbol & quantity requis"
            });
        });

        it("should buy crypto and return result", async () => {
            req.body = { symbol: "btc", quantity: 0.5 };

            const mockResult = { balance: 1000 };
            buyCrypto.mockResolvedValue(mockResult);

            await buyCryptoController(req, res);

            expect(buyCrypto).toHaveBeenCalledWith(10, "btc", 0.5);
            expect(res.json).toHaveBeenCalledWith(mockResult);
        });

        it("should handle errors", async () => {
            req.body = { symbol: "btc", quantity: 1 };

            buyCrypto.mockRejectedValue(new Error("Buy error"));

            await buyCryptoController(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ error: "Erreur serveur" });
        });

    });

    //
    // -----------------------------
    // TEST sellCryptoController
    // -----------------------------
    //
    describe("sellCryptoController", () => {

        it("should return 400 if symbol or quantity missing", async () => {
            req.body = { quantity: 1 }; // symbol missing

            await sellCryptoController(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                error: "symbol & quantity requis"
            });
        });

        it("should sell crypto and return result", async () => {
            req.body = { symbol: "eth", quantity: 1 };

            const mockResult = { balance: 1500 };
            sellCrypto.mockResolvedValue(mockResult);

            await sellCryptoController(req, res);

            expect(sellCrypto).toHaveBeenCalledWith(10, "eth", 1);
            expect(res.json).toHaveBeenCalledWith(mockResult);
        });

        it("should handle errors", async () => {
            req.body = { symbol: "eth", quantity: 1 };

            sellCrypto.mockRejectedValue(new Error("Sell error"));

            await sellCryptoController(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ error: "Erreur serveur" });
        });

    });

    //
    // -----------------------------
    // TEST addFundsController
    // -----------------------------
    //
    describe("addFundsController", () => {

        it("should add funds successfully", async () => {
            req.body = { amount: 300 };

            addFunds.mockResolvedValue(1800);

            await addFundsController(req, res);

            expect(addFunds).toHaveBeenCalledWith(10, 300);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                balance: 1800
            });
        });

        it("should return 400 on error", async () => {
            req.body = { amount: 200 };

            addFunds.mockRejectedValue(new Error("Impossible d'ajouter"));

            await addFundsController(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                error: "Impossible d'ajouter"
            });
        });

    });

});
