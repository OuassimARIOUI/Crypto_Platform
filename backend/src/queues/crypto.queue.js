import { Queue } from "bullmq";

export const cryptoQueue = new Queue("crypto-collector", {
    connection: {
        host: "redis",
        port: 6379,
    },
});
