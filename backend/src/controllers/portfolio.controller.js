import {
    getMyPortfolio,
    buyCrypto,
    sellCrypto
} from "../services/portfolioService.js";

import {addFunds} from "../services/addFundsService.js";

import { logError } from "../utils/logger.js";

export async function getMyPortfolioController(req, res) {
    try {
        const result = await getMyPortfolio(req.user.id);
        return res.json(result);
    } catch (err) {
        logError("Error getMyPortfolioController", err);
        res.status(500).json({ error: "Erreur serveur" });
    }
}

export async function buyCryptoController(req, res) {
    try {
        const { symbol, quantity } = req.body;

        if (!symbol || !quantity)
            return res.status(400).json({ error: "symbol & quantity requis" });

        const result = await buyCrypto(req.user.id, symbol, Number(quantity));
        return res.json(result);
    } catch (err) {
        console.error("BUY ERROR:", err);
        return res.status(500).json({ error: "Erreur serveur" });
    }
}

export async function sellCryptoController(req, res) {
    try {
        const { symbol, quantity } = req.body;

        if (!symbol || !quantity)
            return res.status(400).json({ error: "symbol & quantity requis" });

        const result = await sellCrypto(req.user.id, symbol, Number(quantity));
        return res.json(result);
    } catch (err) {
        console.error("SELL ERROR:", err);
        return res.status(500).json({ error: "Erreur serveur" });
    }
}

export async function addFundsController(req, res) {
    try {
        const { amount } = req.body;
        const userId = req.user.id;

        const newBalance = await addFunds(userId, Number(amount));

        return res.json({
            success: true,
            balance: newBalance
        });

    } catch (err) {
        console.error("ADD FUNDS ERROR:", err);
        return res.status(400).json({
            error: err.message || "Erreur interne serveur"
        });
    }
}
