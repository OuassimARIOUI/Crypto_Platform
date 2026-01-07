import { Queue } from "bullmq";

// Parse REDIS_URL or use defaults
const redisUrl = process.env.REDIS_URL || "redis://redis:6379";
const parsedUrl = new URL(redisUrl);

export const cryptoQueue = new Queue("crypto-collector", {
    connection: {
        host: parsedUrl.hostname,
        port: parseInt(parsedUrl.port) || 6379,
    },
});
