import { connectDB } from "./dbService.js";
import { fetchCryptoData } from "./fetchService.js";
import { logInfo, logError } from "../utils/logger.js";

export async function insertCryptoData() {
    try {
        // --- Connexion à la DB ---
        const prisma = await connectDB();
        logInfo("Connexion à la base établie depuis insertService.js");

        // --- Récupération des données ---
        const data = await fetchCryptoData();
        if (!data || data.length === 0) {
            logError("Aucune donnée récupérée depuis l’API.");
            return;
        }

        // --- Insertion ---
        for (const c of data) {
            //verifier si la crypto existe
            const existing = await prisma.cryptos.findUnique({
                where : {symbol : c.symbol},
            });

            let cryptoId;
            //si elle existe pas
            if(!existing) {
                const insertCrypto = await prisma.cyrptos.create({
                    data : {
                        symbol : c.symbol,
                        name: c.symbol,
                        createdAt : new Date(),
                    }
                });
                cryptoId = insertCrypto.id;
                logInfo("new Crypto created: ", cryptoId);
            }
            else{
                cryptoId= existing.id;
            }
            // Insérer les données dans crypto_prices
            await prisma.crypto_prices.create({
                data: {
                    crypto_id: cryptoId,
                    price_usd: c.current_price,
                    volume_usd_24h: c.total_volume,
                    market_cap_usd: c.market_cap,
                    change_percent_24h: c.price_change_percentage_24h,
                    high_24h: c.high_24h,
                    low_24h: c.low_24h,
                    circulating_supply: c.circulating_supply,
                    total_supply: c.total_supply,
                    ath: c.ath,
                    ath_change_percent: c.ath_change_percentage,
                    atl: c.atl,
                    atl_change_percent: c.atl_change_percentage,
                    fetched_at: new Date()
                }
            });

            logInfo(` ${c.name.padEnd(12)} → ${c.current_price.toFixed(2)} USD`);
        }

        logInfo(" Insertion terminée !");
    } catch (err) {
        logError(" Erreur lors de l’insertion :", err.message);
        console.error(err);
    }
}
