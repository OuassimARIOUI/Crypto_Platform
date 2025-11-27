import { Queue } from "bullmq";

export const queue = new Queue("crypto-jobs", {
    connection: {
        host: "redis",
        port: 6379
    }
});
