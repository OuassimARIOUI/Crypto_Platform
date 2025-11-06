import { connectDB } from "./dbService.js";
import { fetchCryptoData } from "./fetchService.js";
import { logInfo, logError } from "../utils/logger.js";

export async function insertCryptoData() {
    try {
        // --- Connexion à la DB ---
        const client = await connectDB();
        logInfo("Connexion à la base établie depuis insertService.js");

        // --- Récupération des données ---
        const data = await fetchCryptoData();
        if (!data || data.length === 0) {
            logError("Aucune donnée récupérée depuis l’API.");
            return;
        }

        // --- Insertion ---
        for (const c of data) {
            const result = await client.query(
                "SELECT id FROM cryptos WHERE symbol = $1",
                [c.symbol]
            );

            let cryptoId;

            if (result.rows.length === 0) {
                const insertCrypto = await client.query(
                    `INSERT INTO cryptos (symbol, name, created_at)
                     VALUES ($1, $2, NOW())
                         RETURNING id`,
                    [c.symbol, c.name]
                );
                cryptoId = insertCrypto.rows[0].id;
                logInfo(` Nouvelle crypto ajoutée : ${c.name}`);
            } else {
                cryptoId = result.rows[0].id;
            }

            await client.query(
                `INSERT INTO crypto_prices
                 (crypto_id, price_usd, volume_usd_24h, market_cap_usd, change_percent_24h, high_24h, low_24h,  circulating_supply, total_supply,
                  ath, ath_change_percent,
                  atl, atl_change_percent, fetched_at)
                 VALUES ($1, $2, $3, $4, $5,$6,$7,$8,$9,$10,$11,$12,$13, NOW())`,
                [
                    cryptoId,
                    c.current_price,
                    c.total_volume,
                    c.market_cap,
                    c.price_change_percentage_24h,
                    c.high_24h,
                    c.low_24h,
                    c.circulating_supply,
                    c.total_supply,
                    c.ath,
                    c.ath_change_percentage,
                    c.atl,
                    c.atl_change_percentage,
                ]
            );

            logInfo(` ${c.name.padEnd(12)} → ${c.current_price.toFixed(2)} USD`);
        }

        logInfo(" Insertion terminée !");
    } catch (err) {
        logError(" Erreur lors de l’insertion :", err.message);
        console.error(err);
    }
}
