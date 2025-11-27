import { Worker } from "bullmq";
import dotenv from "dotenv";
import { connectDB } from "../services/dbService.js";
import { insertCryptoData } from "../services/insertCryptoService.js";
import { computeAllIndicators } from "../services/indicatorService.js";

dotenv.config();
await connectDB();

console.log(" Worker started. Waiting for jobs…");

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

        console.log(" Job terminé :", job.name);
    },
    {
        connection: {
            host: "redis",
            port: 6379
        }
    }
);
