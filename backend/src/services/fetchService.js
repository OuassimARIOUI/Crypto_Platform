import axios from "axios";
import { logInfo, logError } from "../utils/logger.js";

export async function fetchCryptoData() {
    try {
        const response = await axios.get("https://api.coincap.io/v2/assets");
        const data = response.data.data.slice(0, 5);
        logInfo(` ${new Date().toLocaleTimeString()} — Données crypto :`);
        data.forEach((c) =>
            console.log(`   ${c.name.padEnd(10)} → ${parseFloat(c.priceUsd).toFixed(2)} USD`)
        );
    } catch (err) {
        logError(" Erreur lors de la récupération des données :", err.message);
    }
}
