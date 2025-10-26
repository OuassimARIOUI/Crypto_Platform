import pkg from "pg";
import dotenv from "dotenv";
import { logInfo, logError } from "../utils/logger.js";

dotenv.config();
const { Client } = pkg;

let client;

export async function connectDB() {
    if (client) return client;

    client = new Client({
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        database: process.env.DB_NAME,
    });

    try {
        await client.connect();
        logInfo("Connexion PostgreSQL établie !");
    } catch (err) {
        logError(" Erreur de connexion PostgreSQL :", err.message);
    }
}

export async function saveCrypto(name, price) {
    try {
        await client.query(
            "INSERT INTO crypto (name, price, timestamp) VALUES ($1, $2, NOW())",
            [name, price]
        );
    } catch (err) {
        logError(" Erreur lors de l’insertion :", err.message);
    }
}
