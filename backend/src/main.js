import dotenv from "dotenv";
import { queue } from "./workers/queue.js";

dotenv.config();

console.log(" Scheduler BullMQ started");
// Toutes les 5 minutes
setInterval(() => {
    console.log(" ENVOI JOB → fetch-prices");
    queue.add("fetch-prices", {});
}, 5 * 60 * 1000);

// Toutes les 5 minutes
setInterval(() => {
    console.log(" ENVOI JOB → compute-indicators");
    queue.add("compute-indicators", {});
}, 5 * 60 * 1000);

// Toutes les 1 minute: check user alerts + send Discord notifications
setInterval(() => {
    console.log(" ENVOI JOB → check-alerts");
    queue.add("check-alerts", {});
}, 60 * 1000);
