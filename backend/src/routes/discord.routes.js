import { Router } from "express";
import { auth } from "../middleware/auth.js";
import {
    getConnectUrlController,
    exchangeDiscordCodeController,
    disconnectDiscordController,
} from "../controllers/discord.controller.js";

const router = Router();

router.use(auth);

router.get("/connect-url", getConnectUrlController);
router.post("/exchange", exchangeDiscordCodeController);
router.post("/disconnect", disconnectDiscordController);

export default router;
