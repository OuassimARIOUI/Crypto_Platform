import { vi, describe, test, expect } from "vitest";
import { fetchCryptoData } from "../services/fetchService.js";

vi.mock("axios", () => ({
    default: {
        get: vi.fn(),
    },
}));

import axios from "axios";

describe("fetchService", () => {
    test("retourne un tableau de cryptos", async () => {
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

    test("retourne undefined si l’API échoue", async () => {
        axios.get.mockRejectedValueOnce(new Error("Erreur API"));
        const result = await fetchCryptoData();
        expect(result).toBeUndefined();
    });
});
