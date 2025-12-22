import { Router } from "express";
import { authSse } from "../middleware/authSse.js";
import { sseInit, subscribeRealtime } from "../services/realtimeService.js";

const router = Router();

router.get("/stream", authSse, (req, res) => {
    sseInit(res);
    subscribeRealtime({ userId: req.userId, role: req.userRole, res });
});

export default router;
