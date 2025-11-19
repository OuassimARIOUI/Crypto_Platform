import {getIndicatorsBySymbol} from "../services/indicatorService.js";
import {logError} from "../utils/logger.js";

export async function indicatorsController(req, res){
    try{
        const {symbol} = req.params;

        const result = await getIndicatorsBySymbol(symbol);
        if(!result){
            logError(`Indicators Controller  : Error getIndicatorsBySymbol symbol: ${symbol}`);
        }
        res.json(result);
    }
    catch(err){
        logError("Indicators Controller  : catch error : " , err);
    }
}