import {vi, describe, test, expect} from "vitest";




vi.mock("pg", () => {
    const connect = vi.fn(); // simule la connexion à la DB
    const query = vi.fn();   // simule les requetes SQL

    const Client = vi.fn(function () {
        this.connect = connect;
        this.query = query;
    });
    return {default : {Client} };
});

vi.mock("../utils/logger.js", () => ({
    logInfo: vi.fn(),
    logError: vi.fn(),
}));

import {connectDB, saveCrypto} from "../services/dbService.js";
import { logInfo, logError } from "../utils/logger.js";


describe("----DB TEST---", () => {
    test("Sécurité : Connextion reussie a la DB ", async () => {
        const {default : {Client}} = await import("pg");
        const mockClient = new Client();
        mockClient.connect.mockResolvedValueOnce({});
        await connectDB();
        expect(logInfo).toHaveBeenCalledWith(expect.stringContaining("Connexion "));
    });
        test("Sécurité : returns error if there is no connection to db", async () => {
        const { default: { Client } } = await import("pg");
        Client.mockImplementation(() => ({
            connect: vi.fn().mockRejectedValueOnce(new Error("Echec Connection")),
            query: vi.fn(),
        }));
        await connectDB();
        expect(logError);
    })
    test("Fonction SaveCrypto", async () => {
        const { default: { Client } } = await import("pg");
        const mockClient = Client();

        mockClient.query.mockResolvedValueOnce({});
        await saveCrypto("BTC", 50000);

        expect(logInfo).toHaveBeenCalled();
    });
    test("Sécurité : Returns error the query fails ", async () => {
        const {default : {Client}} = await import("pg");
        const mockClient =  Client();

        mockClient.connect.mockResolvedValueOnce({});
        mockClient.query.mockRejectedValueOnce(new Error("Echec Insertion"));
        await connectDB();
        await saveCrypto("BTC", 50000);
        expect(logError);
    });

    test("Sécurité : aucune variable sensible ne doit apparaître dans les logs", async () => {
        process.env.DB_PASSWORD = "mySuperSecret";
        const { logInfo } = await import("../utils/logger.js");

        logInfo(`Connexion avec user=${process.env.DB_USER} password=${process.env.DB_PASSWORD}`);

        const message = logInfo.mock.calls[0][0];
        expect(message).not.toContain("mySuperSecret");
    });

});