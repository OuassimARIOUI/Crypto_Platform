import { Router } from "express";
import { auth } from "../middleware/auth.js";
import { normalizeAccountStatus } from "../middleware/accessControl.js";
import {
    listConversationsController,
    listMessagesController,
    sendMessageController,
    startDirectConversationController,
    unreadCountController,
} from "../controllers/messages.controller.js";

const router = Router();

router.use(auth, normalizeAccountStatus);

router.get("/conversations", listConversationsController);
router.get("/unread-count", unreadCountController);
router.post("/conversations/start", startDirectConversationController);

router.get("/conversations/:id/messages", listMessagesController);
router.post("/conversations/:id/messages", sendMessageController);

export default router;
