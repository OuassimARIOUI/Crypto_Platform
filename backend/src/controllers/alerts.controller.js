import {
    checkAlert,
    createAlert,
    listMyAlerts,
    deleteMyAlert,
    resetMyAlert,
} from "../services/alertsService.js";
import { logError } from "../utils/logger.js";

export async function checkAlertController(req, res) {
    try {
        const { symbol, up = 0.000001, down = 0.000001 } = req.query;

        if (!symbol) {
            return res.status(400).json({ error: "symbol est requis" });
        }

        const result = await checkAlert(symbol, up, down);
        return res.json(result);
    } catch (err) {
        logError("error checkAlertController", err);
        return res.status(500).json({ error: "Erreur interne serveur" });
    }
}

// Backward-compatible alias for older tests/imports
export async function alertsController(req, res) {
    return checkAlertController(req, res);
}

export async function createAlertController(req, res) {
    try {
        const { symbol, type, threshold } = req.body || {};
        if (!symbol || !type || threshold === undefined || threshold === null) {
            return res.status(400).json({ error: "symbol, type, threshold are required" });
        }

        const alert = await createAlert({
            userId: req.userId,
            symbol,
            type,
            threshold,
        });

        return res.status(201).json({ success: true, alert });
    } catch (err) {
        logError("error createAlertController", err);
        return res.status(500).json({ error: err.message || "Erreur interne serveur" });
    }
}

export async function listMyAlertsController(req, res) {
    try {
        const alerts = await listMyAlerts(req.userId);
        return res.json(alerts);
    } catch (err) {
        logError("error listMyAlertsController", err);
        return res.status(500).json({ error: "Erreur interne serveur" });
    }
}

export async function deleteAlertController(req, res) {
    try {
        const id = Number(req.params.id);
        if (!Number.isFinite(id)) return res.status(400).json({ error: "Invalid id" });

        await deleteMyAlert({ userId: req.userId, alertId: id });
        return res.json({ success: true });
    } catch (err) {
        logError("error deleteAlertController", err);
        return res.status(500).json({ error: err.message || "Erreur interne serveur" });
    }
}

export async function resetAlertController(req, res) {
    try {
        const id = Number(req.params.id);
        if (!Number.isFinite(id)) return res.status(400).json({ error: "Invalid id" });

        const alert = await resetMyAlert({ userId: req.userId, alertId: id });
        return res.json({ success: true, alert });
    } catch (err) {
        logError("error resetAlertController", err);
        return res.status(500).json({ error: err.message || "Erreur interne serveur" });
    }
}
