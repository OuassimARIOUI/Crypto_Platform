import { prisma } from "./dbService.js";


/**
 * Calcule la moyenne mobile simple
 */
export async function calculateSMA(cryptoId, n) {
    const prices = await prisma.crypto_prices.findMany({
        where: { crypto_id: cryptoId },
        orderBy: { fetched_at: "desc" },
        take: n
    });

    if (prices.length < n) return null;

    const sum = prices.reduce((acc, p) => acc + Number(p.price_usd), 0);
    return sum / n;
}

/**
 * Récupère la variation 24h
 */
export async function getVariation24h(cryptoId) {
    const last = await prisma.crypto_prices.findFirst({
        where: { crypto_id: cryptoId },
        orderBy: { fetched_at: "desc" }
    });

    return last?.change_percent_24h ?? null;
}

/**
 * Calcule SMA7, SMA30 et variation 24h puis insère dans indicators_history
 */
export async function computeIndicatorsForCrypto(cryptoId) {
    const safeId = Number(cryptoId);

    const sma7 = await calculateSMA(safeId, 7);
    const sma30 = await calculateSMA(safeId, 30);
    const variation24h = await getVariation24h(safeId);

    await prisma.indicators_history.create({
        data: {
            crypto_id: safeId,
            sma7,
            sma30,
            variation_24h: variation24h,
            fetched_at: new Date()
        }
    });

    console.log(`Indicators saved for crypto ${safeId}`);
}

/**
 * Calcule les indicateurs pour toutes les cryptos
 */
export async function computeAllIndicators() {
    const cryptos = await prisma.cryptos.findMany();
    for (const c of cryptos) {
        await computeIndicatorsForCrypto(c.id);
    }
}
