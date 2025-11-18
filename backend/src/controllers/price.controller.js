import {getLatestPrices} from "../services/getPricesService.js";
import {logInfo, logError} from "../utils/logger.js";

export async function getLatestPricesController(req,res){
    try{
        const prices = await getLatestPrices();
        logInfo("Connexion prisma + PostgreSQL établie !");
        return res.json(prices);
    }
    catch(error){
        logError(error);
    }
}