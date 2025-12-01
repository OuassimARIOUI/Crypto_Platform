import { describe, it, expect, vi } from "vitest";

import { getAllCryptos } from "../../services/getCryptosService.js";
import { prisma } from "../../services/dbService.js";

// Mock Prisma
vi.mock("../../services/dbService.js", () => ({
    prisma: {
        cryptos: {
            findMany: vi.fn()
        }
    }
}));

describe("getAllCryptos()", () => {

    it("récupère toutes les cryptos avec leur dernier prix", async () => {

        // Fake DB response
        const fakeData = [
            {
                id: 1,
                symbol: "btc",
                prices: [
                    { id: 100, price: "45000", fetched_at: "2025-12-01T10:00:00Z" }
                ]
            },
            {
                id: 2,
                symbol: "eth",
                prices: [
                    { id: 200, price: "2200", fetched_at: "2025-12-01T10:05:00Z" }
                ]
            }
        ];

        prisma.cryptos.findMany.mockResolvedValue(fakeData);

        const result = await getAllCryptos();

        // Vérifie que Prisma est appelé correctement
        expect(prisma.cryptos.findMany).toHaveBeenCalledWith({
            orderBy: { id: "asc" },
            include: {
                prices: {
                    orderBy: { fetched_at: "desc" },
                    take: 1
                }
            }
        });

        // Vérifie les données retournées
        expect(result).toEqual(fakeData);
    });

});
