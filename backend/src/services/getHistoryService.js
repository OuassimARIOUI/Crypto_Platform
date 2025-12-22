import { prisma } from "./dbService.js";

export async function getHistoryService(symbol, timeframe = "24h") {

    const crypto = await prisma.cryptos.findUnique({
        where: { symbol: symbol.toLowerCase() }
    });

    if (!crypto) return [];

    const now = new Date();
    const hoursBack = {
        "1h": 1,
        "4h": 4,
        "24h": 24,
        "7d": 24 * 7,
        "1m": 24 * 30,
        "6m": 24 * 180,
        "1y": 24 * 365,
    }[String(timeframe).toLowerCase()] || 24;

    const since = new Date(now.getTime() - hoursBack * 60 * 60 * 1000);

    // Use time range instead of "take: hours" because the ingestion cadence
    // is not guaranteed to be hourly.
    const prices = await prisma.crypto_prices.findMany({
        where: {
            crypto_id: crypto.id,
            fetched_at: { gte: since },
        },
        orderBy: { fetched_at: "asc" },
        take: 2000,
    });

    return prices.map((p) => ({
        time: p.fetched_at,
        price: Number(p.price_usd),
    }));
}
