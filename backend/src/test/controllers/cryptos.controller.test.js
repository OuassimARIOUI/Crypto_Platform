import { describe, it, expect, vi, beforeEach } from "vitest";

import { getAllCryptosController } from "../../controllers/cryptos.controller.js";
import { prisma } from "../../services/dbService.js";

// Mock Prisma
vi.mock("../../services/dbService.js", () => ({
    prisma: {
        cryptos: {
            findMany: vi.fn()
        }
    }
}));

describe("getAllCryptosController", () => {

    let req, res;

    beforeEach(() => {
        vi.clearAllMocks();

        req = {};

        res = {
            status: vi.fn().mockReturnThis(),
            json: vi.fn()
        };
    });

    //
    // -----------------------------
    // TEST 1 — Prisma retourne une liste de cryptos
    // -----------------------------
    //
    it("should return formatted cryptos correctly", async () => {

        prisma.cryptos.findMany.mockResolvedValue([
            {
                id: 1,
                symbol: "BTC",
                name: "Bitcoin",
                crypto_prices: [
                    {
                        price_usd: "45000.50",
                        change_percent_24h: "2.5",
                        fetched_at: "2025-12-01T12:00:00Z"
                    }
                ]
            },
            {
                id: 2,
                symbol: "ETH",
                name: "Ethereum",
                crypto_prices: []
            }
        ]);

        await getAllCryptosController(req, res);

        expect(res.json).toHaveBeenCalledWith([
            {
                id: 1,
                symbol: "BTC",
                name: "Bitcoin",
                logo: "https://cryptoicons.org/api/icon/btc/200",
                price: "45000.50",
                change: "2.5",
                sparkline: null
            },
            {
                id: 2,
                symbol: "ETH",
                name: "Ethereum",
                logo: "https://cryptoicons.org/api/icon/eth/200",
                price: 0,
                change: 0,
                sparkline: null
            }
        ]);
    });

    //
    // -----------------------------
    // TEST 2 — Cas erreur Prisma
    // -----------------------------
    //
    it("should return 500 on error", async () => {

        prisma.cryptos.findMany.mockRejectedValue(new Error("DB error"));

        await getAllCryptosController(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ error: "Erreur interne serveur" });
    });

});
