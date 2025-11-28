import {prisma} from "./dbService.js";

export async function addFunds(userId, amount) {
    if (!amount || amount <= 0) {
        throw new Error("Montant invalide");
    }

    // Mise à jour du portefeuille
    const portfolio = await prisma.portfolios.update({
        where: { user_id: userId },
        data: {
            balance: { increment: Number(amount) }
        }
    });

    return portfolio.balance; // Retourner le nouveau solde
}
