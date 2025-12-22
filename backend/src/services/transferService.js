import { prisma } from "./dbService.js";
import { publishToUser } from "./realtimeService.js";
import { sendTaggedMessageToDirectConversation } from "./messagesService.js";

function normalizeReason(reason) {
    if (typeof reason !== "string") return null;
    const v = reason.trim();
    if (!v) return null;
    return v.slice(0, 500);
}

function formatTransferNoticeBody({ senderPseudo, amount, reason }) {
    const a = Number(amount);
    const cleanAmount = Number.isFinite(a) ? a.toFixed(2) : String(amount);
    const cleanReason = normalizeReason(reason);

    // Tagged message -> client can render green for receiver.
    return [
        "[TRANSFER]",
        `Vous avez reçu un transfert de @${senderPseudo}.`,
        `Montant: ${cleanAmount}`,
        cleanReason ? `Motif: ${cleanReason}` : null,
    ]
        .filter(Boolean)
        .join("\n");
}

export async function transferBetweenUsers({ senderId, receiverPseudo, amount, reason }) {
    const senderUserId = Number(senderId);
    const amt = Number(amount);

    if (!senderUserId || Number.isNaN(senderUserId)) {
        throw new Error("User id manquant");
    }
    if (!receiverPseudo || typeof receiverPseudo !== "string") {
        throw new Error("Pseudo destinataire requis");
    }
    if (!Number.isFinite(amt) || amt <= 0) {
        throw new Error("Montant invalide");
    }

    const targetPseudo = receiverPseudo.trim();
    if (!targetPseudo) throw new Error("Pseudo destinataire requis");

    const [sender, receiver] = await Promise.all([
        prisma.users.findUnique({
            where: { id: senderUserId },
            select: { id: true, pseudo: true, role: true },
        }),
        prisma.users.findUnique({
            where: { pseudo: targetPseudo },
            select: { id: true, pseudo: true },
        }),
    ]);

    if (!sender) throw new Error("User not found");
    if (!receiver) throw new Error("Destinataire introuvable");
    if (receiver.id === sender.id) throw new Error("Impossible de transférer vers soi-même");

    const cleanReason = normalizeReason(reason);

    const result = await prisma.$transaction(async (tx) => {
        const senderPortfolio = await tx.portfolios.upsert({
            where: { user_id: sender.id },
            update: {},
            create: { user_id: sender.id, balance: 0, total_deposited: 0 },
        });

        if (Number(senderPortfolio.balance) < amt) {
            throw new Error("Solde insuffisant");
        }

        await tx.portfolios.upsert({
            where: { user_id: receiver.id },
            update: {},
            create: { user_id: receiver.id, balance: 0, total_deposited: 0 },
        });

        const [updatedSender, updatedReceiver, transfer] = await Promise.all([
            tx.portfolios.update({
                where: { user_id: sender.id },
                data: { balance: { decrement: amt } },
                select: { balance: true },
            }),
            tx.portfolios.update({
                where: { user_id: receiver.id },
                data: { balance: { increment: amt } },
                select: { balance: true },
            }),
            tx.wallet_transfers.create({
                data: {
                    sender_id: sender.id,
                    receiver_id: receiver.id,
                    amount: amt,
                    reason: cleanReason,
                },
                select: {
                    id: true,
                    sender_id: true,
                    receiver_id: true,
                    amount: true,
                    reason: true,
                    created_at: true,
                },
            }),
        ]);

        return {
            transfer,
            sender: { id: sender.id, pseudo: sender.pseudo, balance: updatedSender.balance },
            receiver: { id: receiver.id, pseudo: receiver.pseudo, balance: updatedReceiver.balance },
        };
    });

    // Realtime portfolio events
    publishToUser(sender.id, "portfolio:changed", {
        kind: "transfer_out",
        amount: amt,
        to: receiver.pseudo,
        at: new Date().toISOString(),
    });
    publishToUser(receiver.id, "portfolio:changed", {
        kind: "transfer_in",
        amount: amt,
        from: sender.pseudo,
        at: new Date().toISOString(),
    });

    // Send a green-highlight message for the receiver (tagged)
    const messageBody = formatTransferNoticeBody({
        senderPseudo: sender.pseudo,
        amount: amt,
        reason: cleanReason,
    });

    // Send via messaging service so unread count + realtime events are consistent
    await sendTaggedMessageToDirectConversation({
        senderId: sender.id,
        targetUserId: receiver.id,
        body: messageBody,
    });

    return result;
}
