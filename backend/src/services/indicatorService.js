const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();



/**
 * Calcule la moyenne mobile simple sur les n dernières valeurs
 */
async function calculateSMA(cryptoId, n) {
    const prices = await prisma.cryptoPrice.findMany({
        where: { crypto_id: cryptoId },
        orderBy: { fetched_at: "desc" },
        take: n
    });

    if (prices.length < n) return null;

    const sum = prices.reduce((acc, p) => acc + p.price_usd, 0);
    return sum / n;
}

/**
 * Récupère la variation 24h depuis crypto_prices
 */
async function getVariation24h(cryptoId) {
    const last = await prisma.cryptoPrice.findFirst({
        where: { crypto_id: cryptoId },
        orderBy: { fetched_at: "desc" }
    });

    return last?.change_percent_24h ?? null;
}

/**
 * Calcule SMA7, SMA30 et variation 24h puis enregistre dans indicators_history
 */
async function computeIndicatorsForCrypto(cryptoId) {
    const sma7 = await calculateSMA(cryptoId, 7);
    const sma30 = await calculateSMA(cryptoId, 30);
    const variation24h = await getVariation24h(cryptoId);

    await prisma.indicatorsHistory.create({
        data: {
            crypto_id: cryptoId,
            sma7: sma7,
            sma30: sma30,
            variation_24h: variation24h
        }
    });

    console.log(`✔ Indicators saved for crypto ${cryptoId}`);
}

/**
 * Calcule pour TOUTES les cryptos
 */
async function computeAllIndicators() {
    const cryptos = await prisma.cryptos.findMany();

    for (const c of cryptos) {
        await computeIndicatorsForCrypto(c.id);
    }
}

module.exports = {
    computeAllIndicators
};
