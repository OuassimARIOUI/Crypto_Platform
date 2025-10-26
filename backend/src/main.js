import dotenv from "dotenv";
import cron from "node-cron";
import { fetchCryptoData } from "./services/fetchService.js";
import { connectDB } from "./services/dbService.js";
import { logInfo } from "./utils/logger.js";

dotenv.config();

(async () => {
    await connectDB();
    logInfo(" CryptoPlatform Console App started...");

    //server is collecting every 30 seconds
    cron.schedule("*/30 * * * * *", async () => {
        await fetchCryptoData();
    });
})();
