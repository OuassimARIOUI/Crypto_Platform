import { prisma } from "./dbService.js";
import { logError } from "../utils/logger.js";

// Récupérer le portefeuille complet
export async function getMyPortfolio(userId) {
    if (!userId) throw new Error("User id manquant");

    const portfolio = await prisma.portfolios.findUnique({
        where: { user_id: userId },
        include: {
            transactions: {
                include: { crypto: true },
                orderBy: { timestamp: "desc" }
            }
        }
    });

    if (!portfolio) {
        await prisma.portfolios.create({
            data: {
                user_id: userId,
                balance: 0,
            },
        });

        return {
            balance: 0,
            holdings: {},
            transactions: [],
        };
    }

    // Calcul des holdings (quantités actuelles)
    const holdings = {};

    for (const t of portfolio.transactions) {
        const symbol = t.crypto.symbol;

        if (!holdings[symbol]) holdings[symbol] = 0;

        if (t.type === "buy") holdings[symbol] += t.quantity;
        if (t.type === "sell") holdings[symbol] -= t.quantity;
    }

    return {
        balance: portfolio.balance,
        holdings,
        transactions: portfolio.transactions
    };
}

// Acheter une crypto
export async function buyCrypto(userId, symbol, quantity) {
    const crypto = await prisma.cryptos.findUnique({ where: { symbol } });
    if (!crypto) throw new Error("Crypto inconnue.");

    const price = await prisma.crypto_prices.findFirst({
        where: { crypto_id: crypto.id },
        orderBy: { fetched_at: "desc" }
    });

    if (!price) throw new Error("Aucune donnée de prix disponible.");

    const cost = Number(price.price_usd) * quantity;

    const portfolio = await prisma.portfolios.findUnique({
        where: { user_id: userId }
    });

    if (!portfolio) throw new Error("Portefeuille introuvable.");

    // Vérifier balance
    if (portfolio.balance < cost)
        throw new Error("Solde insuffisant.");

    // Déduire balance
    await prisma.portfolios.update({
        where: { user_id: userId },
        data: { balance: portfolio.balance - cost }
    });

    // Enregistrer transaction
    await prisma.portfolio_transactions.create({
        data: {
            portfolio_id: portfolio.id,
            crypto_id: crypto.id,
            type: "buy",
            quantity,
            price_usd: Number(price.price_usd)
        }
    });

    return await getMyPortfolio(userId);
}

// Vendre une crypto
export async function sellCrypto(userId, symbol, quantity) {
    const crypto = await prisma.cryptos.findUnique({ where: { symbol } });
    if (!crypto) throw new Error("Crypto inconnue.");

    const price = await prisma.crypto_prices.findFirst({
        where: { crypto_id: crypto.id },
        orderBy: { fetched_at: "desc" }
    });

    const portfolio = await prisma.portfolios.findUnique({
        where: { user_id: userId },
        include: { transactions: true }
    });

    if (!portfolio) throw new Error("Portefeuille introuvable.");

    // Calcul des quantités possédées
    let totalQty = 0;

    for (const t of portfolio.transactions) {
        if (t.crypto_id === crypto.id) {
            totalQty += t.type === "buy" ? t.quantity : -t.quantity;
        }
    }

    if (totalQty < quantity)
        throw new Error("Quantité insuffisante pour vendre.");

    // Créditer balance
    const gain = Number(price.price_usd) * quantity;

    await prisma.portfolios.update({
        where: { user_id: userId },
        data: { balance: portfolio.balance + gain }
    });

    // Créer la transaction
    await prisma.portfolio_transactions.create({
        data: {
            portfolio_id: portfolio.id,
            crypto_id: crypto.id,
            type: "sell",
            quantity,
            price_usd: Number(price.price_usd)
        }
    });

    return await getMyPortfolio(userId);
}
