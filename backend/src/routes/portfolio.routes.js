import { Router } from "express";
import { auth } from "../middleware/auth.js";
import {
    getMyPortfolioController,
    buyCryptoController,
    sellCryptoController,
    addFundsController
} from "../controllers/portfolio.controller.js";

const router = Router();

// Toutes les routes nécessitent un token
router.use(auth);

router.get("/me", getMyPortfolioController);
router.post("/buy", buyCryptoController);
router.post("/sell", sellCryptoController);
router.post("/add-funds", addFundsController);

export default router;
