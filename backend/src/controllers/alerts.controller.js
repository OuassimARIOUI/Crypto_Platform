import { checkAlert } from "../services/alertsService.js";
import {logError} from "../utils/logger.js";

export async function alertsController(req, res) {
    try {
        const { symbol, up = 0.000001, down = 0.000001 } = req.query;

        if (!symbol) {
            return res.status(400).json({ error: "symbol est requis" });
        }

        const result = await checkAlert(symbol, up, down);

        return res.json(result);
    } catch (err) {
        logError("error AlertsController", err);
        return res.status(500).json({ error: "Erreur interne serveur" });
    }
}
