import { Router } from "express";
import { auth } from "../middleware/auth.js";
import { normalizeAccountStatus, requireCanTrade } from "../middleware/accessControl.js";
import {
    getMyPortfolioController,
    buyCryptoController,
    sellCryptoController,
    addFundsController,
    transferFundsController
} from "../controllers/portfolio.controller.js";

const router = Router();

// Toutes les routes nécessitent un token
router.use(auth, normalizeAccountStatus);

router.get("/me", getMyPortfolioController);
router.post("/buy", requireCanTrade, buyCryptoController);
router.post("/sell", requireCanTrade, sellCryptoController);
router.post("/add-funds", requireCanTrade, addFundsController);
router.post("/transfer", requireCanTrade, transferFundsController);

export default router;
