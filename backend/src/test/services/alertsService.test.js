import { describe, test, expect, vi, beforeEach } from "vitest";

// 🟦 MOCK PRISMA (avant import du service)
vi.mock("../services/dbService.js", () => ({
    prisma: {
        cryptos: { findUnique: vi.fn() },
        crypto_prices: { findFirst: vi.fn() }
    }
}));

// 🟦 MOCK LOGGER
vi.mock("../utils/logger.js", () => ({
    logInfo: vi.fn(),
    logError: vi.fn(),
}));

// 🟦 IMPORT SERVICE APRÈS LE MOCK
import { prisma } from "../../services/dbService.js";
import { checkAlert } from "../../services/alertsService.js";

beforeEach(() => {
    vi.clearAllMocks();
});

describe("checkAlert()", () => {

    test("retourne null si la crypto n'existe pas", async () => {
        prisma.cryptos.findUnique.mockResolvedValueOnce(null);

        const res = await checkAlert("btc", 1, -1);
        expect(res).toBeNull();
    });

    test("retourne correctement les infos sans déclencher d’alerte", async () => {
        prisma.cryptos.findUnique.mockResolvedValueOnce({ id: 1, name: "Bitcoin" });

        prisma.crypto_prices.findFirst.mockResolvedValueOnce({
            price_usd: 50000,
            change_percent_24h: 0.5,
        });

        const res = await checkAlert("btc", 2, -2);

        expect(res).toEqual({
            symbol: "btc",
            price: 50000,
            variation_24h: 0.5,
            alert: false,
            alertType: null,
        });
    });

    test("déclenche une alerte UP si variation >= upPercent", async () => {
        prisma.cryptos.findUnique.mockResolvedValueOnce({ id: 1 });

        prisma.crypto_prices.findFirst.mockResolvedValueOnce({
            price_usd: 50000,
            change_percent_24h: 5,
        });

        const res = await checkAlert("btc", 3, -2);

        expect(res.alert).toBe(true);
        expect(res.alertType).toBe("increase_3%");
    });

    test("déclenche une alerte DOWN si variation <= downPercent", async () => {
        prisma.cryptos.findUnique.mockResolvedValueOnce({ id: 1 });

        prisma.crypto_prices.findFirst.mockResolvedValueOnce({
            price_usd: 45000,
            change_percent_24h: -10,
        });

        const res = await checkAlert("btc", 3, -5);

        expect(res.alert).toBe(true);
        expect(res.alertType).toBe("decrease_-5%");
    });

    test("alerte DOWN prioritaire si les deux conditions sont remplies", async () => {
        prisma.cryptos.findUnique.mockResolvedValueOnce({ id: 1 });

        prisma.crypto_prices.findFirst.mockResolvedValueOnce({
            price_usd: 40000,
            change_percent_24h: -20,
        });

        const res = await checkAlert("btc", 10, -10);

        expect(res.alert).toBe(true);
        expect(res.alertType).toBe("decrease_-10%");
    });

});
