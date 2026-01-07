import { Worker } from "bullmq";
import dotenv from "dotenv";
import { connectDB } from "../services/dbService.js";
import { insertCryptoData } from "../services/insertCryptoService.js";
import { computeAllIndicators } from "../services/indicatorService.js";
import { processPendingAlerts } from "../services/alertsService.js";

dotenv.config();
await connectDB();

console.log(" Worker started. Waiting for jobs…");

// Parse REDIS_URL or use defaults
const redisUrl = process.env.REDIS_URL || "redis://redis:6379";
const parsedUrl = new URL(redisUrl);

// Worker BullMQ
new Worker(
    "crypto-jobs",
    async (job) => {
        console.log(" Job reçu :", job.name);

        if (job.name === "fetch-prices") {
            await insertCryptoData();
        }

        if (job.name === "compute-indicators") {
            await computeAllIndicators();
        }

        if (job.name === "check-alerts") {
            await processPendingAlerts();
        }

        console.log(" Job terminé :", job.name);
    },
    {
        connection: {
            host: parsedUrl.hostname,
            port: parseInt(parsedUrl.port) || 6379
        }
    }
);
