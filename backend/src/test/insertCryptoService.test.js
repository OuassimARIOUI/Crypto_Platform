import { vi, describe, test, expect } from "vitest";
import { insertCryptoData } from "../services/insertCryptoService.js";
import { logInfo, logError } from "../utils/logger.js";


vi.mock("../utils/logger.js", () => ({
    logInfo: vi.fn(),
    logError: vi.fn(),
}));

vi.mock("../services/dbService.js", () => ({
    connectDB: vi.fn(),
}));

vi.mock("../services/fetchService.js", () => ({
    fetchCryptoData: vi.fn(),
}));

describe("TestInsertion à la DB", () => {
    test("Insertion réussie", async () => {
        const { connectDB } = await import("../services/dbService.js");
        const { fetchCryptoData } = await import("../services/fetchService.js");
        const fakeData = [
            {
                symbol: "btc",
                name: "Bitcoin",
                current_price: 50000,
                total_volume: 1000,
                market_cap: 900000,
                price_change_percentage_24h: 1.2,
                high_24h: 51000,
                low_24h: 49000,
                circulating_supply: 19000000,
                total_supply: 21000000,
                ath: 69000,
                ath_change_percentage: -20,
                atl: 67,
                atl_change_percentage: 1000,
            },
        ];
        const fakeClient = {
            query: vi.fn().mockResolvedValueOnce({ rows: [] }),
        };
        connectDB.mockResolvedValue(fakeClient);
        fetchCryptoData.mockResolvedValue(fakeData);
        await insertCryptoData();
        expect(logInfo);
    });

    test("Erreur si aucune donnée", async () => {
        const { connectDB } = await import("../services/dbService.js");
        const { fetchCryptoData } = await import("../services/fetchService.js");

        connectDB.mockResolvedValue({ query: vi.fn() });
        fetchCryptoData.mockResolvedValue([]); // vide

        await insertCryptoData();

        expect(logError).toHaveBeenCalledWith(
            expect.stringContaining("Aucune donnée récupérée")
        );
    });
});
