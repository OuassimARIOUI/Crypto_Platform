import {Router} from "express";
import {getLatestPricesController} from "../controllers/price.controller.js";
import { getPriceHistoryController } from "../controllers/priceHistory.controller.js";

const router = Router();
router.get("/", getLatestPricesController);
router.get("/history/:symbol", getPriceHistoryController);

export default router;