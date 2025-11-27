import app from "./app.js";
import { cryptoQueue } from "./queues/crypto.queue.js";

const PORT = process.env.PORT || 3004;

app.listen(PORT, () => {
    console.log(` API running on http://localhost:${PORT}`);
});

/*Starting Immmediately
* */

(async () => {
    console.log(" Envoi immédiat → collecte crypto");
    await cryptoQueue.add(
        "collect",
        { immediate: true }
    );
})();

/**Planitfiaction automatically
 * */
cryptoQueue.add(
    "collect",
    {},
    {
        repeat: { every: 5 * 60 * 1000 }, // 5 min
    }
);

console.log("Scheduler → collecte crypto programmée toutes les 5 minutes");