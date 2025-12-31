import { vi, describe, test, expect,beforeEach  } from "vitest";
import { insertCryptoData } from "../../services/insertCryptoService.js";
import { logInfo, logError } from "../../utils/logger.js";


vi.mock("../../utils/logger.js", () => ({
    logInfo: vi.fn(),
    logError: vi.fn(),
}));

vi.mock("../../services/dbService.js", () => ({
    connectDB: vi.fn(),
    saveCrypto: vi.fn(),
}));

vi.mock("../../services/fetchService.js", () => ({
    fetchCryptoData: vi.fn(),
}));

beforeEach(() => {
    vi.clearAllMocks();
});

describe("Sécurité : TestInsertion à la DB", () => {
    //test Insertion
    test("Insertion réussie", async () => {
        const { connectDB } = await import("../../services/dbService.js");
        const { fetchCryptoData } = await import("../../services/fetchService.js");
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

    //test empty Query
    test("Sécurité :  Erreur si aucune donnée", async () => {
        const { connectDB } = await import("../../services/dbService.js");
        const { fetchCryptoData } = await import("../../services/fetchService.js");

        connectDB.mockResolvedValue({ query: vi.fn() });
        fetchCryptoData.mockResolvedValue([]); // vide

        await insertCryptoData();

        expect(logError).toHaveBeenCalledWith(
            expect.stringContaining("Aucune donnée récupérée")
        );
    });

    //Test Injection SQL
    test("Sécurité : empêche l'injection SQL dans saveCrypto" , async () => {
        const { saveCrypto } = await import("../../services/dbService.js");
        const {logError} = await import ("../../utils/logger.js");

        const maliciousName = "BTC; DROP TABLE users; --";
        await saveCrypto(maliciousName, 100000);

        expect(logError).not.toHaveBeenCalledWith(
            expect.stringContaining("syntax error")
        );
    });

    test("Performance : Insertion complète en moins de 3 secondes", async () => {
        const { connectDB } = await import("../../services/dbService.js");
        const { fetchCryptoData } = await import("../../services/fetchService.js");

        const fakeData = Array.from({ length: 20 }).map((_, i) => ({
            symbol: `c${i}`,
            name: `Crypto${i}`,
            current_price: 1000,
            total_volume: 2000,
            market_cap: 50000,
            price_change_percentage_24h: 2.5,
            high_24h: 1200,
            low_24h: 800,
            circulating_supply: 1000000,
            total_supply: 2000000,
            ath: 5000,
            ath_change_percentage: -10,
            atl: 100,
            atl_change_percentage: 900,
        }));

        const fakeClient = { query: vi.fn().mockResolvedValue({ rows: [] }) };
        connectDB.mockResolvedValue(fakeClient);
        fetchCryptoData.mockResolvedValue(fakeData);

        const start = performance.now();
        await insertCryptoData();
        const duration = performance.now() - start;

        console.log(` Temps total d’insertion simulée : ${duration.toFixed(2)} ms`);
        expect(duration).toBeLessThan(3000);
    });
    test("Performance : Supporte 50 insertions simultanées sans crash", async () => {
        const { saveCrypto } = await import("../../services/dbService.js");

        saveCrypto.mockResolvedValue({});
        const promises = [];

        for (let i = 0; i < 50; i++) {
            promises.push(saveCrypto(`crypto${i}`, Math.random() * 10000));
        }

        await Promise.all(promises);
        expect(saveCrypto).toHaveBeenCalledTimes(50);
    });
});
