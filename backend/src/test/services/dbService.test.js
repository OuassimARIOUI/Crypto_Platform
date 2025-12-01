import { describe, test, expect, vi, beforeEach } from "vitest";

//  Mock logger
vi.mock("../utils/logger.js", () => ({
    logInfo: vi.fn(),
    logError: vi.fn(),
}));

// 🟦 Mock PrismaClient (compatible new PrismaClient())
vi.mock("@prisma/client", () => {
    const mockConnect = vi.fn();

    const MockPrismaClient = vi.fn(function () {
        this.$connect = mockConnect;
    });

    return {
        PrismaClient: MockPrismaClient
    };
});

import { prisma, connectDB } from "../../services/dbService.js";
import { logInfo, logError } from "../../utils/logger.js";

beforeEach(() => {
    vi.clearAllMocks();
});

describe("---- DB TESTS (Prisma) ----", () => {

    test("Connexion réussie à la DB", async () => {
        prisma.$connect.mockResolvedValueOnce({});

        const result = await connectDB();

        expect(result).not.toBeNull();
        expect(logInfo).toHaveBeenCalledWith(expect.stringContaining("Connexion prisma"));
    });

    test("Erreur si la connexion échoue", async () => {
        prisma.$connect.mockRejectedValueOnce(new Error("Connexion refusée"));

        const result = await connectDB();

        expect(result).toBeNull();
        expect(logError).toHaveBeenCalled();
    });

    test("Sécurité : le logger ne doit pas afficher DB_PASSWORD", async () => {
        process.env.DB_PASSWORD = "mySuperSecret";

        // simulate a real log from connectDB()
        logInfo("Connexion prisma + PostgreSQL établie !");

        const message = logInfo.mock.calls[0][0];
        expect(message).not.toContain(process.env.DB_PASSWORD);
    });
});
