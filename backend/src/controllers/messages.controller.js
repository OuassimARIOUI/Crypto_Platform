import { prisma } from "../services/dbService.js";
import {
    getConversationMessages,
    getUnreadCount,
    listMyConversations,
    sendMessageToConversation,
    startDirectConversationByPseudo,
} from "../services/messagesService.js";

export async function listConversationsController(req, res) {
    const items = await listMyConversations(req.userId);
    return res.json({ conversations: items });
}

export async function startDirectConversationController(req, res) {
    const { pseudo } = req.body || {};

    const me = await prisma.users.findUnique({
        where: { id: req.userId },
        select: { id: true, role: true, pseudo: true },
    });

    if (!me) return res.status(404).json({ error: "User not found" });

    try {
        const convo = await startDirectConversationByPseudo({ me, targetPseudo: pseudo });
        return res.json({ success: true, conversation: convo });
    } catch (err) {
        return res.status(400).json({ error: err.message || "Failed to start conversation" });
    }
}

export async function listMessagesController(req, res) {
    try {
        const conversationId = Number(req.params.id);
        const limit = Number(req.query.limit ?? 50);
        const messages = await getConversationMessages({
            userId: req.userId,
            conversationId,
            limit,
        });
        return res.json({ conversationId, messages });
    } catch (err) {
        const msg = err.message || "Failed to load messages";
        const status = msg === "Access denied" ? 403 : 400;
        return res.status(status).json({ error: msg });
    }
}

export async function sendMessageController(req, res) {
    const { body } = req.body || {};

    const me = await prisma.users.findUnique({
        where: { id: req.userId },
        select: { id: true, role: true, pseudo: true },
    });

    if (!me) return res.status(404).json({ error: "User not found" });

    try {
        const conversationId = Number(req.params.id);
        const message = await sendMessageToConversation({
            me,
            conversationId,
            body,
        });
        return res.json({ success: true, message });
    } catch (err) {
        const msg = err.message || "Failed to send message";
        const status = msg === "Access denied" ? 403 : 400;
        return res.status(status).json({ error: msg });
    }
}

export async function unreadCountController(req, res) {
    try {
        const unreadCount = await getUnreadCount(req.userId);
        return res.json({ unreadCount });
    } catch (err) {
        return res.status(400).json({ error: err.message || "Failed to load unread count" });
    }
}
