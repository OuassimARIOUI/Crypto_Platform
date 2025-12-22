import { prisma } from "./dbService.js";

function normalizeBody(body) {
    if (typeof body !== "string") return "";
    return body.trim().slice(0, 2000);
}

function directKeyFor(userAId, userBId) {
    const a = Number(userAId);
    const b = Number(userBId);
    const min = Math.min(a, b);
    const max = Math.max(a, b);
    return `${min}:${max}`;
}

export function formatBanNoticeBody({ reason, bannedUntil }) {
    const cleanReason = typeof reason === "string" && reason.trim() ? reason.trim() : "Non spécifié";
    const untilLabel = bannedUntil ? new Date(bannedUntil).toISOString() : null;

    return [
        "[BAN]",
        "Votre compte a été banni.",
        `Motif: ${cleanReason}`,
        bannedUntil ? `Fin: ${untilLabel}` : "Fin: jusqu'à réactivation",
    ].join("\n");
}

export async function ensureDirectConversationByUserIds({ userAId, userBId }) {
    const a = Number(userAId);
    const b = Number(userBId);
    if (!a || Number.isNaN(a) || !b || Number.isNaN(b)) throw new Error("Invalid user ids");
    if (a === b) throw new Error("Cannot create direct conversation with self");

    const key = directKeyFor(a, b);

    const convo = await prisma.conversations.upsert({
        where: { direct_key: key },
        create: {
            type: "direct",
            direct_key: key,
            participants: {
                create: [{ user_id: a }, { user_id: b }],
            },
        },
        update: {},
        select: { id: true },
    });

    return convo.id;
}

export async function sendTaggedMessageToDirectConversation({ senderId, targetUserId, body }) {
    const conversationId = await ensureDirectConversationByUserIds({
        userAId: senderId,
        userBId: targetUserId,
    });

    const message = await prisma.messages.create({
        data: {
            conversation_id: conversationId,
            sender_id: senderId,
            body: normalizeBody(body),
        },
        include: {
            sender: { select: { id: true, pseudo: true, role: true } },
        },
    });

    await prisma.conversations.update({
        where: { id: conversationId },
        data: { updated_at: new Date() },
    });

    return {
        id: message.id,
        conversationId: message.conversation_id,
        body: message.body,
        at: message.created_at,
        sender: message.sender,
    };
}

function canModeratorTalkTo(role) {
    return role === "admin" || role === "moderator";
}

export async function listMyConversations(userId) {
    const conversations = await prisma.conversations.findMany({
        where: {
            participants: {
                some: { user_id: userId },
            },
        },
        orderBy: { updated_at: "desc" },
        include: {
            participants: {
                include: {
                    user: { select: { id: true, pseudo: true, role: true } },
                },
            },
            messages: {
                orderBy: { created_at: "desc" },
                take: 1,
                select: { id: true, body: true, created_at: true, sender_id: true },
            },
        },
        take: 50,
    });

    return conversations.map((c) => {
        const last = c.messages?.[0] ?? null;
        return {
            id: c.id,
            type: c.type,
            updatedAt: c.updated_at,
            createdAt: c.created_at,
            participants: c.participants.map((p) => p.user),
            lastMessage: last
                ? {
                      id: last.id,
                      body: last.body,
                      at: last.created_at,
                      senderId: last.sender_id,
                  }
                : null,
        };
    });
}

export async function startDirectConversationByPseudo({ me, targetPseudo }) {
    const pseudo = (targetPseudo ?? "").toString().trim();
    if (!pseudo) throw new Error("pseudo is required");

    const target = await prisma.users.findUnique({
        where: { pseudo },
        select: { id: true, pseudo: true, role: true },
    });

    if (!target) throw new Error("User not found");
    if (target.id === me.id) throw new Error("Cannot message yourself");

    // Role rules (initial version)
    if (me.role === "moderator" && !canModeratorTalkTo(target.role)) {
        throw new Error("Moderators can only message admins/moderators");
    }

    const key = directKeyFor(me.id, target.id);

    const convo = await prisma.conversations.upsert({
        where: { direct_key: key },
        create: {
            type: "direct",
            direct_key: key,
            participants: {
                create: [{ user_id: me.id }, { user_id: target.id }],
            },
        },
        update: {},
        include: {
            participants: {
                include: { user: { select: { id: true, pseudo: true, role: true } } },
            },
        },
    });

    return {
        id: convo.id,
        participants: convo.participants.map((p) => p.user),
    };
}

export async function getConversationMessages({ userId, conversationId, limit = 50 }) {
    const cid = Number(conversationId);
    if (!cid || Number.isNaN(cid)) throw new Error("Invalid conversation id");

    const isParticipant = await prisma.conversation_participants.findFirst({
        where: { conversation_id: cid, user_id: userId },
        select: { id: true },
    });

    if (!isParticipant) throw new Error("Access denied");

    const rows = await prisma.messages.findMany({
        where: { conversation_id: cid },
        orderBy: { created_at: "desc" },
        take: Math.min(200, Math.max(10, Number(limit) || 50)),
        include: {
            sender: { select: { id: true, pseudo: true, role: true } },
        },
    });

    return rows
        .reverse()
        .map((m) => ({
            id: m.id,
            conversationId: m.conversation_id,
            body: m.body,
            at: m.created_at,
            sender: m.sender,
        }));
}

export async function sendMessageToConversation({ me, conversationId, body }) {
    const cid = Number(conversationId);
    if (!cid || Number.isNaN(cid)) throw new Error("Invalid conversation id");

    const text = normalizeBody(body);
    if (!text) throw new Error("Message is empty");

    const convo = await prisma.conversations.findUnique({
        where: { id: cid },
        include: {
            participants: { include: { user: { select: { id: true, role: true } } } },
        },
    });

    if (!convo) throw new Error("Conversation not found");

    const participantIds = convo.participants.map((p) => p.user.id);
    if (!participantIds.includes(me.id)) throw new Error("Access denied");

    // Role rule: moderators can only talk to admins/moderators
    if (me.role === "moderator") {
        const otherRoles = convo.participants
            .filter((p) => p.user.id !== me.id)
            .map((p) => p.user.role);
        if (otherRoles.some((r) => !canModeratorTalkTo(r))) {
            throw new Error("Moderators can only message admins/moderators");
        }
    }

    const message = await prisma.messages.create({
        data: {
            conversation_id: cid,
            sender_id: me.id,
            body: text,
        },
        include: {
            sender: { select: { id: true, pseudo: true, role: true } },
        },
    });

    // Touch conversation updated_at for ordering
    await prisma.conversations.update({
        where: { id: cid },
        data: { updated_at: new Date() },
    });

    return {
        id: message.id,
        conversationId: message.conversation_id,
        body: message.body,
        at: message.created_at,
        sender: message.sender,
    };
}
