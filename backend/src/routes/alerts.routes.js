import {Router} from "express";

import { auth } from "../middleware/auth.js";

import {
	alertsController,
	createAlertController,
	listMyAlertsController,
	deleteAlertController,
	resetAlertController,
} from "../controllers/alerts.controller.js";

const router = Router();

// Public: quick check (no persistence)
router.get('/check', alertsController);

// Authenticated: manage my alerts
router.use(auth);
router.get('/', listMyAlertsController);
router.post('/', createAlertController);
router.delete('/:id', deleteAlertController);
router.post('/:id/reset', resetAlertController);

export default router;
