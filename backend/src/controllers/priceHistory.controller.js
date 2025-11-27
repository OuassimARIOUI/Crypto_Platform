import { getHistoryService } from "../services/getHistoryService.js";

export async function getPriceHistoryController(req, res) {
    try {
        const { symbol } = req.params;
        const timeframe = req.query.timeframe || "24h";

        const data = await getHistoryService(symbol, timeframe);

        return res.json(data);

    } catch (err) {
        console.error("History Controller Error:", err);
        return res.status(500).json({ error: "Erreur interne serveur" });
    }
}
