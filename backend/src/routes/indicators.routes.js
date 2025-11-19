import {indicatorsController} from "../controllers/indicators.controller.js";
import {Router} from "express";

const router = Router();

router.get("/:symbol", indicatorsController);

export default router;