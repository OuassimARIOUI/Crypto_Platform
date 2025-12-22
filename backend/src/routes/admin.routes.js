import { Router } from "express";
import { auth } from "../middleware/auth.js";
import { normalizeAccountStatus, requireRole } from "../middleware/accessControl.js";
import {
    listUsersController,
    updateUserRoleController,
    banUserController,
    unbanUserController,
    getMaintenanceStatusController,
    setMaintenanceStatusController,
    getUserActivityController,
} from "../controllers/admin.controller.js";
import {
    listReportsController,
    decideReportController,
} from "../controllers/reports.controller.js";

const router = Router();

router.use(auth, normalizeAccountStatus);

router.get("/users", requireRole("admin", "moderator"), listUsersController);
router.get("/users/:id/activity", requireRole("admin", "moderator"), getUserActivityController);

router.get("/maintenance", requireRole("admin"), getMaintenanceStatusController);
router.post("/maintenance", requireRole("admin"), setMaintenanceStatusController);

router.patch("/users/:id/role", requireRole("admin"), updateUserRoleController);
router.post("/users/:id/ban", requireRole("admin"), banUserController);
router.post("/users/:id/unban", requireRole("admin"), unbanUserController);

router.get("/reports", requireRole("admin"), listReportsController);
router.post("/reports/:id/decision", requireRole("admin"), decideReportController);

export default router;
