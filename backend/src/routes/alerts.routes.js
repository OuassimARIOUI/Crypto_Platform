import {Router} from "express";

import {alertsController} from "../controllers/alerts.controller.js";

const router = Router();

router.get('/',alertsController);

export default router;
