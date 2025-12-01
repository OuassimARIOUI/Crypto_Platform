import { describe, it, expect, vi } from "vitest";

import { getHistoryService } from "../../services/getHistoryService.js";
import { prisma } from "../../services/dbService.js";

// Mock Prisma
vi.mock("../services/dbService.js", () => ({
    prisma: {
        cryptos: {
            findUnique: vi.fn(),
        },
        crypto_prices: {
            findMany: vi.fn(),
        }
    }
}));

describe("getHistoryService()", () => {

    it("retourne [] si la crypto n'existe pas", async () => {
        prisma.cryptos.findUnique.mockResolvedValue(null);

        const result = await getHistoryService("btc");

        expect(result).toEqual([]);
        expect(prisma.cryptos.findUnique).toHaveBeenCalledWith({
            where: { symbol: "btc" }
        });
    });

    it("retourne l'historique des prix dans l'ordre chronologique", async () => {
        // Fake crypto
        prisma.cryptos.findUnique.mockResolvedValue({
            id: 1,
            symbol: "btc"
        });

        // Fake prices (déjà triés DESC dans la requête)
        const fakePrices = [
            {
                id: 2,
                price_usd: "45500",
                fetched_at: "2025-12-01T14:00:00Z"
            },
            {
                id: 1,
                price_usd: "45000",
                fetched_at: "2025-12-01T13:00:00Z"
            }
        ];


        prisma.crypto_prices.findMany.mockResolvedValue(fakePrices);

        const result = await getHistoryService("btc", "24h");

        expect(prisma.crypto_prices.findMany).toHaveBeenCalledWith({
            where: { crypto_id: 1 },
            orderBy: { fetched_at: "desc" },
            take: 24,
        });

        // reverse() doit remettre les prix dans l’ordre chronologique petit → grand
        expect(result).toEqual([
            {
                time: "2025-12-01T13:00:00Z",
                price: 45000
            },
            {
                time: "2025-12-01T14:00:00Z",
                price: 45500
            }
        ]);
    });

    it("utilise par défaut 24h si le timeframe est invalide", async () => {
        prisma.cryptos.findUnique.mockResolvedValue({ id: 5 });

        prisma.crypto_prices.findMany.mockResolvedValue([]);

        await getHistoryService("eth", "INVALID_TIMEFRAME");

        expect(prisma.crypto_prices.findMany).toHaveBeenCalledWith({
            where: { crypto_id: 5 },
            orderBy: { fetched_at: "desc" },
            take: 24,  // valeur par défaut
        });
    });

    it("calcule correctement le nombre d'heures pour un timeframe (ex: 7d)", async () => {
        prisma.cryptos.findUnique.mockResolvedValue({ id: 2 });

        prisma.crypto_prices.findMany.mockResolvedValue([]);

        await getHistoryService("btc", "7d");

        expect(prisma.crypto_prices.findMany).toHaveBeenCalledWith({
            where: { crypto_id: 2 },
            orderBy: { fetched_at: "desc" },
            take: 24 * 7,
        });
    });

});
