import { vi, describe, test, expect, beforeEach } from "vitest";

vi.mock("../services/dbService.js", () => ({
    prisma: {
        crypto_prices: {
            findMany: vi.fn(),
            findFirst: vi.fn(),
        },
        indicators_history: {
            create: vi.fn(),
        },
        cryptos: {
            findMany: vi.fn(),
        }
    }
}));

import { prisma } from "../services/dbService.js";
import { computeAllIndicators } from "../services/indicatorService.js";

// Re-import functions privées
const modulePath = "../services/indicatorService.js";
const { default: calculateSMA } = await import(modulePath).then(m => ({ default: m.calculateSMA }));
const { default: getVariation24h } = await import(modulePath).then(m => ({ default: m.getVariation24h }));

beforeEach(() => {
    vi.clearAllMocks();
});




describe("Unitaires : calculateSMA()", () => {
    test("Retourne la moyenne correcte", async () => {
        prisma.crypto_prices.findMany.mockResolvedValue([
            { price_usd: 10 },
            { price_usd: 20 },
            { price_usd: 30 },
        ]);

        const result = await calculateSMA(1, 3);
        expect(result).toBe(20); // (10+20+30)/3
    });

    test("Retourne null si les données sont insuffisantes", async () => {
        prisma.crypto_prices.findMany.mockResolvedValue([
            { price_usd: 10 },
        ]);

        const result = await calculateSMA(1, 3);
        expect(result).toBeNull();
    });
});

describe("Unitaires : getVariation24h()", () => {
    test("Retourne la variation", async () => {
        prisma.crypto_prices.findFirst.mockResolvedValue({
            change_percent_24h: 5.2
        });

        const result = await getVariation24h(1);
        expect(result).toBe(5.2);
    });

    test("Retourne null si aucune donnée", async () => {
        prisma.crypto_prices.findFirst.mockResolvedValue(null);

        const result = await getVariation24h(1);
        expect(result).toBeNull();
    });
});




describe("Sécurité : computeAllIndicators()", () => {
    test("Aucune donnée sensible n’est sauvegardée dans indicators_history", async () => {
        prisma.cryptos.findMany.mockResolvedValue([{ id: 1 }]);
        prisma.crypto_prices.findMany.mockResolvedValue(
            Array.from({ length: 30 }).map(() => ({ price_usd: 100 }))
        );
        prisma.crypto_prices.findFirst.mockResolvedValue({
            change_percent_24h: 2.5
        });

        await computeAllIndicators();

        const call = prisma.indicators_history.create.mock.calls[0][0];

        expect(call.data).not.toHaveProperty("password");
        expect(call.data).not.toHaveProperty("apiKey");
    });

    test("Sécurité : empêche l’injection dans crypto_id", async () => {
        prisma.cryptos.findMany.mockResolvedValue([{ id: "1; DROP TABLE crypto_prices;" }]);

        prisma.crypto_prices.findMany.mockResolvedValue(
            Array.from({ length: 30 }).map(() => ({ price_usd: 100 }))
        );

        prisma.crypto_prices.findFirst.mockResolvedValue({ change_percent_24h: 1 });

        await computeAllIndicators();

        const call = prisma.indicators_history.create.mock.calls[0][0];

        expect(call.data.crypto_id).not.toContain("DROP");
    });
});




describe("Performance : computeAllIndicators()", () => {
    test("Calcule les indicateurs < 2 secondes pour 5 cryptos", async () => {
        prisma.cryptos.findMany.mockResolvedValue(
            Array.from({ length: 5 }).map((_, i) => ({ id: i + 1 }))
        );

        prisma.crypto_prices.findMany.mockResolvedValue(
            Array.from({ length: 30 }).map(() => ({ price_usd: 100 }))
        );

        prisma.crypto_prices.findFirst.mockResolvedValue({
            change_percent_24h: 1
        });

        const start = performance.now();
        await computeAllIndicators();
        const duration = performance.now() - start;

        expect(duration).toBeLessThan(2000);
    });
});




describe("Intégration : indicators_history est bien créé", () => {
    test("Insertion réussie", async () => {
        prisma.cryptos.findMany.mockResolvedValue([{ id: 1 }]);
        prisma.crypto_prices.findMany.mockResolvedValue(
            Array.from({ length: 30 }).map(() => ({ price_usd: 100 }))
        );
        prisma.crypto_prices.findFirst.mockResolvedValue({
            change_percent_24h: 5
        });

        await computeAllIndicators();

        expect(prisma.indicators_history.create).toHaveBeenCalledTimes(1);
    });
});
