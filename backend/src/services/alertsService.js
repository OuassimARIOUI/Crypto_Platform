import { prisma } from "./dbService.js";
import { logInfo, logError } from "../utils/logger.js";

export async function checkAlert(symbol, upPercent, downPercent) {

    const crypto = await prisma.cryptos.findUnique({
        where: { symbol }
    });

    if (!crypto) {
        logError("AlertsService : Crypto introuvable :", symbol);
        return null;
    }

    const lastPrice = await prisma.crypto_prices.findFirst({
        where: { crypto_id: crypto.id },
        orderBy: { fetched_at: "desc" }
    });

    if (!lastPrice) {
        logError("AlertsService : Aucune donnée de prix disponible pour :", crypto.name);
        return null;
    }

    const variation = lastPrice.change_percent_24h;

    let AlertTriggered = false;
    let AlertType = null;

    // Check UP alert
    if (variation >= Number(upPercent)) {
        AlertTriggered = true;
        AlertType = `increase_${upPercent}%`;
    }

    // Check DOWN alert
    if (variation <= Number(downPercent)) {
        AlertTriggered = true;
        AlertType = `decrease_${downPercent}%`;
    }

    return {
        symbol,
        price: lastPrice.price_usd,
        variation_24h: variation,
        alert: AlertTriggered,
        alertType: AlertType
    };
}
