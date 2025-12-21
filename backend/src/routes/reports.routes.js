import { Router } from "express";
import { auth } from "../middleware/auth.js";
import { normalizeAccountStatus, requireRole } from "../middleware/accessControl.js";
import { createReportController } from "../controllers/reports.controller.js";

const router = Router();

router.use(auth, normalizeAccountStatus);
router.post("/", requireRole("moderator", "admin"), createReportController);

export default router;
