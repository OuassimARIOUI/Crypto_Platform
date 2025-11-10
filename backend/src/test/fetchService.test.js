import { vi, describe, test, expect } from "vitest";
import { fetchCryptoData } from "../services/fetchService.js";

vi.mock("axios", () => ({
    default: {
        get: vi.fn(),
    },
}));

import axios from "axios";

describe("fetchService", () => {
    test("Sécurité :  retourne un tableau de cryptos", async () => {
        axios.get.mockResolvedValueOnce({
            data: [
                { name: "Bitcoin", current_price: 50000 },
                { name: "Ethereum", current_price: 3000 },
            ],
        });

        const result = await fetchCryptoData();
        expect(Array.isArray(result)).toBe(true);
        expect(result.length).toBeGreaterThan(0);
    });

    test("Sécurité : retourne undefined si l’API échoue", async () => {
        axios.get.mockRejectedValueOnce(new Error("Erreur API"));
        const result = await fetchCryptoData();
        expect(result).toBeUndefined();
    });
    
    test("Performance : récupération des données < 2 secondes", async () => {
        // on simule une API rapide avec 5 cryptos
        axios.get.mockResolvedValueOnce({
            data: Array.from({ length: 5 }).map((_, i) => ({
                name: `Crypto${i}`,
                current_price: 1000 + i * 100,
            })),
        });

        const start = performance.now();
        await fetchCryptoData();
        const duration = performance.now() - start;

        // le test échoue si ça dépasse 2 secondes
        expect(duration).toBeLessThan(2000);
    });
});
