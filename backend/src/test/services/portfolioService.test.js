import { describe, it, expect, vi, beforeEach } from "vitest";

import { getMyPortfolio, buyCrypto, sellCrypto } from "../../services/portfolioService.js";
import { prisma } from "../../services/dbService.js";

// Mock Prisma
vi.mock("../../services/dbService.js", () => ({
    prisma: {
        portfolios: {
            findUnique: vi.fn(),
            update: vi.fn()
        },
        portfolio_transactions: {
            create: vi.fn()
        },
        cryptos: {
            findUnique: vi.fn()
        },
        crypto_prices: {
            findFirst: vi.fn()
        }
    }
}));

// Mock du logger (optionnel)
vi.mock("../../utils/logger.js", () => ({
    logError: vi.fn()
}));

beforeEach(() => {
    vi.clearAllMocks();
});

//
// -----------------------------
// TEST getMyPortfolio()
// -----------------------------
//
describe("getMyPortfolio()", () => {
    it("retourne null si aucun portefeuille trouvé", async () => {
        prisma.portfolios.findUnique.mockResolvedValue(null);

        const result = await getMyPortfolio(1);

        expect(result).toBeNull();
    });

    it("retourne balance + holdings + transactions", async () => {
        prisma.portfolios.findUnique.mockResolvedValue({
            balance: 1200,
            transactions: [
                { type: "buy", quantity: 1, crypto: { symbol: "btc" } },
                { type: "sell", quantity: 0.5, crypto: { symbol: "btc" } },
                { type: "buy", quantity: 2, crypto: { symbol: "eth" } }
            ]
        });

        const result = await getMyPortfolio(1);

        expect(result.balance).toBe(1200);

        // Vérification holdings
        expect(result.holdings).toEqual({
            btc: 0.5,  // 1 - 0.5
            eth: 2
        });

        // Transactions bien renvoyées
        expect(result.transactions.length).toBe(3);
    });
});

//
// -----------------------------
// TEST buyCrypto()
// -----------------------------
//
describe("buyCrypto()", () => {
    it("lance une erreur si la crypto n'existe pas", async () => {
        prisma.cryptos.findUnique.mockResolvedValue(null);

        await expect(buyCrypto(1, "btc", 1))
            .rejects.toThrow("Crypto inconnue.");
    });

    it("lance une erreur si aucun prix trouvé", async () => {
        prisma.cryptos.findUnique.mockResolvedValue({ id: 10 });

        prisma.crypto_prices.findFirst.mockResolvedValue(null);

        await expect(buyCrypto(1, "btc", 1))
            .rejects.toThrow("Aucune donnée de prix disponible.");
    });

    it("lance une erreur si le portefeuille n'existe pas", async () => {
        prisma.cryptos.findUnique.mockResolvedValue({ id: 10 });
        prisma.crypto_prices.findFirst.mockResolvedValue({ price_usd: "40000" });

        prisma.portfolios.findUnique.mockResolvedValue(null);

        await expect(buyCrypto(1, "btc", 1))
            .rejects.toThrow("Portefeuille introuvable.");
    });

    it("lance une erreur si balance insuffisante", async () => {
        prisma.cryptos.findUnique.mockResolvedValue({ id: 10 });
        prisma.crypto_prices.findFirst.mockResolvedValue({ price_usd: "30000" });

        prisma.portfolios.findUnique.mockResolvedValue({
            balance: 10000
        });

        await expect(buyCrypto(1, "btc", 1))
            .rejects.toThrow("Solde insuffisant.");
    });

    it("réalise l'achat correctement", async () => {
        prisma.cryptos.findUnique.mockResolvedValue({ id: 10 });
        prisma.crypto_prices.findFirst.mockResolvedValue({ price_usd: "20000" });

        prisma.portfolios.findUnique.mockResolvedValue({
            id: 99,
            user_id: 1,
            balance: 50000
        });

        prisma.portfolios.update.mockResolvedValue({});
        prisma.portfolio_transactions.create.mockResolvedValue({});
        prisma.portfolios.findUnique.mockResolvedValue({
            balance: 30000,
            transactions: []
        });

        const result = await buyCrypto(1, "btc", 1);

        expect(prisma.portfolios.update).toHaveBeenCalled();
        expect(prisma.portfolio_transactions.create).toHaveBeenCalled();
        expect(result.balance).toBe(30000);
    });
});

//
// -----------------------------
// TEST sellCrypto()
// -----------------------------
//
describe("sellCrypto()", () => {

    it("lance une erreur si crypto inconnue", async () => {
        prisma.cryptos.findUnique.mockResolvedValue(null);

        await expect(sellCrypto(1, "eth", 1))
            .rejects.toThrow("Crypto inconnue.");
    });

    it("lance une erreur si portefeuille introuvable", async () => {
        prisma.cryptos.findUnique.mockResolvedValue({ id: 5 });
        prisma.crypto_prices.findFirst.mockResolvedValue({ price_usd: "2000" });

        prisma.portfolios.findUnique.mockResolvedValue(null);

        await expect(sellCrypto(1, "eth", 1))
            .rejects.toThrow("Portefeuille introuvable.");
    });

    it("lance une erreur si quantité insuffisante", async () => {
        prisma.cryptos.findUnique.mockResolvedValue({ id: 5 });
        prisma.crypto_prices.findFirst.mockResolvedValue({ price_usd: "2000" });

        prisma.portfolios.findUnique.mockResolvedValue({
            balance: 10000,
            transactions: [
                { crypto_id: 5, type: "buy", quantity: 0.5 }
            ]
        });

        await expect(sellCrypto(1, "eth", 1))
            .rejects.toThrow("Quantité insuffisante pour vendre.");
    });

    it("effectue correctement la vente", async () => {
        prisma.cryptos.findUnique.mockResolvedValue({ id: 5 });
        prisma.crypto_prices.findFirst.mockResolvedValue({ price_usd: "3000" });

        prisma.portfolios.findUnique
            .mockResolvedValueOnce({    // pour récupérer portefeuille initial
                id: 10,
                balance: 5000,
                transactions: [
                    { crypto_id: 5, type: "buy", quantity: 2 }
                ]
            })
            .mockResolvedValueOnce({    // pour getMyPortfolio final
                balance: 11000,
                transactions: []
            });

        prisma.portfolios.update.mockResolvedValue({});
        prisma.portfolio_transactions.create.mockResolvedValue({});

        const result = await sellCrypto(1, "eth", 1);

        expect(prisma.portfolios.update).toHaveBeenCalled();
        expect(prisma.portfolio_transactions.create).toHaveBeenCalled();
        expect(result.balance).toBe(11000);
    });

});
