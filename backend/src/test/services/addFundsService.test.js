import { describe, test, expect, vi, beforeEach } from "vitest";
import { addFunds } from "../../services/addFundsService.js";

// Mock Prisma
import { prisma } from "../../services/dbService.js";

vi.mock("../services/dbService.js", () => ({
    prisma: {
        portfolios: {
            update: vi.fn()
        }
    }
}));

beforeEach(() => {
    vi.clearAllMocks();
});

describe("addFunds()", () => {

    test("doit jeter une erreur si le montant est invalide", async () => {
        await expect(addFunds(1, 0)).rejects.toThrow("Montant invalide");
        await expect(addFunds(1, -5)).rejects.toThrow("Montant invalide");
    });

    test("doit appeler prisma.portfolios.update avec les bons paramètres", async () => {
        prisma.portfolios.update.mockResolvedValueOnce({ balance: 150 });

        const result = await addFunds(1, 50);

        expect(prisma.portfolios.update).toHaveBeenCalledWith({
            where: { user_id: 1 },
            data: {
                balance: { increment: 50 },
            },
        });

        expect(result).toBe(150);
    });

    test("doit retourner le nouveau solde", async () => {
        prisma.portfolios.update.mockResolvedValueOnce({ balance: 200 });

        const balance = await addFunds(1, 100);

        expect(balance).toBe(200);
    });

});
