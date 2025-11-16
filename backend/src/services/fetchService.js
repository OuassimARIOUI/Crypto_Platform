import axios from "axios";
import { logInfo, logError } from "../utils/logger.js";

export async function fetchCryptoData() {
    try {
        const response = await axios.get("https://api.coingecko.com/api/v3/coins/markets", {
            params: {
                vs_currency: "usd",
                order: "market_cap_desc",
                per_page: 5,
                page: 1,
                sparkline: false,
            },
            headers:{
                "User-Agent": "Mozilla/5.0(compatible; CryptoPlatform/1.0)",
                "Accept": "application/json",
            },
            timeout: 10000
        });
        const data = response.data;
        logInfo(` ${new Date().toLocaleTimeString()} — Données crypto :`);
        data.forEach((c) => {
            console.log(`   ${c.name.padEnd(12)} → ${c.current_price.toFixed(2)} USD`);
        });
        if (data) return data;
    } catch (err) {
        logError(" Erreur lors de la récupération des données :", err.message);
    }
}
