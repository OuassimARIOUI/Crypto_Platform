import {Router} from "express";
import {getLatestPricesController} from "../controllers/price.controller.js";

const router = Router();
router.get("/", getLatestPricesController);

export default router;