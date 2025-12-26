import { describe, it, expect, vi } from "vitest";

import { getHistoryService } from "../../services/getHistoryService.js";
import { prisma } from "../../services/dbService.js";

// Mock Prisma
vi.mock("../../services/dbService.js", () => ({
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

        // Fake prices (la requête renvoie ASC)
        const fakePrices = [
            {
                id: 1,
                price_usd: "45000",
                fetched_at: new Date("2025-12-01T13:00:00Z")
            },
            {
                id: 2,
                price_usd: "45500",
                fetched_at: new Date("2025-12-01T14:00:00Z")
            }
        ];


        prisma.crypto_prices.findMany.mockResolvedValue(fakePrices);

        const result = await getHistoryService("btc", "24h");

        expect(prisma.crypto_prices.findMany).toHaveBeenCalledWith(
            expect.objectContaining({
                where: expect.objectContaining({
                    crypto_id: 1,
                    fetched_at: expect.objectContaining({ gte: expect.any(Date) }),
                }),
                orderBy: { fetched_at: "asc" },
                take: 2000,
            })
        );

        // Résultat chronologique petit → grand
        expect(result).toEqual([
            {
                time: new Date("2025-12-01T13:00:00Z"),
                price: 45000
            },
            {
                time: new Date("2025-12-01T14:00:00Z"),
                price: 45500
            }
        ]);
    });

    it("utilise par défaut 24h si le timeframe est invalide", async () => {
        prisma.cryptos.findUnique.mockResolvedValue({ id: 5 });

        prisma.crypto_prices.findMany.mockResolvedValue([]);

        await getHistoryService("eth", "INVALID_TIMEFRAME");

        expect(prisma.crypto_prices.findMany).toHaveBeenCalledWith(
            expect.objectContaining({
                where: expect.objectContaining({
                    crypto_id: 5,
                    fetched_at: expect.objectContaining({ gte: expect.any(Date) }),
                }),
                orderBy: { fetched_at: "asc" },
                take: 2000,
            })
        );
    });

    it("calcule correctement le nombre d'heures pour un timeframe (ex: 7d)", async () => {
        prisma.cryptos.findUnique.mockResolvedValue({ id: 2 });

        prisma.crypto_prices.findMany.mockResolvedValue([]);

        await getHistoryService("btc", "7d");

        expect(prisma.crypto_prices.findMany).toHaveBeenCalledWith(
            expect.objectContaining({
                where: expect.objectContaining({
                    crypto_id: 2,
                    fetched_at: expect.objectContaining({ gte: expect.any(Date) }),
                }),
                orderBy: { fetched_at: "asc" },
                take: 2000,
            })
        );
    });

});
