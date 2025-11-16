import dotenv from "dotenv";
import cron from "node-cron";
import { fetchCryptoData } from "./services/fetchService.js";
import { connectDB } from "./services/dbService.js";
import { logInfo } from "./utils/logger.js";
import {insertCryptoData} from "./services/insertCryptoService.js";
import {computeAllIndicators} from "./services/indicatorService.js"
dotenv.config();

(async () => {
    await connectDB();
    logInfo(" CryptoPlatform Console App started...");

    //server is collecting every 30 seconds
    cron.schedule("*/3 * * * *", async () => {
        await insertCryptoData();
    });
    cron.schedule("* * * * *", async () => {
        try {
            console.log("Running indicators calculation...");
            await computeAllIndicators();
        } catch (err) {
            console.error("Cron error:", err);
        }
    }, {
        scheduled: true,
        recoverMissedExecutions: true,
    });
})();
