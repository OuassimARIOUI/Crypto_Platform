import {prisma} from "./dbService.js"
import {logInfo, logError} from "../utils/logger.js";

export async function checkAlert(symbol, upPercent, downPercent){
    //getting crypto
    const crypto = prisma.cryptos.findUnique({
        where:{symbol}
    });

    if(!crypto){
        logError(" AlertsService : Erreur lors de recup de crypto ");
        return null;
    }

    const lastPrice = await prisma.crypto_prices.findFirst({
        where:{crypto_id : crypto.id},
        order: { fetched_at : "desc" },
    });

    if(!lastPrice){
        logError("AlertsService :  Aucune donnée de prix disponible pour le cryptp", crypto.name );
    }

    const variation = lastPrice.change_percent_24h;

    let AlertTriggered = false;
    let AlertType=null;

    //comparer UP price
    if(variation >= Number(upPercent)){
        AlertTriggered = true;
        AlertType = `increase_${upPercent}%`;
    }

    //comparer DOWN price
    if(variation <= Number(downPercent)){
        AlertTriggered = true;
        AlertType = `decrease_${downPercent}%`;
    }

    return{
        symbol,
        price:lastPrice.price_usd,
        variation_24h: variation,
        alert: AlertTriggered,
        alertType:AlertType,
    };
}