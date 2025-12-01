import { describe, it, expect, vi } from "vitest";

import { getLatestPrices } from "../../services/getPricesService.js";
import { prisma } from "../../services/dbService.js";

// Mock Prisma
vi.mock("../services/dbService.js", () => ({
    prisma: {
        crypto_prices: {
            findMany: vi.fn()
        }
    }
}));

describe("getLatestPrices()", () => {

    it("retourne les 100 derniers prix triés par fetched_at desc", async () => {

        // Fake DB response
        const fakeData = [
            { id: 1, price_usd: "45000", fetched_at: "2025-12-01T15:00:00Z" },
            { id: 2, price_usd: "45100", fetched_at: "2025-12-01T14:59:00Z" }
        ];

        prisma.crypto_prices.findMany.mockResolvedValue(fakeData);

        const result = await getLatestPrices();

        // Vérifie l'appel Prisma
        expect(prisma.crypto_prices.findMany).toHaveBeenCalledWith({
            orderBy: { fetched_at: "desc" },
            take: 100
        });

        // Vérifie les données retournées
        expect(result).toEqual(fakeData);
    });

});
