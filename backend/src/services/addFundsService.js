import {prisma} from "./dbService.js";

export async function addFunds(userId, amount) {
    if (!userId) {
        throw new Error("User id manquant");
    }

    if (!amount || amount <= 0) {
        throw new Error("Montant invalide");
    }

    const portfolio = await prisma.portfolios.upsert({
        where: { user_id: userId },
        update: {
            balance: { increment: Number(amount) },
        },
        create: {
            user_id: userId,
            balance: Number(amount),
        },
    });

    return portfolio.balance; // Retourner le nouveau solde
}
